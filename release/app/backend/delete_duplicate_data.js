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

// 删除重复数据
console.log('开始删除重复数据...')

// 先删除居民表中关联的数据
db.run('DELETE FROM residents WHERE household_id BETWEEN 10 AND 31', function (err) {
  if (err) {
    console.error('删除居民表数据失败:', err.message)
    db.close()
    process.exit(1)
  }
  console.log(`已删除居民表中 ${this.changes} 条数据`)

  // 再删除户主表中的数据
  db.run('DELETE FROM households WHERE id BETWEEN 10 AND 31', function (err) {
    if (err) {
      console.error('删除户主表数据失败:', err.message)
      db.close()
      process.exit(1)
    }
    console.log(`已删除户主表中 ${this.changes} 条数据`)

    // 验证删除结果
    db.all(
      'SELECT id, household_head_name FROM households WHERE household_head_name = "陈东"',
      (err, rows) => {
        if (err) {
          console.error('查询验证数据失败:', err.message)
          db.close()
          process.exit(1)
        }
        console.log('\n验证结果 - 户主名为"陈东"的数据:')
        rows.forEach((row) => {
          console.log(`id: ${row.id}, 户主姓名: ${row.household_head_name}`)
        })

        db.close((err) => {
          if (err) {
            console.error('关闭数据库失败:', err.message)
            process.exit(1)
          }
          console.log('\n数据库连接已关闭，删除操作完成')
        })
      }
    )
  })
})
