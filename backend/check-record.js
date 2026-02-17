const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./app.db')

console.log('查询调解记录2的详情...\n')

db.all('SELECT * FROM mediation_records WHERE id = 2', (err, rows) => {
  if (err) {
    console.log('❌ 查询失败:', err.message)
  } else {
    console.log('调解记录2的数据:')
    console.log(JSON.stringify(rows, null, 2))
  }

  db.close()
})
