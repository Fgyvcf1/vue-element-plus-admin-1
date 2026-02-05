const db = require('./db.js');

// 检查表结构
db.all("SHOW CREATE TABLE mediation_applicants", [], (err, rows) => {
  if (err) {
    console.error('查询表结构失败:', err);
    process.exit(1);
  }
  
  console.log('mediation_applicants 表创建语句:');
  console.log('========================');
  console.log(rows[0]['Create Table']);
  process.exit(0);
});
