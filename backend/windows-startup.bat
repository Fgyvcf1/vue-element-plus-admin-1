@echo off
chcp 65001 > nul
setlocal EnableDelayedExpansion

echo.
echo ===============================================
echo    Vue Element Plus Admin Windows 启动脚本
echo ===============================================
echo.

REM 设置默认端口
if "%PORT%"=="" set PORT=3001

echo 正在检查 Node.js 环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)
echo ✅ Node.js 环境检查通过

echo.
echo 正在检查端口 !PORT! 占用情况...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :!PORT! ^| findstr LISTENING') do (
    set PID=%%a
    if not "!PID!"=="" (
        echo 正在终止占用端口 !PORT! 的进程 PID: !PID!
        taskkill /f /pid !PID! >nul 2>&1
        if !errorlevel! equ 0 (
            echo ✅ 已成功终止进程 !PID!
        ) else (
            echo ⚠️  终止进程 !PID! 失败或进程不存在
        )
    )
)
echo ✅ 端口 !PORT! 检查完成

echo.
echo 正在检查 MySQL/MariaDB 数据库连接...
node -e "
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'config.json');
let fileConfig = {};
if (fs.existsSync(configPath)) {
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    fileConfig = JSON.parse(raw);
  } catch (error) {
    console.log('⚠️  无法读取 config.json:', error.message);
  }
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || fileConfig.host || 'localhost',
  user: process.env.DB_USER || fileConfig.user || 'app_user',
  password: process.env.DB_PASSWORD || fileConfig.password || 'strongpass791002',
  database: process.env.DB_NAME || fileConfig.database || 'village',
  port: Number(process.env.DB_PORT || fileConfig.port || 3306),
  charset: 'utf8mb4',
  connectTimeout: 5000
});

pool.getConnection()
  .then(connection => {
    console.log('✅ 数据库连接成功');
    connection.release();
    pool.end();
  })
  .catch(err => {
    console.error('❌ 数据库连接失败:', err.message);
    process.exit(1);
  });
"

if %errorlevel% neq 0 (
    echo.
    echo ⚠️  数据库连接失败，请检查数据库配置
    echo    请确认 MySQL/MariaDB 服务已启动
    echo    并且 config.json 文件中的数据库配置正确
    pause
    exit /b 1
)

echo.
echo 正在初始化数据库结构...
node init-db.js
if %errorlevel% neq 0 (
    echo ❌ 数据库初始化失败
    pause
    exit /b 1
)
echo ✅ 数据库初始化完成

echo.
echo 正在启动后端服务...
echo 后端服务将在 http://localhost:!PORT! 上运行
echo.
echo 按 Ctrl+C 可停止服务
echo.
node app.js

pause