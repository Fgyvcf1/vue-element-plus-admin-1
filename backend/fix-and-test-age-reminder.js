const db = require('./db');

console.log('========================================');
console.log('年龄提醒问题诊断和修复');
console.log('========================================\n');

const today = new Date('2026-01-09');
console.log(`当前日期: ${today.toISOString().split('T')[0]}\n`);

// 步骤1: 检查notifications表结构
console.log('步骤1: 检查notifications表结构');
console.log('----------------------------------------');

db.get("PRAGMA table_info(notifications)", (err, columns) => {
  if (err) {
    console.error('查询表结构失败:', err.message);
    process.exit(1);
  }

  console.log('notifications表字段:');
  columns.forEach(col => {
    console.log(`  - ${col.name} (${col.type})`);
  });

  // 检查是否有is_read字段
  const hasIsReadField = columns.some(col => col.name === 'is_read');
  const hasStatusField = columns.some(col => col.name === 'status');

  console.log(`\n字段检查:`);
  console.log(`  is_read字段: ${hasIsReadField ? '✅ 存在' : '❌ 不存在'}`);
  console.log(`  status字段: ${hasStatusField ? '✅ 存在' : '❌ 不存在'}`);

  if (!hasIsReadField && !hasStatusField) {
    console.log('\n⚠️  警告: 表结构可能不正确！');
  }

  // 步骤2: 查找1966-01-10出生的居民
  console.log('\n步骤2: 查找1966-01-10出生的居民');
  console.log('----------------------------------------');

  const sql = `SELECT id, name, date_of_birth, id_card, village_group, status
              FROM residents
              WHERE date_of_birth = '1966-01-10'`;

  db.all(sql, [], (err, residents) => {
    if (err) {
      console.error('查询失败:', err.message);
      process.exit(1);
    }

    if (residents.length === 0) {
      console.log('❌ 没有找到1966-01-10出生的居民');
      console.log('   请检查:');
      console.log('   1. 数据库中是否有该日期的居民');
      console.log('   2. date_of_birth字段格式是否为YYYY-MM-DD');
      db.close();
      process.exit(0);
    }

    console.log(`找到 ${residents.length} 个居民:\n`);

    residents.forEach(resident => {
      console.log(`  ${resident.name} (ID: ${resident.id})`);
      console.log(`    出生日期: ${resident.date_of_birth}`);
      console.log(`    状态: ${resident.status}`);

      if (resident.status !== 'active') {
        console.log(`    ⚠️  状态不是active，不会被检查！`);
      }
      console.log('');
    });

    // 步骤3: 检查60岁提醒规则
    console.log('\n步骤3: 检查60岁提醒规则');
    console.log('----------------------------------------');

    db.all("SELECT * FROM reminder_rules WHERE rule_type = 'age' AND status = 'active' AND rule_value = '60'", (err, rules) => {
      if (err) {
        console.error('查询规则失败:', err.message);
        db.close();
        process.exit(1);
      }

      if (rules.length === 0) {
        console.log('❌ 没有找到启用状态的60岁提醒规则');
        db.close();
        process.exit(0);
      }

      console.log(`找到 ${rules.length} 条60岁规则:\n`);

      let hasValidRule = false;
      rules.forEach(rule => {
        console.log(`  规则 #${rule.id}: ${rule.rule_name}`);
        console.log(`    reminder_days: ${rule.reminder_days || 0}天`);
        console.log(`    状态: ${rule.status}`);

        if (rule.reminder_days === 1) {
          hasValidRule = true;
          console.log(`    ✅ 这是一个提前1天的规则`);
        }
        console.log('');
      });

      if (!hasValidRule) {
        console.log('⚠️  没有提前1天的60岁规则！');
      }

      // 步骤4: 检查是否已存在相关通知
      console.log('\n步骤4: 检查是否已存在相关通知');
      console.log('----------------------------------------');

      residents.forEach(resident => {
        const checkSql = `SELECT id, title, content, created_at, status
                        FROM notifications
                        WHERE title LIKE ? OR content LIKE ?
                        ORDER BY created_at DESC
                        LIMIT 3`;

        db.all(checkSql, [`%${resident.name}%`, `%${resident.name}%`], (err, notifications) => {
          if (err) {
            console.error('查询通知失败:', err.message);
            return;
          }

          if (notifications.length > 0) {
            console.log(`找到 ${notifications.length} 条关于 ${resident.name} 的通知:`);
            notifications.forEach(notif => {
              console.log(`  ID: ${notif.id}`);
              console.log(`  标题: ${notif.title}`);
              console.log(`  内容: ${notif.content}`);
              console.log(`  创建时间: ${notif.created_at}`);
              console.log(`  状态: ${notif.status}\n`);
            });
          } else {
            console.log(`${resident.name} 没有相关通知`);
          }
        });
      });

      // 步骤5: 尝试手动创建通知
      setTimeout(() => {
        console.log('\n步骤5: 尝试手动创建测试通知');
        console.log('----------------------------------------');

        const testResident = residents[0];
        const testRule = rules.find(r => r.reminder_days === 1) || rules[0];

        // 检查表实际有的字段
        const availableFields = columns.map(c => c.name);
        console.log(`可用字段: ${availableFields.join(', ')}`);

        // 根据表结构决定插入语句
        let insertSql, params;

        if (availableFields.includes('is_read')) {
          // 如果有is_read字段
          insertSql = `INSERT INTO notifications (title, content, type, priority, is_read, created_at, updated_at)
                      VALUES (?, ?, 'reminder', 2, 0, datetime('now'), datetime('now'))`;
          params = [`测试: ${testResident.name} ${testRule.rule_name}`, `这是一条测试通知，用于验证年龄提醒功能是否正常工作`];
        } else if (availableFields.includes('status')) {
          // 如果只有status字段
          insertSql = `INSERT INTO notifications (title, content, type, priority, status, created_at)
                      VALUES (?, ?, 'reminder', 2, 'unread', datetime('now'))`;
          params = [`测试: ${testResident.name} ${testRule.rule_name}`, `这是一条测试通知，用于验证年龄提醒功能是否正常工作`];
        } else {
          console.log('⚠️  无法确定插入字段，跳过创建测试通知');
          db.close();
          return;
        }

        console.log(`执行SQL: ${insertSql}`);
        console.log(`参数: ${JSON.stringify(params)}\n`);

        db.run(insertSql, params, function(err) {
          if (err) {
            console.error('❌ 创建测试通知失败:', err.message);
            console.log('\n可能的原因:');
            console.log('1. notifications表结构与代码不匹配');
            console.log('2. 插入语句使用了不存在的字段');
            console.log('3. 数据库文件锁定或权限问题');
            console.log('\n建议修复:');
            console.log('- 检查 backend/routes.js 第1860行的INSERT语句');
            console.log('- 确保使用的字段与表结构一致');
          } else {
            console.log(`✅ 成功创建测试通知 (ID: ${this.lastID})`);
            console.log('\n建议操作:');
            console.log('1. 检查前端通知列表是否显示此通知');
            console.log('2. 检查铃铛图标是否有新通知');
            console.log('3. 如果显示了，说明通知创建功能正常');
            console.log('4. 然后触发年龄提醒检查API');
            console.log('\n触发API:');
            console.log('- 访问: http://localhost:3000/api/check-age-reminders');
            console.log('- 或在前端页面调用');
          }
          db.close();
        });
      }, 1000);
    });
  });
});
