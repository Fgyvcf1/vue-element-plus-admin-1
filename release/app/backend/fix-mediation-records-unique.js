const db = require('./db')

// 修复mediation_records表的唯一约束问题
function fixMediationRecordsUniqueConstraint() {
  console.log('开始修复mediation_records表的唯一约束...')

  // 检查表结构，查看archive_id字段是否有唯一约束
  db.all('PRAGMA index_list(mediation_records)', (err, indexes) => {
    if (err) {
      console.error('获取索引列表失败:', err.message)
      return
    }

    console.log('\nmediation_records表索引信息:')
    indexes.forEach((index) => {
      console.log(`  ${index.name} (${index.unique ? '唯一索引' : '普通索引'})`)

      // 获取索引的详细信息
      db.all(`PRAGMA index_info(${index.name})`, (err, columns) => {
        if (err) {
          console.error(`获取索引${index.name}详细信息失败:`, err.message)
          return
        }

        if (columns.length > 0) {
          console.log(`    包含字段: ${columns.map((col) => col.name).join(', ')}`)

          // 如果是archive_id的唯一索引，删除它
          if (index.unique && columns.some((col) => col.name === 'archive_id')) {
            console.log(`\n发现archive_id的唯一索引: ${index.name}，正在删除...`)
            db.run(`DROP INDEX ${index.name}`, (err) => {
              if (err) {
                console.error(`删除索引${index.name}失败:`, err.message)
              } else {
                console.log(`成功删除索引${index.name}`)
                console.log('修复完成，现在一个档案可以有多个调解记录了。')
              }
            })
          }
        }
      })
    })
  })
}

// 运行修复
fixMediationRecordsUniqueConstraint()
