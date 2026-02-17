const db = require('./db');

async function testMoliLogin() {
  try {
    const username = 'moli';
    const password = 'moli';

    // 查询用户
    const [users] = await db.pool.execute(
      'SELECT u.*, r.role_code, r.role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.username = ?',
      [username]
    );

    if (users.length === 0) {
      console.log('用户不存在');
      process.exit(1);
    }

    const user = users[0];
    console.log('用户信息:');
    console.log('  ID:', user.id);
    console.log('  用户名:', user.username);
    console.log('  角色:', user.role_code);

    // 获取用户权限
    let permissions = [];
    if (user.role_id) {
      const [permRows] = await db.pool.execute(`
        SELECT p.permission_code
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = ?
      `, [user.role_id]);
      permissions = permRows.map(r => r.permission_code);
    }

    console.log('\n权限列表:');
    permissions.forEach(p => console.log('  ' + p));

    console.log('\n是否包含 system:view:', permissions.includes('system:view'));
    console.log('是否包含 system:user:', permissions.includes('system:user'));
    console.log('是否包含 system:role:', permissions.includes('system:role'));

    process.exit(0);
  } catch (error) {
    console.error('查询失败:', error.message);
    process.exit(1);
  }
}

testMoliLogin();
