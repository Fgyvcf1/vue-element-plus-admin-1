@echo off
chcp 65001 >nul
cd /d d:\vue-element-admin-master\backend
echo ========================================
echo 添加生日后提醒规则
echo ========================================
echo.
echo 规则配置:
echo   - 规则类型: birthday
echo   - 规则名称: 60岁生日后认证提醒
echo   - 目标年龄: 60岁
echo   - 描述: 通知60岁居民及时进行养老待遇资格认证
echo   - 提醒时机: 生日后1天
echo.
echo ========================================
echo.
node add-birthday-reminder-rule.js
echo.
pause
