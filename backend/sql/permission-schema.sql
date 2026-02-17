-- 权限管理模块数据库表结构
-- 创建时间: 2026-02-16

-- 1. 角色表
CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) NOT NULL COMMENT '角色名称',
    role_code VARCHAR(50) NOT NULL UNIQUE COMMENT '角色编码',
    description VARCHAR(200) COMMENT '角色描述',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- 2. 权限表
CREATE TABLE IF NOT EXISTS permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    module VARCHAR(50) NOT NULL COMMENT '模块名称',
    action VARCHAR(50) NOT NULL COMMENT '操作类型(view/add/edit/delete)',
    permission_code VARCHAR(100) NOT NULL UNIQUE COMMENT '权限编码(如:resident:add)',
    description VARCHAR(200) COMMENT '权限描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限表';

-- 3. 角色权限关联表
CREATE TABLE IF NOT EXISTS role_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_id INT NOT NULL COMMENT '角色ID',
    permission_id INT NOT NULL COMMENT '权限ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_role_permission (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色权限关联表';

-- 4. 菜单表（用于动态路由/侧边栏）
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统菜单表';

-- 5. 角色-菜单关联表
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色菜单关联表';

-- 4. 修改 users 表，添加 role_id 字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INT COMMENT '角色ID';
ALTER TABLE users ADD FOREIGN KEY IF NOT EXISTS (role_id) REFERENCES roles(id);

-- 5. 初始化权限数据
INSERT INTO permissions (module, action, permission_code, description) VALUES
-- 居民管理模块
('resident', 'view', 'resident:view', '查看居民信息'),
('resident', 'add', 'resident:add', '新增居民'),
('resident', 'edit', 'resident:edit', '编辑居民'),
('resident', 'delete', 'resident:delete', '删除居民'),

-- 特殊人群管理模块
('special', 'view', 'special:view', '查看特殊人群'),
('special', 'add', 'special:add', '新增特殊人群'),
('special', 'edit', 'special:edit', '编辑特殊人群'),
('special', 'delete', 'special:delete', '删除特殊人群'),

-- 机构管理模块
('organization', 'view', 'organization:view', '查看机构信息'),
('organization', 'add', 'organization:add', '新增机构'),
('organization', 'edit', 'organization:edit', '编辑机构'),
('organization', 'delete', 'organization:delete', '删除机构'),

-- 人民调解模块
('mediation', 'view', 'mediation:view', '查看调解档案'),
('mediation', 'add', 'mediation:add', '新增调解档案'),
('mediation', 'edit', 'mediation:edit', '编辑调解档案'),
('mediation', 'delete', 'mediation:delete', '删除调解档案'),

-- 待办提醒模块
('todo', 'view', 'todo:view', '查看待办提醒'),
('todo', 'add', 'todo:add', '新增待办提醒'),
('todo', 'edit', 'todo:edit', '编辑待办提醒'),
('todo', 'delete', 'todo:delete', '删除待办提醒'),

-- 系统管理模块
('system', 'view', 'system:view', '查看系统管理'),
('system', 'user', 'system:user', '用户管理'),
('system', 'role', 'system:role', '角色管理');

-- 6. 初始化默认角色
INSERT INTO roles (role_name, role_code, description) VALUES
('超级管理员', 'superadmin', '拥有所有权限'),
('普通管理员', 'admin', '拥有大部分管理权限'),
('普通用户', 'user', '拥有查看和部分编辑权限'),
('只读用户', 'readonly', '仅拥有查看权限');

-- 7. 为超级管理员分配所有权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- 8. 为普通管理员分配权限（除系统管理外）
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE module != 'system';

-- 9. 为普通用户分配查看和编辑权限（无删除权限）
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions WHERE action IN ('view', 'add', 'edit');

-- 10. 为只读用户分配查看权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions WHERE action = 'view';
