const db = require('./db');

console.log('========================================');
console.log('年龄提醒功能调试');
console.log('========================================\n');

const today = new Date('2026-01-09');
console.log(`当前日期: ${today.toISOString().split('T')[0]}\n`);

// 1. 检查提醒规则
console.log('步骤1: 检查提醒规则');
console.log('----------------------------------------');

db.all("SELECT * FROM reminder_rules WHERE rule_type = 'age' AND status = 'active'", (err, rules) => {
  if (err) {
    console.error('查询规则失败:', err.message);
    process.exit(1);
  }

  if (rules.length === 0) {
    console.log('❌ 没有启用的年龄提醒规则！');
    process.exit(1);
  }

  console.log(`找到 ${rules.length} 条启用的年龄规则:\n`);
  rules.forEach(rule => {
    console.log(`规则 #${rule.id}: ${rule.rule_name} (${rule.rule_value}岁)`);
    console.log(`  reminder_days: ${rule.reminder_days || 0}天`);
    console.log(`  状态: ${rule.status}\n`);
  });

  // 2. 检查居民表中的年龄数据
  console.log('\n步骤2: 检查居民表中的年龄数据');
  console.log('----------------------------------------');

  const sql = `
    SELECT id, name, date_of_birth, id_card, village_group, status
    FROM residents
    WHERE status = 'active'
    ORDER BY date_of_birth DESC
    LIMIT 20
  `;

  db.all(sql, [], (err, residents) => {
    if (err) {
      console.error('查询居民失败:', err.message);
      process.exit(1);
    }

    console.log(`找到 ${residents.length} 个活跃居民:\n`);

    residents.forEach(resident => {
      const dob = new Date(resident.date_of_birth);
      const birthYear = dob.getFullYear();
      const birthMonth = dob.getMonth() + 1;
      const birthDay = dob.getDate();

      // 计算当前年龄（考虑生日是否已过）
      let currentAge = today.getFullYear() - birthYear;
      const thisYearBirthday = new Date(today.getFullYear(), birthMonth - 1, birthDay);
      if (today < thisYearBirthday) {
        currentAge--; // 生日还没到，减1岁
      }

      // 计算距离下一个生日的天数
      const nextBirthday = new Date(today.getFullYear(), birthMonth - 1, birthDay);
      if (today > nextBirthday) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
      }
      const daysUntilBirthday = Math.floor((nextBirthday - today) / (1000 * 60 * 60 * 24));

      console.log(`${resident.name} (${resident.id_card.substring(0, 6)}...${resident.id_card.substring(14)})`);
      console.log(`  出生日期: ${resident.date_of_birth}`);
      console.log(`  当前年龄: ${currentAge}岁`);
      console.log(`  距离下一个生日: ${daysUntilBirthday}天`);
      console.log(`  下一个生日: ${nextBirthday.toISOString().split('T')[0]}`);
      console.log(`  下一个生日年龄: ${currentAge + 1}岁`);
      console.log('');

      // 检查是否匹配任何提醒规则
      rules.forEach(rule => {
        const targetAge = parseInt(rule.rule_value);
        const reminderDays = rule.reminder_days || 0;

        // 提前提醒逻辑
        if (currentAge === targetAge - 1 && daysUntilBirthday <= reminderDays && daysUntilBirthday >= 0) {
          console.log(`  ✅ 触发提醒: ${rule.rule_name} (提前${reminderDays}天)`);
        }
        // 当天提醒逻辑
        else if (currentAge === targetAge && daysUntilBirthday === 0) {
          console.log(`  ✅ 触发提醒: ${rule.rule_name} (当天提醒)`);
        }
      });

      console.log('');
    });

    // 3. 特别检查1966-02-10出生的居民
    console.log('\n步骤3: 特别检查1966-02-10出生的居民');
    console.log('----------------------------------------');

    const checkSql = `
      SELECT id, name, date_of_birth, id_card, village_group, status
      FROM residents
      WHERE date_of_birth = '1966-02-10' AND status = 'active'
    `;

    db.all(checkSql, [], (err, specialResidents) => {
      if (err) {
        console.error('查询特定居民失败:', err.message);
        db.close();
        process.exit(1);
      }

      if (specialResidents.length === 0) {
        console.log('❌ 没有找到1966-02-10出生的活跃居民');
        console.log('   提示: 请检查居民的status字段是否为active');
        db.close();
        process.exit(0);
      }

      console.log(`找到 ${specialResidents.length} 个符合条件的居民:\n`);

      specialResidents.forEach(resident => {
        console.log(`${resident.name} (ID: ${resident.id})`);
        console.log(`  出生日期: ${resident.date_of_birth}`);
        console.log(`  身份证: ${resident.id_card}`);
        console.log(`  村组: ${resident.village_group}`);
        console.log(`  状态: ${resident.status}`);

        const dob = new Date(resident.date_of_birth);
        const thisYearBirthday = new Date(2026, 1, 10); // 2月10日
        const daysUntilBirthday = Math.floor((thisYearBirthday - today) / (1000 * 60 * 60 * 24));

        console.log(`  当前年龄: 59岁 (1966年出生)`);
        console.log(`  距离60岁生日: ${daysUntilBirthday}天`);
        console.log('');

        // 检查是否触发任何规则
        let triggered = false;
        rules.forEach(rule => {
          const targetAge = parseInt(rule.rule_value);
          const reminderDays = rule.reminder_days || 0;

          console.log(`检查规则: ${rule.rule_name} (${targetAge}岁, 提前${reminderDays}天)`);
          console.log(`  当前年龄: 59, 目标年龄: ${targetAge}`);
          console.log(`  daysUntilBirthday: ${daysUntilBirthday}, reminderDays: ${reminderDays}`);

          if (currentAge === targetAge - 1 && daysUntilBirthday <= reminderDays && daysUntilBirthday >= 0) {
            console.log(`  ✅ 应该触发提醒！`);
            triggered = true;
          } else if (currentAge === targetAge && daysUntilBirthday === 0) {
            console.log(`  ✅ 应该触发提醒（当天）！`);
            triggered = true;
          } else {
            console.log(`  ❌ 不触发提醒`);
          }
          console.log('');
        });

        if (!triggered) {
          console.log(`⚠️  没有匹配的提醒规则！`);
          console.log(`   建议检查:`);
          console.log(`   - 60岁规则是否已启用`);
          console.log(`   - 60岁规则的reminder_days是否设置为1天`);
        }
      });

      db.close();
    });
  });
});
