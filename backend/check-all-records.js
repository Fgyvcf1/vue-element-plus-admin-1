const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./app.db')

db.all('SELECT * FROM mediation_records ORDER BY id DESC', (err, rows) => {
  if (err) {
    console.log('❌ 查询失败:', err.message)
  } else {
    console.log('所有调解记录（按ID降序）:')
    console.log(JSON.stringify(rows, null, 2))
  }
  db.close()
})
