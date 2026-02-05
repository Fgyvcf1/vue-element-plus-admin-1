@echo off
chcp 65001 >nul
cd /d d:\vue-element-admin-master\backend
echo ========================================
echo 诊断：添加生日提醒规则失败原因
echo ========================================
echo.
node diagnose-add-rule.js
echo.
pause
