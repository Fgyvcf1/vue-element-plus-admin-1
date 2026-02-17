@echo off
chcp 65001 >nul
setlocal

echo ========================================
echo   启动 Vue3 + Element Plus 项目
echo ========================================
echo.

set "PNPM=%APPDATA%\npm\pnpm.cmd"
if not exist "%PNPM%" (
  echo 未找到 pnpm：%PNPM%
  echo 请先安装 pnpm（用户级）:
  echo   npm i -g pnpm --prefix "%APPDATA%\npm"
  pause
  exit /b 1
)

echo [1/1] 启动前后端（dev:all）...
call "%PNPM%" dev:all

echo.
echo 已退出
pause
