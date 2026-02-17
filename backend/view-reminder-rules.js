const db = require('./db')

console.log('========================================')
console.log('查看 reminder_rules 表中的提醒规则')
console.log('========================================\n')

// 查询所有提醒规则
const sql = 'SELECT * FROM reminder_rules ORDER BY id'

db.all(sql, [], (err, rows) => {
  if (err) {
    console.error('查询提醒规则失败:', err.message)
    process.exit(1)
  }

  if (rows.length === 0) {
    console.log('⚠️  reminder_rules 表中没有数据！')
    console.log('\n提示:')
    console.log('- 请运行 node create-notification-tables.js 创建表并插入默认规则')
    console.log('- 或通过前端"提醒规则管理"页面添加规则')
    db.close()
    process.exit(0)
  }

  console.log(`找到 ${rows.length} 条提醒规则：\n`)

  rows.forEach((row, index) => {
    console.log(`规则 #${row.id}`)
    console.log(`  类型: ${row.rule_type === 'age' ? '年龄提醒' : row.rule_type}`)
    console.log(`  名称: ${row.rule_name}`)
    console.log(`  目标值: ${row.rule_value}`)
    console.log(`  描述: ${row.description || '无'}`)
    console.log(`  状态: ${row.status === 'active' ? '✅ 启用' : '❌ 禁用'}`)

    // 检查是否有reminder_days字段
    if (row.hasOwnProperty('reminder_days')) {
      console.log(`  提前提醒天数: ${row.reminder_days || 0}天`)
    } else {
      console.log(`  提前提醒天数: ❌ 字段不存在`)
    }

    console.log(`  创建时间: ${row.created_at || '未知'}`)
    console.log(`  更新时间: ${row.updated_at || '未知'}`)
    console.log('')
  })

  // 统计信息
  console.log('========================================')
  console.log('统计信息')
  console.log('========================================')
  const activeRules = rows.filter((r) => r.status === 'active')
  const ageRules = rows.filter((r) => r.rule_type === 'age')
  const rulesWithReminderDays = rows.filter((r) => r.reminder_days && r.reminder_days > 0)

  console.log(`总规则数: ${rows.length}`)
  console.log(`启用规则数: ${activeRules.length}`)
  console.log(`年龄提醒规则数: ${ageRules.length}`)
  console.log(`配置了提前提醒天数的规则数: ${rulesWithReminderDays.length}`)

  if (rulesWithReminderDays.length > 0) {
    console.log('\n已配置提前提醒的年龄规则:')
    rulesWithReminderDays
      .filter((r) => r.rule_type === 'age')
      .forEach((r) => {
        console.log(`  - ${r.rule_name} (${r.rule_value}岁): ${r.reminder_days}天`)
      })
  }

  // 检查reminder_days字段是否存在
  db.get('PRAGMA table_info(reminder_rules)', (err, columns) => {
    if (err) {
      console.error('\n查询表结构失败:', err.message)
      db.close()
      process.exit(1)
    }

    const hasReminderDaysField = columns.some((col) => col.name === 'reminder_days')
    console.log('\n========================================')
    console.log('表结构检查')
    console.log('========================================')
    console.log(`reminder_days 字段: ${hasReminderDaysField ? '✅ 存在' : '❌ 不存在'}`)

    if (!hasReminderDaysField) {
      console.log('\n⚠️  缺少reminder_days字段！')
      console.log('运行以下命令添加该字段:')
      console.log('  node add-reminder-days-field.js')
      console.log('或访问: http://localhost:3000/api/update-reminder-days-field')
    }

    db.close()
  })
})
