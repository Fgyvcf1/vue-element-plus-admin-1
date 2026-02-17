const db = require('./db')

db.serialize(() => {
  // 检查residents表
  db.all('PRAGMA table_info(residents)', [], (err, rows) => {
    if (err) {
      console.error('查询residents表失败:', err.message)
    } else {
      console.log('=== residents表字段 ===')
      rows.forEach((r) => console.log(`  ${r.name}: ${r.type}`))
      console.log('字段数量:', rows.length)
    }
  })

  // 检查是否有equity_shares字段
  db.get(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='residents'",
    [],
    (err, table) => {
      if (err) {
        console.error('错误:', err.message)
      } else {
        console.log('\nresidents表存在:', !!table)
      }
    }
  )

  setTimeout(() => {
    db.close()
    console.log('\n检查完成')
  }, 500)
})
