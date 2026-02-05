@echo off
chcp 65001 >nul
cd /d d:\vue-element-admin-master\backend
echo ========================================
echo 测试1966-01-10出生居民的年龄提醒
echo ========================================
echo.
echo 当前日期: 2026-01-09
echo 出生日期: 1966-01-10
echo 距离60岁生日: 1天
echo 提前提醒: 1天
echo.
echo 预期结果: 应该触发60岁提前1天提醒
echo ========================================
echo.
node test-1966-01-10-resident.js
echo.
pause
