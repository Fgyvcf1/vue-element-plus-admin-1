const db = require('./db')

console.log('========================================')
console.log('完整调试：年龄提醒流程')
console.log('========================================\n')

const today = new Date('2026-01-09')
console.log(`当前日期: ${today.toISOString().split('T')[0]}\n`)

// 步骤1: 检查notifications表结构
console.log('步骤1: 检查notifications表结构')
console.log('----------------------------------------')

db.all('PRAGMA table_info(notifications)', (err, columns) => {
  if (err) {
    console.error('查询表结构失败:', err.message)
    process.exit(1)
  }

  console.log('notifications表字段:')
  columns.forEach((col) => {
    console.log(`  - ${col.name} (${col.type})`)
  })

  // 检查是否有is_read字段
  const hasIsReadField = columns.some((col) => col.name === 'is_read')
  const hasStatusField = columns.some((col) => col.name === 'status')

  console.log(`\n关键字段检查:`)
  console.log(`  is_read字段: ${hasIsReadField ? '✅ 存在' : '❌ 不存在'}`)
  console.log(`  status字段: ${hasStatusField ? '✅ 存在' : '❌ 不存在'}`)

  if (hasIsReadField) {
    console.log(`\n⚠️  警告: 表中存在is_read字段，但代码应该使用status字段！`)
    console.log(`   这可能导致插入失败。`)
  }

  // 步骤2: 查找1966-01-10出生的居民
  console.log('\n步骤2: 查找1966-01-10出生的居民')
  console.log('----------------------------------------')

  const sql = `SELECT id, name, date_of_birth, id_card, village_group, status
              FROM residents
              WHERE date_of_birth = '1966-01-10'`

  db.all(sql, [], (err, residents) => {
    if (err) {
      console.error('查询失败:', err.message)
      process.exit(1)
    }

    if (residents.length === 0) {
      console.log('❌ 没有找到1966-01-10出生的居民')
      db.close()
      process.exit(0)
    }

    console.log(`找到 ${residents.length} 个居民:\n`)

    residents.forEach((resident) => {
      console.log(`  ${resident.name} (ID: ${resident.id})`)
      console.log(`    出生日期: ${resident.date_of_birth}`)
      console.log(`    状态: ${resident.status}\n`)
    })

    // 步骤3: 检查60岁提醒规则
    console.log('\n步骤3: 检查60岁提醒规则')
    console.log('----------------------------------------')

    db.all(
      "SELECT * FROM reminder_rules WHERE rule_type = 'age' AND status = 'active' AND rule_value = '60'",
      (err, rules) => {
        if (err) {
          console.error('查询规则失败:', err.message)
          db.close()
          process.exit(1)
        }

        if (rules.length === 0) {
          console.log('❌ 没有找到启用状态的60岁提醒规则')
          db.close()
          process.exit(0)
        }

        console.log(`找到 ${rules.length} 条60岁规则:\n`)

        rules.forEach((rule) => {
          console.log(`  规则 #${rule.id}: ${rule.rule_name}`)
          console.log(`    reminder_days: ${rule.reminder_days || 0}天`)
          console.log(`    状态: ${rule.status}\n`)
        })

        // 步骤4: 手动执行年龄提醒逻辑
        console.log('\n步骤4: 手动执行年龄提醒逻辑')
        console.log('----------------------------------------')

        const reminders = []

        residents.forEach((resident) => {
          const birthDate = new Date(resident.date_of_birth)

          // 计算精确年龄
          let age = today.getFullYear() - birthDate.getFullYear()
          const monthDiff = today.getMonth() - birthDate.getMonth()

          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--
          }

          // 计算距离生日天数
          const nextBirthday = new Date(
            today.getFullYear(),
            birthDate.getMonth(),
            birthDate.getDate()
          )
          if (nextBirthday < today) {
            nextBirthday.setFullYear(today.getFullYear() + 1)
          }
          const daysToBirthday = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24))

          console.log(`居民: ${resident.name}`)
          console.log(`  当前年龄: ${age}岁`)
          console.log(`  距离生日: ${daysToBirthday}天`)

          rules.forEach((rule) => {
            const targetAge = parseInt(rule.rule_value)
            const reminderDays = rule.reminder_days || 0

            // 提前提醒条件
            if (age === targetAge - 1 && daysToBirthday <= reminderDays && daysToBirthday > 0) {
              const reminder = {
                resident_id: resident.id,
                resident_name: resident.name,
                age: age,
                rule_id: rule.id,
                rule_name: rule.rule_name,
                reminder_content: `${resident.name}居民将在${daysToBirthday}天后年满${targetAge}岁，请注意相关事项`,
                reminder_type: 'advance_reminder',
                days_to_birthday: daysToBirthday
              }
              reminders.push(reminder)
              console.log(`  ✅ 匹配规则: ${rule.rule_name}`)
              console.log(`     将创建通知: ${reminder.reminder_content}\n`)
            }
          })
        })

        console.log(`总计找到 ${reminders.length} 个需要提醒的记录\n`)

        // 步骤5: 检查是否已存在相同的通知
        console.log('步骤5: 检查是否已存在相同的通知')
        console.log('----------------------------------------')

        let newReminders = []
        let processedCount = 0

        if (reminders.length === 0) {
          console.log('❌ 没有需要创建的提醒！')
          console.log('\n可能的原因:')
          console.log('1. 年龄计算不准确')
          console.log('2. 规则配置不正确')
          console.log('3. 条件判断逻辑有误')
          db.close()
          process.exit(0)
        }

        reminders.forEach((reminder, index) => {
          const checkSql = `SELECT id FROM notifications
                         WHERE title LIKE ? AND content = ?
                         AND created_at >= date('now', '-7 days')`

          db.get(
            checkSql,
            [`%${reminder.resident_name}%`, reminder.reminder_content],
            (checkErr, existing) => {
              if (checkErr) {
                console.error('检查重复通知失败:', checkErr.message)
              }

              if (!existing) {
                newReminders.push(reminder)
                console.log(`✅ 可以创建新通知: ${reminder.resident_name} ${reminder.rule_name}`)
              } else {
                console.log(
                  `⏭️  通知已存在（7天内），跳过: ${reminder.resident_name} ${reminder.rule_name}`
                )
              }

              processedCount++

              // 当所有提醒检查完成后
              if (processedCount === reminders.length) {
                console.log(`\n可以创建的新通知数量: ${newReminders.length}\n`)

                // 步骤6: 尝试创建通知
                console.log('步骤6: 尝试创建通知')
                console.log('----------------------------------------')

                if (newReminders.length === 0) {
                  console.log('没有新通知需要创建')
                  db.close()
                  return
                }

                let createdCount = 0

                newReminders.forEach((reminder) => {
                  // 根据表结构决定插入语句
                  let insertSql, params

                  if (hasIsReadField) {
                    insertSql = `INSERT INTO notifications (title, content, type, priority, is_read, created_at, updated_at)
                            VALUES (?, ?, 'reminder', 2, 0, datetime('now'), datetime('now'))`
                  } else {
                    insertSql = `INSERT INTO notifications (title, content, type, priority, status, created_at)
                            VALUES (?, ?, 'reminder', 2, 'unread', datetime('now'))`
                  }

                  const title = `${reminder.resident_name} ${reminder.rule_name}`
                  params = [title, reminder.reminder_content]

                  console.log(`\n尝试创建通知:`)
                  console.log(`  标题: ${title}`)
                  console.log(`  内容: ${reminder.reminder_content}`)
                  console.log(`  SQL: ${insertSql}`)

                  db.run(insertSql, params, function (insertErr) {
                    if (insertErr) {
                      console.error(`❌ 创建通知失败:`, insertErr.message)
                      console.error(`   错误详情: ${insertErr}`)
                    } else {
                      console.log(`✅ 成功创建通知 (ID: ${this.lastID})`)
                      createdCount++
                    }

                    // 当所有通知处理完成后
                    if (createdCount === newReminders.length) {
                      console.log(`\n========================================`)
                      console.log(`调试完成`)
                      console.log(`========================================`)
                      console.log(`总提醒数: ${reminders.length}`)
                      console.log(`新通知数: ${newReminders.length}`)
                      console.log(`成功创建: ${createdCount}条\n`)

                      if (createdCount > 0) {
                        console.log(`✅ 通知创建成功！请检查：`)
                        console.log(
                          `   1. 数据库: SELECT * FROM notifications WHERE id >= (SELECT max(id) - ${createdCount} + 1 FROM notifications)`
                        )
                        console.log(`   2. 前端通知列表`)
                        console.log(`   3. 铃铛图标`)
                      } else {
                        console.log(`❌ 所有通知创建失败！`)
                        console.log(`   请检查表结构和字段名是否匹配`)
                      }

                      db.close()
                    }
                  })
                })
              }
            }
          )
        })
      }
    )
  })
})
