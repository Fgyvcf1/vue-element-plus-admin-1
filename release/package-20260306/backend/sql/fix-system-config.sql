-- 彻底修复 system_config 表结构与重复数据（需要管理员权限）
-- 使用前请备份数据库或至少备份此表：
--   CREATE TABLE system_config_backup AS SELECT * FROM system_config;
--
-- 说明：
-- 1) 旧表字段类型错误（TEXT）且无唯一约束，导致重复行与刷新回退
-- 2) 本脚本会新建标准结构表，迁移每个 config_key 的最新值，再替换旧表

START TRANSACTION;

CREATE TABLE system_config_new (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  config_key VARCHAR(128) NOT NULL UNIQUE,
  config_value TEXT,
  config_name VARCHAR(255) NOT NULL,
  config_group VARCHAR(64) DEFAULT 'system',
  value_type VARCHAR(32) DEFAULT 'string',
  description TEXT,
  is_system TINYINT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 迁移每个 key 最新的一条记录
INSERT INTO system_config_new (
  config_key,
  config_value,
  config_name,
  config_group,
  value_type,
  description,
  is_system,
  created_at,
  updated_at
)
SELECT
  sc.config_key,
  sc.config_value,
  COALESCE(NULLIF(sc.config_name, ''), sc.config_key),
  COALESCE(NULLIF(sc.config_group, ''), 'system'),
  COALESCE(NULLIF(sc.value_type, ''), 'string'),
  COALESCE(sc.description, ''),
  COALESCE(sc.is_system, 0),
  COALESCE(STR_TO_DATE(sc.created_at, '%Y-%m-%d %H:%i:%s'), NOW()),
  COALESCE(STR_TO_DATE(sc.updated_at, '%Y-%m-%d %H:%i:%s'), NOW())
FROM system_config sc
JOIN (
  SELECT
    config_key,
    MAX(COALESCE(updated_at, created_at, '0000-00-00 00:00:00')) AS max_time
  FROM system_config
  GROUP BY config_key
) latest
  ON sc.config_key = latest.config_key
  AND COALESCE(sc.updated_at, sc.created_at, '0000-00-00 00:00:00') = latest.max_time
GROUP BY sc.config_key;

RENAME TABLE system_config TO system_config_old, system_config_new TO system_config;

COMMIT;

-- 如果确认无误，可手动删除旧表：
-- DROP TABLE system_config_old;
