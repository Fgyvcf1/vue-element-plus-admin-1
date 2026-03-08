const mysql = require('mysql2/promise')

async function addMissingDictionaries() {
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

    // 检查现有分类
    const [categories] = await connection.query('SELECT DISTINCT category FROM dictionaries')
    console.log(
      '现有分类:',
      categories.map((c) => c.category)
    )

    // 插入残疾等级数据（使用 "残疾等级" 分类）
    const disabilityLevels = [
      { value: '一级', display_order: 1 },
      { value: '二级', display_order: 2 },
      { value: '三级', display_order: 3 },
      { value: '四级', display_order: 4 }
    ]

    for (const item of disabilityLevels) {
      await connection.query(
        "INSERT IGNORE INTO dictionaries (category, value, display_order, status) VALUES (?, ?, ?, 'active')",
        ['残疾等级', item.value, item.display_order]
      )
    }
    console.log('✅ 已添加/更新 残疾等级 数据')

    // 检查并插入残疾类型数据（如果缺失）
    const [disabilityTypes] = await connection.query(
      "SELECT * FROM dictionaries WHERE category = '残疾类型'"
    )
    if (disabilityTypes.length === 0) {
      const types = [
        { value: '视力残疾', display_order: 1 },
        { value: '听力残疾', display_order: 2 },
        { value: '言语残疾', display_order: 3 },
        { value: '肢体残疾', display_order: 4 },
        { value: '智力残疾', display_order: 5 },
        { value: '精神残疾', display_order: 6 },
        { value: '多重残疾', display_order: 7 }
      ]

      for (const item of types) {
        await connection.query(
          "INSERT IGNORE INTO dictionaries (category, value, display_order, status) VALUES (?, ?, ?, 'active')",
          ['残疾类型', item.value, item.display_order]
        )
      }
      console.log('✅ 已添加 残疾类型 数据')
    } else {
      console.log('ℹ️  残疾类型 数据已存在')
    }

    // 检查享受政策数据
    const [policyTypes] = await connection.query(
      "SELECT * FROM dictionaries WHERE category = '享受政策'"
    )
    if (policyTypes.length === 0) {
      const policies = [
        { value: '最低生活保证金', display_order: 1 },
        { value: '特困供养', display_order: 2 },
        { value: '临时救助', display_order: 3 }
      ]

      for (const item of policies) {
        await connection.query(
          "INSERT IGNORE INTO dictionaries (category, value, display_order, status) VALUES (?, ?, ?, 'active')",
          ['享受政策', item.value, item.display_order]
        )
      }
      console.log('✅ 已添加 享受政策 数据')
    } else {
      console.log('ℹ️  享受政策 数据已存在')
    }

    connection.release()
    console.log('\n字典数据更新完成！')
  } catch (err) {
    console.error('错误:', err)
  } finally {
    pool.end()
  }
}

addMissingDictionaries()
