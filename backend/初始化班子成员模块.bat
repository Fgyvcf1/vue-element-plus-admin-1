@echo off
echo ========================================
echo 班子成员模块 - 数据库初始化脚本
echo ========================================
echo.

cd backend

echo [1/3] 创建班子成员表...
node create-committee-tables.js
if %errorlevel% neq 0 (
    echo 创建班子成员表失败！
    pause
    exit /b 1
)
echo 班子成员表创建成功！
echo.

echo [2/3] 插入职务字典数据...
node insert-position-dictionary.js
if %errorlevel% neq 0 (
    echo 插入职务字典失败！
    pause
    exit /b 1
)
echo 职务字典插入成功！
echo.

echo [3/3] 创建全局索引...
node create-global-indexes.js
if %errorlevel% neq 0 (
    echo 创建全局索引失败！
    pause
    exit /b 1
)
echo 全局索引创建成功！
echo.

echo ========================================
echo 班子成员模块初始化完成！
echo ========================================
echo.
echo 请重启后端服务以使API生效。
pause
