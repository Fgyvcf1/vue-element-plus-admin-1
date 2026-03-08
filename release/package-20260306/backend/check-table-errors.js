// 检查表的错误详情
const db = require('./db.js')

async function checkErrors() {
  try {
    console.log('=== 检查表修复错误详情 ===\n')

    const tables = [
      'mediation_archives',
      'mediation_applications',
      'mediation_applicants',
      'mediation_respondents'
    ]

    for (const table of tables) {
      console.log(`\n📋 表: ${table}`)
      console.log('---')

      try {
        // 检查id列当前状态
        const [columns] = await db.pool.execute(
          `
          SELECT COLUMN_NAME, DATA_TYPE, COLUMN_KEY, EXTRA, IS_NULLABLE, COLUMN_DEFAULT
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = 'village' 
          AND TABLE_NAME = ?
          AND COLUMN_NAME = 'id'
        `,
          [table]
        )

        if (columns.length > 0) {
          const col = columns[0]
          console.log(`数据类型: ${col.DATA_TYPE}`)
          console.log(`主键: ${col.COLUMN_KEY || '无'}`)
          console.log(`可空: ${col.IS_NULLABLE}`)
          console.log(`默认值: ${col.COLUMN_DEFAULT || '无'}`)
          console.log(`额外属性: ${col.EXTRA || '无'}`)

          // 检查是否有重复id
          const [duplicates] = await db.pool.execute(`
            SELECT id, COUNT(*) as count 
            FROM ${table} 
            GROUP BY id 
            HAVING count > 1
          `)

          if (duplicates.length > 0) {
            console.log(`⚠️ 发现 ${duplicates.length} 个重复id值`)
          }

          // 检查是否有null id
          const [nullIds] = await db.pool.execute(`
            SELECT COUNT(*) as count 
            FROM ${table} 
            WHERE id IS NULL
          `)

          if (nullIds[0].count > 0) {
            console.log(`⚠️ 发现 ${nullIds[0].count} 个null id值`)
          }

          // 检查表是否有数据
          const [count] = await db.pool.execute(`
            SELECT COUNT(*) as count FROM ${table}
          `)
          console.log(`表数据量: ${count[0].count} 条`)
        }
      } catch (err) {
        console.log(`检查失败: ${err.message}`)
      }
    }

    console.log('\n=== 检查完成 ===')
    process.exit(0)
  } catch (err) {
    console.error('检查失败:', err.message)
    process.exit(1)
  }
}

checkErrors()
