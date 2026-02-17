// 检查表的约束和外键
const db = require('./db.js')

async function checkConstraints() {
  try {
    console.log('=== 检查表的约束和外键 ===\n')

    const tables = [
      'mediation_archives',
      'mediation_applications',
      'mediation_applicants',
      'mediation_respondents',
      'mediation_records'
    ]

    for (const table of tables) {
      console.log(`\n📋 表: ${table}`)
      console.log('---')

      try {
        // 检查主键
        const [pk] = await db.pool.execute(
          `
          SELECT COLUMN_NAME, CONSTRAINT_NAME
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
          WHERE TABLE_SCHEMA = 'village'
          AND TABLE_NAME = ?
          AND CONSTRAINT_NAME = 'PRIMARY'
        `,
          [table]
        )

        if (pk.length > 0) {
          console.log(`主键: ${pk.map((p) => p.COLUMN_NAME).join(', ')}`)
        } else {
          console.log('主键: 无')
        }

        // 检查外键
        const [fk] = await db.pool.execute(
          `
          SELECT COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
          WHERE TABLE_SCHEMA = 'village'
          AND TABLE_NAME = ?
          AND REFERENCED_TABLE_NAME IS NOT NULL
        `,
          [table]
        )

        if (fk.length > 0) {
          console.log('外键:')
          fk.forEach((f) => {
            console.log(
              `  - ${f.COLUMN_NAME} -> ${f.REFERENCED_TABLE_NAME}(${f.REFERENCED_COLUMN_NAME})`
            )
          })
        } else {
          console.log('外键: 无')
        }

        // 检查索引
        const [indexes] = await db.pool.execute(
          `
          SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE
          FROM INFORMATION_SCHEMA.STATISTICS
          WHERE TABLE_SCHEMA = 'village'
          AND TABLE_NAME = ?
        `,
          [table]
        )

        if (indexes.length > 0) {
          console.log('索引:')
          indexes.forEach((idx) => {
            const unique = idx.NON_UNIQUE === 0 ? 'UNIQUE' : ''
            console.log(`  - ${idx.INDEX_NAME}: ${idx.COLUMN_NAME} ${unique}`)
          })
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

checkConstraints()
