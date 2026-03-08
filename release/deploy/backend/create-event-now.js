const sqlite3 = require('sqlite3').verbose()
const path = require('path')

console.log('开始创建 event_reminders 表...')

const dbPath = path.join(__dirname, 'app.db')
console.log('数据库路径:', dbPath)

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('连接数据库失败:', err.message)
    process.exit(1)
  }

  console.log('数据库连接成功')

  const sql = `CREATE TABLE IF NOT EXISTS event_reminders (
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
  )`

  db.run(sql, (err) => {
    if (err) {
      console.error('创建表失败:', err.message)
      process.exit(1)
    }

    console.log('✓ event_reminders 表创建成功')

    // 插入示例数据
    const insertSql = `INSERT INTO event_reminders (event_type, title, event_date, event_time, location, description) VALUES
      ('meeting', '村委会例会', '2026-01-20', '14:00', '村委会会议室', '每月例行会议'),
      ('inspection', '安全生产检查', '2026-01-25', '09:00', '全村', '季度安全生产大检查'),
      ('training', '消防知识培训', '2026-01-30', '15:00', '村委会广场', '组织村民参加消防知识培训')`

    db.run(insertSql, function (err) {
      if (err) {
        console.error('插入示例数据失败:', err.message)
      } else {
        console.log('✓ 已插入 3 条示例数据')

        // 查询验证
        db.all('SELECT id, event_type, title, event_date FROM event_reminders', (err, rows) => {
          if (err) {
            console.error('查询失败:', err.message)
          } else {
            console.log(`\n当前共有 ${rows.length} 条事件提醒：`)
            rows.forEach((r) => {
              console.log(`  [${r.id}] ${r.event_type}: ${r.title} - ${r.event_date}`)
            })
          }
          db.close()
          console.log('\n✓ 操作完成，数据库连接已关闭')
        })
      }
    })
  })
})
