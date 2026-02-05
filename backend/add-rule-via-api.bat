@echo off
chcp 65001 >nul
cd /d d:\vue-element-admin-master\backend
echo ========================================
echo 通过API添加生日提醒规则
echo ========================================
echo.
echo 请确保后端服务正在运行！
echo.
node add-rule-via-api.js
echo.
pause
