@echo off
chcp 65001 >nul
echo ========================================
echo 创建 event_reminders 表
echo ========================================
echo.
cd /d "%~dp0"
sqlite3 app.db <<EOF
CREATE TABLE IF NOT EXISTS event_reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  event_date TEXT NOT NULL,
  event_time TEXT,
  location TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
EOF

echo.
echo 执行完成，检查表是否创建成功...
sqlite3 app.db "SELECT '✓ event_reminders 表存在' FROM sqlite_master WHERE type='table' AND name='event_reminders';"
echo.
echo 插入示例数据...
sqlite3 app.db "INSERT INTO event_reminders (event_type, title, event_date, event_time, location, description) VALUES ('meeting', '村委会例会', '2026-01-20', '14:00', '村委会会议室', '每月例行会议'), ('inspection', '安全生产检查', '2026-01-25', '09:00', '全村', '季度安全生产大检查'), ('training', '消防知识培训', '2026-01-30', '15:00', '村委会广场', '组织村民参加消防知识培训');"
echo.
echo ✓ 已插入示例数据
echo.
echo 查询数据...
sqlite3 app.db "SELECT id, event_type, title, event_date FROM event_reminders;"
echo.
pause
