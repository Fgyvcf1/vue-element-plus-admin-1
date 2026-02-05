const cron = require('node-cron');
const db = require('./db');

// 工具函数：计算年龄
function getAge(birthdate, onDate) {
  const b = new Date(birthdate);
  let age = onDate.getFullYear() - b.getFullYear();
  const m1 = onDate.getMonth(), d1 = onDate.getDate();
  const m2 = b.getMonth(), d2 = b.getDate();
  if (m1 < m2 || (m1 === m2 && d1 < d2)) age--;
  return age;
}

// 从配置表获取生日提醒配置
async function getBirthdayReminderConfig() {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT config_key, config_value
      FROM system_config
      WHERE config_key IN ('birth_remind_days', 'birth_remind_enabled', 'birth_remind_time')
    `;

    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error('获取生日提醒配置失败:', err);
        // 返回默认配置
        resolve({
          days: 7,
          enabled: 1,
          time: '09:00:00'
        });
        return;
      }

      const config = {
        days: 7,
        enabled: 1,
        time: '09:00:00'
      };

      rows.forEach(row => {
        if (row.config_key === 'birth_remind_days') {
          config.days = parseInt(row.config_value) || 7;
        } else if (row.config_key === 'birth_remind_enabled') {
          config.enabled = parseInt(row.config_value) || 1;
        } else if (row.config_key === 'birth_remind_time') {
          config.time = row.config_value || '09:00:00';
        }
      });

      resolve(config);
    });
  });
}

// 执行生日提醒任务
async function executeBirthdayReminder() {
  console.log('开始执行生日提醒任务...');
  const today = new Date();
  const config = await getBirthdayReminderConfig();

  console.log('生日提醒配置:', config);

  // 如果未启用，直接返回
  if (config.enabled !== 1) {
    console.log('生日提醒功能未启用');
    return;
  }

  const remindDays = config.days;

  // 查询所有有生日的居民
  db.all('SELECT id, name, date_of_birth FROM residents WHERE date_of_birth IS NOT NULL', [], (err, rows) => {
    if (err) {
      console.error('查询居民列表失败:', err);
      return;
    }

    console.log(`找到 ${rows.length} 位有生日信息的居民`);

    rows.forEach(r => {
      const b = new Date(r.date_of_birth);

      // 今年生日（使用UTC时间创建）
      let nextBirthday = new Date(Date.UTC(today.getFullYear(), b.getMonth(), b.getDate()));

      // 只比较日期部分（年、月、日），不比较时间
      let diffDays;
      if (today.getFullYear() === nextBirthday.getUTCFullYear() &&
          today.getMonth() === nextBirthday.getUTCMonth() &&
          today.getDate() === nextBirthday.getUTCDate()) {
        // 今天就是生日
        diffDays = 0;
      } else if (nextBirthday < today) {
        // 今年生日已过，计算明年的
        nextBirthday = new Date(Date.UTC(today.getFullYear() + 1, b.getMonth(), b.getDate()));
        diffDays = Math.round((nextBirthday - today) / 86400000);
      } else {
        // 今年生日还未到
        diffDays = Math.round((nextBirthday - today) / 86400000);
      }

      // 计算生日时的年龄（使用下一次生日的年份 - 出生年份）
      const ageOnBirthday = nextBirthday.getUTCFullYear() - b.getFullYear();

      // 只在提前提醒天数内且年龄>=60时才发送提醒
      if (diffDays < 0 || diffDays > remindDays || ageOnBirthday < 60) {
        return;
      }

      // 避免重复：当天同类型同居民只生成一次通知
      db.get(
        'SELECT id FROM notification WHERE type = ? AND resident_id = ? AND DATE(created_at) = DATE("now")',
        ['birth', r.id],
        (err2, exists) => {
          if (err2) {
            console.error('检查重复通知失败:', err2);
            return;
          }

          if (exists) {
            console.log(`居民 ${r.name} 今天已发送过生日提醒`);
            return;
          }

          // 生成通知
          const birthdayStr = nextBirthday.toISOString().slice(0,10);
          const title = `${r.name}居民将于${birthdayStr}满${ageOnBirthday}岁`;
          const content = `${r.name}居民将于${birthdayStr}满${ageOnBirthday}岁，请及时通知办理社保养老高龄补贴等相关事宜`;

          db.run(
            'INSERT INTO notification (title, content, type, resident_id) VALUES (?, ?, ?, ?)',
            [title, content, 'birth', r.id],
            function(err3) {
              if (err3) {
                console.error('插入生日提醒通知失败:', err3);
              } else {
                console.log(`✓ 已发送生日提醒: ${title}`);
              }
            }
          );
        }
      );
    });
  });
}

// 按配置的时间执行生日提醒任务
// 每天在配置的时间执行（默认09:00）
// cron格式：秒 分 时 日 月 周
async function scheduleBirthdayReminder() {
  const config = await getBirthdayReminderConfig();

  // 解析时间字符串 "HH:mm:ss" 或 "HH:mm"
  const timeParts = config.time.split(':');
  const hours = parseInt(timeParts[0]);
  const minutes = parseInt(timeParts[1]) || 0;

  // 创建cron表达式：秒 分 时 日 月 周
  const cronExpression = `0 ${minutes} ${hours} * * *`;

  console.log(`定时任务已配置：每天 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} 执行生日提醒`);
  console.log(`Cron表达式: ${cronExpression}`);

  // 取消之前的定时任务（如果存在）
  if (global.birthdayReminderJob) {
    global.birthdayReminderJob.stop();
    console.log('已停止之前的生日提醒定时任务');
  }

  // 创建新的定时任务
  global.birthdayReminderJob = cron.schedule(cronExpression, async () => {
    await executeBirthdayReminder();
  });

  console.log('✓ 生日提醒定时任务已启动');
}

// 启动定时任务
scheduleBirthdayReminder().catch(err => {
  console.error('启动生日提醒定时任务失败:', err);
});

// 导出函数，用于后续动态更新定时任务
module.exports = {
  scheduleBirthdayReminder,
  executeBirthdayReminder
};

console.log('定时任务模块已加载');
