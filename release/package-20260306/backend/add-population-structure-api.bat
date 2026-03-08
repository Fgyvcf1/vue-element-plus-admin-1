@echo off
echo 正在添加人口结构统计API...

cd /d D:\vue-element-admin-master\backend

:: 添加API到routes.js
echo // 获取人口结构统计>> routes.js
echo router.get('/population-structure', (req, res) => {>> routes.js
echo   console.log('获取人口结构统计...');>> routes.js
echo.>> routes.js
echo   // 按年龄段分组查询居民数据>> routes.js
echo   db.all(`>> routes.js
echo     SELECT >> routes.js
echo       CASE>> routes.js
echo         WHEN age < 7 THEN '0-6岁'>> routes.js
echo         WHEN age BETWEEN 7 AND 17 THEN '7-17岁'>> routes.js
echo         WHEN age BETWEEN 18 AND 59 THEN '18-59岁'>> routes.js
echo         WHEN age BETWEEN 60 AND 69 THEN '60-69岁'>> routes.js
echo         WHEN age BETWEEN 70 AND 79 THEN '70-79岁'>> routes.js
echo         WHEN age BETWEEN 80 AND 89 THEN '80-89岁'>> routes.js
echo         WHEN age BETWEEN 90 AND 99 THEN '90-99岁'>> routes.js
echo         ELSE '100岁以上'>> routes.js
echo       END as ageGroup,>> routes.js
echo       COUNT(*) as count>> routes.js
echo     FROM residents>> routes.js
echo     WHERE status = 'active'>> routes.js
echo     GROUP BY >> routes.js
echo       CASE>> routes.js
echo         WHEN age < 7 THEN '0-6岁'>> routes.js
echo         WHEN age BETWEEN 7 AND 17 THEN '7-17岁'>> routes.js
echo         WHEN age BETWEEN 18 AND 59 THEN '18-59岁'>> routes.js
echo         WHEN age BETWEEN 60 AND 69 THEN '60-69岁'>> routes.js
echo         WHEN age BETWEEN 70 AND 79 THEN '70-79岁'>> routes.js
echo         WHEN age BETWEEN 80 AND 89 THEN '80-89岁'>> routes.js
echo         WHEN age BETWEEN 90 AND 99 THEN '90-99岁'>> routes.js
echo         ELSE '100岁以上'>> routes.js
echo       END>> routes.js
echo     ORDER BY >> routes.js
echo       CASE>> routes.js
echo         WHEN age < 7 THEN 0>> routes.js
echo         WHEN age BETWEEN 7 AND 17 THEN 1>> routes.js
echo         WHEN age BETWEEN 18 AND 59 THEN 2>> routes.js
echo         WHEN age BETWEEN 60 AND 69 THEN 3>> routes.js
echo         WHEN age BETWEEN 70 AND 79 THEN 4>> routes.js
echo         WHEN age BETWEEN 80 AND 89 THEN 5>> routes.js
echo         WHEN age BETWEEN 90 AND 99 THEN 6>> routes.js
echo         ELSE 7>> routes.js
echo       END>> routes.js
echo   `, (err, rows) => {>> routes.js
echo     if (err) {>> routes.js
echo       console.error('查询人口结构统计失败:', err.message);>> routes.js
echo       res.status(500).json({ code: 500, message: '查询人口结构统计失败' });>> routes.js
echo       return;>> routes.js
echo     }>> routes.js
echo.>> routes.js
echo     // 确保所有年龄段都存在，即使数量为0>> routes.js
echo     const allAgeGroups = [>> routes.js
echo       { ageGroup: '0-6岁', count: 0 },>> routes.js
echo       { ageGroup: '7-17岁', count: 0 },>> routes.js
echo       { ageGroup: '18-59岁', count: 0 },>> routes.js
echo       { ageGroup: '60-69岁', count: 0 },>> routes.js
echo       { ageGroup: '70-79岁', count: 0 },>> routes.js
echo       { ageGroup: '80-89岁', count: 0 },>> routes.js
echo       { ageGroup: '90-99岁', count: 0 },>> routes.js
echo       { ageGroup: '100岁以上', count: 0 }>> routes.js
echo     ];>> routes.js
echo.>> routes.js
echo     // 合并查询结果>> routes.js
echo     rows.forEach(row => {>> routes.js
echo       const existingGroup = allAgeGroups.find(g => g.ageGroup === row.ageGroup);>> routes.js
echo       if (existingGroup) {>> routes.js
echo         existingGroup.count = row.count;>> routes.js
echo       }>> routes.js
echo     });>> routes.js
echo.>> routes.js
echo     res.json({>> routes.js
echo       code: 20000,>> routes.js
echo       success: true,>> routes.js
echo       message: '获取人口结构统计成功',>> routes.js
echo       data: allAgeGroups>> routes.js
echo     });>> routes.js
echo   });>> routes.js
echo });>> routes.js

echo API添加完成！
echo.
echo 按任意键退出...
pause > nul