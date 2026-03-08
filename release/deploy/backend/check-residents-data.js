const sqlite3 = require('sqlite3').verbose()

const db = new sqlite3.Database('./backend/app.db')

console.log('=== 检查residents表数据和字段 ===\n')

// 1. 检查表结构
db.all('PRAGMA table_info(residents)', (err, columns) => {
  if (err) {
    console.error('查询表结构失败:', err.message)
    process.exit(1)
  }

  console.log('residents表结构:')
  console.log('字段名\t\t\t类型\t\t非空\t主键')
  console.log(''.padEnd(80, '-'))
  columns.forEach((col) => {
    console.log(
      `${col.name.padEnd(32)}\t${col.type.padEnd(12)}\t${col.notnull ? '是' : '否'}\t${col.pk ? '是' : '否'}`
    )
  })

  // 2. 查询前5条记录
  console.log('\n\n前5条记录:')
  db.all('SELECT id, name, id_card FROM residents LIMIT 5', (err, rows) => {
    if (err) {
      console.error('查询记录失败:', err.message)
    } else {
      rows.forEach((row) => {
        console.log(`ID: ${row.id}, 姓名: ${row.name}, 身份证: ${row.id_card}`)
      })
    }

    db.close()
  })
})
