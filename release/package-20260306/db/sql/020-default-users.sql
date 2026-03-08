-- 默认用户数据（Docker部署时使用）
-- 这些用户将在数据库初始化时自动创建

-- 确保角色存在
INSERT IGNORE INTO `roles` (`id`, `role_name`, `role_code`, `description`, `status`, `created_at`, `updated_at`) VALUES
(1, '超级管理员', 'superadmin', '拥有所有权限', 'active', NOW(), NOW()),
(2, '普通管理员', 'admin', '拥有大部分管理权限', 'active', NOW(), NOW()),
(3, '普通用户', 'user', '拥有查看和部分编辑权限', 'active', NOW(), NOW()),
(4, '只读用户', 'readonly', '仅拥有查看权限', 'active', NOW(), NOW());

-- 插入默认用户（如果用户名不存在则插入）
INSERT IGNORE INTO `users` (`username`, `password`, `real_name`, `user_type`, `role_id`, `phone`, `email`, `status`, `created_at`, `updated_at`) VALUES
-- 超级管理员账号（推荐给客户使用）
('admin', 'admin123', '系统管理员', 'superadmin', 1, '13800138000', 'admin@example.com', 'active', NOW(), NOW()),

-- 演示账号（可选）
('demo', 'demo123', '演示用户', 'user', 3, '13900139000', 'demo@example.com', 'active', NOW(), NOW()),

-- 村级管理员账号
('village', 'village123', '村管理员', 'admin', 2, '13700137000', 'village@example.com', 'active', NOW(), NOW());

-- 更新第一个用户为超级管理员（确保至少有一个超级管理员）
UPDATE `users` SET `role_id` = 1 WHERE `username` = 'admin';
