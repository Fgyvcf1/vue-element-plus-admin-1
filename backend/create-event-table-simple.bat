@echo off
chcp 65001 >nul
echo ========================================
echo 创建 event_reminders 表
echo ========================================
echo.
cd /d "%~dp0"
python create_event_table.py
echo.
pause
