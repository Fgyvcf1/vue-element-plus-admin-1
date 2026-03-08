// 检查户编号
const db = require('./db.js')

async function checkHousehold() {
  try {
    console.log('=== 检查户编号 HH1768129452565 ===\n')

    const [households] = await db.pool.execute(
      `
      SELECT * FROM households WHERE household_number = ?
    `,
      ['HH1768129452565']
    )

    if (households.length === 0) {
      console.log('未找到该户编号')
    } else {
      console.log('找到记录:')
      households.forEach((h) => {
        console.log('  户编号:', h.household_number)
        console.log('  户主:', h.household_head_name)
        console.log('  状态:', h.status)
        console.log('')
      })
    }

    // 检查所有 households 记录数
    const [count] = await db.pool.execute('SELECT COUNT(*) as count FROM households')
    console.log('households 表总记录数:', count[0].count)

    console.log('\n=== 检查完成 ===')
    process.exit(0)
  } catch (err) {
    console.error('检查失败:', err.message)
    process.exit(1)
  }
}

checkHousehold()
