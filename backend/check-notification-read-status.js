const db = require('./db');

// 检查通知表中的 is_read 字段
console.log('检查通知表的 is_read 字段...\n');

const sql = `
  SELECT
    id,
    title,
    status,
    is_read,
    created_at
  FROM notifications
  ORDER BY created_at DESC
  LIMIT 10
`;

db.all(sql, [], (err, rows) => {
  if (err) {
    console.error('查询失败:', err.message);
    return;
  }

  console.log('最近的10条通知:');
  console.log('ID\t标题\t\t\t状态\t已读\t创建时间');
  console.log('------------------------------------------------------------');
  rows.forEach(row => {
    const title = row.title.substring(0, 12).padEnd(12, ' ');
    const status = row.status.padEnd(10, ' ');
    const isRead = row.is_read === 1 ? '已读' : '未读';
    const createdAt = row.created_at.split('T')[0];
    console.log(`${row.id}\t${title}\t${status}\t${isRead}\t${createdAt}`);
  });

  // 统计未读数量
  const countSql = `SELECT COUNT(*) as count, is_read FROM notifications GROUP BY is_read`;
  db.all(countSql, [], (err, stats) => {
    if (err) {
      console.error('\n统计数据失败:', err.message);
      return;
    }

    console.log('\n已读/未读统计:');
    stats.forEach(stat => {
      const status = stat.is_read === 1 ? '已读' : '未读';
      console.log(`${status}: ${stat.count} 条`);
    });
  });
});
