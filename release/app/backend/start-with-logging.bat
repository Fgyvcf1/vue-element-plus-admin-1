@echo off
chcp 65001 >nul
echo 正在启动后端服务...
cd /d "d:\vue-element-admin-master\backend"
node app.js 2>&1 > "d:\vue-element-admin-master\backend\startup-log.txt"
pause
