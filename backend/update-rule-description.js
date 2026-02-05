const db = require('./db');

console.log('========================================');
console.log('修改60岁规则描述，包含生日后提醒');
console.log('========================================\n');

// 查找60岁规则
const findSql = `SELECT id, rule_name, description FROM reminder_rules
                WHERE rule_type = 'age' AND rule_value = '60' LIMIT 1`;

db.get(findSql, [], (err, row) => {
  if (err) {
    console.error('查询规则失败:', err.message);
    process.exit(1);
  }

  if (!row) {
    console.log('❌ 没有找到60岁的年龄提醒规则');
    console.log('\n请先通过前端添加60岁年龄提醒规则');
    db.close();
    process.exit(0);
  }

  console.log('找到规则:');
  console.log(`  ID: ${row.id}`);
  console.log(`  规则名称: ${row.rule_name}`);
  console.log(`  当前描述: ${row.description || '无'}\n`);

  // 更新描述
  const newDescription = '满60岁提醒：生日前1天提醒准备材料，生日后1天提醒进行养老待遇资格认证';

  console.log(`新描述: ${newDescription}\n`);

  const updateSql = `UPDATE reminder_rules
                    SET description = ?
                    WHERE id = ?`;

  db.run(updateSql, [newDescription, row.id], function(err) {
    if (err) {
      console.error('❌ 更新失败:', err.message);
      db.close();
      process.exit(1);
    }

    console.log(`✅ 描述更新成功！\n`);
    console.log('现在规则的说明更清楚了，包含了生日前和生日后的提醒内容。');
    console.log('\n不过，实际的提醒逻辑还需要修改后端代码。');
    console.log('当前逻辑：只在生日前提醒');
    console.log('需要添加：生日后1天的检查逻辑\n');

    console.log('========================================');
    console.log('下一步：修改后端检查逻辑');
    console.log('========================================');
    console.log('\n需要修改 routes.js 中的 /check-age-reminders API');
    console.log('添加对 birthday_after 类型的支持，或者扩展 age 类型的逻辑');
    console.log('使其支持 birthday_after: -1（负数表示生日后）');
    console.log('');
    console.log('是否需要我帮您实现生日后提醒的逻辑？(输入 yes 或 no)');

    db.close();
  });
});
