const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'app.db');
const db = new sqlite3.Database(dbPath);

console.log('检查residents表结构...');
db.all("PRAGMA table_info(residents);", (err, rows) => {
  if (err) {
    console.error('查询表结构失败:', err.message);
    db.close();
    return;
  }
  
  console.log('residents表结构:');
  console.log('总共有', rows.length, '个字段');
  console.log('=====================================');
  rows.forEach((row, index) => {
    console.log(`字段${index + 1}:`);
    console.log(`  cid: ${row.cid}`);
    console.log(`  name: "${row.name}"`);
    console.log(`  type: "${row.type}"`);
    console.log(`  notnull: ${row.notnull}`);
    console.log(`  dflt_value: "${row.dflt_value}"`);
    console.log(`  pk: ${row.pk}`);
    console.log('-------------------------------------');
  });
  
  // 同时查询表是否存在
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='residents';", (err, result) => {
    if (err) {
      console.error('检查表是否存在失败:', err.message);
    } else {
      console.log('residents表是否存在:', result ? '是' : '否');
    }
    db.close();
  });
});