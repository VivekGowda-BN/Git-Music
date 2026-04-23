const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Fallback for randomUUID for older Node versions
if (!crypto.randomUUID) {
  crypto.randomUUID = () => crypto.randomBytes(16).toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
}

const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
  }
});
const upload = multer({ storage });

// Helper to interact with Python service
async function getTagsForAudio(filepath) {
  try {
    const response = await axios.post('http://localhost:8000/analyze', {
      filepath: filepath
    });
    return response.data; // expected to be { mood, type, energy }
  } catch (error) {
    console.error('Error contacting Python service:', error.message);
    return { error: 'Failed to generate tags' };
  }
}

// Alias for /record to match user request
app.post('/upload', upload.single('audio'), async (req, res) => {
  console.log('[Backend] /upload called');
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });

    const id = crypto.randomUUID();
    const filename = req.file.filename;
    const description = req.body.description || '';

    // Call Python AI Service
    const tags = await getTagsForAudio(req.file.path);

    db.run(`
      INSERT INTO recordings (id, filename, parent_id, tags, description, name, message)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, filename, null, JSON.stringify(tags), description, req.body.name || 'Untitled Recording', req.body.message || ''], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      const newRecord = { 
        id, 
        filename, 
        tags, 
        parent_id: null, 
        name: req.body.name || 'Untitled Recording', 
        message: req.body.message || '',
        created_at: new Date().toISOString() 
      };
      res.json(newRecord);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint for text-only analysis if needed
app.post('/analyze-description', async (req, res) => {
  const { description } = req.body;
  console.log('[Backend] /analyze-description called for:', description);
  // We can repurpose the python service or use a simpler prompt
  // For now, let's call the same service but with a mock path or similar
  // Actually, let's just return some tags based on description
  const tags = {
    mood: description.includes('chill') ? 'chill' : 'intense',
    type: description.includes('beat') ? 'beat' : 'melody',
    energy: 'medium'
  };
  res.json(tags);
});

app.post('/record', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });

    const id = crypto.randomUUID();
    const filename = req.file.filename;
    const name = req.body.name || 'Untitled Recording';
    const message = req.body.message || '';
    const description = req.body.description || '';

    const tags = await getTagsForAudio(req.file.path);

    db.run(`
      INSERT INTO recordings (id, filename, parent_id, tags, description, name, message)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, filename, null, JSON.stringify(tags), description, name, message], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      const newRecord = { 
        id, 
        filename, 
        tags, 
        parent_id: null, 
        name, 
        message,
        created_at: new Date().toISOString() 
      };
      res.json(newRecord);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/branch', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });
    const { parent_id, description } = req.body;
    if (!parent_id) return res.status(400).json({ error: 'parent_id is required' });

    const id = crypto.randomUUID();
    const filename = req.file.filename;

    const tags = await getTagsForAudio(req.file.path);

    db.run(`
      INSERT INTO recordings (id, filename, parent_id, tags, description, name, message)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, filename, parent_id, JSON.stringify(tags), req.body.description || '', req.body.name || 'Untitled Recording', req.body.message || ''], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      const newRecord = { 
        id, 
        filename, 
        parent_id, 
        tags, 
        name: req.body.name || 'Untitled Recording', 
        message: req.body.message || '',
        created_at: new Date().toISOString() 
      };
      res.json(newRecord);
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Helper to recursively find and delete recordings
async function deleteRecursive(id) {
  return new Promise((resolve, reject) => {
    // 1. Find the recording and its children
    db.all(`SELECT id, filename FROM recordings WHERE id = ? OR parent_id = ?`, [id, id], async (err, rows) => {
      if (err) return reject(err);
      
      const parent = rows.find(r => r.id === id);
      const children = rows.filter(r => r.id !== id);

      // 2. Recursively delete children first
      for (const child of children) {
        await deleteRecursive(child.id);
      }

      // 3. Delete the parent record and file
      if (parent) {
        const filePath = path.join(UPLOADS_DIR, parent.filename);
        
        db.run(`DELETE FROM recordings WHERE id = ?`, [id], (err) => {
          if (err) {
            console.error(`Failed to delete DB record for ${id}:`, err.message);
            // Even if DB fails, we try to continue or report
          }
          
          if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
              if (err) console.error(`Error deleting file ${parent.filename}:`, err);
            });
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  });
}

app.delete('/recordings/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`[Backend] Recursive DELETE request received for ID: ${id}`);
  
  try {
    await deleteRecursive(id);
    res.json({ success: true, message: 'Recording and its branches deleted' });
  } catch (err) {
    console.error('[Backend] Delete failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/versions', (req, res) => {
  db.all(`SELECT * FROM recordings ORDER BY created_at ASC`, [], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: err.message });
    }
    
    try {
      // Parse tags JSON string to object safely
      const recordings = rows.map(r => {
        let parsedTags = null;
        if (r.tags) {
          try {
            parsedTags = JSON.parse(r.tags);
          } catch (e) {
            console.error('Error parsing tags for record:', r.id, e);
            parsedTags = { error: 'Invalid tags data' };
          }
        }
        return {
          ...r,
          tags: parsedTags
        };
      });
      res.json(recordings);
    } catch (error) {
      console.error('Processing error:', error);
      res.status(500).json({ error: 'Failed to process recordings' });
    }
  });
});
const FormData = require('form-data');
const PYTHON_SERVICE_URL = 'http://localhost:8000';

app.post('/analyze-audio', upload.single('audio'), async (req, res) => {
  console.log('[Backend] /analyze-audio called');
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });

    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path));

    const pythonRes = await axios.post(`${PYTHON_SERVICE_URL}/analyze-audio`, formData, {
      headers: { ...formData.getHeaders() }
    });

    // Clean up temporary file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });

    res.json(pythonRes.data);
  } catch (error) {
    console.error('[Backend] Analysis failed:', error.message);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Serve audio files statically
app.use('/audio', express.static(UPLOADS_DIR));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
