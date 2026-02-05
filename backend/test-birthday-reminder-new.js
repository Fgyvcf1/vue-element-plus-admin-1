const db = require('./db.js');

// 手动执行生日提醒任务（使用新的SQL查询）
async function executeBirthdayReminder() {
  console.log('开始执行生日提醒任务（测试新SQL）...');
  const today = new Date();
  console.log('今天日期:', today.toISOString().slice(0, 10));

  const remindDays = 0; // 从配置读取，这里是0
  console.log('提前提醒天数:', remindDays);

  // 查询所有有生日的居民（包含电话和户主电话）
  const sql = `
    SELECT 
      r.id, 
      r.name, 
      r.date_of_birth, 
      r.phone_number,
      r.household_id,
      rh.phone_number as head_phone_number
    FROM residents r
    LEFT JOIN households h ON r.household_id = h.household_number
    LEFT JOIN residents rh ON h.household_number = rh.household_id 
      AND rh.relationship_to_head = '户主'
    WHERE r.date_of_birth IS NOT NULL
  `;

  try {
    const [residents] = await db.pool.execute(sql);
    console.log(`找到 ${residents.length} 位有生日信息的居民`);

    // 只处理今天生日的居民
    for (const r of residents) {
      const b = new Date(r.date_of_birth);
      let nextBirthday = new Date(Date.UTC(today.getFullYear(), b.getMonth(), b.getDate()));

      let diffDays;
      if (today.getFullYear() === nextBirthday.getUTCFullYear() &&
          today.getMonth() === nextBirthday.getUTCMonth() &&
          today.getDate() === nextBirthday.getUTCDate()) {
        diffDays = 0;
      } else if (nextBirthday < today) {
        nextBirthday = new Date(Date.UTC(today.getFullYear() + 1, b.getMonth(), b.getDate()));
        diffDays = Math.round((nextBirthday - today) / 86400000);
      } else {
        diffDays = Math.round((nextBirthday - today) / 86400000);
      }

      // 只处理今天生日的（diffDays = 0）
      if (diffDays !== 0) {
        continue;
      }

      console.log(`\n处理居民: ${r.name}, 生日: ${r.date_of_birth}, 差值: ${diffDays}天`);
      console.log(`  本人电话: ${r.phone_number || '无'}`);
      console.log(`  户主电话: ${r.head_phone_number || '无'}`);

      // 检查是否已存在今天的通知
      const [exists] = await db.pool.execute(
        'SELECT id FROM notification WHERE type = ? AND resident_id = ? AND DATE(created_at) = CURDATE()',
        ['birth', r.id]
      );

      if (exists.length > 0) {
        console.log(`  ${r.name} 今天已发送过生日提醒`);
        continue;
      }

      // 计算年龄
      const ageOnBirthday = today.getFullYear() - b.getFullYear();

      // 获取联系电话（优先使用本人电话，没有则使用户主电话）
      const phoneNumber = r.phone_number || r.head_phone_number || '无';

      // 生成通知
      const title = `${r.name}同志即将年满${ageOnBirthday}岁`;
      const content = `${r.name}同志即将年满${ageOnBirthday}岁，请及时通知该同志办理社保、养老、高龄补贴等相关认证手续。联系电话：${phoneNumber}`;

      console.log(`  准备插入通知:`);
      console.log(`    标题: ${title}`);
      console.log(`    内容: ${content}`);

      try {
        // 获取最大ID
        const [maxIdResult] = await db.pool.execute('SELECT MAX(id) as maxId FROM notification');
        const newId = (maxIdResult[0].maxId || 0) + 1;

        const [result] = await db.pool.execute(
          'INSERT INTO notification (id, title, content, type, resident_id, status, is_read, progress, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
          [newId, title, content, 'birth', r.id, 'pending', 0, 0]
        );
        console.log(`  ✓ 已发送生日提醒: ${title}, ID: ${newId}`);
      } catch (err) {
        console.error(`  ✗ 插入失败: ${err.message}`);
      }
    }

    console.log('\n生日提醒任务执行完成');
  } catch (err) {
    console.error('执行失败:', err);
  }
  process.exit(0);
}

executeBirthdayReminder();
