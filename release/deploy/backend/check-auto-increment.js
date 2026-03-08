// 检查表自增ID状态
const db = require('./db.js')

async function checkTables() {
  try {
    console.log('=== 检查表自增ID状态 ===\n')

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
      const [rows] = await db.pool.execute(
        `
        SELECT COLUMN_NAME, COLUMN_DEFAULT, EXTRA 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'village' 
        AND TABLE_NAME = ? 
        AND COLUMN_NAME = 'id'
      `,
        [table]
      )

      if (rows.length > 0) {
        const col = rows[0]
        const isAutoIncrement = col.EXTRA.includes('auto_increment')
        console.log(`${isAutoIncrement ? '✅' : '❌'} ${table}: ${col.EXTRA}`)
      } else {
        console.log(`❌ ${table}: 未找到id列`)
      }
    }

    console.log('\n=== 检查完成 ===')
    process.exit(0)
  } catch (err) {
    console.error('检查失败:', err.message)
    process.exit(1)
  }
}

checkTables()
