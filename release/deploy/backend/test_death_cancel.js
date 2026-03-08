const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const dbPath = path.join(__dirname, 'app.db')
const db = new sqlite3.Database(dbPath)

console.log('测试死亡注销功能...')

// 测试插入死亡注销记录
const testDeathCancel = (residentId, deathDate) => {
  return new Promise((resolve, reject) => {
    // 首先更新居民状态为死亡
    const updateSql = `UPDATE residents SET status = 'deceased' WHERE id = ?`

    db.run(updateSql, [residentId], function (err) {
      if (err) {
        console.error('更新居民状态失败:', err.message)
        reject(err)
        return
      }

      // 然后向变动记录表中插入死亡注销记录
      const logSql = `INSERT INTO household_change_log 
                     (resident_id, change_type, change_date, change_reason, previous_status, new_status, created_at) 
                     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`

      const logParams = [residentId, '死亡注销', deathDate, '', 'active', 'deceased']

      db.run(logSql, logParams, function (err) {
        if (err) {
          console.error('记录死亡注销失败:', err.message)
          reject(err)
        } else {
          console.log('死亡注销记录成功，ID:', this.lastID)
          resolve(this.lastID)
        }
      })
    })
  })
}

// 测试查询死亡注销记录
const testSelectDeathLogs = (residentId) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM household_change_log WHERE resident_id = ? AND change_type = '死亡注销' ORDER BY change_date DESC`

    db.all(sql, [residentId], (err, rows) => {
      if (err) {
        console.error('查询死亡注销记录失败:', err.message)
        reject(err)
      } else {
        console.log(`查询到 ${rows.length} 条死亡注销记录:`)
        rows.forEach((row, index) => {
          console.log(
            `${index + 1}. ID: ${row.id}, 日期: ${row.change_date}, 原因: ${row.change_reason || '无'}`
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
    console.log('1. 测试死亡注销（无死亡事由）...')
    const deathDate = new Date().toISOString().slice(0, 10)
    const logId = await testDeathCancel(1, deathDate)

    console.log('\n2. 测试查询死亡注销记录...')
    await testSelectDeathLogs(1)

    console.log('\n3. 测试查询居民状态...')
    await new Promise((resolve, reject) => {
      const sql = `SELECT id, name, status FROM residents WHERE id = ?`
      db.get(sql, [1], (err, row) => {
        if (err) {
          reject(err)
        } else {
          console.log(`居民状态: ID=${row.id}, 姓名=${row.name}, 状态=${row.status}`)
          resolve()
        }
      })
    })

    console.log('\n测试完成！死亡注销功能正常工作，不需要死亡事由。')
  } catch (error) {
    console.error('测试失败:', error.message)
  } finally {
    db.close()
  }
}

runTests()
