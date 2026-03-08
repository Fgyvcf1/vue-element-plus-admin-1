const sqlite3 = require('sqlite3').verbose()
const path = require('path')

// 数据库路径
const dbPath = path.join(__dirname, 'app.db')

// 连接数据库
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('连接数据库失败:', err.message)
    process.exit(1)
  }
  console.log('成功连接到SQLite数据库')
})

// 检查residents表结构
db.serialize(() => {
  console.log('========================================')
  console.log('检查residents表结构:')
  db.all('PRAGMA table_info(residents)', (err, rows) => {
    if (err) {
      console.error('查询residents表结构失败:', err.message)
      return
    }

    console.log(`residents表共有 ${rows.length} 个字段:`)
    rows.forEach((row, index) => {
      console.log(
        `${index + 1}. ${row.name} (${row.type}) - ${row.notnull ? 'NOT NULL' : 'NULL'} - 默认值: ${row.dflt_value}`
      )
    })

    // 检查households表结构
    console.log('\n========================================')
    console.log('检查households表结构:')
    db.all('PRAGMA table_info(households)', (err, rows) => {
      if (err) {
        console.error('查询households表结构失败:', err.message)
        return
      }

      console.log(`households表共有 ${rows.length} 个字段:`)
      rows.forEach((row, index) => {
        console.log(
          `${index + 1}. ${row.name} (${row.type}) - ${row.notnull ? 'NOT NULL' : 'NULL'} - 默认值: ${row.dflt_value}`
        )
      })

      db.close()
    })
  })
})
