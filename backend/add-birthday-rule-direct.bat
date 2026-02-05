@echo off
chcp 65001 >nul
cd /d d:\vue-element-admin-master\backend
echo ========================================
echo 添加60岁生日后提醒规则
echo ========================================
echo.
echo 规则详情:
echo   - 规则类型: birthday_after (生日后提醒)
echo   - 规则名称: 60岁生日后认证提醒
echo   - 目标年龄: 60岁
echo   - 提醒时机: 生日后1天
echo   - 描述: 通知60岁居民及时进行养老待遇资格认证
echo   - 状态: active (已启用)
echo.
echo ========================================
echo.
echo 正在执行SQL命令...
echo.

sqlite3 app.db "INSERT OR IGNORE INTO reminder_rules (rule_type, rule_name, rule_value, description, status, reminder_days, created_at) VALUES ('birthday_after', '60岁生日后认证提醒', '60', '通知60岁居民及时进行养老待遇资格认证', 'active', 1, datetime('now'));"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ 规则添加成功！
    echo.
    echo 查询添加的规则:
    sqlite3 app.db "SELECT id, rule_type, rule_name, rule_value, description, status, reminder_days FROM reminder_rules WHERE rule_type = 'birthday_after' AND rule_value = '60';"
) else (
    echo.
    echo ❌ 规则添加失败！
)
echo.
echo ========================================
echo.
pause
