@echo off
cd /d D:\vue-element-admin-master\backend
echo 正在插入"村民代表"到字典表...
sqlite3 app.db "INSERT OR IGNORE INTO dictionaries (category, value, display_order, status, created_at) VALUES ('职务', '村民代表', 10, 'active', datetime('now'));"
echo.
echo 查询验证...
sqlite3 app.db "SELECT id, category, value, display_order, status FROM dictionaries WHERE category = '职务' AND value = '村民代表';"
echo.
echo 按任意键退出...
pause > nul
