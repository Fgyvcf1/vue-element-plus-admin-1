const sqlite3 = require('sqlite3').verbose()

// 连接到SQLite数据库
const db = new sqlite3.Database('./app.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('连接数据库失败:', err.message)
    return
  }
  console.log('成功连接到SQLite数据库')

  // 为households表添加gender字段
  const sql = `ALTER TABLE households ADD COLUMN gender VARCHAR(10) DEFAULT '未知'`

  db.run(sql, (err) => {
    if (err) {
      console.error('添加字段失败:', err.message)
    } else {
      console.log('成功为households表添加gender字段')
    }

    // 关闭数据库连接
    db.close((err) => {
      if (err) {
        console.error('关闭数据库连接失败:', err.message)
      } else {
        console.log('数据库连接已关闭')
      }
    })
  })
})
