@echo off
chcp 65001 > nul

echo.
echo ===============================================
echo    Vue Element Plus Admin 服务启动脚本
echo ===============================================
echo.

REM 部署环境标记（用于强制使用环境变量密码）
set "APP_ENV=production"
set "DEPLOY=1"

REM 需要通过环境变量提供数据库密码
if not defined DB_PASSWORD (
    for /f "usebackq delims=" %%p in (`powershell -NoProfile -Command "$p = Read-Host '请输入数据库密码（不会回显）' -AsSecureString; [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($p))"`) do set "DB_PASSWORD=%%p"
)
if "%DB_PASSWORD%"=="" (
    echo ❌ 未提供 DB_PASSWORD，无法启动
    pause
    exit /b 1
)

REM 检查 Node.js 环境
echo 正在检查 Node.js 环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)
echo ✅ Node.js 环境检查通过

REM 安装依赖（如果尚未安装）
if not exist "node_modules" (
    echo.
    echo 正在安装依赖包...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
)

REM 运行数据库初始化
echo.
echo 正在初始化数据库...
node init-db.js
if %errorlevel% neq 0 (
    echo ❌ 数据库初始化失败
    pause
    exit /b 1
)
echo ✅ 数据库初始化完成

REM 启动服务
echo.
echo 正在启动后端服务...
echo 服务将在 http://localhost:3001 上运行
echo.
node app.js
