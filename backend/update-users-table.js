const db = require('./db');

async function updateUsersTable() {
  try {
    // 1. 修改 id 字段为自增主键
    await db.pool.execute('ALTER TABLE users MODIFY id INT AUTO_INCREMENT PRIMARY KEY');
    console.log('✅ id 字段已修改为自增主键');

    // 2. 添加 password 字段（如果还没有）
    try {
      await db.pool.execute('ALTER TABLE users ADD COLUMN password VARCHAR(255) AFTER username');
      console.log('✅ password 字段已添加');
    } catch (e) {
      if (e.message.includes('Duplicate')) {
        console.log('ℹ️ password 字段已存在');
      }
    }

    // 3. 将现有用户的 password_hash 复制到 password
    await db.pool.execute('UPDATE users SET password = password_hash WHERE password IS NULL');
    console.log('✅ 密码数据已同步');

    console.log('\n🎉 users 表更新完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 更新失败:', error.message);
    process.exit(1);
  }
}

updateUsersTable();
