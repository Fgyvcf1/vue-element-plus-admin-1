@echo off
chcp 65001 >nul
echo 正在创建 event_reminders 表...
cd /d "%~dp0"
node create-event-reminders-table.js
pause
