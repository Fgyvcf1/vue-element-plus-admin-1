const db = require('./db')

console.log('========================================')
console.log('查看现有的60岁提醒规则')
console.log('========================================\n')

const sql = `SELECT * FROM reminder_rules
             WHERE rule_type = 'age' AND rule_value = '60'`

db.all(sql, [], (err, rows) => {
  if (err) {
    console.error('查询失败:', err.message)
    process.exit(1)
  }

  if (rows.length === 0) {
    console.log('❌ 没有找到60岁的年龄提醒规则\n')
    console.log('请先通过前端添加60岁年龄提醒规则')
    db.close()
    process.exit(0)
  }

  console.log(`找到 ${rows.length} 条60岁规则:\n`)

  rows.forEach((row, index) => {
    console.log(`规则 #${index + 1} (ID: ${row.id})`)
    console.log(`  规则名称: ${row.rule_name}`)
    console.log(`  规则类型: ${row.rule_type}`)
    console.log(`  目标年龄: ${row.rule_value}岁`)
    console.log(`  提醒天数: ${row.reminder_days || 0}天`)
    console.log(`  描述: ${row.description || '无'}`)
    console.log(`  状态: ${row.status}`)
    console.log(`  创建时间: ${row.created_at}\n`)
  })

  // 检查是否可以修改为生日后提醒
  console.log('========================================')
  console.log('建议：修改规则描述')
  console.log('========================================')
  console.log('\n既然前端不支持"生日提醒"类型，建议：')
  console.log('1. 保持使用"age"类型')
  console.log('2. 修改规则描述，包含生日前和生日后的说明')
  console.log('3. 或者，修改后端检查逻辑，支持生日后提醒\n')

  const ruleId = rows[0].id
  console.log(`可以运行以下SQL修改规则描述：\n`)
  console.log(`UPDATE reminder_rules`)
  console.log(`SET description = '满60岁提醒：生日前1天提醒，生日后1天提醒进行养老待遇资格认证'`)
  console.log(`WHERE id = ${ruleId};\n`)

  console.log('或者直接运行: node update-rule-description.js')
  console.log('')
  db.close()
})
