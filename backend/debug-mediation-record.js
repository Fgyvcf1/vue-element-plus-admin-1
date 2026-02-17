const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const dbPath = path.join(__dirname, 'app.db')
const db = new sqlite3.Database(dbPath)

console.log('检查调解记录表结构...\n')

// 检查表结构
db.all('PRAGMA table_info(mediation_records)', (err, columns) => {
  if (err) {
    console.error('查询表结构失败:', err.message)
    process.exit(1)
  }

  console.log('mediation_records 表结构:')
  console.log('字段名\t\t\t\t类型\t\t非空\t主键')
  console.log(''.padEnd(80, '-'))
  columns.forEach((col) => {
    console.log(
      `${col.name.padEnd(32)}\t${col.type.padEnd(12)}\t${col.notnull ? '是' : '否'}\t${col.pk ? '是' : '否'}`
    )
  })

  // 查询一条记录
  console.log('\n\n查询ID=3的记录:')
  db.get('SELECT * FROM mediation_records WHERE id = 3', (err, row) => {
    if (err) {
      console.error('查询记录失败:', err.message)
    } else if (!row) {
      console.log('记录不存在')
    } else {
      console.log('记录存在:', JSON.stringify(row, null, 2))
    }

    db.close()
  })
})
