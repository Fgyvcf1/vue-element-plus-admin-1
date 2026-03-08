@echo off
echo 测试机构类型筛选功能...
echo.

if not exist "app.db" (
    echo 错误: 数据库文件 app.db 不存在!
    pause
    exit /b 1
)

echo 1. 检查数据库中的机构类型分布:
sqlite3 app.db "SELECT DISTINCT organization_type, organization_name, COUNT(*) as count FROM committee_members GROUP BY organization_type, organization_name;"

echo.
echo 2. 检查支部委员会数据:
sqlite3 app.db "SELECT COUNT(*) as count FROM committee_members WHERE organization_type = 'branch_committee';"

echo.
echo 3. 检查村民委员会数据:
sqlite3 app.db "SELECT COUNT(*) as count FROM committee_members WHERE organization_type = 'village_committee';"

echo.
echo 4. 查看 committee_members 表结构:
sqlite3 app.db "PRAGMA table_info(committee_members);"

echo.
echo 测试完成!
pause