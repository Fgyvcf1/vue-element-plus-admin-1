const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接到SQLite数据库
const dbPath = path.join(__dirname, 'app.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('连接数据库失败:', err.message);
    process.exit(1);
  } else {
    console.log('成功连接到SQLite数据库');
  }
});

// 查询households表的字段信息
db.all("PRAGMA table_info(households);", [], (err, rows) => {
  if (err) {
    console.error('查询字段信息失败:', err.message);
    db.close();
    process.exit(1);
  }
  
  console.log('households表的字段信息:');
  console.log('字段名 (类型, 是否非空, 默认值, 是否主键)');
  console.log('----------------------------------------');
  
  rows.forEach(row => {
    const primaryKey = row.pk === 1 ? '是' : '否';
    const notNull = row.notnull === 1 ? '是' : '否';
    console.log(`${row.name} (${row.type}, 非空: ${notNull}, 默认值: ${row.dflt_value || '无'}, 主键: ${primaryKey})`);
  });
  
  db.close();
});
