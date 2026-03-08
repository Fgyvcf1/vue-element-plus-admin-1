const db = require('./db')

console.log('=== 检查提醒规则表结构 ===')

// 检查 reminder_rules 表结构
db.all('PRAGMA table_info(reminder_rules)', (err, columns) => {
  if (err) {
    console.error('查询表结构失败:', err.message)
    return
  }

  if (!columns || columns.length === 0) {
    console.error('reminder_rules 表不存在')
    return
  }

  console.log('reminder_rules 表结构:')
  columns.forEach((col) => {
    console.log(`- ${col.name} (${col.type})`)
  })

  // 查询提醒规则数据
  db.all('SELECT * FROM reminder_rules LIMIT 5', (err, rows) => {
    if (err) {
      console.error('查询提醒规则数据失败:', err.message)
      return
    }

    console.log(`\n查询到 ${rows.length} 条提醒规则:`)
    rows.forEach((row) => {
      console.log(
        `- ID: ${row.id}, 类型: ${row.rule_type}, 名称: ${row.rule_name}, 提醒天数: ${row.reminder_days}`
      )
    })
  })
})
