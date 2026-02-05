const db = require('./db');

console.log('========================================');
console.log('检查最新创建的通知');
console.log('========================================\n');

// 查询最新创建的5条通知
const sql = `SELECT * FROM notifications ORDER BY id DESC LIMIT 5`;

db.all(sql, [], (err, rows) => {
  if (err) {
    console.error('查询失败:', err.message);
    process.exit(1);
  }

  if (rows.length === 0) {
    console.log('❌ 没有找到通知记录');
    db.close();
    process.exit(0);
  }

  console.log(`找到 ${rows.length} 条最新通知:\n`);

  rows.forEach((row, index) => {
    const isLatest = index === 0 ? '🔴 最新' : '';
    const statusIcon = row.is_read === 0 ? '❌ 未读' : '✅ 已读';
    const statusText = row.status === 'unread' ? '未读' : '已读';

    console.log(`${isLatest} ID: ${row.id}`);
    console.log(`   标题: ${row.title}`);
    console.log(`   内容: ${row.content}`);
    console.log(`   类型: ${row.type}`);
    console.log(`   优先级: ${row.priority}`);
    console.log(`   status字段: ${row.status} (${statusText})`);
    console.log(`   is_read字段: ${row.is_read} (${statusIcon})`);
    console.log(`   创建时间: ${row.created_at}`);

    if (row.updated_at) {
      console.log(`   更新时间: ${row.updated_at}`);
    }

    console.log('');
  });

  // 特别检查ID=6的通知
  console.log('========================================');
  console.log('检查ID=6的通知（刚创建的）');
  console.log('========================================\n');

  const checkSql = `SELECT * FROM notifications WHERE id = 6`;
  db.get(checkSql, [], (err, row) => {
    if (err) {
      console.error('查询失败:', err.message);
      db.close();
      return;
    }

    if (!row) {
      console.log('❌ 没有找到ID=6的通知');
      db.close();
      return;
    }

    console.log('✅ 找到ID=6的通知:');
    console.log(`   标题: ${row.title}`);
    console.log(`   内容: ${row.content}`);
    console.log(`   类型: ${row.type}`);
    console.log(`   优先级: ${row.priority}`);
    console.log(`   status: ${row.status}`);
    console.log(`   is_read: ${row.is_read}`);
    console.log(`   创建时间: ${row.created_at}`);
    console.log('');

    console.log('========================================');
    console.log('检查结果');
    console.log('========================================');
    console.log('✅ 通知已成功创建！');
    console.log('');
    console.log('如果前端没有显示，请检查：');
    console.log('1. 是否刷新了页面？');
    console.log('2. 前端API请求是否成功？');
    console.log('3. 浏览器控制台是否有错误？');
    console.log('4. 铃铛组件是否正确加载？');
    console.log('');
    console.log('建议：在浏览器控制台运行 fetch("/api/notifications").then(r=>r.json()).then(d=>console.log(d))');

    db.close();
  });
});
