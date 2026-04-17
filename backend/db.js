const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  }
});

// Initialize schema
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS recordings (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      parent_id TEXT,
      tags TEXT,
      description TEXT,
      FOREIGN KEY(parent_id) REFERENCES recordings(id)
    )
  `);
});

module.exports = db;
