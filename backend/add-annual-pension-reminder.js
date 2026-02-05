const db = require('./db');

console.log('========================================');
echo "添加年度养老待遇认证提醒规则"
console.log('========================================\n');

// 规则配置
const newRule = {
  rule_type: 'annual_pension',        // 年度养老待遇认证提醒
  rule_name: '61岁以上年度养老待遇认证提醒',
  rule_value: '61',                 // 最低年龄
  description: '61岁以上居民，每年生日后1天提醒进行城乡居民养老待遇资格认证',
  status: 'active',                 // 启用状态
  reminder_days: 1                  // 生日后1天提醒
};

console.log('准备添加新规则:');
console.log(`  规则类型: ${newRule.rule_type}`);
console.log(`  规则名称: ${newRule.rule_name}`);
console.log(`  最低年龄: ${newRule.rule_value}岁以上`);
console.log(`  描述: ${newRule.description}`);
console.log(`  状态: ${newRule.status}`);
console.log(`  提醒时机: 每年生日后${newRule.reminder_days}天\n`);

// 检查表结构并插入
db.get("PRAGMA table_info(reminder_rules)", (err, columns) => {
  if (err) {
    console.error('❌ 查询表结构失败:', err.message);
    process.exit(1);
  }

  const hasReminderDays = columns.some(col => col.name === 'reminder_days');
  const hasCreatedAt = columns.some(col => col.name === 'created_at');

  // 构建插入SQL
  let insertSql, params;

  if (hasReminderDays && hasCreatedAt) {
    insertSql = `INSERT INTO reminder_rules
                 (rule_type, rule_name, rule_value, description, status, reminder_days, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`;
    params = [
      newRule.rule_type,
      newRule.rule_name,
      newRule.rule_value,
      newRule.description,
      newRule.status,
      newRule.reminder_days
    ];
  } else {
    insertSql = `INSERT INTO reminder_rules
                 (rule_type, rule_name, rule_value, description, status)
                 VALUES (?, ?, ?, ?, ?)`;
    params = [
      newRule.rule_type,
      newRule.rule_name,
      newRule.rule_value,
      newRule.description,
      newRule.status
    ];
  }

  console.log('执行SQL插入...\n');

  db.run(insertSql, params, function(err) {
    if (err) {
      console.error('❌ 添加规则失败:', err.message);
      console.error('\n错误详情:', err);
      if (err.message.includes('UNIQUE')) {
        console.log('\n提示: 可能已存在相同的规则');
      }
      process.exit(1);
    }

    console.log(`✅ 规则添加成功 (ID: ${this.lastID})\n`);

    console.log('========================================');
    console.log('规则详情');
    console.log('========================================');
    console.log(`  ID: ${this.lastID}`);
    console.log(`  规则名称: ${newRule.rule_name}`);
    console.log(`  规则类型: ${newRule.rule_type}`);
    console.log(`  适用对象: ${newRule.rule_value}岁以上居民`);
    console.log(`  提醒频率: 每年一次（生日后1天）`);
    console.log(`  描述: ${newRule.description}`);
    console.log(`  状态: ${newRule.status}\n`);

    console.log('========================================');
    console.log('下一步');
    console.log('========================================');
    console.log('\n规则已添加，需要实现检查逻辑：');
    console.log('- 在 routes.js 中添加 /check-annual-pension-reminders API');
    console.log('- 实现年度生日后提醒检查逻辑\n');

    db.close();
  });
});
