const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'app.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('连接数据库失败:', err.message);
    return;
  }
  console.log('成功连接到SQLite数据库');
  console.log('');

  // 获取当前最大display_order
  db.get("SELECT MAX(display_order) as max_order FROM dictionaries WHERE category = '职务'", (err, row) => {
    if (err) {
      console.error('查询最大display_order失败:', err.message);
      db.close();
      return;
    }

    const nextOrder = (row.max_order || 0) + 1;
    console.log('当前职务类别最大display_order:', row.max_order);
    console.log('将使用display_order:', nextOrder);
    console.log('');

    // 插入数据
    const insertSql = `INSERT INTO dictionaries (category, value, display_order, status, created_at) 
                       VALUES (?, ?, ?, 'active', datetime('now'))`;

    db.run(insertSql, ['职务', '村民代表', nextOrder], function(err) {
      if (err) {
        console.error('❌ 插入"村民代表"失败:', err.message);
        db.close();
        return;
      }

      console.log('✅ 插入成功!');
      console.log('影响的行数:', this.changes);
      console.log('最后插入的ID:', this.lastID);
      console.log('');

      // 查询验证
      db.all("SELECT * FROM dictionaries WHERE category = '职务' ORDER BY display_order", (err, rows) => {
        if (err) {
          console.error('查询验证失败:', err.message);
        } else {
          console.log('=== 职务类别下的所有字典项 ===');
          console.log(`共 ${rows.length} 条记录`);
          console.log('');
          rows.forEach(r => {
            console.log(`ID: ${r.id} | Value: ${r.value} | Order: ${r.display_order}`);
          });
        }

        db.close((err) => {
          if (err) {
            console.error('关闭数据库连接失败:', err.message);
          } else {
            console.log('');
            console.log('数据库连接已关闭');
          }
        });
      });
    });
  });
});
