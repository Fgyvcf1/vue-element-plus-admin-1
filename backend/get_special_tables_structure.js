const sqlite3 = require('sqlite3').verbose()

// 连接到database.sqlite数据库
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('连接database.sqlite数据库失败:', err.message)
  } else {
    console.log('成功连接到database.sqlite数据库')
  }
})

// 获取表结构的函数
function getTableStructure(tableName) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
      if (err) {
        reject(err)
        return
      }

      console.log(`\n=== ${tableName} 表结构 ===`)
      columns.forEach((col) => {
        console.log(
          `${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`
        )
      })

      // 获取表的创建语句
      db.get(
        `SELECT sql FROM sqlite_master WHERE type='table' AND name='${tableName}'`,
        (err, row) => {
          if (err) {
            reject(err)
            return
          }
          console.log(`\n创建语句: ${row.sql}`)
          resolve(row.sql)
        }
      )
    })
  })
}

// 批量获取特殊人群相关表的结构
async function getSpecialTablesStructure() {
  try {
    const tables = ['disabled_persons', 'low_income_persons', 'low_income_policy_records']
    for (const table of tables) {
      await getTableStructure(table)
    }
  } catch (err) {
    console.error('获取表结构失败:', err.message)
  } finally {
    db.close()
  }
}

getSpecialTablesStructure()
