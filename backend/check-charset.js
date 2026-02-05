const db = require('./db.js');

// 检查数据库字符集
db.all("SHOW CREATE TABLE archive_attachments", [], (err, rows) => {
  if (err) {
    console.error('查询失败:', err);
    process.exit(1);
  }
  
  console.log('表结构:');
  console.log(rows[0]['Create Table']);
  
  // 检查数据库字符集
  db.all("SHOW VARIABLES LIKE 'character_set_%'", [], (err, rows) => {
    if (err) {
      console.error('查询失败:', err);
      process.exit(1);
    }
    console.log('\n数据库字符集设置:');
    rows.forEach(row => {
      console.log(`${row.Variable_name}: ${row.Value}`);
    });
    process.exit(0);
  });
});
