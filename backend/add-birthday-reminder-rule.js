const db = require('./db');

console.log('========================================');
console.log('添加生日后提醒规则');
console.log('========================================\n');

// 新规则配置
const newRule = {
  rule_type: 'birthday',  // 生日提醒类型
  rule_name: '60岁生日后认证提醒',
  rule_value: '60',       // 目标年龄
  description: '通知60岁居民及时进行养老待遇资格认证',
  status: 'active',       // 启用状态
  reminder_days: 1        // 生日后1天提醒
};

console.log('准备添加新规则:');
console.log(`  规则类型: ${newRule.rule_type}`);
console.log(`  规则名称: ${newRule.rule_name}`);
console.log(`  目标年龄: ${newRule.rule_value}岁`);
console.log(`  描述: ${newRule.description}`);
console.log(`  状态: ${newRule.status}`);
console.log(`  提醒天数: 生日后${newRule.reminder_days}天\n`);

// 检查是否已存在相同规则
const checkSql = `SELECT id, rule_name FROM reminder_rules
                 WHERE rule_type = ? AND rule_value = ?`;

db.get(checkSql, [newRule.rule_type, newRule.rule_value], (err, existing) => {
  if (err) {
    console.error('检查现有规则失败:', err.message);
    process.exit(1);
  }

  if (existing) {
    console.log(`⚠️  已存在相同规则 (ID: ${existing.id}): ${existing.rule_name}`);
    console.log('规则已存在，跳过添加');
    console.log('\n如需更新，请使用以下SQL:');
    console.log(`UPDATE reminder_rules SET rule_name = '${newRule.rule_name}', description = '${newRule.description}', reminder_days = ${newRule.reminder_days} WHERE id = ${existing.id};`);
    db.close();
    process.exit(0);
  }

  // 插入新规则
  const insertSql = `INSERT INTO reminder_rules
                   (rule_type, rule_name, rule_value, description, status, reminder_days)
                   VALUES (?, ?, ?, ?, ?, ?)`;

  const params = [
    newRule.rule_type,
    newRule.rule_name,
    newRule.rule_value,
    newRule.description,
    newRule.status,
    newRule.reminder_days
  ];

  db.run(insertSql, params, function(err) {
    if (err) {
      console.error('❌ 添加规则失败:', err.message);
      process.exit(1);
    }

    console.log(`✅ 成功添加新规则 (ID: ${this.lastID})`);
    console.log('\n规则详情:');
    console.log(`  ID: ${this.lastID}`);
    console.log(`  规则名称: ${newRule.rule_name}`);
    console.log(`  规则类型: ${newRule.rule_type}`);
    console.log(`  目标年龄: ${newRule.rule_value}岁`);
    console.log(`  提醒时机: 生日后${newRule.reminder_days}天`);
    console.log(`  描述: ${newRule.description}`);
    console.log(`  状态: ${newRule.status}\n`);

    console.log('========================================');
    console.log('添加完成！');
    console.log('========================================');
    console.log('\n提示:');
    console.log('- 此规则已添加到数据库');
    console.log('- 需要在routes.js中实现birthday类型的提醒检查逻辑');
    console.log('- 或通过前端"提醒规则管理"页面查看此规则\n');

    db.close();
  });
});
