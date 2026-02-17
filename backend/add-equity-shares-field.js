// 添加 equity_shares 字段到 residents 表
const db = require('./db')

console.log('检查 residents 表的字段...')

db.all('PRAGMA table_info(residents)', [], (err, columns) => {
  if (err) {
    console.error('查询表结构失败:', err.message)
    process.exit(1)
  }

  console.log('residents 表当前字段:')
  columns.forEach((col) => console.log(`  - ${col.name} (${col.type})`))

  const hasEquityShares = columns.some((col) => col.name === 'equity_shares')

  if (hasEquityShares) {
    console.log('\nequity_shares 字段已存在，无需添加')
    process.exit(0)
  }

  console.log('\nequity_shares 字段不存在，准备添加...')

  db.run('ALTER TABLE residents ADD COLUMN equity_shares REAL DEFAULT 0;', function (err) {
    if (err) {
      console.error('添加字段失败:', err.message)
      process.exit(1)
    }

    console.log('✓ equity_shares 字段添加成功！')

    // 验证字段是否添加成功
    db.all('PRAGMA table_info(residents)', [], (err, newColumns) => {
      if (err) {
        console.error('验证失败:', err.message)
        process.exit(1)
      }

      const equityColumn = newColumns.find((col) => col.name === 'equity_shares')
      if (equityColumn) {
        console.log('✓ 验证成功：equity_shares 字段已存在于 residents 表')
        console.log(`  字段类型: ${equityColumn.type || 'REAL (默认)'}`)
      } else {
        console.error('✗ 验证失败：equity_shares 字段未找到')
      }

      process.exit(0)
    })
  })
})
