-- 添加残疾人管理模块新字段
-- 执行时间: 2026-01-26

-- 1. 添加监护人姓名字段
ALTER TABLE disabled_persons ADD COLUMN IF NOT EXISTS guardian_name TEXT;

-- 2. 添加监护人联系电话字段
ALTER TABLE disabled_persons ADD COLUMN IF NOT EXISTS guardian_phone TEXT;

-- 3. 添加与残疾人关系字段
ALTER TABLE disabled_persons ADD COLUMN IF NOT EXISTS guardian_relationship TEXT;

-- 4. 添加初次发证日期字段
ALTER TABLE disabled_persons ADD COLUMN IF NOT EXISTS issue_date DATE;

-- 5. 添加有效期至字段
ALTER TABLE disabled_persons ADD COLUMN IF NOT EXISTS validity_period DATE;

-- 6. 添加持证状态字段（默认为'在持'）
ALTER TABLE disabled_persons ADD COLUMN IF NOT EXISTS certificate_status TEXT DEFAULT '在持';

-- 验证字段是否添加成功
SELECT '字段添加完成' AS status;
SHOW COLUMNS FROM disabled_persons;
