import sqlite3

# 连接数据库
conn = sqlite3.connect('app.db')
cursor = conn.cursor()

# 创建表
sql = '''CREATE TABLE IF NOT EXISTS event_reminders (
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
)'''

cursor.execute(sql)
print('event_reminders 表创建成功')

# 插入示例数据
sample_data = [
    ('meeting', '村委会例会', '2026-01-20', '14:00', '村委会会议室', '每月例行会议'),
    ('inspection', '安全生产检查', '2026-01-25', '09:00', '全村', '季度安全生产大检查'),
    ('training', '消防知识培训', '2026-01-30', '15:00', '村委会广场', '组织村民参加消防知识培训')
]

cursor.executemany('INSERT INTO event_reminders (event_type, title, event_date, event_time, location, description) VALUES (?, ?, ?, ?, ?, ?)', sample_data)
print('已插入 3 条示例数据')

# 查询验证
cursor.execute('SELECT id, event_type, title, event_date FROM event_reminders')
rows = cursor.fetchall()
print(f'\n当前共有 {len(rows)} 条事件提醒：')
for row in rows:
    print(f'  [{row[0]}] {row[1]}: {row[2]} - {row[3]}')

# 关闭连接
conn.commit()
conn.close()
print('\n✓ 操作完成')
