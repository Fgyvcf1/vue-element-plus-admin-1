const db = require('./db')

// 查询易泽美的低保信息
const query = `SELECT 
                r.name, 
                l.id AS low_income_id,
                l.status,
                p.account_name,
                p.bank_name,
                p.bank_account,
                p.start_date,
                p.end_date
              FROM 
                residents r
              JOIN 
                low_income_persons l ON r.id = l.resident_id
              LEFT JOIN 
                low_income_policy_records p ON l.id = p.low_income_person_id
              WHERE 
                r.name = '易泽美' 
              ORDER BY 
                p.created_at DESC
              LIMIT 10;
`

db.all(query, [], (err, rows) => {
  if (err) {
    console.error('查询失败:', err.message)
    process.exit(1)
  }

  if (rows.length === 0) {
    console.log('未找到易泽美的低保信息')
  } else {
    console.log('易泽美的低保信息:')
    console.log('='.repeat(60))
    rows.forEach((row, index) => {
      console.log(`记录 ${index + 1}:`)
      console.log(`  姓名: ${row.name}`)
      console.log(`  低保ID: ${row.low_income_id}`)
      console.log(`  状态: ${row.status}`)
      console.log(`  账户名称: ${row.account_name || '未填写'}`)
      console.log(`  银行名称: ${row.bank_name || '未填写'}`)
      console.log(`  银行账户: ${row.bank_account || '未填写'}`)
      console.log(`  开始日期: ${row.start_date || '未填写'}`)
      console.log(`  结束日期: ${row.end_date || '未填写'}`)
      console.log('-'.repeat(60))
    })
  }

  // 关闭数据库连接
  db.close()
})
