const db = require('./db.js');

// 检查表结构
db.all("SHOW COLUMNS FROM low_income_persons", [], (err, rows) => {
  if (err) {
    console.error('查询表结构失败:', err);
    process.exit(1);
  }
  
  console.log('low_income_persons 表结构:');
  console.log('========================');
  rows.forEach(row => {
    console.log(`${row.Field}: ${row.Type} ${row.Null === 'NO' ? 'NOT NULL' : ''} ${row.Default ? `DEFAULT ${row.Default}` : ''} ${row.Extra}`);
  });
  process.exit(0);
});
