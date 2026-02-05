-- 添加60岁生日后提醒规则
-- 描述: 通知60岁居民及时进行养老待遇资格认证

-- 检查并插入新规则
INSERT OR IGNORE INTO reminder_rules (
    rule_type,
    rule_name,
    rule_value,
    description,
    status,
    reminder_days,
    created_at
) VALUES (
    'birthday_after',           -- 规则类型：生日后提醒
    '60岁生日后认证提醒',     -- 规则名称
    '60',                      -- 目标年龄
    '通知60岁居民及时进行养老待遇资格认证', -- 描述
    'active',                  -- 启用状态
    1,                        -- 生日后1天提醒
    datetime('now')            -- 创建时间
);

-- 验证插入结果
SELECT '插入结果:' as info;
SELECT * FROM reminder_rules WHERE rule_type = 'birthday_after' AND rule_value = '60';
