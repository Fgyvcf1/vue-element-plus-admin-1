const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, 'app.db');

// 连接数据库
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
    process.exit(1);
  }
  console.log('✅ 已连接到数据库\n');
});

// 检查reminder_rules表结构
console.log('📋 检查 reminder_rules 表结构...\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

db.get("PRAGMA table_info(reminder_rules)", (err, columns) => {
  if (err) {
    console.error('❌ 查询表结构失败:', err.message);
    db.close();
    process.exit(1);
  }

  console.log('字段名              \t类型\t\t非空\t主键');
  console.log('────────────────────────────────────────────────────────────────');
  columns.forEach(col => {
    const name = col.name.padEnd(20, ' ');
    const type = col.type.padEnd(12, ' ');
    const notnull = col.notnull ? '是  ' : '否  ';
    const pk = col.pk ? '是' : '否';
    console.log(`${name}\t${type}\t${notnull}\t${pk}`);
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 检查reminder_days字段是否存在
  const hasReminderDaysField = columns.some(col => col.name === 'reminder_days');

  if (hasReminderDaysField) {
    console.log('✅ reminder_days 字段已成功添加到表结构中\n');

    // 查看reminder_rules表数据
    console.log('📝 查看 reminder_rules 表数据...\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    db.all("SELECT * FROM reminder_rules", (err, rows) => {
      if (err) {
        console.error('❌ 查询数据失败:', err.message);
        db.close();
        process.exit(1);
      }

      if (rows.length === 0) {
        console.log('⚠️  表中暂无数据');
        console.log('提示：需要先创建提醒规则，请到前端"提醒规则管理"页面添加规则\n');
      } else {
        console.log('ID\t规则类型\t规则名称      \t规则值\t提前提醒天数\t状态\t描述');
        console.log('─────────────────────────────────────────────────────────────────────────────────────────');
        rows.forEach(row => {
          const id = String(row.id).padEnd(4, ' ');
          const type = row.rule_type.padEnd(10, ' ');
          const name = row.rule_name.substring(0, 10).padEnd(14, ' ');
          const value = String(row.rule_value).padEnd(8, ' ');
          const days = row.reminder_days !== undefined ? String(row.reminder_days).padEnd(10, ' ') : '未设置      ';
          const status = row.status;
          const desc = row.description || '';

          console.log(`${id}\t${type}\t${name}\t${value}\t${days}\t${status}\t${desc}`);
        });
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // 统计信息
        const ageRules = rows.filter(r => r.rule_type === 'age').length;
        const rulesWithReminderDays = rows.filter(r => r.reminder_days > 0).length;

        console.log('📊 统计信息：');
        console.log(`   - 总规则数：${rows.length}`);
        console.log(`   - 年龄提醒规则：${ageRules}`);
        console.log(`   - 设置了提前提醒天数的规则：${rulesWithReminderDays}`);
      }

      console.log('\n✅ 数据库检查完成！\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('💡 提示：');
      console.log('   1. reminder_days 字段已添加，可以在前端配置提前提醒天数');
      console.log('   2. 值为 0 表示当天提醒');
      console.log('   3. 值为正数表示提前多少天提醒（如 30 表示提前30天）');
      console.log('   4. 请访问：http://localhost:9527 进入系统配置提醒规则');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      db.close((err) => {
        if (err) {
          console.error('❌ 关闭数据库失败:', err.message);
        } else {
          console.log('数据库连接已关闭');
        }
        process.exit(0);
      });
    });
  } else {
    console.log('❌ reminder_days 字段不存在，数据库更新可能未成功\n');
    console.log('请执行以下命令更新数据库：');
    console.log('  cd backend');
    console.log('  node add-reminder-days-field.js');
    console.log('\n或双击执行：执行数据库更新.bat\n');

    db.close((err) => {
      if (err) {
        console.error('❌ 关闭数据库失败:', err.message);
      } else {
        console.log('数据库连接已关闭');
      }
      process.exit(1);
    });
  }
});
