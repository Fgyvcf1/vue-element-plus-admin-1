const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('app.db', (err) => {
  if (err) {
    console.error('连接数据库失败:', err.message);
    process.exit(1);
  }

  console.log('数据库连接成功');

  // 查询所有表
  db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, rows) => {
    if (err) {
      console.error('查询表失败:', err.message);
      db.close();
      return;
    }

    console.log('\n数据库中所有表:');
    rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.name}`);
    });

    // 检查 event_reminders 表
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='event_reminders'", (err, row) => {
      if (err) {
        console.error('查询 event_reminders 失败:', err.message);
      } else if (row) {
        console.log('\n✓ event_reminders 表已存在');

        // 查询数据
        db.all("SELECT * FROM event_reminders", (err, rows) => {
          if (err) {
            console.error('查询数据失败:', err.message);
          } else {
            console.log(`  表中有 ${rows.length} 条记录`);
          }
          db.close();
        });
      } else {
        console.log('\n✗ event_reminders 表不存在');
        db.close();
      }
    });
  });
});
