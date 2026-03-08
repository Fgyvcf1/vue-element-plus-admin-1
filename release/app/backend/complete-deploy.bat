@echo off
title Vue Element Plus Admin - 完整部署 (端口3002/3307)

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "ROOT_DIR=%%~fI"

if not defined NODE_PATH set "NODE_PATH=%ROOT_DIR%\node-portable"
if not defined MARIADB_HOME set "MARIADB_HOME=%ROOT_DIR%\mariadb-portable"
if not defined MARIADB_PATH set "MARIADB_PATH=%MARIADB_HOME%\bin"
set "PATH=%NODE_PATH%;%MARIADB_PATH%;%PATH%"

echo ========================================
echo Vue Element Plus Admin 完整部署工具
echo 端口配置: 后端3002, 数据库3307
echo ========================================
echo.

:: 检查必需文件
echo 检查必需文件...
if not exist "database-full-export-2026-02-23.sql" (
    echo 警告: 未找到预期的数据库导出文件 database-full-export-2026-02-23.sql
    echo 检查其他可能的数据库导出文件...
    
    :: 尝试其他可能的文件名
    if exist "database-full-export.sql" (
        echo 找到: database-full-export.sql
        copy "database-full-export.sql" "database-full-export-2026-02-23.sql"
    ) else if exist "full-database-export.sql" (
        echo 找到: full-database-export.sql
        copy "full-database-export.sql" "database-full-export-2026-02-23.sql"
    ) else if exist "exported-database.sql" (
        echo 找到: exported-database.sql
        copy "exported-database.sql" "database-full-export-2026-02-23.sql"
    ) else (
        echo 错误: 找不到数据库导出文件
        echo 请确保数据库导出文件存在于当前目录
        pause
        exit /b 1
    )
)

if not exist "%NODE_PATH%\node.exe" (
    echo 错误: 找不到Node.js可执行文件
    pause
    exit /b 1
)

if not exist "%MARIADB_PATH%\mysqld.exe" (
    echo 错误: 找不到MariaDB可执行文件
    pause
    exit /b 1
)

:: 创建必要目录
echo 创建必要目录...
if not exist "data" mkdir data
if not exist "logs" mkdir logs

:: 启动数据库（3307端口）
echo.
echo 启动数据库服务（端口3307）...
call setup-portable-env.bat

start "" "%MARIADB_PATH%\mysqld.exe" --defaults-file="%SCRIPT_DIR%mariadb-config.ini" --console

:: 等待数据库启动
echo 等待数据库启动...
timeout /t 15 /nobreak >nul

:: 检查数据库进程
tasklist | findstr mysqld >nul
if errorlevel 1 (
    echo 警告: 数据库进程未找到，继续尝试初始化...
)

:: 初始化数据库
echo.
echo 初始化数据库...
"%NODE_PATH%\node.exe" robust-init-db.js

if errorlevel 1 (
    echo.
    echo 数据库初始化失败！
    echo 请检查:
    echo 1. MariaDB是否正确启动
    echo 2. 数据库导出文件是否存在且完整
    echo 3. 端口3307是否被其他程序占用
    pause
    exit /b 1
)

:: 启动后端服务（3002端口）
echo.
echo 启动后端服务（端口3002）...
set "PORT=3002"
start "" "%NODE_PATH%\node.exe" app.js

echo.
echo ========================================
echo 部署完成！
echo ========================================
echo 访问地址: http://localhost:3002
echo 管理员账号: admin
echo 管理员密码: admin123
echo 数据库端口: 3307
echo ========================================
echo.

:: 打开浏览器
timeout /t 3 /nobreak >nul
start http://localhost:3002

echo.
echo 按任意键退出...
pause >nul
