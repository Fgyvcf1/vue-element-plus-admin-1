const db = require('./db')

console.log('检查档案管理相关的数据库表...')

// 查询所有表名
const sql = `SELECT name FROM sqlite_master WHERE type='table' AND (name LIKE '%mediation%' OR name LIKE '%archive%') ORDER BY name`

db.all(sql, [], (err, rows) => {
  if (err) {
    console.error('查询表失败:', err.message)
    db.close()
    return
  }

  console.log('档案管理相关表:')
  console.log('-'.repeat(40))
  if (rows.length === 0) {
    console.log('没有找到档案管理相关的表')
  } else {
    rows.forEach((row) => {
      console.log('-', row.name)
    })
  }
  console.log('-'.repeat(40))
  console.log(`共找到 ${rows.length} 个相关表`)

  // 关闭数据库连接
  db.close()
})
