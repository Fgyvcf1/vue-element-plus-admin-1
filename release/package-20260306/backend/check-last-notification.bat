@echo off
chcp 65001 >nul
cd /d d:\vue-element-admin-master\backend
echo ========================================
echo 检查最新创建的通知
echo ========================================
echo.
node check-last-notification.js
echo.
pause
