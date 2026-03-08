// 检查档案状态
const db = require('./db.js')

async function checkStatus() {
  try {
    console.log('=== 检查档案状态 ===\n')

    const [archives] = await db.pool.execute(`
      SELECT archive_id, status, prefix, sequence_number, created_at
      FROM mediation_archives
      ORDER BY created_at DESC
      LIMIT 10
    `)

    console.log('最近10条档案:')
    archives.forEach((row) => {
      console.log(`  档案号: ${row.archive_id}, 状态: ${row.status}, 前缀: ${row.prefix}`)
    })

    // 检查是否有协议记录
    const [withAgreement] = await db.pool.execute(`
      SELECT a.archive_id, a.status, m.agreement_date
      FROM mediation_archives a
      INNER JOIN mediation_agreements m ON a.archive_id = m.archive_id
      ORDER BY m.agreement_date DESC
      LIMIT 5
    `)

    console.log('\n有协议的档案:')
    withAgreement.forEach((row) => {
      console.log(
        `  档案号: ${row.archive_id}, 状态: ${row.status}, 协议日期: ${row.agreement_date}`
      )
    })

    console.log('\n=== 检查完成 ===')
    process.exit(0)
  } catch (err) {
    console.error('检查失败:', err.message)
    process.exit(1)
  }
}

checkStatus()
