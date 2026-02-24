@echo off
chcp 65001 > nul

echo.
echo ===============================================
echo    Vue Element Plus Admin 服务启动脚本
echo ===============================================
echo.

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