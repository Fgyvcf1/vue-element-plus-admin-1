-- ============================================
-- 权限管理系统 - 数据库表创建脚本
-- 数据库: village (MariaDB/MySQL)
-- 创建时间: 2026-02-16
-- 说明: 为权限管理功能创建4张核心表
-- ============================================

-- 1. 角色表 (sys_roles)
-- 存储系统角色信息，如：超级管理员、普通用户等
CREATE TABLE IF NOT EXISTS sys_roles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '角色ID，主键自增',
    role_name VARCHAR(50) NOT NULL COMMENT '角色名称，如：超级管理员、普通用户',
    role_code VARCHAR(50) NOT NULL UNIQUE COMMENT '角色唯一标识，如：super_admin、normal_user',
    description VARCHAR(200) DEFAULT NULL COMMENT '角色描述，说明该角色的职责范围',
    status TINYINT UNSIGNED DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_role_code (role_code),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统角色表';

-- 2. 权限/菜单表 (sys_permissions)
-- 存储菜单和按钮权限，支持树形结构
CREATE TABLE IF NOT EXISTS sys_permissions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '权限ID，主键自增',
    parent_id INT UNSIGNED DEFAULT 0 COMMENT '父级ID，0表示顶级目录/菜单',
    name VARCHAR(100) NOT NULL COMMENT '菜单/按钮名称，如：村民查询、新增村民',
    type TINYINT UNSIGNED NOT NULL COMMENT '类型：1-目录，2-菜单，3-按钮',
    path VARCHAR(200) DEFAULT NULL COMMENT '前端路由路径，如：/resident/query',
    component VARCHAR(200) DEFAULT NULL COMMENT '前端组件路径，如：views/Resident/Query.vue',
    permission_code VARCHAR(100) DEFAULT NULL COMMENT '权限标识符，如：resident:query, resident:add',
    icon VARCHAR(50) DEFAULT NULL COMMENT '菜单图标，Element Plus 图标名',
    sort_order INT UNSIGNED DEFAULT 0 COMMENT '排序序号，数字越小越靠前',
    status TINYINT UNSIGNED DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_parent_id (parent_id),
    INDEX idx_type (type),
    INDEX idx_permission_code (permission_code),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统权限/菜单表';

-- 3. 用户-角色关联表 (user_roles)
-- 实现用户与角色的多对多关系
CREATE TABLE IF NOT EXISTS user_roles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '关联ID，主键自增',
    user_id INT UNSIGNED NOT NULL COMMENT '用户ID，关联 users 表的 id',
    role_id INT UNSIGNED NOT NULL COMMENT '角色ID，关联 sys_roles 表的 id',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_user_role (user_id, role_id) COMMENT '用户和角色的联合唯一索引',
    INDEX idx_user_id (user_id),
    INDEX idx_role_id (role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (role_id) REFERENCES sys_roles(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';

-- 4. 角色-权限关联表 (role_permissions)
-- 实现角色与权限的多对多关系
CREATE TABLE IF NOT EXISTS role_permissions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '关联ID，主键自增',
    role_id INT UNSIGNED NOT NULL COMMENT '角色ID，关联 sys_roles 表的 id',
    permission_id INT UNSIGNED NOT NULL COMMENT '权限ID，关联 sys_permissions 表的 id',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_role_permission (role_id, permission_id) COMMENT '角色和权限的联合唯一索引',
    INDEX idx_role_id (role_id),
    INDEX idx_permission_id (permission_id),
    FOREIGN KEY (role_id) REFERENCES sys_roles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES sys_permissions(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色权限关联表';

-- ============================================
-- 初始化基础数据
-- ============================================

-- 插入基础角色
INSERT INTO sys_roles (role_name, role_code, description, status) VALUES
('超级管理员', 'super_admin', '拥有系统的所有权限，可以管理所有功能和数据', 1),
('普通用户', 'normal_user', '拥有基本的查看权限，部分敏感操作受限', 1),
('数据录入员', 'data_entry', '负责数据录入和基础维护，无删除权限', 1)
ON DUPLICATE KEY UPDATE 
    role_name = VALUES(role_name),
    description = VALUES(description);

-- 插入基础权限（系统管理模块）
INSERT INTO sys_permissions (parent_id, name, type, path, component, permission_code, icon, sort_order) VALUES
-- 系统管理目录
(0, '系统管理', 1, '/system', NULL, NULL, 'Setting', 100),
-- 角色管理菜单
(1, '角色管理', 2, '/system/role', 'views/System/Role/index.vue', 'system:role:list', 'UserFilled', 1),
(2, '新增角色', 3, NULL, NULL, 'system:role:add', NULL, 1),
(2, '编辑角色', 3, NULL, NULL, 'system:role:edit', NULL, 2),
(2, '删除角色', 3, NULL, NULL, 'system:role:delete', NULL, 3),
-- 权限管理菜单
(1, '权限管理', 2, '/system/permission', 'views/System/Permission/index.vue', 'system:permission:list', 'Lock', 2),
(6, '新增权限', 3, NULL, NULL, 'system:permission:add', NULL, 1),
(6, '编辑权限', 3, NULL, NULL, 'system:permission:edit', NULL, 2),
(6, '删除权限', 3, NULL, NULL, 'system:permission:delete', NULL, 3),
-- 用户管理菜单
(1, '用户管理', 2, '/system/user', 'views/System/User/index.vue', 'system:user:list', 'User', 3),
(10, '新增用户', 3, NULL, NULL, 'system:user:add', NULL, 1),
(10, '编辑用户', 3, NULL, NULL, 'system:user:edit', NULL, 2),
(10, '删除用户', 3, NULL, NULL, 'system:user:delete', NULL, 3),
(10, '分配角色', 3, NULL, NULL, 'system:user:assignRole', NULL, 4)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    type = VALUES(type),
    path = VALUES(path),
    component = VALUES(component),
    icon = VALUES(icon),
    sort_order = VALUES(sort_order);

-- 给超级管理员角色分配所有权限
-- 先清除现有权限，再重新分配
DELETE FROM role_permissions WHERE role_id = 1;

INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM sys_permissions;

-- ============================================
-- 创建完成
-- ============================================
SELECT '权限管理表创建成功！' AS result;
SELECT CONCAT('sys_roles 表记录数: ', COUNT(*)) AS info FROM sys_roles;
SELECT CONCAT('sys_permissions 表记录数: ', COUNT(*)) AS info FROM sys_permissions;
SELECT CONCAT('user_roles 表记录数: ', COUNT(*)) AS info FROM user_roles;
SELECT CONCAT('role_permissions 表记录数: ', COUNT(*)) AS info FROM role_permissions;