const db = require('./db')

console.log('========================================')
console.log('诊断：添加生日提醒规则失败原因')
console.log('========================================\n')

// 步骤1: 检查reminder_rules表结构
console.log('步骤1: 检查reminder_rules表结构')
console.log('----------------------------------------')

db.all('PRAGMA table_info(reminder_rules)', (err, columns) => {
  if (err) {
    console.error('查询表结构失败:', err.message)
    process.exit(1)
  }

  console.log('reminder_rules表字段:')
  columns.forEach((col) => {
    console.log(`  - ${col.name} (${col.type})`)
  })

  // 检查是否有必要字段
  const requiredFields = ['rule_type', 'rule_name', 'rule_value', 'description', 'status']
  const optionalFields = ['reminder_days', 'created_at']

  console.log('\n字段检查:')
  requiredFields.forEach((field) => {
    const exists = columns.some((col) => col.name === field)
    console.log(`  ${field}: ${exists ? '✅ 存在' : '❌ 缺少'}`)
  })

  optionalFields.forEach((field) => {
    const exists = columns.some((col) => col.name === field)
    console.log(`  ${field}: ${exists ? '✅ 存在' : '⚠️  缺少（可选）'}`)
  })

  // 步骤2: 检查是否已存在相同规则
  console.log('\n步骤2: 检查是否已存在相同规则')
  console.log('----------------------------------------')

  const checkSql = `SELECT id, rule_type, rule_name, rule_value, reminder_days
                   FROM reminder_rules
                   WHERE rule_type LIKE '%birthday%' AND rule_value = '60'`

  db.all(checkSql, [], (err, rows) => {
    if (err) {
      console.error('查询失败:', err.message)
      process.exit(1)
    }

    if (rows.length > 0) {
      console.log(`找到 ${rows.length} 条相关规则:\n`)
      rows.forEach((row) => {
        console.log(`  ID: ${row.id}`)
        console.log(`  规则类型: ${row.rule_type}`)
        console.log(`  规则名称: ${row.rule_name}`)
        console.log(`  目标年龄: ${row.rule_value}`)
        console.log(`  提醒天数: ${row.reminder_days || '未设置'}\n`)
      })
      console.log('⚠️  如果规则已存在，请先删除或更新旧规则\n')
    } else {
      console.log('✅ 没有找到冲突规则\n')
    }

    // 步骤3: 尝试手动插入
    console.log('步骤3: 尝试手动插入规则')
    console.log('----------------------------------------')

    const newRule = {
      rule_type: 'birthday_after',
      rule_name: '60岁生日后认证提醒',
      rule_value: '60',
      description: '通知60岁居民及时进行养老待遇资格认证',
      status: 'active',
      reminder_days: 1
    }

    console.log('准备插入的规则:')
    console.log(`  rule_type: ${newRule.rule_type}`)
    console.log(`  rule_name: ${newRule.rule_name}`)
    console.log(`  rule_value: ${newRule.rule_value}`)
    console.log(`  description: ${newRule.description}`)
    console.log(`  status: ${newRule.status}`)
    console.log(`  reminder_days: ${newRule.reminder_days}\n`)

    // 检查所有字段是否存在
    const allFieldsExist =
      requiredFields.every((field) => columns.some((col) => col.name === field)) &&
      columns.some((col) => col.name === 'reminder_days')

    if (!allFieldsExist) {
      console.log('❌ 表结构不完整，无法插入！')
      console.log('\n请先运行: node create-notification-tables.js')
      db.close()
      process.exit(1)
    }

    // 构建插入SQL
    let insertSql = `INSERT INTO reminder_rules (`
    const params = []
    const values = []

    if (columns.some((col) => col.name === 'created_at')) {
      insertSql += `rule_type, rule_name, rule_value, description, status, reminder_days, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
      params.push(
        newRule.rule_type,
        newRule.rule_name,
        newRule.rule_value,
        newRule.description,
        newRule.status,
        newRule.reminder_days
      )
    } else {
      insertSql += `rule_type, rule_name, rule_value, description, status, reminder_days) VALUES (?, ?, ?, ?, ?, ?)`
      params.push(
        newRule.rule_type,
        newRule.rule_name,
        newRule.rule_value,
        newRule.description,
        newRule.status,
        newRule.reminder_days
      )
    }

    console.log(`执行SQL: ${insertSql}`)
    console.log(`参数: ${JSON.stringify(params)}\n`)

    db.run(insertSql, params, function (err) {
      if (err) {
        console.error('❌ 插入失败:', err.message)
        console.error('错误详情:', err)

        if (err.message.includes('UNIQUE constraint')) {
          console.log('\n⚠️  违反唯一约束！可能已有相同规则的组合')
        }

        if (err.message.includes('no such column')) {
          console.log('\n⚠️  字段不存在！请检查表结构')
        }

        db.close()
        process.exit(1)
      }

      console.log(`✅ 成功插入规则 (ID: ${this.lastID})`)
      console.log('\n规则已成功添加到数据库！')
      console.log('您可以通过前端"提醒规则管理"页面查看此规则')

      db.close()
    })
  })
})
