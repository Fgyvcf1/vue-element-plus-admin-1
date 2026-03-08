@echo off
cd /d "%~dp0"
node -e "const sqlite3=require('sqlite3').verbose();const db=new sqlite3.Database('app.db');const sql='CREATE TABLE IF NOT EXISTS event_reminders (id INTEGER PRIMARY KEY AUTOINCREMENT, event_type TEXT NOT NULL, title TEXT NOT NULL, event_date TEXT NOT NULL, event_time TEXT, location TEXT, description TEXT, status TEXT NOT NULL DEFAULT ''pending'', created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)';db.run(sql,function(err){if(err){console.error('创建表失败:',err.message);process.exit(1);}console.log('event_reminders 表创建成功');db.close();});"
pause
