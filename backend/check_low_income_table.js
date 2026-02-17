const db = require('./db')

console.log('正在查询low_income_persons表结构...')

db.all('PRAGMA table_info(low_income_persons);', [], (err, rows) => {
  if (err) {
    console.error('查询表结构失败:', err.message)
    process.exit(1)
  }

  console.log('low_income_persons表结构:')
  rows.forEach((row) => {
    const defaultValue = row.dflt_value ? `, 默认值: ${row.dflt_value}` : ''
    console.log(`${row.name} (${row.type}) - ${row.notnull ? 'NOT NULL' : 'NULL'}${defaultValue}`)
  })

  // 同时查询表的CREATE语句，获取更完整的信息
  db.get(
    'SELECT sql FROM sqlite_master WHERE type="table" AND name="low_income_persons";',
    [],
    (sqlErr, sqlRow) => {
      if (sqlErr) {
        console.error('查询CREATE语句失败:', sqlErr.message)
      } else {
        console.log('\nCREATE TABLE语句:')
        console.log(sqlRow.sql)
      }

      db.close()
      process.exit(0)
    }
  )
})
