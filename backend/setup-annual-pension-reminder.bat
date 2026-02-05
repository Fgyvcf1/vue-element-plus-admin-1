@echo off
chcp 65001 >nul
cd /d d:\vue-element-admin-master\backend
echo ========================================
echo 设置年度养老待遇认证提醒
echo ========================================
echo.
echo 此脚本将:
echo 1. 添加年度养老提醒规则到数据库
echo 2. 说明如何触发检查
echo.
echo 规则详情:
echo   - 规则类型: annual_pension
echo   - 规则名称: 61岁以上年度养老待遇认证提醒
echo   - 适用对象: 61岁以上居民
echo   - 提醒频率: 每年一次（生日后1天）
echo   - 描述: 61岁以上居民，每年生日后1天提醒进行城乡居民养老待遇资格认证
echo.
echo ========================================
echo.
echo [步骤1/2] 添加规则...
echo.
node add-annual-pension-reminder.js
echo.
echo.
echo ========================================
echo [步骤2/2] 使用说明
echo ========================================
echo.
echo 规则添加完成后，需要:
echo.
echo 1. 重启后端服务
echo    停止: Ctrl+C
echo    启动: node server.js
echo.
echo 2. 手动触发检查（测试）
echo    访问: http://localhost:3000/api/check-annual-pension-reminders
echo.
echo 3. 设置定时任务（可选，推荐）
echo    在 server.js 中设置每天定时检查
echo.
echo 4. 验证结果
echo    检查前端通知列表和铃铛图标
echo.
echo ========================================
echo.
pause
