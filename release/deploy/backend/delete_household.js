const sqlite3 = require('sqlite3').verbose()

// 打开数据库连接
const db = new sqlite3.Database('./app.db', (err) => {
  if (err) {
    console.error('连接数据库失败:', err.message)
  } else {
    console.log('成功连接到SQLite数据库')
  }
})

// 删除户主为张三的户主信息及其成员
const deleteHousehold = () => {
  // 开始事务
  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      console.error('开始事务失败:', err.message)
      return
    }

    // 1. 查询户主为张三的家庭ID
    db.get(
      'SELECT id FROM households WHERE household_head_name = ?',
      ['张三'],
      (err, household) => {
        if (err) {
          console.error('查询家庭失败:', err.message)
          db.run('ROLLBACK')
          return
        }

        if (!household) {
          console.log('未找到户主为张三的家庭')
          db.run('ROLLBACK')
          return
        }

        const householdId = household.id
        console.log(`找到户主为张三的家庭，家庭ID: ${householdId}`)

        // 2. 删除该家庭的所有成员
        db.run('DELETE FROM residents WHERE household_id = ?', [householdId], function (err) {
          if (err) {
            console.error('删除家庭成员失败:', err.message)
            db.run('ROLLBACK')
            return
          }
          console.log(`成功删除 ${this.changes} 个家庭成员`)

          // 3. 删除户主信息
          db.run('DELETE FROM households WHERE id = ?', [householdId], function (err) {
            if (err) {
              console.error('删除户主信息失败:', err.message)
              db.run('ROLLBACK')
              return
            }
            console.log(`成功删除户主信息，家庭ID: ${householdId}`)

            // 提交事务
            db.run('COMMIT', (err) => {
              if (err) {
                console.error('提交事务失败:', err.message)
              } else {
                console.log('删除操作完成，所有数据已成功删除')
              }
              // 关闭数据库连接
              db.close((err) => {
                if (err) {
                  console.error('关闭数据库失败:', err.message)
                } else {
                  console.log('数据库连接已关闭')
                }
              })
            })
          })
        })
      }
    )
  })
}

// 执行删除操作
deleteHousehold()
