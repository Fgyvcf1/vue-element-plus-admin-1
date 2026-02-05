const db = require('./db');

console.log('检查通知相关表是否存在...');

const checkTables = ['notifications', 'notification_recipients', 'notification_progress', 'reminder_rules', 'reminder_history'];

checkTables.forEach(tableName => {
  db.all(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`, (err, rows) => {
    if (err) {
      console.error(`查询表 ${tableName} 失败:`, err.message);
    } else if (rows.length > 0) {
      console.log(`✓ 表 ${tableName} 存在`);
    } else {
      console.log(`✗ 表 ${tableName} 不存在`);
    }

    // 检查完成后关闭数据库
    if (tableName === checkTables[checkTables.length - 1]) {
      db.close();
      console.log('\n检查完成!');
    }
  });
});
