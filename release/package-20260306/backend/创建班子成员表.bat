@echo off
cd backend
node create-committee-tables.js
if %errorlevel% neq 0 (
    echo 创建班子成员表失败！
    pause
    exit /b 1
)
echo.
echo 班子成员表创建成功！
echo.
pause
