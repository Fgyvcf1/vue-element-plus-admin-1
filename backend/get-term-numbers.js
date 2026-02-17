const sqlite3 = require('sqlite3').verbose()
const path = require('path')

// 连接到SQLite数据库
const dbPath = path.join(__dirname, 'app.db')
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('连接数据库失败:', err.message)
    process.exit(1)
  }
  console.log('成功连接到SQLite数据库\n')
})

// 获取指定机构的届数列表
const orgType = process.argv[2] || 'branch_committee'

console.log(`========== 查询 ${orgType} 的届数 ==========\n`)

const sql = `
  SELECT DISTINCT term_number, term_start_date, term_end_date, status
  FROM committee_members
  WHERE organization_type = ?
  ORDER BY term_number DESC
`

db.all(sql, [orgType], (err, rows) => {
  if (err) {
    console.error('查询届数失败:', err.message)
    db.close()
    process.exit(1)
  }

  console.log(`共找到 ${rows.length} 届:\n`)

  rows.forEach((row, index) => {
    const statusText = row.status === 'current' ? '【现任】' : ''
    const endDateText = row.term_end_date ? ` - ${row.term_end_date}` : '【当前届】'

    console.log(`${index + 1}. 第${row.term_number}届 ${statusText}`)
    console.log(`   任期: ${row.term_start_date}${endDateText}\n`)
  })

  // 统计信息
  const currentTerms = rows.filter((r) => r.status === 'current').length
  const historyTerms = rows.filter((r) => r.status === 'history').length

  console.log('========== 统计信息 ==========')
  console.log(`总计: ${rows.length} 届`)
  console.log(`现任: ${currentTerms} 届`)
  console.log(`历届: ${historyTerms} 届`)

  db.close(() => {
    console.log('\n数据库连接已关闭')
  })
})
