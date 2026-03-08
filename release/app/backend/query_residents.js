const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const dbPath = path.join(__dirname, 'app.db')
const db = new sqlite3.Database(dbPath)

console.log('查询residents表的结构和数据...')

// 查询表结构
db.all('PRAGMA table_info(residents);', (err, tableInfo) => {
  if (err) {
    console.error('查询表结构失败:', err.message)
    db.close()
    return
  }

  console.log('residents表结构:')
  tableInfo.forEach((col, index) => {
    console.log(
      `${index + 1}. ${col.name} (${col.type}) - ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.pk ? 'PRIMARY KEY' : ''}`
    )
  })

  // 查询表中的数据
  db.all('SELECT * FROM residents;', (err, data) => {
    if (err) {
      console.error('查询数据失败:', err.message)
      db.close()
      return
    }

    console.log('\nresidents表中的数据:')
    if (data.length === 0) {
      console.log('表中没有数据')
    } else {
      console.log(`共有 ${data.length} 条数据:`)
      data.forEach((row, index) => {
        console.log(`\n数据 ${index + 1}:`)
        Object.entries(row).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`)
        })
      })
    }

    db.close()
  })
})
