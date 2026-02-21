@echo off
chcp 65001 >nul
echo ========================================
echo   启动 Vue3 + Element Plus 项目
echo ========================================
echo.
echo [1/2] 启动后端服务（端口3001）...
start "后端服务" cmd /k "cd /d %~dp0backend && node start-backend.js"

echo.
echo [2/2] 启动前端服务...
cd /d %~dp0
pnpm dev

echo.
echo 前端服务已关闭
echo 请手动关闭后端服务窗口
pause