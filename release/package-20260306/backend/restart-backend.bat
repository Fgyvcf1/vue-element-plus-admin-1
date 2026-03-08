@echo off
chcp 65001 >nul
echo ========================================
echo 重启后端服务
echo ========================================
echo.
echo 正在停止后端服务...
taskkill /F /IM node.exe >nul 2>&1
echo.
echo 启动后端服务...
cd /d d:\vue-element-admin-master\backend
start cmd /k "node server.js"
echo.
echo ✅ 后端服务已重启
echo.
pause
