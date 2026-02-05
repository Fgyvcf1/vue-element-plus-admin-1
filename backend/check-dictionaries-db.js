const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接到SQLite数据库
const dbPath = path.join(__dirname, 'app.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('连接数据库失败:', err.message);
    return;
  }
  console.log('成功连接到SQLite数据库');
  
  // 查询dictionaries表中的所有数据
  db.all('SELECT * FROM dictionaries', [], (err, rows) => {
    if (err) {
      console.error('查询字典数据失败:', err.message);
      return;
    }
    
    console.log('=== 字典表所有数据 ===');
    console.log(`共找到 ${rows.length} 条记录`);
    console.log('\n详细数据:');
    rows.forEach(row => {
      console.log(`ID: ${row.id}, Category: "${row.category}", Value: "${row.value}", Status: "${row.status}"`);
    });
    
    // 专门查询category为"村组"的数据
    db.all('SELECT * FROM dictionaries WHERE category = ?', ['村组'], (err, villageGroupRows) => {
      if (err) {
        console.error('查询category为"村组"的数据失败:', err.message);
        return;
      }
      
      console.log('\n=== Category为"村组"的数据 ===');
      console.log(`共找到 ${villageGroupRows.length} 条记录`);
      console.log('\n详细数据:');
      villageGroupRows.forEach(row => {
        console.log(`ID: ${row.id}, Category: "${row.category}", Value: "${row.value}", Status: "${row.status}"`);
      });
      
      // 关闭数据库连接
      db.close((err) => {
        if (err) {
          console.error('关闭数据库连接失败:', err.message);
          return;
        }
        console.log('\n数据库连接已关闭');
      });
    });
  });
});
