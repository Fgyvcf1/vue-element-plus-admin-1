// 检查户主状态分布
const db = require('./db.js')

async function checkStatus() {
  try {
    console.log('=== 检查户主状态分布 ===\n')

    // 检查 households 表中所有户主
    const [allHouseholds] = await db.pool.execute(`
      SELECT status, COUNT(*) as count 
      FROM households 
      GROUP BY status
    `)

    console.log('households 表状态分布:')
    allHouseholds.forEach((row) => {
      console.log(`  ${row.status}: ${row.count}`)
    })

    // 检查 residents 表中 relationship_to_head = '本人' 或 '户主' 的居民状态
    const [residentStatus] = await db.pool.execute(`
      SELECT r.status, COUNT(*) as count 
      FROM residents r
      WHERE r.relationship_to_head IN ('本人', '户主')
      GROUP BY r.status
    `)

    console.log('\nresidents 表中户主的状态分布:')
    residentStatus.forEach((row) => {
      console.log(`  ${row.status}: ${row.count}`)
    })

    // 检查关联后的数量
    const [joinedCount] = await db.pool.execute(`
      SELECT COUNT(*) as count 
      FROM residents r
      LEFT JOIN households h ON r.household_id = h.household_number
      WHERE r.relationship_to_head IN ('本人', '户主')
      AND r.status = 'active'
      AND h.status = 'active'
    `)

    console.log(
      `\n关联查询后（r.status='active' AND h.status='active'）的户主数量: ${joinedCount[0].count}`
    )

    console.log('\n=== 检查完成 ===')
    process.exit(0)
  } catch (err) {
    console.error('检查失败:', err.message)
    process.exit(1)
  }
}

checkStatus()
