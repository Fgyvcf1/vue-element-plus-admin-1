const cron = require('node-cron')
const db = require('./db')

// 工具函数：计算年龄
function getAge(birthdate, onDate) {
  const b = new Date(birthdate)
  let age = onDate.getFullYear() - b.getFullYear()
  const m1 = onDate.getMonth(),
    d1 = onDate.getDate()
  const m2 = b.getMonth(),
    d2 = b.getDate()
  if (m1 < m2 || (m1 === m2 && d1 < d2)) age--
  return age
}

// 从配置表获取生日提醒配置
function getBirthdayReminderConfig(callback) {
  const sql = `
    SELECT config_key, config_value
    FROM system_config
    WHERE config_key IN ('birth_remind_days', 'birth_remind_enabled', 'birth_remind_time')
  `

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('获取生日提醒配置失败:', err)
      // 返回默认配置
      callback({
        days: 7,
        enabled: 1,
        time: '09:00:00'
      })
      return
    }

    const config = {
      days: 7,
      enabled: 1,
      time: '09:00:00'
    }

    rows.forEach((row) => {
      if (row.config_key === 'birth_remind_days') {
        config.days = parseInt(row.config_value) || 7
      } else if (row.config_key === 'birth_remind_enabled') {
        config.enabled = parseInt(row.config_value) || 1
      } else if (row.config_key === 'birth_remind_time') {
        config.time = row.config_value || '09:00:00'
      }
    })

    callback(config)
  })
}

// 检查当前时间是否到达提醒时间
function isReminderTime(config) {
  const now = new Date()
  const timeParts = config.time.split(':')
  const targetHours = parseInt(timeParts[0]) || 9
  const targetMinutes = parseInt(timeParts[1]) || 0

  const currentHours = now.getHours()
  const currentMinutes = now.getMinutes()

  // 只比较小时和分钟，秒数忽略
  return currentHours === targetHours && currentMinutes === targetMinutes
}

// 执行生日提醒任务
function executeBirthdayReminder() {
  console.log('开始执行生日提醒任务...')
  const today = new Date()
  const formatDate = (date) => {
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    return `${year}年${month}月${day}日`
  }

  getBirthdayReminderConfig((config) => {
    console.log('生日提醒配置:', config)

    // 如果未启用，直接返回
    if (config.enabled !== 1) {
      console.log('生日提醒功能未启用')
      return
    }

    const remindDays = config.days

    // 查询所有有生日的居民（包含电话和同户其他成员电话）
    // 逻辑：1. 先查本人电话
    //       2. 如果本人没有，查同户（household_id相同）其他成员的电话
    const sql = `
      SELECT 
        r.id, 
        r.name, 
        r.date_of_birth, 
        r.phone_number,
        r.household_id,
        rh.phone_number as other_member_phone
      FROM residents r
      LEFT JOIN residents rh ON r.household_id = rh.household_id 
        AND r.id != rh.id
        AND rh.phone_number IS NOT NULL
        AND rh.phone_number != ''
      WHERE r.date_of_birth IS NOT NULL
    `

    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error('查询居民列表失败:', err)
        return
      }

      console.log(`找到 ${rows.length} 位有生日信息的居民`)

      rows.forEach((r) => {
        const b = new Date(r.date_of_birth)

        // 今年生日（使用UTC时间创建）
        let nextBirthday = new Date(Date.UTC(today.getFullYear(), b.getMonth(), b.getDate()))

        // 只比较日期部分（年、月、日），不比较时间
        let diffDays
        if (
          today.getFullYear() === nextBirthday.getUTCFullYear() &&
          today.getMonth() === nextBirthday.getUTCMonth() &&
          today.getDate() === nextBirthday.getUTCDate()
        ) {
          // 今天就是生日
          diffDays = 0
        } else if (nextBirthday < today) {
          // 今年生日已过，计算明年的
          nextBirthday = new Date(Date.UTC(today.getFullYear() + 1, b.getMonth(), b.getDate()))
          diffDays = Math.round((nextBirthday - today) / 86400000)
        } else {
          // 今年生日还未到
          diffDays = Math.round((nextBirthday - today) / 86400000)
        }

        // 只在提前提醒天数内发送提醒
        if (diffDays < 0 || diffDays > remindDays) {
          return
        }

        // 计算生日时的年龄
        const ageOnBirthday = getAge(b, nextBirthday)

        // 只有年龄大于或等于60岁的才发送提醒
        if (ageOnBirthday < 60) {
          return
        }

        // 避免重复：当天同类型同居民只生成一次通知
        db.get(
          'SELECT id FROM notification WHERE type = ? AND resident_id = ? AND DATE(created_at) = DATE(NOW())',
          ['birth', r.id],
          (err2, exists) => {
            if (err2) {
              console.error('检查重复通知失败:', err2)
              return
            }

            if (exists) {
              console.log(`居民 ${r.name} 今天已发送过生日提醒`)
              return
            }

            // 获取联系电话（优先使用本人电话，没有则使用同户其他成员电话）
            const phoneNumber = r.phone_number || r.other_member_phone

            // 生成通知标题和内容
            const birthdayText = formatDate(nextBirthday)
            const title = `${r.name}同志即将年满${ageOnBirthday}岁`
            const content = `${r.name}同志于${birthdayText}即将年满${ageOnBirthday}岁，请及时通知该同志办理社保、养老、高龄补贴等相关认证手续。联系电话：${phoneNumber || ''}`

            // 获取最大ID并生成新ID
            db.get('SELECT MAX(id) as maxId FROM notification', [], (err4, row) => {
              if (err4) {
                console.error('获取最大ID失败:', err4)
                return
              }
              const newId = (row && row.maxId ? row.maxId : 0) + 1

              db.run(
                'INSERT INTO notification (id, title, content, type, resident_id, status, is_read, progress, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
                [newId, title, content, 'birth', r.id, 'pending', 0, 0],
                function (err3) {
                  if (err3) {
                    console.error('插入生日提醒通知失败:', err3)
                  } else {
                    console.log(`✓ 已发送生日提醒: ${title}`)
                  }
                }
              )
            })
          }
        )
      })
    })
  })
}

