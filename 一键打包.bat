@echo off
chcp 65001 >nul
cls
echo ========================================
echo   村居办公系统一键打包工具
echo ========================================
echo.

set PROJECT_DIR=%~dp0
set NODE_DIR=E:\node-portable\node-v24.13.1-win-x64
set MARIADB_DIR=E:\mariadb-portable

echo 正在检查依赖...
if not exist "%NODE_DIR%\node.exe" (
    echo 错误: 未找到Node.js: %NODE_DIR%
    pause
    exit /b 1
)

if not exist "%MARIADB_DIR%\bin\mysqld.exe" (
    echo 错误: 未找到MariaDB: %MARIADB_DIR%\bin
    pause
    exit /b 1
)

echo 依赖检查通过
echo.

echo [0/4] 打包稳健预检...
cd /d "%PROJECT_DIR%"
if exist ".env.pro" (
    findstr /C:"VITE_API_BASE_PATH=/api" ".env.pro" >nul
    if errorlevel 1 (
        echo 错误: .env.pro 缺少 VITE_API_BASE_PATH=/api
        echo    请补上这一行后再打包（否则安装后登录可能 404）
        pause
        exit /b 1
    )
) else (
    echo 注意: 未找到 .env.pro（将继续，但请确认前端配置正确）
)

if exist "scripts\generate-sys-menu-seed.cjs" (
    node "scripts\generate-sys-menu-seed.cjs"
    if errorlevel 1 (
        echo 错误: 生成菜单种子失败
        pause
        exit /b 1
    )
) else (
    echo 注意: 未找到 scripts\generate-sys-menu-seed.cjs（将继续）
)

if not exist "backend\seed-data.js" (
    echo 注意: 未找到 backend\seed-data.js（安装时可能无法自动补齐菜单/字典数据）
)

echo [1/4] 构建前端...
cd /d "%PROJECT_DIR%"
call pnpm build:pro
if errorlevel 1 (
    echo 错误: 前端构建失败
    pause
    exit /b 1
)

echo [2/4] 导出数据库结构...
cd /d "%PROJECT_DIR%backend"
if exist "scripts\export-db-structure.js" (
    node scripts/export-db-structure.js
    if errorlevel 1 (
        echo 错误: 数据库导出失败
        pause
        exit /b 1
    )
) else (
    echo 跳过数据库导出（脚本不存在）
)

echo [3/4] 打包应用程序...
set PUPPETEER_SKIP_DOWNLOAD=1
powershell -ExecutionPolicy Bypass -File "%PROJECT_DIR%deploy\windows\build-release.ps1" -Mode pro -SkipFrontendBuild -NodeRuntimeDir "%NODE_DIR%" -MariaDbDir "%MARIADB_DIR%" -UseBackendNodeModules
if errorlevel 1 (
    echo 错误: 应用程序打包失败
    pause
    exit /b 1
)

echo [4/4] 编译安装程序...
cd /d "%PROJECT_DIR%deploy\windows"
"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" installer.iss
if errorlevel 1 (
    echo 错误: 安装程序编译失败
    pause
    exit /b 1
)

echo.
echo ========================================
echo   打包成功！
echo ========================================
echo 安装包位置: %PROJECT_DIR%release\installer\VueElementPlusAdmin-Setup.exe
echo.
echo 用户只需:
echo 1. 双击安装包
echo 2. 按提示完成安装
echo 3. 系统自动配置并启动
echo.
if not "%NO_PAUSE%"=="1" (
    pause
)
