const sqlite3 = require('sqlite3').verbose();

// 连接到SQLite数据库
const db = new sqlite3.Database('./app.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('连接数据库失败:', err.message);
    return;
  }
  console.log('成功连接到SQLite数据库');

  // 将所有户主的性别更新为"男"
  const sql = `UPDATE households SET gender = '男'`;
  
  db.run(sql, function(err) {
    if (err) {
      console.error('更新数据失败:', err.message);
    } else {
      console.log(`成功更新了 ${this.changes} 条记录，所有户主的性别已设置为"男"`);
    }
    
    // 关闭数据库连接
    db.close((err) => {
      if (err) {
        console.error('关闭数据库连接失败:', err.message);
      } else {
        console.log('数据库连接已关闭');
      }
    });
  });
});