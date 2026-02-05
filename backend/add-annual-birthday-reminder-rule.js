const db = require('./db');

console.log('========================================');
console.log('添加年度生日后提醒规则');
console.log('========================================\n');

// 新规则配置
const newRule = {
  rule_type: 'annual_birthday',  // 年度生日后提醒
  rule_name: '61岁以上年度生日后认证提醒',
  rule_value: '61',              // 最低年龄
  description: '61岁以上居民，每年生日后1天提醒进行养老待遇资格认证',
  status: 'active',              // 启用状态
  reminder_days: 1               // 生日后1天提醒
};

console.log('准备添加新规则:');
console.log(`  规则类型: ${newRule.rule_type}`);
console.log(`  规则名称: ${newRule.rule_name}`);
console.log(`  最低年龄: ${newRule.rule_value}岁以上`);
console.log(`  描述: ${newRule.description}`);
console.log(`  状态: ${newRule.status}`);
console.log(`  提醒时机: 每年生日后${newRule.reminder_days}天\n`);

// 检查表结构
db.get("PRAGMA table_info(reminder_rules)", (err, columns) => {
  if (err) {
    console.error('查询表结构失败:', err.message);
    process.exit(1);
  }

  const requiredFields = ['rule_type', 'rule_name', 'rule_value', 'description', 'status'];
  const hasRequiredFields = requiredFields.every(field =>
    columns.some(col => col.name === field)
  );

  if (!hasRequiredFields) {
    console.log('❌ 表结构不完整，缺少必要字段');
    db.close();
    process.exit(1);
  }

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
      console.log('规则已存在，跳过添加\n');
      db.close();
      process.exit(0);
    }

    // 构建插入SQL
    let insertSql, params;

    if (columns.some(col => col.name === 'reminder_days') &&
        columns.some(col => col.name === 'created_at')) {
      insertSql = `INSERT INTO reminder_rules (rule_type, rule_name, rule_value, description, status, reminder_days, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`;
      params = [
        newRule.rule_type,
        newRule.rule_name,
        newRule.rule_value,
        newRule.description,
        newRule.status,
        newRule.reminder_days
      ];
    } else if (columns.some(col => col.name === 'reminder_days')) {
      insertSql = `INSERT INTO reminder_rules (rule_type, rule_name, rule_value, description, status, reminder_days)
                   VALUES (?, ?, ?, ?, ?, ?)`;
      params = [
        newRule.rule_type,
        newRule.rule_name,
        newRule.rule_value,
        newRule.description,
        newRule.status,
        newRule.reminder_days
      ];
    } else {
      insertSql = `INSERT INTO reminder_rules (rule_type, rule_name, rule_value, description, status)
                   VALUES (?, ?, ?, ?, ?)`;
      params = [
        newRule.rule_type,
        newRule.rule_name,
        newRule.rule_value,
        newRule.description,
        newRule.status
      ];
    }

    console.log('执行SQL...\n');

    db.run(insertSql, params, function(err) {
      if (err) {
        console.error('❌ 添加规则失败:', err.message);
        console.error('\n错误详情:', err);
        db.close();
        process.exit(1);
      }

      console.log(`✅ 成功添加新规则 (ID: ${this.lastID})`);
      console.log('\n规则详情:');
      console.log(`  ID: ${this.lastID}`);
      console.log(`  规则类型: ${newRule.rule_type}`);
      console.log(`  规则名称: ${newRule.rule_name}`);
      console.log(`  最低年龄: ${newRule.rule_value}岁以上`);
      console.log(`  提醒时机: 每年生日后${newRule.reminder_days}天`);
      console.log(`  描述: ${newRule.description}`);
      console.log(`  状态: ${newRule.status}\n`);

      console.log('========================================');
      console.log('添加完成！');
      console.log('========================================');
      console.log('\n提示:');
      console.log('- 此规则已添加到数据库');
      console.log('- 需要在routes.js中实现annual_birthday类型的提醒检查逻辑');
      console.log('- 检查逻辑应该：');
      console.log('  1. 查找年龄 >= 61岁的居民');
      console.log('  2. 计算距离上次生日的天数');
      console.log('  3. 如果距离 = 1天，则触发提醒\n');

      console.log('\n是否需要我帮您实现检查逻辑？');

      db.close();
    });
  });
});
