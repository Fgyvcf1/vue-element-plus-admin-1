const mysql = require('mysql2/promise')

async function checkDictionaries() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'app_user',
    password: process.env.DB_PASSWORD || 'strongpass791002',
    database: process.env.DB_NAME || 'village',
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4'
  })

  try {
    const connection = await pool.getConnection()
    console.log('成功连接到数据库')

    // 1. 检查表是否存在
    const [tables] = await connection.query("SHOW TABLES LIKE 'dictionaries'")
    if (tables.length === 0) {
      console.log('❌ dictionaries 表不存在')

      // 检查所有表
      const [allTables] = await connection.query('SHOW TABLES')
      console.log(
        '数据库中的所有表:',
        allTables.map((t) => Object.values(t)[0])
      )
    } else {
      console.log('✅ dictionaries 表存在')

      // 2. 检查表结构
      const [columns] = await connection.query('SHOW COLUMNS FROM dictionaries')
      console.log(
        '表结构:',
        columns.map((c) => c.Field)
      )

      // 3. 检查 "档次" 数据
      const [rows] = await connection.query("SELECT * FROM dictionaries WHERE category = '档次'")
      console.log('查询 "档次" 分类的结果:', rows)

      // 4. 检查所有分类
      const [categories] = await connection.query('SELECT DISTINCT category FROM dictionaries')
      console.log(
        '所有可用分类:',
        categories.map((c) => c.category)
      )
    }

    connection.release()
  } catch (err) {
    console.error('数据库错误:', err)
  } finally {
    pool.end()
  }
}

checkDictionaries()
