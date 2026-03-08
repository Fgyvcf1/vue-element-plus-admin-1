-- 删除disabled_persons表中的initial_certificate_date字段
-- 执行时间: 2026-01-27

-- 删除初次发证日期字段
ALTER TABLE disabled_persons DROP COLUMN initial_certificate_date;

-- 验证字段是否删除成功
SELECT '字段删除完成' AS status;
PRAGMA table_info(disabled_persons);
