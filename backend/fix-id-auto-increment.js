const db = require('./db')

async function fixTable() {
  try {
    console.log('正在修复 households 表的 id 字段...')

    // 修改 id 字段为自增主键
    await db.pool.execute(`
      ALTER TABLE households 
      MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY
    `)

    console.log('✓ 修复成功！id 字段已设置为自增主键')

    // 验证修改结果
    const [columns] = await db.pool.execute('DESCRIBE households')
    console.log('\n当前表结构:')
    columns.forEach((col) => {
      if (col.Field === 'id') {
        console.log(`  ${col.Field}: ${col.Type}, ${col.Null}, ${col.Key}, ${col.Extra}`)
      }
    })

    process.exit(0)
  } catch (err) {
    console.error('✗ 修复失败:', err.message)
    process.exit(1)
  }
}

fixTable()
