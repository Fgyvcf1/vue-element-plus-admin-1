-- 测试年龄提醒功能 - 插入测试居民数据
-- 出生日期：1966-02-08，在2026-01-09检查时应该触发60岁提前30天提醒

-- 首先检查是否已存在该身份证号的居民
SELECT '检查现有居民:' as action;
SELECT id, name, date_of_birth, id_card FROM residents WHERE id_card = '11010119660208001X';

-- 如果上一步查询返回了记录，说明已存在，需要先删除
-- DELETE FROM residents WHERE id_card = '11010119660208001X';

-- 插入测试居民数据（假设household_id=1存在）
INSERT OR REPLACE INTO residents (
    household_id, 
    name, 
    gender, 
    date_of_birth, 
    id_card, 
    relationship_to_head, 
    ethnicity, 
    marital_status, 
    political_status, 
    military_service, 
    bank_card, 
    bank_name, 
    village_group, 
    education_level, 
    phone_number, 
    registered_date, 
    status, 
    Home_address
) VALUES (
    1,                              -- household_id (请确保该户存在)
    '测试年龄提醒人员',              -- name
    '男',                           -- gender
    '1966-02-08',                   -- date_of_birth (关键：触发60岁提前30天提醒)
    '11010119660208001X',           -- id_card (唯一)
    '户主',                         -- relationship_to_head
    '汉族',                         -- ethnicity
    '已婚',                         -- marital_status
    '党员',                         -- political_status
    '已服兵役',                     -- military_service
    '6225880012345678',             -- bank_card
    '测试银行',                     -- bank_name
    '测试村组',                     -- village_group
    '高中',                         -- education_level
    '13800138000',                  -- phone_number
    date('now'),                    -- registered_date (今天)
    'active',                       -- status
    '测试地址123号'                 -- Home_address
);

-- 验证插入结果
SELECT '插入结果:' as action;
SELECT id, name, date_of_birth, id_card, village_group 
FROM residents 
WHERE id_card = '11010119660208001X';

-- 显示年龄提醒逻辑验证
SELECT 
    '年龄提醒验证:' as info,
    name,
    date_of_birth,
    '当前日期: 2026-01-09' as current_date,
    '出生年份: 1966' as birth_year,
    '当前年龄计算: 2026-1966=60，但生日在2月8日，现在1月9日所以实际59岁' as age_note,
    '距离60岁生日: 30天' as days_to_birthday,
    '预期: 触发60岁提前30天提醒' as expected_result;
