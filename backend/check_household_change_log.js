const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const dbPath = path.join(__dirname, 'app.db')
const db = new sqlite3.Database(dbPath)

console.log('检查household_change_log表...')

// 检查表是否存在
db.get(
  "SELECT name FROM sqlite_master WHERE type='table' AND name='household_change_log';",
  (err, table) => {
    if (err) {
      console.error('查询表失败:', err.message)
      db.close()
      return
    }

    if (table) {
      console.log('household_change_log表存在')

      // 检查表结构
      db.all('PRAGMA table_info(household_change_log);', (err, columns) => {
        if (err) {
          console.error('查询表结构失败:', err.message)
          db.close()
          return
        }

        console.log('表结构:')
        columns.forEach((column, index) => {
          console.log(
            `${index + 1}. ${column.name} (${column.type}) - ${column.notnull ? 'NOT NULL' : 'NULL'} ${column.pk ? 'PRIMARY KEY' : ''}`
          )
        })

        // 检查是否有数据
        db.get('SELECT COUNT(*) as count FROM household_change_log;', (err, result) => {
          if (err) {
            console.error('查询数据行数失败:', err.message)
            db.close()
            return
          }

          console.log(`表中数据行数: ${result.count}`)
          db.close()
        })
      })
    } else {
      console.log('household_change_log表不存在，需要创建')

      // 创建表
      const createSql = `
      CREATE TABLE household_change_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        resident_id INTEGER NOT NULL,
        change_type TEXT NOT NULL,
        change_date TEXT NOT NULL,
        change_reason TEXT,
        previous_status TEXT,
        new_status TEXT,
        operator TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (resident_id) REFERENCES residents (id)
      );
    `

      db.run(createSql, (err) => {
        if (err) {
          console.error('创建表失败:', err.message)
        } else {
          console.log('household_change_log表创建成功')
        }
        db.close()
      })
    }
  }
)
