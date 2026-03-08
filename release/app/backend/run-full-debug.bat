@echo off
chcp 65001 >nul
cd /d d:\vue-element-admin-master\backend
echo ========================================
echo 完整调试：年龄提醒流程
echo ========================================
echo.
echo 此脚本将:
echo 1. 检查notifications表结构
echo 2. 查找1966-01-10出生的居民
echo 3. 检查60岁提醒规则
echo 4. 手动执行年龄提醒逻辑
echo 5. 检查是否已存在通知
echo 6. 尝试创建通知
echo.
echo ========================================
echo.
node full-debug-age-reminder.js
echo.
pause
