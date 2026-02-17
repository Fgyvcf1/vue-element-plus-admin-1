const sqlite3 = require('sqlite3').verbose()
const path = require('path')

// 连接到app.db数据库
const dbPath = path.join(__dirname, 'app.db')
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('连接app.db数据库失败:', err.message)
  } else {
    console.log('成功连接到app.db数据库')
  }
})

// 查询数据库中的所有表
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
  if (err) {
    console.error('查询表失败:', err.message)
    db.close()
    return
  }

  console.log('app.db数据库中存在的表:')
  if (rows.length > 0) {
    rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.name}`)
    })
  } else {
    console.log('数据库中没有表')
  }

  db.close()
})
