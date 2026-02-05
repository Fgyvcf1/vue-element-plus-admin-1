const db = require('./db.js');

// 检查附件表中的文件名
db.all("SELECT id, file_name, file_path FROM archive_attachments LIMIT 5", [], (err, rows) => {
  if (err) {
    console.error('查询失败:', err);
    process.exit(1);
  }
  
  console.log('附件列表:');
  console.log('========================');
  rows.forEach(row => {
    console.log(`ID: ${row.id}`);
    console.log(`文件名: ${row.file_name}`);
    console.log(`文件路径: ${row.file_path}`);
    console.log('------------------------');
  });
  process.exit(0);
});
