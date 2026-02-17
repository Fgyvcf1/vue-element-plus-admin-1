const db = require('./db')

db.all('PRAGMA table_info(residents)', (err, rows) => {
  if (err) {
    console.error('查询表结构失败:', err.message)
    process.exit(1)
  }

  console.log('residents表结构:')
  console.log('总共有', rows.length, '个字段')
  console.log('=====================================')

  rows.forEach((row, index) => {
    console.log(`字段${index + 1}:`)
    console.log(`  名称: "${row.name}"`)
    console.log(`  类型: "${row.type}"`)
    console.log(`  NOT NULL: ${row.notnull}`)
    console.log(`  默认值: "${row.dflt_value}"`)
    console.log(`  主键: ${row.pk}`)
    console.log('-------------------------------------')
  })

  process.exit(0)
})
