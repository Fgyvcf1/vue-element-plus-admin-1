// 检查 committee_members 表结构
const db = require('./db.js')

async function checkTable() {
  try {
    console.log('=== 检查 committee_members 表结构 ===\n')

    // 检查表是否存在
    const [tables] = await db.pool.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'village' 
      AND TABLE_NAME = 'committee_members'
    `)

    if (tables.length === 0) {
      console.log('❌ committee_members 表不存在')
      return
    }

    console.log('✅ committee_members 表存在')

    // 获取表结构
    const [columns] = await db.pool.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_KEY, EXTRA, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'village' 
      AND TABLE_NAME = 'committee_members'
    `)

    console.log('\n表结构:')
    columns.forEach((col) => {
      console.log(`  ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.COLUMN_KEY} ${col.EXTRA}`)
    })

    // 检查是否有数据
    const [count] = await db.pool.execute('SELECT COUNT(*) as count FROM committee_members')
    console.log(`\n表数据量: ${count[0].count} 条`)

    console.log('\n=== 检查完成 ===')
    process.exit(0)
  } catch (err) {
    console.error('检查失败:', err.message)
    process.exit(1)
  }
}

checkTable()
