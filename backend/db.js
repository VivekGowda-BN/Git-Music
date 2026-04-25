const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to SQLite database');
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON;', (err) => {
      if (err) console.error('Error enabling foreign keys', err.message);
    });
  }
});

// Initialize schema
db.serialize(() => {
  // Create recordings table
  db.run(`
    CREATE TABLE IF NOT EXISTS recordings (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      parent_id TEXT,
      tags TEXT,
      description TEXT,
      name TEXT,
      message TEXT,
      FOREIGN KEY(parent_id) REFERENCES recordings(id)
    )
  `);

  // Create users table for authentication
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table', err.message);
    } else {
      console.log('Users table ready');
    }
  });

  // Create projects table
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      is_public INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating projects table', err.message);
    } else {
      console.log('Projects table ready');
    }
  });

  // Create audio_versions table
  db.run(`
    CREATE TABLE IF NOT EXISTS audio_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      bpm REAL,
      key TEXT,
      mood TEXT,
      genre TEXT,
      instruments TEXT,
      freq_min REAL,
      freq_max REAL,
      file_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating audio_versions table', err.message);
    } else {
      console.log('Audio versions table ready');
    }
  });

  // Ensure older versions of recordings table are updated
  db.run(`ALTER TABLE recordings ADD COLUMN name TEXT`, (err) => { /* ignore if already exists */ });
  db.run(`ALTER TABLE recordings ADD COLUMN message TEXT`, (err) => { /* ignore if already exists */ });
});

module.exports = db;
