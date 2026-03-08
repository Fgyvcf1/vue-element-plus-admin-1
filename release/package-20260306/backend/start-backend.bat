@echo off
:: 启动后端服务（使用3002端口）
echo 正在启动后端服务（端口3002）...

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "ROOT_DIR=%%~fI"

if not defined NODE_PATH set "NODE_PATH=%ROOT_DIR%\node-portable"
set "PATH=%NODE_PATH%;%PATH%"
set "PORT=3002"

REM 部署环境标记（用于强制使用环境变量密码）
set "APP_ENV=production"
set "DEPLOY=1"

REM 需要通过环境变量提供数据库密码
if not defined DB_PASSWORD (
    for /f "usebackq delims=" %%p in (`powershell -NoProfile -Command "$p = Read-Host '请输入数据库密码（不会回显）' -AsSecureString; [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($p))"`) do set "DB_PASSWORD=%%p"
)
if "%DB_PASSWORD%"=="" (
    echo ❌ 未提供 DB_PASSWORD，无法启动
    exit /b 1
)

if not exist "%NODE_PATH%\node.exe" (
    echo 错误: 找不到Node.js可执行文件
    exit /b 1
)

:: 启动后端服务
start "" "%NODE_PATH%\node.exe" app.js

echo 后端服务已启动（端口3002）！
echo 请访问 http://localhost:3002 查看应用
