@echo off
chcp 65001 >nul
cd /d d:\vue-element-admin-master\backend
echo ========================================
echo 查看提醒规则
echo ========================================
echo.
node view-reminder-rules.js
echo.
pause
