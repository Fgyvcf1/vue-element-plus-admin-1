const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接数据库
const dbPath = path.join(__dirname, 'app.db');
const db = new sqlite3.Database(dbPath);

console.log('正在创建 event_reminders 表...');

// 创建事件提醒表
const createEventRemindersTable = `
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
`;

db.run(createEventRemindersTable, (err) => {
  if (err) {
    console.error('创建 event_reminders 表失败:', err.message);
    process.exit(1);
  }

  console.log('✓ event_reminders 表创建成功');

  // 检查表结构
  db.all("PRAGMA table_info(event_reminders)", (err, columns) => {
    if (err) {
      console.error('查询表结构失败:', err.message);
      process.exit(1);
    }

    console.log('\nevent_reminders 表结构:');
    columns.forEach(col => {
      console.log(`  - ${col.name}: ${col.type}`);
    });

    console.log('\n✓ 表结构检查完成');

    // 插入示例数据（可选）
    const insertSampleData = `
      INSERT OR IGNORE INTO event_reminders
      (event_type, title, event_date, event_time, location, description, status)
      VALUES
      ('meeting', '村委会例会', '2026-01-20', '14:00', '村委会会议室', '每月例行会议，讨论本月工作安排', 'pending'),
      ('inspection', '安全生产检查', '2026-01-25', '09:00', '全村', '季度安全生产大检查', 'pending'),
      ('training', '消防知识培训', '2026-01-30', '15:00', '村委会广场', '组织村民参加消防知识培训', 'pending')
    `;

    db.run(insertSampleData, function(err) {
      if (err) {
        console.error('插入示例数据失败:', err.message);
      } else {
        console.log('\n✓ 已插入 3 条示例数据');
      }

      // 查询数据
      db.all("SELECT * FROM event_reminders", (err, rows) => {
        if (err) {
          console.error('查询数据失败:', err.message);
        } else {
          console.log(`\nevent_reminders 表中当前有 ${rows.length} 条记录`);
          if (rows.length > 0) {
            console.log('\n数据列表:');
            rows.forEach(row => {
              console.log(`  [${row.id}] ${getEventTypeName(row.event_type)}: ${row.title} - ${row.event_date} ${row.event_time || ''}`);
            });
          }
        }

        db.close();
        console.log('\n✓ 数据库连接已关闭');
        console.log('\n========================================');
        console.log('event_reminders 表创建完成！');
        console.log('========================================');
      });
    });
  });
});

// 辅助函数
function getEventTypeName(type) {
  const typeMap = {
    'meeting': '会议',
    'inspection': '检查',
    'training': '培训',
    'other': '其他'
  };
  return typeMap[type] || type;
}
