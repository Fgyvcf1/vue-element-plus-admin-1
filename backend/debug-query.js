const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./app.db');

console.log('调试查询问题...\n');

// 1. 查看所有调解记录
console.log('1. 所有调解记录:');
db.all('SELECT * FROM mediation_records', (err, rows) => {
  if (err) {
    console.log('❌ 查询失败:', err.message);
  } else {
    console.log(JSON.stringify(rows, null, 2));
  }

  // 2. 查看居民表
  console.log('\n2. 居民表数据:');
  db.all('SELECT id, name FROM residents LIMIT 5', (err, rows) => {
    if (err) {
      console.log('❌ 查询失败:', err.message);
    } else {
      console.log(JSON.stringify(rows, null, 2));
    }

    // 3. 查看调解员表
    console.log('\n3. 调解员表数据:');
    db.all('SELECT * FROM mediators', (err, rows) => {
      if (err) {
        console.log('❌ 查询失败:', err.message);
      } else {
        console.log(JSON.stringify(rows, null, 2));
      }

      // 4. 测试JOIN查询
      console.log('\n4. 测试JOIN查询 (ID=3):');
      const sql = `SELECT
                    mr.*,
                    a.name AS applicant_name,
                    r.name AS respondent_name
                  FROM mediation_records mr
                  LEFT JOIN residents a ON mr.applicant_id = a.id
                  LEFT JOIN residents r ON mr.respondent_id = r.id
                  WHERE mr.id = 3`;
      db.get(sql, (err, row) => {
        if (err) {
          console.log('❌ JOIN查询失败:', err.message);
        } else {
          console.log('JOIN查询结果:', JSON.stringify(row, null, 2));
        }

        db.close();
      });
    });
  });
});
