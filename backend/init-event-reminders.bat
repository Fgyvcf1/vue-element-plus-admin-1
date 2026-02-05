@echo off
chcp 65001 >nul
echo ========================================
echo 创建 event_reminders 表
echo ========================================
echo.
echo 正在执行数据库表创建脚本...
cd /d "%~dp0"
node check-event-reminders.js
echo.
if %errorlevel% equ 0 (
    echo ✓ 创建成功！
    echo.
    echo 请重启后端服务以使功能生效。
) else (
    echo ✗ 创建失败，请检查错误信息。
)
echo.
pause
