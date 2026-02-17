const sqlite3 = require('sqlite3').verbose()
const path = require('path')

// 连接到SQLite数据库
const dbPath = path.join(__dirname, 'app.db')
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('连接数据库失败:', err.message)
    process.exit(1)
  } else {
    console.log('成功连接到SQLite数据库')
  }
})

// 检查households表结构
console.log('开始检查households表结构...')

// 查询表结构
db.all('PRAGMA table_info(households)', (err, rows) => {
  if (err) {
    console.error('查询表结构失败:', err.message)
    db.close()
    process.exit(1)
  }

  console.log('households表结构:')
  rows.forEach((row) => {
    console.log(
      `${row.cid}: ${row.name} (${row.type}) - ${row.notnull ? 'NOT NULL' : 'NULL'} - 默认值: ${row.dflt_value}`
    )
  })

  // 查询样例数据
  console.log('\nhouseholds表样例数据:')
  db.all('SELECT * FROM households LIMIT 5', (err, rows) => {
    if (err) {
      console.error('查询样例数据失败:', err.message)
      db.close()
      process.exit(1)
    }
    rows.forEach((row) => {
      console.log(row)
    })

    db.close((err) => {
      if (err) {
        console.error('关闭数据库失败:', err.message)
        process.exit(1)
      }
      console.log('\n数据库连接已关闭')
    })
  })
})
