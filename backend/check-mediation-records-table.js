const db = require('./db')

// 检查mediation_records表结构
function checkMediationRecordsTable() {
  console.log('开始检查mediation_records表结构...')

  // 检查表结构
  db.all('PRAGMA table_info(mediation_records)', (err, columns) => {
    if (err) {
      console.error('获取表结构失败:', err.message)
      return
    }

    console.log('\nmediation_records表字段信息:')
    columns.forEach((column) => {
      console.log(
        `  ${column.name} (${column.type}${column.notnull ? ', NOT NULL' : ''}${column.pk ? ', PRIMARY KEY' : ''})`
      )
    })

    // 检查是否存在保存调解记录所需的字段
    const requiredFields = [
      'id',
      'archive_id',
      'mediation_date',
      'mediation_location',
      'mediators',
      'process_record',
      'mediation_result',
      'agreement',
      'created_at'
    ]

    console.log('\n检查所需字段是否存在:')
    requiredFields.forEach((field) => {
      const exists = columns.some((column) => column.name === field)
      console.log(`  ${field}: ${exists ? '存在' : '不存在'}`)
    })

    // 检查数据库连接和表是否存在
    db.get('SELECT COUNT(*) as count FROM mediation_records LIMIT 1', (err, result) => {
      if (err) {
        console.error('\n检查表数据失败:', err.message)
      } else {
        console.log(`\n表存在，当前记录数: ${result.count}`)
      }
      process.exit(0)
    })
  })
}

// 运行检查
checkMediationRecordsTable()
