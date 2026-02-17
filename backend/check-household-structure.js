const db = require('./db')

// 检查households表结构
function checkHouseholdStructure() {
  console.log('检查households表结构...')

  // 检查表结构
  db.all('PRAGMA table_info(households)', (err, columns) => {
    if (err) {
      console.error('查询表结构失败:', err.message)
      return
    }

    console.log('households表字段信息:')
    columns.forEach((col) => {
      console.log(
        `- ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.defaultValue ? 'DEFAULT ' + col.defaultValue : ''}`
      )
    })

    // 关闭数据库连接
    db.close()
  })
}

// 运行检查
checkHouseholdStructure()
