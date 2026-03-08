const db = require('./db')

console.log('正在查询residents表的结构...')

// 查询residents表的结构
db.all('PRAGMA table_info(residents);', [], (err, rows) => {
  if (err) {
    console.error('查询表结构失败:', err.message)
    process.exit(1)
  }

  console.log('residents表结构:')
  rows.forEach((row) => {
    console.log(
      `${row.name} (${row.type}) - ${row.notnull ? 'NOT NULL' : 'NULL'}${row.dflt_value ? `, 默认值: ${row.dflt_value}` : ''}`
    )
  })

  // 检查是否存在用户提到的字段
  const fieldsToCheck = [
    'household_registration_status',
    'migration_in_date',
    'migration_out_date',
    'death_date',
    'account_cancellation_date'
  ]

  console.log('\n检查用户提到的字段:')
  fieldsToCheck.forEach((field) => {
    const found = rows.some((row) => row.name === field)
    console.log(`${field}: ${found ? '存在' : '不存在'}`)
  })

  process.exit(0)
})
