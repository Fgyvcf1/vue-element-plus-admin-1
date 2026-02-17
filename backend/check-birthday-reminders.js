const db = require('./db.js')

async function checkBirthdayReminders() {
  const today = new Date()
  console.log('今天日期:', today.toISOString().slice(0, 10))

  // 1. 检查生日提醒配置
  console.log('\n1. 生日提醒配置:')
  try {
    const [configRows] = await db.pool.execute(
      "SELECT config_key, config_value FROM system_config WHERE config_key LIKE 'birth%'"
    )
    configRows.forEach((row) => {
      console.log(`  ${row.config_key}: ${row.config_value}`)
    })
  } catch (err) {
    console.log('  使用默认配置: days=7, enabled=1, time=09:00:00')
  }

  // 2. 查找1966年2月1日和2月2日出生的居民
  console.log('\n2. 查找目标居民:')
  const [residents] = await db.pool.execute(
    "SELECT id, name, date_of_birth FROM residents WHERE date_of_birth LIKE '1966-02-01' OR date_of_birth LIKE '1966-02-02'"
  )

  if (residents.length === 0) {
    console.log('  未找到1966年2月1日或2月2日出生的居民')
  } else {
    residents.forEach((r) => {
      console.log(`  ID: ${r.id}, 姓名: ${r.name}, 生日: ${r.date_of_birth}`)
    })
  }

  // 3. 检查今天是否已生成通知
  console.log('\n3. 今天已生成的生日通知:')
  if (residents.length > 0) {
    const ids = residents.map((r) => r.id).join(',')
    const [notifications] = await db.pool.execute(
      `SELECT id, title, content, resident_id, created_at FROM notification 
       WHERE type = 'birth' AND resident_id IN (${ids}) AND DATE(created_at) = CURDATE()`
    )

    if (notifications.length === 0) {
      console.log('  今天没有生成生日通知')
    } else {
      notifications.forEach((n) => {
        console.log(`  ID: ${n.id}, 标题: ${n.title}, 居民ID: ${n.resident_id}`)
      })
    }
  }

  // 4. 计算生日差值
  console.log('\n4. 生日差值计算:')
  residents.forEach((r) => {
    const b = new Date(r.date_of_birth)
    let nextBirthday = new Date(Date.UTC(today.getFullYear(), b.getMonth(), b.getDate()))

    let diffDays
    if (
      today.getFullYear() === nextBirthday.getUTCFullYear() &&
      today.getMonth() === nextBirthday.getUTCMonth() &&
      today.getDate() === nextBirthday.getUTCDate()
    ) {
      diffDays = 0
    } else if (nextBirthday < today) {
      nextBirthday = new Date(Date.UTC(today.getFullYear() + 1, b.getMonth(), b.getDate()))
      diffDays = Math.round((nextBirthday - today) / 86400000)
    } else {
      diffDays = Math.round((nextBirthday - today) / 86400000)
    }

    const age = today.getFullYear() - b.getFullYear()
    console.log(`  ${r.name}: 生日${r.date_of_birth}, 差值${diffDays}天, 即将满${age}岁`)
  })

  process.exit(0)
}

checkBirthdayReminders()
