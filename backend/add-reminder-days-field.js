const sqlite3 = require('sqlite3').verbose()
const path = require('path')

// 数据库文件路径
const dbPath = path.join(__dirname, 'app.db')

// 连接数据库
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message)
    process.exit(1)
  }
  console.log('已连接到数据库')
})

// 检查并添加reminder_days字段
db.get('PRAGMA table_info(reminder_rules)', (err, columns) => {
  if (err) {
    console.error('查询表结构失败:', err.message)
    db.close()
    process.exit(1)
  }

  // 检查是否已存在reminder_days字段
  const hasReminderDaysField = columns.some((col) => col.name === 'reminder_days')

  if (hasReminderDaysField) {
    console.log('reminder_days 字段已存在，无需添加')
    db.close()
    process.exit(0)
  }

  // 添加reminder_days字段
  const sql = 'ALTER TABLE reminder_rules ADD COLUMN reminder_days INTEGER DEFAULT 0'

  db.run(sql, (err) => {
    if (err) {
      console.error('添加字段失败:', err.message)
      db.close()
      process.exit(1)
    }

    console.log('成功添加 reminder_days 字段到 reminder_rules 表')

    // 更新现有记录的reminder_days值为30天（作为示例）
    db.run(
      "UPDATE reminder_rules SET reminder_days = 30 WHERE reminder_days = 0 AND rule_type = 'age'",
      (err) => {
        if (err) {
          console.error('更新数据失败:', err.message)
        } else {
          console.log('已将现有年龄提醒规则的提前提醒天数设置为30天')
        }

        db.close((err) => {
          if (err) {
            console.error('关闭数据库失败:', err.message)
          } else {
            console.log('数据库连接已关闭')
          }
          process.exit(0)
        })
      }
    )
  })
})
