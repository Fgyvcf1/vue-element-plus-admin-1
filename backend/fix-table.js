const db = require('./db.js')

async function fixTable() {
  try {
    console.log('开始修复 low_income_persons 表结构...')

    // 1. 添加主键和 AUTO_INCREMENT
    const alterSql = `ALTER TABLE low_income_persons 
                      MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY`

    await new Promise((resolve, reject) => {
      db.run(alterSql, [], function (err) {
        if (err) {
          console.error('修改表结构失败:', err.message)
          reject(err)
        } else {
          console.log('表结构修改成功')
          resolve()
        }
      })
    })

    console.log('修复完成！')
    process.exit(0)
  } catch (error) {
    console.error('修复失败:', error)
    process.exit(1)
  }
}

fixTable()
