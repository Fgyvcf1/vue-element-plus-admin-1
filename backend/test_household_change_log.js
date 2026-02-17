const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const dbPath = path.join(__dirname, 'app.db')
const db = new sqlite3.Database(dbPath)

console.log('测试household_change_log表功能...')

// 测试插入一条记录
const testInsert = () => {
  return new Promise((resolve, reject) => {
    const logSql = `INSERT INTO household_change_log 
                   (resident_id, change_type, change_date, change_reason, previous_status, new_status, created_at) 
                   VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`

    const logParams = [1, '迁入', '2024-01-01', '工作调动', 'non_active', 'active']

    db.run(logSql, logParams, function (err) {
      if (err) {
        console.error('插入记录失败:', err.message)
        reject(err)
      } else {
        console.log('插入记录成功，ID:', this.lastID)
        resolve(this.lastID)
      }
    })
  })
}

// 测试查询记录
const testSelect = (residentId) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM household_change_log WHERE resident_id = ? ORDER BY change_date DESC`

    db.all(sql, [residentId], (err, rows) => {
      if (err) {
        console.error('查询记录失败:', err.message)
        reject(err)
      } else {
        console.log(`查询到 ${rows.length} 条记录:`)
        rows.forEach((row, index) => {
          console.log(
            `${index + 1}. ID: ${row.id}, 类型: ${row.change_type}, 日期: ${row.change_date}, 原因: ${row.change_reason}`
          )
        })
        resolve(rows)
      }
    })
  })
}

// 运行测试
async function runTests() {
  try {
    console.log('1. 测试插入记录...')
    const logId = await testInsert()

    console.log('\n2. 测试查询记录...')
    await testSelect(1)

    console.log('\n3. 测试查询所有记录...')
    await new Promise((resolve, reject) => {
      const sql = `SELECT * FROM household_change_log ORDER BY created_at DESC LIMIT 10`
      db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err)
        } else {
          console.log(`查询到 ${rows.length} 条记录:`)
          rows.forEach((row, index) => {
            console.log(
              `${index + 1}. ID: ${row.id}, 居民ID: ${row.resident_id}, 类型: ${row.change_type}, 日期: ${row.change_date}`
            )
          })
          resolve()
        }
      })
    })

    console.log('\n测试完成！')
  } catch (error) {
    console.error('测试失败:', error.message)
  } finally {
    db.close()
  }
}

runTests()
