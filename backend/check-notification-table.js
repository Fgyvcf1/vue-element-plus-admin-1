const db = require('./db.js');

// 检查通知表结构
db.all("SHOW CREATE TABLE notification", [], (err, rows) => {
  if (err) {
    console.error('查询失败:', err);
    process.exit(1);
  }
  
  console.log('notification 表结构:');
  console.log('========================');
  console.log(rows[0]['Create Table']);
  process.exit(0);
});
