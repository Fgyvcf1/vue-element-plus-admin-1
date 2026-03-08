-- 测试更新残疾人监护人字段
-- 执行时间: 2026-01-27

-- 更新ID为1的残疾人记录
UPDATE disabled_persons
SET guardian_name = '张三',
    guardian_phone = '13800138000',
    updated_at = datetime('now')
WHERE id = 1;

-- 查询更新结果
SELECT id, disability_type, guardian_name, guardian_phone, updated_at
FROM disabled_persons
WHERE id = 1;
