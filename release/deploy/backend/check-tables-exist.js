// 检查调解相关表是否存在及结构
const db = require('./db.js')

async function checkTables() {
  try {
    console.log('=== 检查表是否存在及结构 ===\n')

    const tables = [
      'mediation_archives',
      'mediation_applications',
      'mediation_applicants',
      'mediation_respondents',
      'mediation_records',
      'mediation_agreements',
      'archive_attachments',
      'archive_sequences'
    ]

    for (const table of tables) {
      try {
        // 检查表是否存在
        const [exists] = await db.pool.execute(
          `
          SELECT TABLE_NAME 
          FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_SCHEMA = 'village' 
          AND TABLE_NAME = ?
        `,
          [table]
        )

        if (exists.length === 0) {
          console.log(`❌ ${table}: 表不存在`)
          continue
        }

        // 获取表结构
        const [columns] = await db.pool.execute(
          `
          SELECT COLUMN_NAME, DATA_TYPE, COLUMN_KEY, EXTRA, IS_NULLABLE
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = 'village' 
          AND TABLE_NAME = ?
          AND COLUMN_NAME = 'id'
        `,
          [table]
        )

        if (columns.length > 0) {
          const col = columns[0]
          console.log(`✅ ${table}:`)
          console.log(`   数据类型: ${col.DATA_TYPE}`)
          console.log(`   主键: ${col.COLUMN_KEY}`)
          console.log(`   可空: ${col.IS_NULLABLE}`)
          console.log(`   额外属性: ${col.EXTRA || '无'}`)
        } else {
          console.log(`❌ ${table}: 没有id列`)
        }
      } catch (err) {
        console.log(`❌ ${table}: 检查失败 - ${err.message}`)
      }
      console.log('')
    }

    console.log('=== 检查完成 ===')
    process.exit(0)
  } catch (err) {
    console.error('检查失败:', err.message)
    process.exit(1)
  }
}

checkTables()
