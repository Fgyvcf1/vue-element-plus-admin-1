const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'data', 'village.db');
const dbDir = path.dirname(dbPath);

// Ensure directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database:', dbPath);
  }
});

// Promisify methods
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Initialize database
async function initDatabase() {
  console.log('Initializing SQLite database...');
  
  // Read and execute SQL files
  const sqlFiles = [
    'database-structure.sql',
    'permission-schema.sql',
    'organization-management-schema.sql',
    '010-seed-data.sql',
    '020-default-users.sql'
  ];
  
  for (const file of sqlFiles) {
    const filePath = path.join(__dirname, 'sql', file);
    if (fs.existsSync(filePath)) {
      console.log(`Executing ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Split SQL into individual statements
      const statements = sql.split(';').filter(s => s.trim());
      
      for (const statement of statements) {
        try {
          await run(statement);
        } catch (err) {
          // Ignore duplicate table errors
          if (!err.message.includes('already exists')) {
            console.warn(`Warning in ${file}:`, err.message);
          }
        }
      }
    }
  }
  
  console.log('Database initialization complete!');
}

module.exports = {
  db,
  run,
  get,
  all,
  initDatabase
};
