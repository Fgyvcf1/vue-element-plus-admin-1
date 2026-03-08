const db = require('./db');

async function checkAdmin() {
  try {
    const [users] = await db.pool.execute(
      'SELECT id, username, password, password_hash, role_id FROM users WHERE username = ?',
      ['admin']
    );

    if (users.length > 0) {
      const user = users[0];
      console.log('用户信息:');
      console.log('  ID:', user.id);
      console.log('  用户名:', user.username);
      console.log('  password 长度:', user.password ? user.password.length : 0);
      console.log('  password 值:', user.password);
      console.log('  password_hash 长度:', user.password_hash ? user.password_hash.length : 0);
      console.log('  role_id:', user.role_id);
    } else {
      console.log('用户不存在');
    }

    process.exit(0);
  } catch (error) {
    console.error('查询失败:', error.message);
    process.exit(1);
  }
}

checkAdmin();
