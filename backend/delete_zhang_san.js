const sqlite3 = require('sqlite3').verbose()

// 打开数据库连接
const db = new sqlite3.Database('./app.db')

console.log('正在删除户主为张三的家庭信息及其成员...')

// 查询户主为张三的家庭ID
db.get('SELECT id FROM households WHERE household_head_name = ?', ['张三'], (err, household) => {
  if (err) {
    console.error('查询家庭失败:', err.message)
    db.close()
    return
  }

  if (!household) {
    console.log('未找到户主为张三的家庭')
    db.close()
    return
  }

  const householdId = household.id
  console.log(`找到家庭ID: ${householdId}`)

  // 删除该家庭的所有成员
  db.run('DELETE FROM residents WHERE household_id = ?', [householdId], function (err) {
    if (err) {
      console.error('删除成员失败:', err.message)
      db.close()
      return
    }
    console.log(`删除了 ${this.changes} 个成员`)

    // 删除户主信息
    db.run('DELETE FROM households WHERE id = ?', [householdId], function (err) {
      if (err) {
        console.error('删除户主失败:', err.message)
        db.close()
        return
      }
      console.log(`删除了1条户主信息`)

      console.log('删除完成！')
      db.close()
    })
  })
})
