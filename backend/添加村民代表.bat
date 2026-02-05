@echo off
cd /d D:\vue-element-admin-master\backend
sqlite3 app.db "INSERT OR IGNORE INTO dictionaries (category, value, display_order, status, created_at) VALUES ('村组', '村民代表', 1, 'active', datetime('now'));"
sqlite3 app.db "SELECT * FROM dictionaries WHERE category = '村组' AND value = '村民代表';"
echo.
echo 按任意键退出...
pause > nul
