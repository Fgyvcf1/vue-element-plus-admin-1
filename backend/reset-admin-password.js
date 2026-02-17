const db = require('./db');

async function resetAdminPassword() {
  try {
    // 将 admin 用户的密码重置为明文 'admin'
    await db.pool.execute(
      'UPDATE users SET password = ?, password_hash = ? WHERE username = ?',
      ['admin', 'admin', 'admin']
    );
    console.log('✅ admin 用户密码已重置为: admin');

    // 验证
    const [users] = await db.pool.execute(
      'SELECT id, username, password, password_hash FROM users WHERE username = ?',
      ['admin']
    );

    if (users.length > 0) {
      console.log('\n验证结果:');
      console.log('  用户名:', users[0].username);
      console.log('  password:', users[0].password);
      console.log('  password_hash:', users[0].password_hash);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ 重置失败:', error.message);
    process.exit(1);
  }
}

resetAdminPassword();
