const mysql = require('mysql2/promise')

console.log('开始诊断MariaDB连接...\n')

const connectionConfig = {
  host: 'localhost',
  user: 'app_user',
  password: 'strongpass791002',
  database: 'village',
  port: 3306
}

async function diagnose() {
  let connection
  try {
    // 1. 测试连接
    console.log('1. 测试数据库连接...')
    connection = await mysql.createConnection(connectionConfig)
    console.log('✓ 数据库连接成功\n')

    // 2. 检查数据库
    console.log('2. 检查数据库...')
    const [dbs] = await connection.query('SHOW DATABASES')
    const dbExists = dbs.some((db) => db.Database === 'village')
    console.log(dbExists ? '✓ village数据库存在' : '✗ village数据库不存在')
    console.log()

    // 3. 检查表
    console.log('3. 检查表是否存在...')
    const [tables] = await connection.query('SHOW TABLES')
    console.log(`找到 ${tables.length} 个表:`)
    tables.forEach((t) => console.log(`  - ${Object.values(t)[0]}`))

    const residentsExists = tables.some((t) => Object.values(t)[0] === 'residents')
    const householdsExists = tables.some((t) => Object.values(t)[0] === 'households')
    console.log()
    console.log(residentsExists ? '✓ residents表存在' : '✗ residents表不存在')
    console.log(householdsExists ? '✓ households表存在' : '✗ households表不存在')
    console.log()

    // 4. 检查residents表结构
    if (residentsExists) {
      console.log('4. 检查residents表结构...')
      const [columns] = await connection.query('DESCRIBE residents')
      console.log('residents表字段:')
      columns.forEach((col) => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''}`)
      })
      console.log()
    }

    // 5. 检查数据
    if (residentsExists) {
      console.log('5. 测试查询居民数据...')
      const [rows] = await connection.query(
        `SELECT COUNT(*) as total FROM residents WHERE status = 'active'`
      )
      console.log(`✓ 找到 ${rows[0].total} 个active状态的居民`)
      console.log()

      // 6. 测试居民列表查询
      console.log('6. 测试居民列表查询（模拟前端请求）...')
      const [residents] = await connection.query(`
        SELECT
          r.id,
          r.name,
          r.id_card AS idCard,
          r.gender,
          r.date_of_birth AS dateOfBirth,
          YEAR(CURDATE()) - YEAR(r.date_of_birth) AS age,
          r.village_group AS villageGroup,
          h.address,
          r.bank_card AS bankCard,
          r.phone_number AS phoneNumber,
          r.household_id,
          h.household_head_name,
          r.relationship_to_head,
          h.household_number,
          r.status
        FROM residents r
        LEFT JOIN households h ON r.household_id = h.household_number
        WHERE h.status = 'active' AND r.status = 'active'
        LIMIT 5
      `)
      console.log(`✓ 成功查询到 ${residents.length} 条记录`)
      if (residents.length > 0) {
        console.log('示例数据:')
        const r = residents[0]
        console.log(`  - ID: ${r.id}, 姓名: ${r.name}, 年龄: ${r.age}`)
      }
      console.log()
    }

    console.log('='.repeat(50))
    console.log('诊断完成！如果所有检查都通过，数据库配置正常。')
    console.log('='.repeat(50))
  } catch (error) {
    console.error('\n✗ 诊断失败:')
    console.error(`错误代码: ${error.code}`)
    console.error(`错误信息: ${error.message}`)

    if (error.code === 'ECONNREFUSED') {
      console.log('\n提示: MariaDB服务未启动，请启动MariaDB服务')
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n提示: 数据库用户名或密码错误')
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n提示: village数据库不存在，需要先创建数据库')
    }
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

diagnose()
