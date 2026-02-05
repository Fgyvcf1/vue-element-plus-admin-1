@echo off
chcp 65001 >nul
cd /d d:\vue-element-admin-master\backend
echo ========================================
echo 年龄提醒功能完整测试
echo ========================================
echo.
echo 此脚本将依次执行以下步骤:
echo.
echo 步骤1: 重启后端服务
echo 步骤2: 运行完整调试脚本
echo 步骤3: 提供手动触发API的说明
echo.
echo ========================================
echo.

echo [步骤1/3] 重启后端服务...
echo.
echo 正在停止现有服务...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo 启动后端服务...
start cmd /k "node server.js"
echo ✅ 后端服务已启动
echo.
timeout /t 3 >nul

echo [步骤2/3] 运行完整调试脚本...
echo.
node full-debug-age-reminder.js

echo.
echo [步骤3/3] 手动触发API检查...
echo.
echo 请在浏览器中访问以下URL来触发年龄提醒检查:
echo.
echo http://localhost:3000/api/check-age-reminders
echo.
echo 或者在浏览器控制台(F12)中运行以下代码:
echo.
echo fetch('/api/check-age-reminders')
echo   .then(res ^> res.json())
echo   .then(data ^> console.log(data))
echo.
echo ========================================
echo.
echo 测试完成后，请检查:
echo 1. 前端通知列表 (右上角铃铛图标)
echo 2. 通知列表页面 (菜单 - 通知管理 - 通知列表)
echo 3. notifications表数据
echo.
pause
