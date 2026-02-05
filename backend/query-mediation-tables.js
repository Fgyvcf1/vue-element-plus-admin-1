const db = require('./db.js');

console.log('=== 查询数据库中的调解相关表 ===\n');

db.all("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%mediation%' ORDER BY name", [], (err, rows) => {
  if (err) {
    console.error('查询失败:', err.message);
    db.close();
    return;
  }

  console.log('当前数据库中的调解相关表:');
  if (rows.length === 0) {
    console.log('  (无调解相关表)');
  } else {
    rows.forEach(row => {
      console.log(`  - ${row.name}`);
    });
  }

  console.log('\n=== 查询完成 ===');
  db.close();
});
