const db = require('./db')

async function addAmountToDictionaries() {
  let connection
  try {
    connection = await db.beginTransaction()
    console.log('开始向 dictionaries 表添加 amount 字段...')

    // 检查字段是否已存在
    const [columns] = await connection.execute(
      `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE table_schema = DATABASE() AND table_name = 'dictionaries' AND column_name = 'amount'`
    )

    if (columns[0].count > 0) {
      console.log('字段 amount 已存在，无需添加。')
    } else {
      await connection.execute('ALTER TABLE dictionaries ADD COLUMN amount DECIMAL(10, 2) NULL')
      console.log('✅ 成功添加 amount 字段')
    }

    await db.commit(connection)
    console.log('操作成功完成！')
  } catch (error) {
    if (connection) {
      await db.rollback(connection)
    }
    console.error('操作失败:', error)
  } finally {
    if (db.pool) {
      db.pool.end()
    }
  }
}

addAmountToDictionaries()