const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'app.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('连接数据库失败:', err.message);
    return;
  }
  console.log('成功连接到SQLite数据库');
  console.log('开始向字典表插入"村民代表"...');

  const insertSql = `INSERT OR IGNORE INTO dictionaries (category, value, display_order, status, created_at) VALUES (?, ?, ?, 'active', CURRENT_TIMESTAMP)`;

  db.run(insertSql, ['村组', '村民代表', 1], function(err) {
    if (err) {
      console.error('插入"村民代表"失败:', err.message);
      db.close();
      return;
    }
    
    if (this.changes > 0) {
      console.log('✓ 成功插入: Category: "村组", Value: "村民代表"');
    } else {
      console.log('✓ "村民代表"已存在，无需插入');
    }
    
    // 查询验证
    db.all('SELECT * FROM dictionaries WHERE category = ? AND value = ?', ['村组', '村民代表'], (err, rows) => {
      if (err) {
        console.error('查询验证失败:', err.message);
      } else {
        console.log('\n=== 验证结果 ===');
        console.log(`找到 ${rows.length} 条记录:`);
        rows.forEach(row => {
          console.log(`ID: ${row.id}, Category: "${row.category}", Value: "${row.value}", Status: "${row.status}"`);
        });
      }
      db.close((err) => {
        if (err) {
          console.error('关闭数据库连接失败:', err.message);
        } else {
          console.log('\n数据库连接已关闭');
        }
      });
    });
  });
});
