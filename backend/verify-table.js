const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const dbPath = path.join(__dirname, 'app.db')
const db = new sqlite3.Database(dbPath)

db.all('PRAGMA table_info(residents)', [], (err, rows) => {
  if (err) {
    console.error('错误:', err.message)
  } else {
    console.log('=== residents表字段 ===')
    rows.forEach((r) => console.log(`  ${r.name}: ${r.type}`))
    const hasEquity = rows.some((r) => r.name === 'equity_shares')
    console.log(`\n包含 equity_shares 字段: ${hasEquity}`)
  }
  db.close()
})
