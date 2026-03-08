const db = require('./db.js')

async function testConfigUpdate() {
  try {
    // 1. 先查看当前的 birth_remind_days 值
    console.log('1. 当前配置值:')
    const [rows1] = await db.pool.execute(
      "SELECT config_key, config_value, value_type FROM system_config WHERE config_key = 'birth_remind_days'"
    )
    if (rows1.length > 0) {
      console.log(
        `   ${rows1[0].config_key}: ${rows1[0].config_value} (类型: ${rows1[0].value_type})`
      )
    } else {
      console.log('   未找到 birth_remind_days 配置')
    }

    // 2. 测试更新为数字 5
    console.log('\n2. 测试更新为数字 5:')
    const [result] = await db.pool.execute(
      'UPDATE system_config SET config_value = ?, updated_at = CURRENT_TIMESTAMP WHERE config_key = ?',
      [5, 'birth_remind_days']
    )
    console.log(`   影响行数: ${result.affectedRows}`)

    // 3. 查看更新后的值
    console.log('\n3. 更新后的配置值:')
    const [rows2] = await db.pool.execute(
      "SELECT config_key, config_value, value_type FROM system_config WHERE config_key = 'birth_remind_days'"
    )
    if (rows2.length > 0) {
      console.log(
        `   ${rows2[0].config_key}: ${rows2[0].config_value} (类型: ${rows2[0].value_type})`
      )
    }

    // 4. 测试更新为字符串 '3'
    console.log('\n4. 测试更新为字符串 "3":')
    const [result2] = await db.pool.execute(
      'UPDATE system_config SET config_value = ?, updated_at = CURRENT_TIMESTAMP WHERE config_key = ?',
      ['3', 'birth_remind_days']
    )
    console.log(`   影响行数: ${result2.affectedRows}`)

    // 5. 查看更新后的值
    console.log('\n5. 更新后的配置值:')
    const [rows3] = await db.pool.execute(
      "SELECT config_key, config_value, value_type FROM system_config WHERE config_key = 'birth_remind_days'"
    )
    if (rows3.length > 0) {
      console.log(
        `   ${rows3[0].config_key}: ${rows3[0].config_value} (类型: ${rows3[0].value_type})`
      )
    }
  } catch (err) {
    console.error('测试失败:', err)
  }
  process.exit(0)
}

testConfigUpdate()
