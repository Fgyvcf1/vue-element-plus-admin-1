const db = require('./db');

async function checkMoliPerms() {
  try {
    const [rows] = await db.pool.execute(`
      SELECT p.permission_code, p.description
      FROM users u
      JOIN role_permissions rp ON u.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.username = ?
      ORDER BY p.module, p.action
    `, ['moli']);

    console.log('moli 用户的权限:');
    rows.forEach(r => console.log('  ' + r.permission_code + ' (' + r.description + ')'));

    process.exit(0);
  } catch (error) {
    console.error('查询失败:', error.message);
    process.exit(1);
  }
}

checkMoliPerms();
