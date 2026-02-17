const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const dbPath = path.join(__dirname, 'app.db')
const db = new sqlite3.Database(dbPath)

console.log('开始添加股权数量字段到residents表...')
console.log('')

// 直接执行ALTER TABLE语句
db.serialize(() => {
  // 检查字段是否已存在
  db.all('PRAGMA table_info(residents);', (err, columns) => {
    if (err) {
      console.error('查询表结构失败:', err.message)
      db.close()
      process.exit(1)
    }

    // 检查是否已有equity_shares字段
    const hasEquityShares = columns.some((col) => col.name === 'equity_shares')

    if (hasEquityShares) {
      console.log('equity_shares字段已存在，无需添加')
      console.log('')

      // 显示当前字段信息
      const equityColumn = columns.find((col) => col.name === 'equity_shares')
      console.log('当前字段信息:')
      console.log(`  字段名: ${equityColumn.name}`)
      console.log(`  数据类型: ${equityColumn.type}`)
      console.log(`  是否可为空: ${equityColumn.notnull ? 'NOT NULL' : 'NULL'}`)
      console.log(`  默认值: ${equityColumn.dflt_value || '无'}`)

      db.close()
      process.exit(0)
    }

    console.log('equity_shares字段不存在，准备添加...')
    console.log('')

    // 添加股权数量字段
    db.run('ALTER TABLE residents ADD COLUMN equity_shares REAL DEFAULT 0;', function (err) {
      if (err) {
        console.error('✗ 添加字段失败:', err.message)
        console.error('')
        console.error('错误详情:', err)
        db.close()
        process.exit(1)
      }

      console.log('✓ equity_shares字段添加成功！')
      console.log('字段类型: REAL (实数类型)')
      console.log('默认值: 0')
      console.log('')

      // 验证字段是否添加成功
      db.all('PRAGMA table_info(residents);', (verifyErr, newColumns) => {
        if (verifyErr) {
          console.error('✗ 验证失败:', verifyErr.message)
          db.close()
          process.exit(1)
        }

        const equityColumn = newColumns.find((col) => col.name === 'equity_shares')
        if (equityColumn) {
          console.log('✓ 验证成功：equity_shares字段已存在于residents表')
          console.log(`  字段名: ${equityColumn.name}`)
          console.log(`  数据类型: ${equityColumn.type}`)
          console.log(`  是否可为空: ${equityColumn.notnull ? 'NOT NULL' : 'NULL'}`)
          console.log(`  默认值: ${equityColumn.dflt_value || '无'}`)
          console.log('')
          console.log('数据库操作完成！')
        } else {
          console.error('✗ 验证失败：equity_shares字段未找到')
          db.close()
          process.exit(1)
        }

        db.close()
      })
    })
  })
})
