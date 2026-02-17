@echo off
chcp 65001 >nul
echo ============================================
echo  权限管理系统 - 数据库表创建脚本
echo ============================================
echo.

REM 设置数据库连接信息（根据您的环境修改）
set DB_HOST=localhost
set DB_USER=app_user
set DB_PASS=strongpass791002
set DB_NAME=village
set DB_PORT=3306

echo 正在连接数据库: %DB_NAME%
echo.

REM 执行SQL脚本
mysql -h%DB_HOST% -u%DB_USER% -p%DB_PASS% -P%DB_PORT% %DB_NAME% < create-permission-tables.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo  权限管理表创建成功！
    echo ============================================
    echo.
    echo 已创建以下4张表：
    echo   1. sys_roles        - 角色表
    echo   2. sys_permissions  - 权限/菜单表
    echo   3. user_roles       - 用户角色关联表
    echo   4. role_permissions - 角色权限关联表
    echo.
    echo 已初始化数据：
    echo   - 3个基础角色（超级管理员、普通用户、数据录入员）
    echo   - 系统管理模块权限（角色管理、权限管理、用户管理）
    echo   - 超级管理员拥有所有权限
    echo.
) else (
    echo.
    echo ============================================
    echo  创建失败，请检查：
    echo ============================================
    echo   1. MySQL/MariaDB 服务是否启动
    echo   2. 数据库连接信息是否正确
    echo   3. 数据库 village 是否存在
    echo   4. users 表是否存在（用于外键关联）
    echo.
    pause
    exit /b 1
)

echo 按任意键退出...
pause >nul