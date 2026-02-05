@echo off
chcp 65001 >nul
cd /d d:\vue-element-admin-master\backend
echo ========================================
echo 修改60岁规则描述
echo ========================================
echo.
echo 此脚本将:
echo 1. 查看现有的60岁规则
echo 2. 修改描述，包含生日后提醒
echo.
echo ========================================
echo.
node update-rule-description.js
echo.
pause
