-- 添加提前提醒天数字段到reminder_rules表
ALTER TABLE reminder_rules ADD COLUMN reminder_days INTEGER DEFAULT 0;

-- 更新现有数据：设置默认的提前提醒天数
UPDATE reminder_rules SET reminder_days = 30 WHERE rule_type = 'age' AND reminder_days = 0;
