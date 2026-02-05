const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'app.db');
const db = new sqlite3.Database(dbPath);

console.log('检查residents表结构...');

// 检查表结构
db.all("PRAGMA table_info(residents);", (err, columns) => {
  if (err) {
    console.error('查询表结构失败:', err.message);
    db.close();
    return;
  }
  
  console.log('residents表结构:');
  columns.forEach((column, index) => {
    console.log(`${index + 1}. ${column.name} (${column.type}) - ${column.notnull ? 'NOT NULL' : 'NULL'} ${column.pk ? 'PRIMARY KEY' : ''}`);
  });
  
  db.close();
});
