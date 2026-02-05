// 手动更新档案状态为已完成
const db = require('./db.js');

async function updateStatus() {
  try {
    console.log('=== 更新档案状态 ===\n');
    
    // 查找有协议但状态不是completed的档案
    const [archives] = await db.pool.execute(`
      SELECT a.archive_id, a.status
      FROM mediation_archives a
      INNER JOIN mediation_agreements m ON a.archive_id = m.archive_id
      WHERE a.status != 'completed'
    `);
    
    console.log(`找到 ${archives.length} 个需要更新的档案`);
    
    for (const archive of archives) {
      await db.pool.execute(
        'UPDATE mediation_archives SET status = ?, updated_at = NOW() WHERE archive_id = ?',
        ['completed', archive.archive_id]
      );
      console.log(`✅ 已更新: ${archive.archive_id}`);
    }
    
    console.log('\n=== 更新完成 ===');
    process.exit(0);
  } catch (err) {
    console.error('更新失败:', err.message);
    process.exit(1);
  }
}

updateStatus();
