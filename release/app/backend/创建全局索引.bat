@echo off
cd backend
node create-global-indexes.js
if %errorlevel% neq 0 (
    echo 创建全局索引失败！
    pause
    exit /b 1
)
echo.
echo 全局索引创建成功！
echo.
pause
