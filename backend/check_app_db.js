const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./app.db')

console.log('检查app.db数据库中的表...')

// 检查所有表
db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, tables) => {
  if (err) {
    console.error('查询表列表失败:', err.message)
    db.close()
    return
  }

  console.log('app.db中存在的表:')
  tables.forEach((table, index) => {
    console.log(`${index + 1}. ${table.name}`)
  })

  // 检查residents表结构
  db.all('PRAGMA table_info(residents);', (err, rows) => {
    if (err) {
      console.error('查询residents表结构失败:', err.message)
      db.close()
      return
    }

    console.log('\nresidents表结构:')
    if (rows.length === 0) {
      console.log('residents表不存在或没有字段')
    } else {
      rows.forEach((row, index) => {
        console.log(
          `${index + 1}. ${row.name} (${row.type}) - ${row.notnull ? 'NOT NULL' : 'NULL'} ${row.pk ? 'PRIMARY KEY' : ''}`
        )
      })

      // 查询residents表中的数据数量
      db.get('SELECT COUNT(*) as count FROM residents;', (err, result) => {
        if (err) {
          console.error('查询residents表数据数量失败:', err.message)
        } else {
          console.log(`\nresidents表中有 ${result.count} 条数据`)
        }
        db.close()
      })
    }
  })
})
