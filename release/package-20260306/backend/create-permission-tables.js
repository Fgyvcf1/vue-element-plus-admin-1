const db = require('./db');

async function createTables() {
  try {
    // 1. 创建角色表
    await db.pool.execute(`
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
    console.log('✅ roles 表创建成功');

    // 2. 创建权限表
    await db.pool.execute(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        module VARCHAR(50) NOT NULL COMMENT '模块名称',
        action VARCHAR(50) NOT NULL COMMENT '操作类型',
        permission_code VARCHAR(100) NOT NULL UNIQUE COMMENT '权限编码',
        description VARCHAR(200) COMMENT '权限描述',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限表'
    `);
    console.log('✅ permissions 表创建成功');

    // 3. 创建角色权限关联表
    await db.pool.execute(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        role_id INT NOT NULL COMMENT '角色ID',
        permission_id INT NOT NULL COMMENT '权限ID',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_role_permission (role_id, permission_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色权限关联表'
    `);
    console.log('✅ role_permissions 表创建成功');

    // 3.1 创建菜单表
    await db.pool.execute(`
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
    console.log('✅ sys_menu 表创建成功');

    // 3.2 创建角色菜单关联表
    await db.pool.execute(`
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
    console.log('✅ role_menu 表创建成功');

    // 4. 添加 users 表的 role_id 字段
    try {
      await db.pool.execute(`ALTER TABLE users ADD COLUMN role_id INT COMMENT '角色ID'`);
      console.log('✅ users 表添加 role_id 字段成功');
    } catch (e) {
      if (e.message.includes('Duplicate')) {
        console.log('ℹ️ role_id 字段已存在');
      } else {
        throw e;
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
        await db.pool.execute(
          'INSERT IGNORE INTO permissions (module, action, permission_code, description) VALUES (?, ?, ?, ?)',
          [module, action, code, desc]
        );
      } catch (e) {
        console.log(`ℹ️ 权限 ${code} 已存在`);
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
        await db.pool.execute(
          'INSERT IGNORE INTO roles (role_name, role_code, description) VALUES (?, ?, ?)',
          [name, code, desc]
        );
      } catch (e) {
        console.log(`ℹ️ 角色 ${code} 已存在`);
      }
    }
    console.log('✅ 角色数据初始化完成');

    // 7. 初始化基础菜单（仅在 sys_menu 为空时）
    const [menuCountRows] = await db.pool.execute('SELECT COUNT(*) as cnt FROM sys_menu');
    if ((menuCountRows[0]?.cnt || 0) === 0) {
      const insertMenu = async (data) => {
        const [result] = await db.pool.execute(
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
    const [roleRows] = await db.pool.execute(
      "SELECT id FROM roles WHERE role_code = 'superadmin' LIMIT 1"
    );
    const [roleMenuCountRows] = await db.pool.execute(
      'SELECT COUNT(*) as cnt FROM role_menu'
    );
    if (roleRows.length && (roleMenuCountRows[0]?.cnt || 0) === 0) {
      await db.pool.execute(
        'INSERT IGNORE INTO role_menu (role_id, menu_id) SELECT ?, id FROM sys_menu',
        [roleRows[0].id]
      );
      console.log('✅ 超级管理员菜单权限初始化完成');
    }

    console.log('\n🎉 权限管理数据库表创建完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 创建表失败:', error.message);
    process.exit(1);
  }
}

createTables();
