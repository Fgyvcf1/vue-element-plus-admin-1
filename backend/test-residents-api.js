const db = require('./db.js')

console.log('开始测试居民查询API...\n')

async function testResidentsQuery() {
  try {
    // 模拟 /api/residents 查询
    console.log('1. 测试基础查询（无过滤条件）...')

    const sql = `
      SELECT
        r.id,
        r.name,
        r.id_card AS idCard,
        r.gender,
        r.ethnicity,
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
        r.status,
        r.equity_shares,
        r.occupation
      FROM residents r
      LEFT JOIN households h ON r.household_id = h.household_number
      WHERE h.status = 'active' AND r.status = 'active'
      LIMIT 10
    `

    const [residents] = await db.pool.execute(sql)
    console.log(`✓ 查询成功，返回 ${residents.length} 条记录`)

    if (residents.length > 0) {
      console.log('\n示例数据:')
      const r = residents[0]
      console.log(`  ID: ${r.id}`)
      console.log(`  姓名: ${r.name}`)
      console.log(`  身份证: ${r.idCard}`)
      console.log(`  性别: ${r.gender}`)
      console.log(`  年龄: ${r.age}`)
      console.log(`  村组: ${r.villageGroup}`)
      console.log(`  户编号: ${r.household_id}`)
      console.log(`  户主: ${r.household_head_name}`)
    }
    console.log()

    // 测试分页查询
    console.log('2. 测试分页查询...')
    const [allResidents] = await db.pool.execute(sql.replace('LIMIT 10', ''))
    console.log(`✓ 总计 ${allResidents.length} 条记录`)

    const pageNum = 1
    const pageSize = 10
    const offset = (pageNum - 1) * pageSize
    const pageResidents = allResidents.slice(offset, offset + pageSize)
    console.log(`✓ 第${pageNum}页，显示${pageResidents.length}条记录\n`)

    // 测试关键字搜索
    console.log('3. 测试关键字搜索（姓名包含"张"）...')
    const keywordSql = `
      ${sql}
      AND (r.name LIKE ? OR r.id_card LIKE ?)
    `

    const [searchResults] = await db.pool.execute(keywordSql, ['%张%', '%张%'])
    console.log(`✓ 搜索到 ${searchResults.length} 条记录\n`)

    // 测试户主姓名查询
    console.log('4. 测试户主姓名查询...')
    const householdHeadSql = `
      SELECT DISTINCT household_number FROM households
      WHERE household_head_name LIKE ? AND status = 'active'
      LIMIT 3
    `

    const [households] = await db.pool.execute(householdHeadSql, ['%张%'])
    console.log(`✓ 找到 ${households.length} 个户主`)

    if (households.length > 0) {
      const householdNumbers = households.map((h) => h.household_number)
      const numbersPlaceholders = householdNumbers.map(() => '?').join(',')

      const finalSql = `
        SELECT r.id, r.name, r.household_id, h.household_head_name
        FROM residents r
        LEFT JOIN households h ON r.household_id = h.household_number
        WHERE r.household_id IN (${numbersPlaceholders})
        LIMIT 5
      `

      const [householdResidents] = await db.pool.execute(finalSql, householdNumbers)
      console.log(`✓ 这些家庭的居民数: ${householdResidents.length}`)
    }
    console.log()

    console.log('='.repeat(50))
    console.log('所有查询测试通过！API应该可以正常工作。')
    console.log('='.repeat(50))
  } catch (error) {
    console.error('\n✗ 测试失败:')
    console.error(`错误信息: ${error.message}`)
    console.error(`错误代码: ${error.code}`)
    console.error(`SQL错误: ${error.sqlMessage || error.message}`)

    if (error.code === 'ER_BAD_FIELD_ERROR') {
      console.log('\n提示: 查询的字段不存在')
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('\n提示: 表不存在')
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n提示: 数据库连接失败')
    }
  } finally {
    // 关闭连接池
    await db.pool.end()
  }
}

testResidentsQuery()
