@echo off
chcp 65001 >nul
cd /d d:\vue-element-admin-master\backend
echo ========================================
echo 添加60岁生日后提醒规则（简化版）
echo ========================================
echo.
echo 正在执行...
echo.

sqlite3 app.db <<EOF
INSERT INTO reminder_rules (rule_type, rule_name, rule_value, description, status, reminder_days, created_at)
VALUES ('birthday_after', '60岁生日后认证提醒', '60', '通知60岁居民及时进行养老待遇资格认证', 'active', 1, datetime('now'));

SELECT '插入完成，查询结果:' as info;
SELECT id, rule_type, rule_name, rule_value, description, status, reminder_days, created_at
FROM reminder_rules
WHERE rule_type = 'birthday_after';
EOF

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ 规则添加成功！
) else (
    echo.
    echo ❌ 规则添加失败！
    echo.
    echo 可能的原因:
    echo 1. reminder_days 字段不存在
    echo 2. 数据库文件被锁定
    echo 3. 表结构与SQL不匹配
)
echo.
echo ========================================
pause
