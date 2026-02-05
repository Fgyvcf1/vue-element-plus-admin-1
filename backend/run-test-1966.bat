@echo off
chcp 65001 >nul
cd /d d:\vue-element-admin-master\backend
echo ========================================
echo 测试1966-01-10出生居民的年龄提醒
echo ========================================
echo.
node test-1966-01-10-resident.js
echo.
pause