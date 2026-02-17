const db = require('./db')

console.log('=== 检查通知表结构和数据 ===')

// 检查表是否存在
db.all('PRAGMA table_info(notifications)', (err, columns) => {
  if (err) {
    console.error('查询通知表结构失败:', err.message)
    return
  }

  if (!columns || columns.length === 0) {
    console.error('通知表不存在')
    return
  }

  console.log('通知表结构:')
  columns.forEach((col) => {
    console.log(`- ${col.name} (${col.type})`)
  })

  // 查询通知数据
  db.all('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10', (err, rows) => {
    if (err) {
      console.error('查询通知数据失败:', err.message)
      return
    }

    console.log(`\n查询到 ${rows.length} 条通知:`)
    rows.forEach((row) => {
      console.log(
        `- ID: ${row.id}, 标题: ${row.title}, 类型: ${row.type}, 状态: ${row.status}, 创建时间: ${row.created_at}`
      )
    })

    if (rows.length === 0) {
      console.log('数据库中暂无通知数据')
    }
  })
})
