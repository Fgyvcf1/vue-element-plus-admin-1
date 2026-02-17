const sqlite3 = require('sqlite3').verbose()

// 打开数据库连接
const db = new sqlite3.Database('./app.db')

console.log('查询所有家庭信息...')

// 查询所有家庭信息
db.all(
  'SELECT id, household_head_name, household_number, address FROM households',
  [],
  (err, rows) => {
    if (err) {
      console.error('查询家庭失败:', err.message)
      db.close()
      return
    }

    console.log(`共找到 ${rows.length} 个家庭:`)
    rows.forEach((row) => {
      console.log(
        `ID: ${row.id}, 户主: ${row.household_head_name}, 户号: ${row.household_number}, 地址: ${row.address}`
      )
    })

    // 查询所有居民信息
    db.all('SELECT id, name, household_id FROM residents', [], (err, residents) => {
      if (err) {
        console.error('查询居民失败:', err.message)
        db.close()
        return
      }

      console.log(`\n共找到 ${residents.length} 个居民:`)
      residents.forEach((resident) => {
        console.log(`ID: ${resident.id}, 姓名: ${resident.name}, 家庭ID: ${resident.household_id}`)
      })

      db.close()
    })
  }
)
