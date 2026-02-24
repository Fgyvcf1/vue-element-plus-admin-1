const db = require('./db');

async function initDatabase() {
  console.log('开始初始化数据库...');

  try {
    // 检查数据库连接
    console.log('正在连接数据库...');
    const connection = await db.pool.getConnection();
    console.log('✅ 数据库连接成功');

    // 创建权限相关表（如果不存在）
    console.log('检查权限相关表...');
    
    // 1. 创建角色表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        role_name VARCHAR(50) NOT NULL COMMENT '角色名称',
        role_code VARCHAR(50) NOT NULL UNIQUE COMMENT '角色编码',
        description VARCHAR(200) COMMENT '角色描述',
        status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表'
    `);
    console.log('✅ roles 表已就绪');

    // 2. 创建权限表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        module VARCHAR(50) NOT NULL COMMENT '模块名称',
        action VARCHAR(50) NOT NULL COMMENT '操作类型',
        permission_code VARCHAR(100) NOT NULL UNIQUE COMMENT '权限编码',
        description VARCHAR(200) COMMENT '权限描述',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限表'
    `);
    console.log('✅ permissions 表已就绪');

    // 3. 创建角色权限关联表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        role_id INT NOT NULL COMMENT '角色ID',
        permission_id INT NOT NULL COMMENT '权限ID',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_role_permission (role_id, permission_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色权限关联表'
    `);
    console.log('✅ role_permissions 表已就绪');

    // 3.1 创建菜单表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sys_menu (
        id INT PRIMARY KEY AUTO_INCREMENT,
        parent_id INT NOT NULL DEFAULT 0 COMMENT '父级ID，0表示顶级',
        name VARCHAR(100) NOT NULL COMMENT '路由名称(唯一)',
        path VARCHAR(200) NOT NULL COMMENT '路由路径',
        component VARCHAR(200) DEFAULT NULL COMMENT '组件路径或特殊标记(#/##)',
        redirect VARCHAR(200) DEFAULT NULL COMMENT '重定向',
        title VARCHAR(100) NOT NULL COMMENT '菜单标题',
        icon VARCHAR(100) DEFAULT NULL COMMENT '菜单图标',
        menu_type TINYINT NOT NULL DEFAULT 2 COMMENT '1-目录 2-菜单 3-按钮',
        permission_code VARCHAR(100) DEFAULT NULL COMMENT '权限标识(如 resident:view)',
        sort_order INT NOT NULL DEFAULT 0 COMMENT '排序',
        hidden TINYINT NOT NULL DEFAULT 0 COMMENT '是否隐藏',
        always_show TINYINT NOT NULL DEFAULT 0 COMMENT '是否始终显示',
        no_cache TINYINT NOT NULL DEFAULT 0 COMMENT '是否禁用缓存',
        affix TINYINT NOT NULL DEFAULT 0 COMMENT '是否固定标签',
        active_menu VARCHAR(200) DEFAULT NULL COMMENT '高亮菜单路径',
        status TINYINT NOT NULL DEFAULT 1 COMMENT '状态 1-启用 0-禁用',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_parent_id (parent_id),
        INDEX idx_menu_type (menu_type),
        INDEX idx_permission_code (permission_code),
        INDEX idx_status (status),
        INDEX idx_sort (sort_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统菜单表'
    `);
    console.log('✅ sys_menu 表已就绪');

    // 3.2 创建角色菜单关联表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS role_menu (
        id INT PRIMARY KEY AUTO_INCREMENT,
        role_id INT NOT NULL COMMENT '角色ID',
        menu_id INT NOT NULL COMMENT '菜单ID',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_role_menu (role_id, menu_id),
        INDEX idx_role_id (role_id),
        INDEX idx_menu_id (menu_id),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (menu_id) REFERENCES sys_menu(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色菜单关联表'
    `);
    console.log('✅ role_menu 表已就绪');

    // 4. 添加 users 表的 role_id 字段（如果不存在）
    try {
      await connection.execute(`ALTER TABLE users ADD COLUMN role_id INT COMMENT '角色ID'`);
      console.log('✅ users 表添加 role_id 字段成功');
    } catch (e) {
      if (e.message.includes('Duplicate')) {
        console.log('ℹ️ role_id 字段已存在');
      } else {
        console.log('ℹ️ role_id 字段可能已存在:', e.message);
      }
    }

    // 5. 初始化权限数据
    const permissions = [
      // 居民管理
      ['resident', 'view', 'resident:view', '查看居民信息'],
      ['resident', 'add', 'resident:add', '新增居民'],
      ['resident', 'edit', 'resident:edit', '编辑居民'],
      ['resident', 'delete', 'resident:delete', '删除居民'],
      // 特殊人群
      ['special', 'view', 'special:view', '查看特殊人群'],
      ['special', 'add', 'special:add', '新增特殊人群'],
      ['special', 'edit', 'special:edit', '编辑特殊人群'],
      ['special', 'delete', 'special:delete', '删除特殊人群'],
      // 机构管理
      ['organization', 'view', 'organization:view', '查看机构信息'],
      ['organization', 'add', 'organization:add', '新增机构'],
      ['organization', 'edit', 'organization:edit', '编辑机构'],
      ['organization', 'delete', 'organization:delete', '删除机构'],
      // 人民调解
      ['mediation', 'view', 'mediation:view', '查看调解档案'],
      ['mediation', 'add', 'mediation:add', '新增调解档案'],
      ['mediation', 'edit', 'mediation:edit', '编辑调解档案'],
      ['mediation', 'delete', 'mediation:delete', '删除调解档案'],
      // 待办提醒
      ['todo', 'view', 'todo:view', '查看待办提醒'],
      ['todo', 'add', 'todo:add', '新增待办提醒'],
      ['todo', 'edit', 'todo:edit', '编辑待办提醒'],
      ['todo', 'delete', 'todo:delete', '删除待办提醒'],
      // 系统管理
      ['system', 'view', 'system:view', '查看系统管理'],
      ['system', 'user', 'system:user', '用户管理'],
      ['system', 'role', 'system:role', '角色管理']
    ];

    for (const [module, action, code, desc] of permissions) {
      try {
        await connection.execute(
          'INSERT IGNORE INTO permissions (module, action, permission_code, description) VALUES (?, ?, ?, ?)',
          [module, action, code, desc]
        );
      } catch (e) {
        console.log(`ℹ️ 权限 ${code} 可能已存在`);
      }
    }
    console.log('✅ 权限数据初始化完成');

    // 6. 初始化角色
    const roles = [
      ['超级管理员', 'superadmin', '拥有所有权限'],
      ['普通管理员', 'admin', '拥有大部分管理权限'],
      ['普通用户', 'user', '拥有查看和部分编辑权限'],
      ['只读用户', 'readonly', '仅拥有查看权限']
    ];

    for (const [name, code, desc] of roles) {
      try {
        await connection.execute(
          'INSERT IGNORE INTO roles (role_name, role_code, description) VALUES (?, ?, ?)',
          [name, code, desc]
        );
      } catch (e) {
        console.log(`ℹ️ 角色 ${code} 可能已存在`);
      }
    }
    console.log('✅ 角色数据初始化完成');

    // 7. 初始化基础菜单（仅在 sys_menu 为空时）
    const [menuCountRows] = await connection.execute('SELECT COUNT(*) as cnt FROM sys_menu');
    if ((menuCountRows[0]?.cnt || 0) === 0) {
      const insertMenu = async (data) => {
        const [result] = await connection.execute(
          `INSERT INTO sys_menu
           (parent_id, name, path, component, redirect, title, icon, menu_type, permission_code, sort_order,
            hidden, always_show, no_cache, affix, active_menu, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          data
        );
        return result.insertId;
      };

      // 仪表盘
      const dashboardId = await insertMenu([
        0,
        'Dashboard',
        '/index',
        '#',
        '/index',
        '仪表盘',
        'vi-material-symbols:dashboard',
        1,
        null,
        1,
        0,
        0,
        0,
        1,
        null,
        1
      ]);
      await insertMenu([
        dashboardId,
        'DashboardIndex',
        '',
        'views/Dashboard/index',
        null,
        '首页',
        'vi-ep:house',
        2,
        null,
        1,
        0,
        0,
        0,
        1,
        null,
        1
      ]);

      // 权限管理
      const permissionId = await insertMenu([
        0,
        'Permission',
        '/permission',
        '#',
        '/permission/role',
        '权限管理',
        'vi-ep:setting',
        1,
        'system:view',
        90,
        0,
        1,
        0,
        1,
        null,
        1
      ]);
      await insertMenu([
        permissionId,
        'RoleManagement',
        'role',
        'views/Permission/Role/index',
        null,
        '角色管理',
        null,
        2,
        'system:role',
        1,
        0,
        0,
        0,
        1,
        null,
        1
      ]);
      await insertMenu([
        permissionId,
        'UserRoleManagement',
        'user',
        'views/Permission/User/index',
        null,
        '用户管理',
        null,
        2,
        'system:user',
        2,
        0,
        0,
        0,
        1,
        null,
        1
      ]);

      console.log('✅ sys_menu 基础数据初始化完成');
    } else {
      console.log('ℹ️ sys_menu 已有数据，跳过初始化');
    }

    // 8. 给超级管理员分配全部菜单（role_menu 为空时）
    const [roleRows] = await connection.execute(
      "SELECT id FROM roles WHERE role_code = 'superadmin' LIMIT 1"
    );
    const [roleMenuCountRows] = await connection.execute(
      'SELECT COUNT(*) as cnt FROM role_menu'
    );
    if (roleRows.length && (roleMenuCountRows[0]?.cnt || 0) === 0) {
      await connection.execute(
        'INSERT IGNORE INTO role_menu (role_id, menu_id) SELECT ?, id FROM sys_menu',
        [roleRows[0].id]
      );
      console.log('✅ 超级管理员菜单权限初始化完成');
    }

    // 检查并初始化其他必要的表
    console.log('检查其他必要表结构...');
    
    // 检查用户表是否存在
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INT PRIMARY KEY AUTO_INCREMENT,
          username LONGTEXT NOT NULL,
          password VARCHAR(255) DEFAULT NULL,
          password_hash LONGTEXT NOT NULL,
          real_name LONGTEXT NOT NULL,
          role LONGTEXT NOT NULL,
          department LONGTEXT DEFAULT NULL,
          phone_number LONGTEXT DEFAULT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          status LONGTEXT NOT NULL,
          role_id INT COMMENT '角色ID',
          avatar_url TEXT DEFAULT NULL COMMENT '头像',
          email VARCHAR(100) DEFAULT NULL,
          INDEX idx_username (username(100))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表'
      `);
      console.log('✅ users 表已就绪');
      
      // 初始化默认管理员账户
      const [existingUsers] = await connection.execute("SELECT COUNT(*) as cnt FROM users");
      if (existingUsers[0].cnt === 0) {
        const hashedPassword = require('crypto').createHash('md5').update('123456').digest('hex');
        await connection.execute(
          `INSERT INTO users 
           (username, password, password_hash, real_name, role, department, phone_number, created_at, updated_at, status, role_id) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          ['admin', '123456', hashedPassword, '管理员', 'admin', 'IT部门', '13800138000', new Date().toISOString().slice(0, 19).replace('T', ' '), new Date().toISOString().slice(0, 19).replace('T', ' '), 'active', 2]
        );
        console.log('✅ 默认管理员账户已创建 (用户名: admin, 密码: 123456)');
      } else {
        console.log('ℹ️ 用户表已有数据，跳过默认管理员创建');
      }
    } catch (e) {
      console.error('⚠️ 初始化用户表时出现错误:', e.message);
    }

    connection.release();
    
    console.log('\n🎉 数据库初始化完成！');
    return true;
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    console.error('详细错误信息:', error);
    return false;
  }
}

// 如果直接运行此脚本，则执行初始化
if (require.main === module) {
  initDatabase().then(success => {
    if (success) {
      console.log('数据库初始化成功！');
      process.exit(0);
    } else {
      console.error('数据库初始化失败！');
      process.exit(1);
    }
  }).catch(error => {
    console.error('数据库初始化出错:', error);
    process.exit(1);
  });
}

module.exports = { initDatabase };