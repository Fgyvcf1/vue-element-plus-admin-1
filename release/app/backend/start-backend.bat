@echo off
:: 启动后端服务（使用3002端口）
echo 正在启动后端服务（端口3002）...

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "ROOT_DIR=%%~fI"

if not defined NODE_PATH set "NODE_PATH=%ROOT_DIR%\node-portable"
set "PATH=%NODE_PATH%;%PATH%"
set "PORT=3002"

if not exist "%NODE_PATH%\node.exe" (
    echo 错误: 找不到Node.js可执行文件
    exit /b 1
)

:: 启动后端服务
start "" "%NODE_PATH%\node.exe" app.js

echo 后端服务已启动（端口3002）！
echo 请访问 http://localhost:3002 查看应用
