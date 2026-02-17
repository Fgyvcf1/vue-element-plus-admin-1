const db = require('./db');

async function checkReadOnlyPerms() {
  try {
    const [rows] = await db.pool.execute(`
      SELECT p.permission_code, p.description
      FROM roles r
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE r.role_code = ?
      ORDER BY p.module, p.action
    `, ['readonly']);

    console.log('只读用户权限:');
    rows.forEach(r => console.log('  ' + r.permission_code + ' (' + r.description + ')'));

    process.exit(0);
  } catch (error) {
    console.error('查询失败:', error.message);
    process.exit(1);
  }
}

checkReadOnlyPerms();
