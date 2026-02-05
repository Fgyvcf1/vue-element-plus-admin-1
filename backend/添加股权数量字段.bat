@echo off
chcp 65001 > nul
echo ========================================
echo 添加股权数量字段到residents表
echo ========================================
echo.

node add-equity-shares-field.js

echo.
echo ========================================
echo 操作完成！
echo ========================================
pause
