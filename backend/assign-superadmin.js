const db = require('./db');

async function assignSuperAdmin() {
  try {
    // 获取超级管理员角色ID
    const [roles] = await db.pool.execute('SELECT id FROM roles WHERE role_code = ?', ['superadmin']);
    if (roles.length === 0) {
      console.log('❌ 超级管理员角色不存在');
      return;
    }
    const superAdminRoleId = roles[0].id;
    console.log('超级管理员角色ID:', superAdminRoleId);

    // 给admin用户分配超级管理员角色
    await db.pool.execute('UPDATE users SET role_id = ? WHERE username = ?', [superAdminRoleId, 'admin']);
    console.log('✅ admin用户已分配超级管理员角色');

    // 验证
    const [users] = await db.pool.execute('SELECT u.id, u.username, u.real_name, r.role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.username = ?', ['admin']);
    if (users.length > 0) {
      const user = users[0];
      console.log('\n用户信息:');
      console.log('  用户名:', user.username);
      console.log('  姓名:', user.real_name);
      console.log('  角色:', user.role_name);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ 执行失败:', error.message);
    process.exit(1);
  }
}

assignSuperAdmin();
