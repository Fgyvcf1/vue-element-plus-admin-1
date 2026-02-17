const db = require('./db')

// 通过重建表的方式修复mediation_records表的唯一约束问题
function rebuildMediationRecordsTable() {
  console.log('开始重建mediation_records表...')

  db.serialize(() => {
    try {
      // 1. 创建临时表，结构与原表相同，但移除archive_id字段的唯一约束
      console.log('1. 创建临时表...')
      db.run(
        `
        CREATE TABLE IF NOT EXISTS temp_mediation_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          archive_id VARCHAR(50) NOT NULL,
          mediation_date DATE NOT NULL,
          mediation_location VARCHAR(100),
          mediators TEXT NOT NULL,
          process_record TEXT NOT NULL,
          mediation_result TEXT,
          agreement VARCHAR(10),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `,
        (err) => {
          if (err) {
            console.error('创建临时表失败:', err.message)
            return
          }

          // 2. 将原表中的数据复制到临时表
          console.log('2. 复制数据到临时表...')
          db.run(
            `
          INSERT INTO temp_mediation_records 
          (id, archive_id, mediation_date, mediation_location, mediators, process_record, mediation_result, agreement, created_at)
          SELECT id, archive_id, mediation_date, mediation_location, mediators, process_record, mediation_result, agreement, created_at
          FROM mediation_records
        `,
            (err) => {
              if (err) {
                console.error('复制数据失败:', err.message)
                return
              }

              // 3. 删除原表
              console.log('3. 删除原表...')
              db.run(`DROP TABLE IF EXISTS mediation_records`, (err) => {
                if (err) {
                  console.error('删除原表失败:', err.message)
                  return
                }

                // 4. 将临时表重命名为原表名
                console.log('4. 将临时表重命名为原表名...')
                db.run(`ALTER TABLE temp_mediation_records RENAME TO mediation_records`, (err) => {
                  if (err) {
                    console.error('重命名表失败:', err.message)
                    return
                  }

                  console.log('\n✅ 修复完成！mediation_records表的archive_id字段唯一约束已移除。')
                  console.log('现在一个档案可以有多个调解记录了。')
                })
              })
            }
          )
        }
      )
    } catch (error) {
      console.error('修复过程中发生错误:', error.message)
    }
  })
}

// 运行修复
rebuildMediationRecordsTable()
