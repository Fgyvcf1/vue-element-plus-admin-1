@echo off
echo 正在删除之前添加的职务数据...
echo.

REM 检查数据库文件是否存在
if not exist "app.db" (
    echo 错误: 数据库文件 app.db 不存在!
    pause
    exit /b 1
)

REM 尝试使用sqlite3命令行工具
sqlite3 app.db "DELETE FROM dictionaries WHERE category IN ('职务_支部委员会', '职务_村民委员会', '职务_集体经济组织理事会', '职务_集体经济组织监事会', '职务_村务监督委员会', '职务_村民小组长', '职务_村民代表', '职务_青年团妇组织');"

if %errorlevel% neq 0 (
    echo 警告: sqlite3命令执行失败，可能未安装sqlite3命令行工具
    echo.
    echo 请手动执行以下SQL语句：
    echo DELETE FROM dictionaries WHERE category IN ('职务_支部委员会', '职务_村民委员会', '职务_集体经济组织理事会', '职务_集体经济组织监事会', '职务_村务监督委员会', '职务_村民小组长', '职务_村民代表', '职务_青年团妇组织');
    echo.
    pause
    exit /b %errorlevel%
)

echo 删除完成！
echo.
echo 检查剩余的职务相关数据：
sqlite3 app.db "SELECT category, COUNT(*) as count FROM dictionaries WHERE category LIKE '%职务%' GROUP BY category;"

echo.
echo 检查category为'职务'的数据：
sqlite3 app.db "SELECT COUNT(*) as count FROM dictionaries WHERE category = '职务';"

pause