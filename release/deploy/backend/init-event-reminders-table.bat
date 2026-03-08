@echo off
chcp 65001 >nul
echo ========================================
echo 创建 event_reminders 表
echo ========================================
echo.
echo 正在执行 Node.js 脚本...
cd /d "%~dp0"
node -e "const sqlite3=require('sqlite3').verbose();const db=new sqlite3.Database('app.db',function(err){if(err){console.error('连接失败:',err.message);process.exit(1);}console.log('连接成功');const sql='CREATE TABLE IF NOT EXISTS event_reminders (id INTEGER PRIMARY KEY AUTOINCREMENT, event_type TEXT NOT NULL, title TEXT NOT NULL, event_date TEXT NOT NULL, event_time TEXT, location TEXT, description TEXT, status TEXT NOT NULL DEFAULT \x22pending\x22, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)';db.run(sql,function(err){if(err){console.error('创建表失败:',err.message);process.exit(1);}console.log('✓ event_reminders 表创建成功');const insertSql='INSERT INTO event_reminders (event_type,title,event_date,event_time,location,description) VALUES (\x22meeting\x22,\x22村委会例会\x22,\x222026-01-20\x22,\x2214:00\x22,\x22村委会会议室\x22,\x22每月例行会议\x22),(\x22inspection\x22,\x22安全生产检查\x22,\x222026-01-25\x22,\x2209:00\x22,\x22全村\x22,\x22季度安全生产大检查\x22),(\x22training\x22,\x22消防知识培训\x22,\x222026-01-30\x22,\x2215:00\x22,\x22村委会广场\x22,\x22组织村民参加消防知识培训\x22)';db.run(insertSql,function(err){if(err){console.error('插入示例数据失败:',err.message);}else{console.log('✓ 已插入 3 条示例数据');db.all(\x22SELECT id,event_type,title,event_date FROM event_reminders\x22,function(err,rows){if(err){console.error('查询失败:',err.message);}else{console.log(\x27\n当前共有 \x27+rows.length+\x27 条事件提醒:\x27);rows.forEach(function(r){console.log(\x27  [\x27+r.id+\x27] \x27+r.event_type+\x27: \x27+r.title+\x27 - \x27+r.event_date);});}db.close();console.log(\x27\n✓ 操作完成\x27);}});});"
echo.
pause
