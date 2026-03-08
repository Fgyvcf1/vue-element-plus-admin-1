const db = require('./db')

console.log('检查档案管理相关表的结构...')

// 要检查的表名
const tablesToCheck = [
  'archive_attachments',
  'archive_sequences',
  'mediation_agreements',
  'mediation_applicants',
  'mediation_applications',
  'mediation_archives',
  'mediation_records',
  'mediation_respondents'
]

// 检查单个表的结构
function checkTableStructure(tableName) {
  return new Promise((resolve, reject) => {
    console.log(`\n检查表 ${tableName} 的结构:`)
    console.log('-'.repeat(50))

    // 查询表结构
    const sql = `PRAGMA table_info(${tableName})`

    db.all(sql, [], (err, columns) => {
      if (err) {
        console.error(`查询表 ${tableName} 结构失败:`, err.message)
        resolve(false)
        return
      }

      if (columns.length === 0) {
        console.log(`表 ${tableName} 不存在或没有列`)
        resolve(false)
        return
      }

      console.log(`表 ${tableName} 包含 ${columns.length} 个列:`)
      columns.forEach((col) => {
        console.log(
          `- ${col.name} (${col.type}${col.notnull ? ', NOT NULL' : ''}${col.dflt_value !== null ? `, DEFAULT: ${col.dflt_value}` : ''})`
        )
      })

      resolve(true)
    })
  })
}

// 检查所有表
async function checkAllTables() {
  console.log('开始检查所有档案管理相关表的结构...')
  console.log('='.repeat(60))

  let allTablesExist = true

  for (const tableName of tablesToCheck) {
    const exists = await checkTableStructure(tableName)
    if (!exists) {
      allTablesExist = false
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('检查完成!')

  if (allTablesExist) {
    console.log('所有表都存在且结构正常。')
  } else {
    console.log('存在表结构问题，请检查上述输出。')
  }

  // 关闭数据库连接
  db.close()
}

// 执行检查
checkAllTables()
