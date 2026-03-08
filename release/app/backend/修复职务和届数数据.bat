@echo off
echo ========================================
echo 修复职务和届数数据
echo ========================================
echo.
echo 正在执行修复脚本...
node fix-position-and-term.js
echo.
echo ========================================
echo 修复完成！
echo.
echo 重要提示：
echo 1. 请重启后端服务以使更改生效
echo 2. 执行: d:/vue-element-admin-master/重启后端服务.bat
echo 3. 然后刷新前端页面
echo ========================================
pause
