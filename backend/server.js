const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const db = require('./db');
const { hashPassword, comparePassword } = require('./utils/auth');
const jwt = require('jsonwebtoken');
const authenticateUser = require('./middleware/authMiddleware');

const JWT_SECRET = 'secret123';

const app = express();
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Test routes
app.get('/', (req, res) => {
  res.send('API running');
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is healthy'
  });
});

// Authentication Routes
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  // 1. Validate input
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // 2. Check if user already exists
    db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], async (err, existingUser) => {
      if (err) {
        console.error('[Signup] DB Error:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }

      if (existingUser) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }

      // 3. Hash password
      const hashedPassword = await hashPassword(password);

      // 4. Insert into DB
      db.run(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [username, email, hashedPassword],
        function(err) {
          if (err) {
            console.error('[Signup] Insert Error:', err.message);
            return res.status(500).json({ error: 'Failed to create user' });
          }
          console.log(`[Signup] User created: ${username}`);
          res.json({ message: 'User created successfully' });
        }
      );
    });
  } catch (error) {
    console.error('[Signup] Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // 1. Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // 2. Find user
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        console.error('[Login] DB Error:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        // Security best practice: same message for non-existent user or wrong password
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // 3. Compare password
      const isMatch = await comparePassword(password, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // 4. Generate token
      const token = jwt.sign(
        { user_id: user.id },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // 5. Response
      console.log(`[Login] User logged in: ${user.username}`);
      res.json({
        access_token: token,
        user_id: user.id
      });
    });
  } catch (error) {
    console.error('[Login] Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Debug & Verification Routes (Temporary)
app.get('/debug/tables', (req, res) => {
  console.log('[Debug] Listing tables');
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/debug/users', (req, res) => {
  console.log('[Debug] Listing users');
  db.all("SELECT id, username, email FROM users", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Project Routes
app.post('/projects', authenticateUser, (req, res) => {
  const { title, is_public } = req.body;
  const user_id = req.user_id;

  // 1. Validate input
  if (!title) {
    return res.status(400).json({ error: 'Project title is required' });
  }

  try {
    // 2. Insert into DB
    db.run(
      'INSERT INTO projects (title, user_id, is_public) VALUES (?, ?, ?)',
      [title, user_id, is_public ? 1 : 0],
      function(err) {
        if (err) {
          console.error('[Projects] Insert Error:', err.message);
          return res.status(500).json({ error: 'Failed to create project' });
        }

        // 3. Response
        const projectId = this.lastID;
        console.log(`[Projects] Project created: ${title} (ID: ${projectId}) for User: ${user_id}`);
        res.json({
          id: projectId,
          title,
          user_id,
          is_public: is_public ? 1 : 0
        });
      }
    );
  } catch (error) {
    console.error('[Projects] Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/my-projects', authenticateUser, (req, res) => {
  const user_id = req.user_id;

  try {
    db.all('SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC', [user_id], (err, rows) => {
      if (err) {
        console.error('[Projects] Fetch Error:', err.message);
        return res.status(500).json({ error: 'Failed to fetch projects' });
      }
      res.json(rows);
    });
  } catch (error) {
    console.error('[Projects] Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Version Routes
app.post('/versions', authenticateUser, (req, res) => {
  const {
    project_id, bpm, key, mood, genre, instruments, freq_min, freq_max, file_url
  } = req.body;
  const user_id = req.user_id;

  // 1. Validate input
  if (!project_id) {
    return res.status(400).json({ error: 'Project ID is required' });
  }

  try {
    // 2. Ensure project belongs to user
    db.get('SELECT * FROM projects WHERE id = ? AND user_id = ?', [project_id, user_id], (err, project) => {
      if (err) {
        console.error('[Versions] DB Error:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!project) {
        return res.status(403).json({ error: 'Forbidden: You do not own this project' });
      }

      // 3. Insert into DB
      const sql = `
        INSERT INTO audio_versions (
          project_id, bpm, key, mood, genre, instruments, freq_min, freq_max, file_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [project_id, bpm, key, mood, genre, instruments, freq_min, freq_max, file_url];

      db.run(sql, params, function(err) {
        if (err) {
          console.error('[Versions] Insert Error:', err.message);
          return res.status(500).json({ error: 'Failed to save version' });
        }

        // 4. Response
        const versionId = this.lastID;
        console.log(`[Versions] Version saved: ID ${versionId} for Project ${project_id}`);
        res.json({
          id: versionId,
          project_id,
          bpm,
          key,
          mood,
          genre,
          instruments,
          freq_min,
          freq_max,
          file_url
        });
      });
    });
  } catch (error) {
    console.error('[Versions] Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/projects/:id/versions', authenticateUser, (req, res) => {
  const project_id = req.params.id;
  const user_id = req.user_id;

  try {
    // 1. Verify project ownership
    db.get('SELECT * FROM projects WHERE id = ? AND user_id = ?', [project_id, user_id], (err, project) => {
      if (err) {
        console.error('[Versions] DB Error:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!project) {
        return res.status(403).json({ error: 'Forbidden: You do not own this project' });
      }

      // 2. Fetch all versions for this project
      db.all('SELECT * FROM audio_versions WHERE project_id = ? ORDER BY created_at DESC', [project_id], (err, rows) => {
        if (err) {
          console.error('[Versions] Fetch Error:', err.message);
          return res.status(500).json({ error: 'Failed to fetch versions' });
        }
        res.json(rows);
      });
    });
  } catch (error) {
    console.error('[Versions] Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

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

// AI Tagging using local Ollama
async function generateTagsWithOllama(description, name = 'Untitled') {
  console.log(`[AI] Generating tags for: ${name}`);
  try {
    const prompt = `
      Analyze this music recording:
      Name: ${name}
      Description: ${description}
      
      Provide exactly 3 tags: mood, type, and energy.
      Respond ONLY with a valid JSON object.
      Example: {"mood": "calm", "type": "ambient", "energy": "low"}
    `;

    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama3',
      prompt: prompt,
      stream: false,
      format: 'json'
    });

    // Ollama returns { response: "..." } where response is the stringified JSON
    const result = JSON.parse(response.data.response);
    console.log('[AI] Generated tags:', result);
    return result;
  } catch (error) {
    console.error('[AI] Ollama error:', error.message);
    return { 
      mood: description.includes('chill') ? 'chill' : 'unknown', 
      type: 'unknown', 
      energy: 'medium',
      error: 'AI unavailable'
    };
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

    // Use direct Ollama tagging instead of Python service
    const name = req.body.name || 'Untitled Recording';
    const tags = await generateTagsWithOllama(description, name);

    db.run(`
      INSERT INTO recordings (id, filename, parent_id, tags, description, name, message)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, filename, null, JSON.stringify(tags), description, name, req.body.message || ''], function(err) {
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
  const { description, name } = req.body;
  console.log('[Backend] /analyze-description called');
  const tags = await generateTagsWithOllama(description, name || 'Analysis');
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

    const tags = await generateTagsWithOllama(description, name);

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

    const tags = await generateTagsWithOllama(description, req.body.name || 'Branch');

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
// Python service URL removed (Node-centric refactor)
// const PYTHON_SERVICE_URL = 'http://localhost:8000/api/v1';

app.post('/analyze-audio', upload.single('audio'), async (req, res) => {
  console.log('[Backend] /analyze-audio called (Node-only mode)');
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });

    // In Node-only mode without Python librosa, we perform a simplified text-based analysis
    // or return a placeholder until a Node audio library is integrated.
    const tags = await generateTagsWithOllama(req.body.description || 'Audio recording', req.body.name || 'Audio');

    // Clean up temporary file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });

    res.json({
      ...tags,
      note: "Audio-specific features (BPM, Key) are disabled in Node-only mode."
    });
  } catch (error) {
    console.error('[Backend] Analysis failed:', error.message);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Serve audio files statically
app.use('/audio', express.static(UPLOADS_DIR));

// 404 Fallback route
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