// 事件提醒任务（保持不变）
function executeEventReminder() {
  console.log('开始执行事件提醒任务...')
  const today = new Date()

  db.all('SELECT id, title, start_at, lead_hours FROM event', [], (err, rows) => {
    if (err) {
      console.error('查询事件列表失败:', err)
      return
    }

    rows.forEach((e) => {
      const start = new Date(e.start_at)
      const remindTime = new Date(start.getTime() - e.lead_hours * 60 * 60 * 1000)

      // 如果提醒时间已经过去就不管
      if (remindTime < today) return

      // 提醒时间在未来 7 天内，就生成通知
      const diffDays = Math.round((remindTime - today) / 86400000)
      if (diffDays < 0 || diffDays > 7) return

      // 避免重复
      db.get(
        'SELECT id FROM notification WHERE type = ? AND event_id = ?',
        ['event', e.id],
        (err2, exists) => {
          if (err2) {
            console.error('检查重复通知失败:', err2)
            return
          }
          if (exists) {
            console.log(`事件 ${e.title} 已发送过提醒`)
            return
          }

          const title = `事件提醒：${e.title}`
          const content = `${start.toLocaleString()} 将召开 ${e.title}，请提前${e.lead_hours}小时准备。`

          // 获取最大ID并生成新ID
          db.get('SELECT MAX(id) as maxId FROM notification', [], (err4, row) => {
            if (err4) {
              console.error('获取最大ID失败:', err4)
              return
            }
            const newId = (row && row.maxId ? row.maxMax : 0) + 1

            db.run(
              'INSERT INTO notification (id, title, content, type, event_id, status, is_read, progress, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
              [newId, title, content, 'event', e.id, 'pending', 0, 0],
              function (err3) {
                if (err3) {
                  console.error('插入事件提醒通知失败:', err3)
                } else {
                  console.log(`✓ 已发送事件提醒: ${title}`)
                }
              }
            )
          })
        }
      )
    })
  })
}

// 每分钟检查一次配置，在配置的时间执行提醒任务
// 格式：秒 分 时 日 月 周
console.log('定时任务模块已加载，每分钟检查配置时间...')

// 每分钟执行一次检查
cron.schedule('0 * * * * *', () => {
  getBirthdayReminderConfig((config) => {
    // 检查是否到达提醒时间
    if (isReminderTime(config)) {
      console.log(`到达提醒时间 ${config.time}，开始执行提醒任务...`)
      executeBirthdayReminder()
      executeEventReminder()
    }
  })
})

// 导出函数，用于手动触发和测试
module.exports = {
  executeBirthdayReminder,
  executeEventReminder,
  getBirthdayReminderConfig,
  isReminderTime
}
