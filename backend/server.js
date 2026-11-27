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
const { rateLimit } = require('./middleware/rateLimit');

const JWT_SECRET = require('./jwtSecret');

const app = express();
app.disable('x-powered-by');
// Only enable when the API actually sits behind a trusted reverse proxy, so
// rate limiting can use the forwarded client address without letting clients
// spoof it.
if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);

// Only the studio origins may call the API from a browser. Requests without an
// Origin header (server-to-server, curl) are still allowed.
const allowedOrigins = (process.env.CORS_ORIGINS ||
  'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173')
  .split(',').map((value) => value.trim()).filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600
}));
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
  next();
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 200;

function text(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

const loginLimiter = rateLimit({ max: Number(process.env.RATE_LIMIT_MAX) || 20 });
const signupLimiter = rateLimit({ max: Number(process.env.RATE_LIMIT_SIGNUP_MAX) || 10 });


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
app.post('/signup', signupLimiter, async (req, res) => {
  const username = text(req.body?.username, 80);
  const email = text(req.body?.email, 254).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  // 1. Validate input
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (username.length < 2) {
    return res.status(400).json({ error: 'Username must be at least 2 characters' });
  }
  if (!EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address' });
  }
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Password must be ${MIN_PASSWORD_LENGTH}–${MAX_PASSWORD_LENGTH} characters` });
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

let dummyHash;
function invalidLoginHash() {
  // Compare against a real hash when the email is unknown so response timing
  // does not reveal whether an account exists.
  dummyHash ||= hashPassword(crypto.randomBytes(16).toString('hex'));
  return dummyHash;
}

app.post('/login', loginLimiter, async (req, res) => {
  const email = text(req.body?.email, 254).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  // 1. Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  try {
    // 2. Find user
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        console.error('[Login] DB Error:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }

      // 3. Compare password (real or dummy hash, same message either way)
      const isMatch = await comparePassword(password, user ? user.password_hash : await invalidLoginHash());
      if (!user || !isMatch) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      // 4. Generate token
      const token = jwt.sign(
        { user_id: user.id },
        JWT_SECRET,
        { expiresIn: '7d', algorithm: 'HS256' }
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

// Authenticated current-user endpoint
app.get('/me', authenticateUser, (req, res) => {
  db.get('SELECT id, username, email, created_at FROM users WHERE id = ?', [req.user_id], (err, user) => {
    if (err) {
      console.error('[Me] DB Error:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });
});

// Project Routes
app.post('/projects', authenticateUser, (req, res) => {
  const title = text(req.body?.title, 120);
  const isPublic = req.body?.is_public === true || req.body?.is_public === 1;
  const user_id = req.user_id;

  // 1. Validate input
  if (!title) {
    return res.status(400).json({ error: 'Project title is required' });
  }

  try {
    // 2. Insert into DB
    db.run(
      'INSERT INTO projects (title, user_id, is_public) VALUES (?, ?, ?)',
      [title, user_id, isPublic ? 1 : 0],
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
          is_public: isPublic ? 1 : 0
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

// Delete a project and its version rows. Ownership is checked before either
// delete so one account cannot remove another account's work.
app.delete('/projects/:id', authenticateUser, (req, res) => {
  const project_id = req.params.id;
  const user_id = req.user_id;

  db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [project_id, user_id], (err, project) => {
    if (err) {
      console.error('[Projects] Delete lookup error:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!project) {
      return res.status(403).json({ error: 'Forbidden: You do not own this project' });
    }
    db.run('DELETE FROM audio_versions WHERE project_id = ?', [project_id], (err) => {
      if (err) {
        console.error('[Projects] Version delete error:', err.message);
        return res.status(500).json({ error: 'Failed to delete project versions' });
      }
      db.run('DELETE FROM projects WHERE id = ? AND user_id = ?', [project_id, user_id], function (err) {
        if (err) {
          console.error('[Projects] Delete error:', err.message);
          return res.status(500).json({ error: 'Failed to delete project' });
        }
        if (!this.changes) {
          return res.status(404).json({ error: 'Project not found' });
        }
        res.json({ success: true });
      });
    });
  });
});

// Version Routes
app.post('/versions', authenticateUser, (req, res) => {
  const project_id = Number(req.body?.project_id);
  const user_id = req.user_id;

  // 1. Validate input
  if (!Number.isInteger(project_id) || project_id <= 0) {
    return res.status(400).json({ error: 'Project ID is required' });
  }
  const bpm = req.body?.bpm ?? null;
  const key = text(req.body?.key, 40) || null;
  const mood = text(req.body?.mood, 60) || null;
  const genre = text(req.body?.genre, 60) || null;
  const instruments = text(req.body?.instruments, 400) || null;
  const freq_min = req.body?.freq_min ?? null;
  const freq_max = req.body?.freq_max ?? null;
  const file_url = text(req.body?.file_url, 500) || null;

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
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  }
});

const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.webm', '.ogg', '.oga', '.m4a', '.aac', '.flac', '.mp4', '.aiff', '.aif', '.opus']);
const AUDIO_MIME = /^(audio\/|video\/webm$|video\/mp4$|application\/ogg$)/;

const upload = multer({
  storage,
  limits: {
    fileSize: Number(process.env.MAX_UPLOAD_BYTES) || 25 * 1024 * 1024,
    files: 1,
    fields: 20
  },
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    // The extension alone is not trusted: reject HTML/SVG/executables that
    // would be served back from /audio.
    if (!AUDIO_EXTENSIONS.has(ext) || !AUDIO_MIME.test(file.mimetype || '')) {
      return cb(new Error('Unsupported audio file type'));
    }
    return cb(null, true);
  }
});

// AI Tagging using local Ollama
async function generateTagsWithOllama(description, name = 'Untitled') {
  console.log(`[AI] Generating tags for: ${name}`);
  try {
    const prompt = `
      Analyze this music recording based on its description. If the description is vague, infer plausible professional music production metadata for it.
      Name: ${name}
      Description: ${description}
      
      You MUST provide exactly the following fields:
      - "bpm": integer (e.g. 120)
      - "key": string (e.g. "C Minor", "G Major")
      - "mood": string (e.g. "Energetic", "Melancholic")
      - "genre": string (e.g. "Synthwave", "Acoustic Folk")
      - "instruments": array of strings (e.g. ["Synthesizer", "Drum Machine", "Bass"])
      - "frequency_range": object with "low" (integer, e.g. 20) and "high" (integer, e.g. 20000)
      - "energy": float between 0.0 and 1.0 (e.g. 0.85)

      Respond ONLY with a valid JSON object matching these exact keys.
      Example: {"bpm": 128, "key": "F Minor", "mood": "Dark", "genre": "Techno", "instruments": ["Kick", "Bass", "Hi-hat"], "frequency_range": {"low": 20, "high": 18000}, "energy": 0.9}
    `;

    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama3',
      prompt: prompt,
      stream: false,
      format: 'json'
    }, { timeout: 5000 });

    const result = JSON.parse(response.data.response);
    console.log('[AI] Generated tags:', result);
    return result;
  } catch (error) {
    console.error('[AI] Ollama error:', error.message);
    return { 
      bpm: 120,
      key: "C Major",
      mood: description.includes('chill') ? 'Chill' : 'Unknown', 
      genre: 'Unknown',
      instruments: ["Unknown"],
      frequency_range: { low: 20, high: 20000 },
      energy: 0.5,
      error: 'AI unavailable'
    };
  }
}

// Alias for /record to match user request
app.post('/upload', authenticateUser, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });

    const id = crypto.randomUUID();
    const filename = req.file.filename;
    const description = text(req.body?.description, 2000);
    const name = text(req.body?.name, 120) || 'Untitled Recording';
    const message = text(req.body?.message, 2000);
    const tags = await generateTagsWithOllama(description, name);

    db.run(`
      INSERT INTO recordings (id, filename, parent_id, tags, description, name, message, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, filename, null, JSON.stringify(tags), description, name, message, req.user_id], function(err) {
      if (err) {
        console.error('[Upload] Insert Error:', err.message);
        fs.unlink(req.file.path, () => {});
        return res.status(500).json({ error: 'Failed to save recording' });
      }
      res.json({
        id,
        filename,
        tags,
        parent_id: null,
        name,
        message,
        created_at: new Date().toISOString()
      });
    });
  } catch (error) {
    console.error('[Upload] Error:', error.message);
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint for text-only analysis if needed
app.post('/analyze-description', authenticateUser, async (req, res) => {
  const description = text(req.body?.description, 4000);
  const name = text(req.body?.name, 120) || 'Analysis';
  const tags = await generateTagsWithOllama(description, name);
  res.json(tags);
});

app.post('/record', authenticateUser, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });

    const id = crypto.randomUUID();
    const filename = req.file.filename;
    const name = text(req.body?.name, 120) || 'Untitled Recording';
    const message = text(req.body?.message, 2000);
    const description = text(req.body?.description, 2000);

    const tags = await generateTagsWithOllama(description, name);

    db.run(`
      INSERT INTO recordings (id, filename, parent_id, tags, description, name, message, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, filename, null, JSON.stringify(tags), description, name, message, req.user_id], function(err) {
      if (err) {
        console.error('[Record] Insert Error:', err.message);
        fs.unlink(req.file.path, () => {});
        return res.status(500).json({ error: 'Failed to save recording' });
      }
      res.json({
        id,
        filename,
        tags,
        parent_id: null,
        name,
        message,
        created_at: new Date().toISOString()
      });
    });
  } catch (error) {
    console.error('[Record] Error:', error.message);
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/branch', authenticateUser, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });
    const parent_id = text(req.body?.parent_id, 80);
    if (!parent_id) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'parent_id is required' });
    }

    // A branch may only be attached to a recording owned by the same account.
    db.get('SELECT id FROM recordings WHERE id = ? AND user_id = ?', [parent_id, req.user_id], async (lookupError, parent) => {
      if (lookupError) {
        fs.unlink(req.file.path, () => {});
        return res.status(500).json({ error: 'Database error' });
      }
      if (!parent) {
        fs.unlink(req.file.path, () => {});
        return res.status(403).json({ error: 'Forbidden: You do not own this recording' });
      }

      const id = crypto.randomUUID();
      const filename = req.file.filename;
      const name = text(req.body?.name, 120) || 'Untitled Recording';
      const message = text(req.body?.message, 2000);
      const description = text(req.body?.description, 2000);
      const tags = await generateTagsWithOllama(description, name || 'Branch');

      db.run(`
        INSERT INTO recordings (id, filename, parent_id, tags, description, name, message, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, filename, parent_id, JSON.stringify(tags), description, name, message, req.user_id], function(err) {
        if (err) {
          console.error('[Branch] Insert Error:', err.message);
          fs.unlink(req.file.path, () => {});
          return res.status(500).json({ error: 'Failed to save recording' });
        }
        res.json({
          id,
          filename,
          parent_id,
          tags,
          name,
          message,
          created_at: new Date().toISOString()
        });
      });
    });
  } catch (error) {
    console.error('[Branch] Error:', error.message);
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Helper to recursively find and delete recordings owned by one account.
async function deleteRecursive(id, userId) {
  return new Promise((resolve, reject) => {
    // 1. Find the recording and its children that belong to this user
    db.all(`SELECT id, filename FROM recordings WHERE (id = ? OR parent_id = ?) AND user_id = ?`, [id, id, userId], async (err, rows) => {
      if (err) return reject(err);
      
      const parent = rows.find(r => r.id === id);
      const children = rows.filter(r => r.id !== id);

      // 2. Recursively delete children first
      for (const child of children) {
        await deleteRecursive(child.id, userId);
      }

      // 3. Delete the parent record and file
      if (parent) {
        const filePath = path.join(UPLOADS_DIR, parent.filename);
        
        db.run(`DELETE FROM recordings WHERE id = ? AND user_id = ?`, [id, userId], (err) => {
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

app.delete('/recordings/:id', authenticateUser, async (req, res) => {
  const { id } = req.params;
  console.log(`[Backend] Recursive DELETE request received for ID: ${id}`);

  db.get('SELECT id FROM recordings WHERE id = ? AND user_id = ?', [id, req.user_id], async (lookupError, owned) => {
    if (lookupError) {
      console.error('[Backend] Delete lookup failed:', lookupError.message);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!owned) {
      return res.status(404).json({ error: 'Recording not found' });
    }
    try {
      await deleteRecursive(id, req.user_id);
      res.json({ success: true, message: 'Recording and its branches deleted' });
    } catch (err) {
      console.error('[Backend] Delete failed:', err.message);
      res.status(500).json({ error: 'Could not delete recording' });
    }
  });
});

app.get('/versions', authenticateUser, (req, res) => {
  db.all(`SELECT * FROM recordings WHERE user_id = ? ORDER BY created_at ASC`, [req.user_id], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
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

app.post('/analyze-audio', authenticateUser, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });

    // In Node-only mode without Python librosa, we perform a simplified text-based analysis
    // or return a placeholder until a Node audio library is integrated.
    const tags = await generateTagsWithOllama(text(req.body?.description, 4000) || 'Audio recording', text(req.body?.name, 120) || 'Audio');

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
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Serve audio files statically. Filenames are random UUIDs and uploads are
// restricted to audio MIME types so this cannot serve HTML or scripts.
app.use('/audio', express.static(UPLOADS_DIR, {
  dotfiles: 'deny',
  index: false,
  setHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; media-src 'self'");
  }
}));

// 404 Fallback route
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Central error handler: multer rejections and unexpected failures return JSON
// without leaking stack traces or file-system paths.
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : 'Upload rejected';
    return res.status(status).json({ error: message });
  }
  if (err?.message === 'Unsupported audio file type') {
    return res.status(400).json({ error: err.message });
  }
  console.error('[API] Unhandled error:', err?.message);
  return res.status(500).json({ error: 'Internal Server Error' });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
  });
}

module.exports = app;
