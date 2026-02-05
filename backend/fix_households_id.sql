-- 修复 households 表的 id 字段，设置为自增主键

-- 查看当前表结构
DESCRIBE households;

-- 修改 id 字段为自增主键
ALTER TABLE households MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY;

-- 验证修改结果
DESCRIBE households;
