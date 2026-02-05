const db = require('./db');

// 添加 is_read 字段到 notifications 表
function addIsReadField() {
  console.log('开始添加 is_read 字段到 notifications 表...');

  // 检查字段是否已存在
  const checkSql = "PRAGMA table_info(notifications)";
  db.all(checkSql, [], (err, rows) => {
    if (err) {
      console.error('检查表结构失败:', err.message);
      return;
    }

    const hasIsReadField = rows.some(row => row.name === 'is_read');

    if (hasIsReadField) {
      console.log('is_read 字段已存在，无需添加');
      return;
    }

    // 添加 is_read 字段
    const alterSql = `ALTER TABLE notifications ADD COLUMN is_read INTEGER DEFAULT 0`;

    db.run(alterSql, function(err) {
      if (err) {
        console.error('添加 is_read 字段失败:', err.message);
        return;
      }
      console.log('is_read 字段添加成功！');

      // 更新现有数据：已完成的通知标记为已读
      const updateSql = `UPDATE notifications SET is_read = 1 WHERE status = 'completed' OR status = 'cancelled'`;
      db.run(updateSql, function(err) {
        if (err) {
          console.error('更新现有数据失败:', err.message);
          return;
        }
        console.log('已更新现有通知的已读状态');

        // 显示当前数据统计
        const countSql = `
          SELECT
            COUNT(*) as total,
            SUM(is_read) as read_count,
            COUNT(*) - SUM(is_read) as unread_count
          FROM notifications
        `;
        db.get(countSql, [], (err, result) => {
          if (err) {
            console.error('统计数据失败:', err.message);
            return;
          }
          console.log('通知统计:');
          console.log(`  总数: ${result.total}`);
          console.log(`  已读: ${result.read_count}`);
          console.log(`  未读: ${result.unread_count}`);
        });
      });
    });
  });
}

// 运行添加字段的函数
addIsReadField();
