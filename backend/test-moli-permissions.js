const db = require('./db');

async function testMoliPermissions() {
  try {
    const username = 'moli';
    
    // 查询用户
    const [users] = await db.pool.execute(
      'SELECT u.*, r.role_code, r.role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.username = ?',
      [username]
    );

    if (users.length === 0) {
      console.log('❌ 用户不存在');
      process.exit(1);
    }

    const user = users[0];
    console.log('👤 用户信息:');
    console.log('   ID:', user.id);
    console.log('   用户名:', user.username);
    console.log('   角色:', user.role_code, '-', user.role_name);

    // 获取用户权限
    let permissions = [];
    if (user.role_id) {
      const [permRows] = await db.pool.execute(`
        SELECT p.permission_code, p.description, p.module, p.action
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = ?
      `, [user.role_id]);
      permissions = permRows;
    }

    console.log('\n🔐 权限列表:');
    if (permissions.length > 0) {
      permissions.forEach(p => {
        console.log('   ', p.permission_code, '-', p.description, '(', p.module + ':' + p.action, ')');
      });
    } else {
      console.log('   无权限');
    }

    // 检查关键权限
    console.log('\n📋 权限检查:');
    console.log('   查看居民权限 (resident:view):', permissions.some(p => p.permission_code === 'resident:view'));
    console.log('   新增居民权限 (resident:add):', permissions.some(p => p.permission_code === 'resident:add'));
    console.log('   编辑居民权限 (resident:edit):', permissions.some(p => p.permission_code === 'resident:edit'));
    console.log('   删除居民权限 (resident:delete):', permissions.some(p => p.permission_code === 'resident:delete'));
    
    console.log('   查看特殊人群权限 (special:view):', permissions.some(p => p.permission_code === 'special:view'));
    console.log('   新增特殊人群权限 (special:add):', permissions.some(p => p.permission_code === 'special:add'));
    console.log('   编辑特殊人群权限 (special:edit):', permissions.some(p => p.permission_code === 'special:edit'));
    console.log('   删除特殊人群权限 (special:delete):', permissions.some(p => p.permission_code === 'special:delete'));
    
    console.log('   查看调解档案权限 (mediation:view):', permissions.some(p => p.permission_code === 'mediation:view'));
    console.log('   新增调解档案权限 (mediation:add):', permissions.some(p => p.permission_code === 'mediation:add'));
    console.log('   编辑调解档案权限 (mediation:edit):', permissions.some(p => p.permission_code === 'mediation:edit'));
    console.log('   删除调解档案权限 (mediation:delete):', permissions.some(p => p.permission_code === 'mediation:delete'));

    // 总结
    console.log('\n💡 总结:');
    const canAdd = permissions.some(p => 
      p.permission_code.endsWith(':add') || 
      p.permission_code.endsWith(':create')
    );
    const canEdit = permissions.some(p => 
      p.permission_code.endsWith(':edit') || 
      p.permission_code.endsWith(':update')
    );
    const canDelete = permissions.some(p => 
      p.permission_code.endsWith(':delete') || 
      p.permission_code.endsWith(':remove')
    );
    
    console.log('   是否可以新增:', canAdd ? '✅ 是' : '❌ 否');
    console.log('   是否可以编辑:', canEdit ? '✅ 是' : '❌ 否');
    console.log('   是否可以删除:', canDelete ? '✅ 是' : '❌ 否');
    
    if (!canAdd && !canEdit && !canDelete) {
      console.log('\n✅ moli用户是真正的只读用户，权限配置正确！');
    } else {
      console.log('\n⚠️ moli用户权限配置有问题，仍可以进行写操作！');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
    process.exit(1);
  }
}

testMoliPermissions();

