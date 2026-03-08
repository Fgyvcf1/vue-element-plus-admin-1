-- Vue Element Plus Admin 数据库完整导出
-- 包含所有表结构和用户数据
-- 导出时间: 2026-02-23T05:18:17.826Z

-- ====================
-- 表结构: users
-- ====================
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` longtext NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `password_hash` longtext NOT NULL,
  `real_name` longtext NOT NULL,
  `role` longtext NOT NULL,
  `department` longtext DEFAULT NULL,
  `phone_number` longtext DEFAULT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  `status` longtext NOT NULL,
  `role_id` int(11) DEFAULT NULL COMMENT '角色ID',
  `avatar_url` text DEFAULT NULL COMMENT '头像',
  `email` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX idx_username (username(100))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ====================
-- 表数据: users (2 条记录)
-- ====================
LOCK TABLES `users` WRITE;
INSERT INTO `users` (`id`, `username`, `password`, `password_hash`, `real_name`, `role`, `department`, `phone_number`, `created_at`, `updated_at`, `status`, `role_id`, `avatar_url`, `email`) VALUES (1, 'admin', '123456', 'pbkdf2:sha256:260000$...', '管理员', 'admin', 'IT部门', '13800138000', '2026-02-23 05:18:17', '2026-02-23 05:18:17', 'active', 2, NULL, 'admin@example.com');
INSERT INTO `users` (`id`, `username`, `password`, `password_hash`, `real_name`, `role`, `department`, `phone_number`, `created_at`, `updated_at`, `status`, `role_id`, `avatar_url`, `email`) VALUES (2, 'user1', '123456', 'pbkdf2:sha256:260000$...', '普通用户', 'user', '销售部', '13900139000', '2026-02-23 05:18:17', '2026-02-23 05:18:17', 'active', 3, NULL, 'user1@example.com');
UNLOCK TABLES;

-- ====================
-- 表结构: roles
-- ====================
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) NOT NULL COMMENT '角色名称',
  `role_code` varchar(50) NOT NULL UNIQUE COMMENT '角色编码',
  `description` varchar(200) COMMENT '角色描述',
  `status` enum('active', 'inactive') DEFAULT 'active' COMMENT '状态',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_code` (`role_code`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- ====================
-- 表数据: roles (4 条记录)
-- ====================
LOCK TABLES `roles` WRITE;
INSERT INTO `roles` (`id`, `role_name`, `role_code`, `description`, `status`, `created_at`, `updated_at`) VALUES (1, '超级管理员', 'superadmin', '拥有所有权限', 'active', '2026-02-23 05:18:17', '2026-02-23 05:18:17');
INSERT INTO `roles` (`id`, `role_name`, `role_code`, `description`, `status`, `created_at`, `updated_at`) VALUES (2, '普通管理员', 'admin', '拥有大部分管理权限', 'active', '2026-02-23 05:18:17', '2026-02-23 05:18:17');
INSERT INTO `roles` (`id`, `role_name`, `role_code`, `description`, `status`, `created_at`, `updated_at`) VALUES (3, '普通用户', 'user', '拥有查看和部分编辑权限', 'active', '2026-02-23 05:18:17', '2026-02-23 05:18:17');
INSERT INTO `roles` (`id`, `role_name`, `role_code`, `description`, `status`, `created_at`, `updated_at`) VALUES (4, '只读用户', 'readonly', '仅拥有查看权限', 'active', '2026-02-23 05:18:17', '2026-02-23 05:18:17');
UNLOCK TABLES;

-- ====================
-- 表结构: permissions
-- ====================
CREATE TABLE `permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `module` varchar(50) NOT NULL COMMENT '模块名称',
  `action` varchar(50) NOT NULL COMMENT '操作类型',
  `permission_code` varchar(100) NOT NULL COMMENT '权限编码',
  `description` varchar(200) DEFAULT NULL COMMENT '权限描述',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `permission_code` (`permission_code`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COMMENT='权限表';

-- ====================
-- 表数据: permissions (24 条记录)
-- ====================
LOCK TABLES `permissions` WRITE;
INSERT INTO `permissions` (`id`, `module`, `action`, `permission_code`, `description`, `created_at`) VALUES (1, 'resident', 'view', 'resident:view', '查看居民信息', '2026-02-23 05:18:17');
INSERT INTO `permissions` (`id`, `module`, `action`, `permission_code`, `description`, `created_at`) VALUES (2, 'resident', 'add', 'resident:add', '新增居民', '2026-02-23 05:18:17');
INSERT INTO `permissions` (`id`, `module`, `action`, `permission_code`, `description`, `created_at`) VALUES (3, 'resident', 'edit', 'resident:edit', '编辑居民', '2026-02-23 05:18:17');
INSERT INTO `permissions` (`id`, `module`, `action`, `permission_code`, `description`, `created_at`) VALUES (4, 'resident', 'delete', 'resident:delete', '删除居民', '2026-02-23 05:18:17');
INSERT INTO `permissions` (`id`, `module`, `action`, `permission_code`, `description`, `created_at`) VALUES (5, 'special', 'view', 'special:view', '查看特殊人群', '2026-02-23 05:18:17');
INSERT INTO `permissions` (`id`, `module`, `action`, `permission_code`, `description`, `created_at`) VALUES (6, 'special', 'add', 'special:add', '新增特殊人群', '2026-02-23 05:18:17');
INSERT INTO `permissions` (`id`, `module`, `action`, `permission_code`, `description`, `created_at`) VALUES (7, 'special', 'edit', 'special:edit', '编辑特殊人群', '2026-02-23 05:18:17');
INSERT INTO `permissions` (`id`, `module`, `action`, `permission_code`, `description`, `created_at`) VALUES (8, 'special', 'delete', 'special:delete', '删除特殊人群', '2026-02-23 05:18:17');
INSERT INTO `permissions` (`id`, `module`, `action`, `permission_code`, `description`, `created_at`) VALUES (9, 'organization', 'view', 'organization:view', '查看机构信息', '2026-02-23 05:18:17');
INSERT INTO `permissions` (`id`, `module`, `action`, `permission_code`, `description`, `created_at`) VALUES (10, 'organization', 'add', 'organization:add', '新增机构', '2026-02-23 05:18:17');
INSERT INTO `permissions` (`id`, `module`, `action`, `permission_code`, `description`, `created_at`) VALUES (11, 'organization', 'edit', 'organization:edit', '编辑机构', '2026-02-23 05:18:17');
INSERT INTO `permissions` (`id`, `module`, `action`, `permission_code`, `description`, `created_at`) VALUES (12, 'organization', 'delete', 'organization:delete', '删除机构', '2026-02-23 05:18:17');
INSERT INTO `permissions` (`id`, `module`, `action`, `permission_code`, `description`, `created_at`) VALUES (13, 'mediation', 'view', 'mediation:view', '查看调解档案', '2026-02-23 05:18:17');
INSERT INTO `permissions` (`id`, `module`, `action`, `permission_code`, `description`, `created_at`) VALUES (14, 'mediation', 'add', 'mediation:add', '新增调解档案', '2026-02-23 05:18:17');
INSERT INTO `permissions` (`id`, `module`, `action`, `permission_code`, `description`, `created_at`) VALUES (15, 'mediation', 'edit', 'mediation:edit', '编辑调解档案', '2026-02-23 05:18:17');
INSERT INTO `permissions` (`id`, `module`, `action`, `permission_code`, `description`, `created_at`) VALUES (16, 'mediation', 'delete', 'mediation:delete', '删除调解档案', '2026-02-23 05:18:17');
INSERT INTO `permissions` (`id`, `module`, `action`, `permission_code`, `description`, `created_at`) VALUES (17, 'todo', 'view', 'todo:view', '查看待办提醒', '2026-02-23 05:18:17');
INSERT INTO `permissions` (`id`, `module`, `action`, `permission_code`, `description`, `created_at`) VALUES (18, 'todo', 'add', 'todo:add', '新增待办提醒', '2026-02-23 05:18:17');
INSERT INTO `permissions` (`id`, `module`, `action`, `permission_code`, `description`, `created_at`) VALUES (19, 'todo', 'edit', 'todo:edit', '编辑待办提醒', '2026-02-23 05:18:17');
INSERT INTO `permissions` (`id`, `module`, `action`, `permission_code`, `description`, `created_at`) VALUES (20, 'todo', 'delete', 'todo:delete', '删除待办提醒', '2026-02-23 05:18:17');
INSERT INTO `permissions` (`id`, `module`, `action`, `permission_code`, `description`, `created_at`) VALUES (21, 'system', 'view', 'system:view', '查看系统管理', '2026-02-23 05:18:17');
INSERT INTO `permissions` (`id`, `module`, `action`, `permission_code`, `description`, `created_at`) VALUES (22, 'system', 'user', 'system:user', '用户管理', '2026-02-23 05:18:17');
INSERT INTO `permissions` (`id`, `module`, `action`, `permission_code`, `description`, `created_at`) VALUES (23, 'system', 'role', 'system:role', '角色管理', '2026-02-23 05:18:17');
INSERT INTO `permissions` (`id`, `module`, `action`, `permission_code`, `description`, `created_at`) VALUES (24, 'system', 'menu', 'system:menu', '菜单管理', '2026-02-23 05:18:17');
UNLOCK TABLES;

-- ====================
-- 表结构: sys_menu
-- ====================
CREATE TABLE `sys_menu` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `parent_id` int(11) NOT NULL DEFAULT 0 COMMENT '父级ID，0表示顶级',
  `name` varchar(100) NOT NULL COMMENT '路由名称(唯一)',
  `path` varchar(200) NOT NULL COMMENT '路由路径',
  `component` varchar(200) DEFAULT NULL COMMENT '组件路径或特殊标记(#/##)',
  `redirect` varchar(200) DEFAULT NULL COMMENT '重定向',
  `title` varchar(100) NOT NULL COMMENT '菜单标题',
  `icon` varchar(100) DEFAULT NULL COMMENT '菜单图标',
  `menu_type` tinyint(4) NOT NULL DEFAULT 2 COMMENT '1-目录 2-菜单 3-按钮',
  `permission_code` varchar(100) DEFAULT NULL COMMENT '权限标识(如 resident:view)',
  `sort_order` int(11) NOT NULL DEFAULT 0 COMMENT '排序',
  `hidden` tinyint(4) NOT NULL DEFAULT 0 COMMENT '是否隐藏',
  `always_show` tinyint(4) NOT NULL DEFAULT 0 COMMENT '是否始终显示',
  `no_cache` tinyint(4) NOT NULL DEFAULT 0 COMMENT '是否禁用缓存',
  `affix` tinyint(4) NOT NULL DEFAULT 0 COMMENT '是否固定标签',
  `active_menu` varchar(200) DEFAULT NULL COMMENT '高亮菜单路径',
  `status` tinyint(4) NOT NULL DEFAULT 1 COMMENT '状态 1-启用 0-禁用',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_menu_type` (`menu_type`),
  KEY `idx_permission_code` (`permission_code`),
  KEY `idx_status` (`status`),
  KEY `idx_sort` (`sort_order`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COMMENT='系统菜单表';

-- ====================
-- 表数据: sys_menu (10 条记录)
-- ====================
LOCK TABLES `sys_menu` WRITE;
INSERT INTO `sys_menu` (`id`, `parent_id`, `name`, `path`, `component`, `redirect`, `title`, `icon`, `menu_type`, `permission_code`, `sort_order`, `hidden`, `always_show`, `no_cache`, `affix`, `active_menu`, `status`, `created_at`, `updated_at`) VALUES (1, 0, 'Dashboard', '/index', '#', '/index', '仪表盘', 'vi-material-symbols:dashboard', 1, NULL, 1, 0, 0, 0, 1, NULL, 1, '2026-02-23 05:18:17', '2026-02-23 05:18:17');
INSERT INTO `sys_menu` (`id`, `parent_id`, `name`, `path`, `component`, `redirect`, `title`, `icon`, `menu_type`, `permission_code`, `sort_order`, `hidden`, `always_show`, `no_cache`, `affix`, `active_menu`, `status`, `created_at`, `updated_at`) VALUES (2, 1, 'DashboardIndex', '', 'views/Dashboard/index', NULL, '首页', 'vi-ep:house', 2, NULL, 1, 0, 0, 0, 1, NULL, 1, '2026-02-23 05:18:17', '2026-02-23 05:18:17');
INSERT INTO `sys_menu` (`id`, `parent_id`, `name`, `path`, `component`, `redirect`, `title`, `icon`, `menu_type`, `permission_code`, `sort_order`, `hidden`, `always_show`, `no_cache`, `affix`, `active_menu`, `status`, `created_at`, `updated_at`) VALUES (3, 0, 'Permission', '/permission', '#', '/permission/role', '权限管理', 'vi-ep:setting', 1, 'system:view', 90, 0, 1, 0, 1, NULL, 1, '2026-02-23 05:18:17', '2026-02-23 05:18:17');
INSERT INTO `sys_menu` (`id`, `parent_id`, `name`, `path`, `component`, `redirect`, `title`, `icon`, `menu_type`, `permission_code`, `sort_order`, `hidden`, `always_show`, `no_cache`, `affix`, `active_menu`, `status`, `created_at`, `updated_at`) VALUES (4, 3, 'RoleManagement', 'role', 'views/Permission/Role/index', NULL, '角色管理', NULL, 2, 'system:role', 1, 0, 0, 0, 1, NULL, 1, '2026-02-23 05:18:17', '2026-02-23 05:18:17');
INSERT INTO `sys_menu` (`id`, `parent_id`, `name`, `path`, `component`, `redirect`, `title`, `icon`, `menu_type`, `permission_code`, `sort_order`, `hidden`, `always_show`, `no_cache`, `affix`, `active_menu`, `status`, `created_at`, `updated_at`) VALUES (5, 3, 'UserRoleManagement', 'user', 'views/Permission/User/index', NULL, '用户管理', NULL, 2, 'system:user', 2, 0, 0, 0, 1, NULL, 1, '2026-02-23 05:18:17', '2026-02-23 05:18:17');
INSERT INTO `sys_menu` (`id`, `parent_id`, `name`, `path`, `component`, `redirect`, `title`, `icon`, `menu_type`, `permission_code`, `sort_order`, `hidden`, `always_show`, `no_cache`, `affix`, `active_menu`, `status`, `created_at`, `updated_at`) VALUES (6, 0, 'System', '/system', '#', '/system/config', '系统管理', 'vi-ep:setting', 1, 'system:view', 95, 0, 0, 0, 0, NULL, 1, '2026-02-23 05:18:17', '2026-02-23 05:18:17');
INSERT INTO `sys_menu` (`id`, `parent_id`, `name`, `path`, `component`, `redirect`, `title`, `icon`, `menu_type`, `permission_code`, `sort_order`, `hidden`, `always_show`, `no_cache`, `affix`, `active_menu`, `status`, `created_at`, `updated_at`) VALUES (7, 6, 'SysConfig', 'config', 'views/System/Config/index', NULL, '系统配置', NULL, 2, 'system:config', 1, 0, 0, 0, 0, NULL, 1, '2026-02-23 05:18:17', '2026-02-23 05:18:17');
INSERT INTO `sys_menu` (`id`, `parent_id`, `name`, `path`, `component`, `redirect`, `title`, `icon`, `menu_type`, `permission_code`, `sort_order`, `hidden`, `always_show`, `no_cache`, `affix`, `active_menu`, `status`, `created_at`, `updated_at`) VALUES (8, 6, 'SysLog', 'log', 'views/System/Log/index', NULL, '系统日志', NULL, 2, 'system:log', 2, 0, 0, 0, 0, NULL, 1, '2026-02-23 05:18:17', '2026-02-23 05:18:17');
INSERT INTO `sys_menu` (`id`, `parent_id`, `name`, `path`, `component`, `redirect`, `title`, `icon`, `menu_type`, `permission_code`, `sort_order`, `hidden`, `always_show`, `no_cache`, `affix`, `active_menu`, `status`, `created_at`, `updated_at`) VALUES (9, 0, 'DataManage', '/data', '#', '/data/users', '数据管理', 'vi-ep:data-analysis', 1, 'data:view', 85, 0, 0, 0, 0, NULL, 1, '2026-02-23 05:18:17', '2026-02-23 05:18:17');
INSERT INTO `sys_menu` (`id`, `parent_id`, `name`, `path`, `component`, `redirect`, `title`, `icon`, `menu_type`, `permission_code`, `sort_order`, `hidden`, `always_show`, `no_cache`, `affix`, `active_menu`, `status`, `created_at`, `updated_at`) VALUES (10, 9, 'UserManage', 'users', 'views/DataManage/Users/index', NULL, '用户管理', NULL, 2, 'data:users', 1, 0, 0, 0, 0, NULL, 1, '2026-02-23 05:18:17', '2026-02-23 05:18:17');
UNLOCK TABLES;