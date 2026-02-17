const db = require('./db')

// 创建通知系统相关表
function createNotificationTables() {
  console.log('开始创建通知系统相关表...')

  // 先删除现有表（如果存在）
  const dropTables = `
    DROP TABLE IF EXISTS reminder_history;
    DROP TABLE IF EXISTS reminder_rules;
    DROP TABLE IF EXISTS notification_progress;
    DROP TABLE IF EXISTS notification_recipients;
    DROP TABLE IF EXISTS notifications;
  `

  // 执行删除表操作
  db.exec(dropTables, function (err) {
    if (err) {
      console.error('删除现有表失败:', err.message)
      return
    }
    console.log('现有表删除成功')

    // 1. 通知表
    const createNotificationsTable = `
      CREATE TABLE notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'task',
        status TEXT NOT NULL DEFAULT 'pending',
        priority INTEGER NOT NULL DEFAULT 1,
        start_date TEXT,
        end_date TEXT,
        creator_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `

    // 2. 通知接收者表
    const createNotificationRecipientsTable = `
      CREATE TABLE notification_recipients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        notification_id INTEGER NOT NULL,
        recipient_id INTEGER NOT NULL,
        read_status TEXT NOT NULL DEFAULT 'unread',
        read_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
      );
    `

    // 3. 通知进度表
    const createNotificationProgressTable = `
      CREATE TABLE notification_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        notification_id INTEGER NOT NULL,
        progress INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'in_progress',
        description TEXT,
        updated_by INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
      );
    `

    // 4. 提醒规则表
    const createReminderRulesTable = `
      CREATE TABLE reminder_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rule_type TEXT NOT NULL,
        rule_name TEXT NOT NULL,
        rule_value TEXT NOT NULL,
        reminder_days INTEGER NOT NULL DEFAULT 0,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `

    // 5. 提醒历史表
    const createReminderHistoryTable = `
      CREATE TABLE reminder_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rule_id INTEGER NOT NULL,
        resident_id INTEGER NOT NULL,
        reminder_type TEXT NOT NULL,
        reminder_content TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'unread',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (rule_id) REFERENCES reminder_rules(id) ON DELETE CASCADE
      );
    `

    // 执行创建表的SQL语句
    db.run(createNotificationsTable, function (err) {
      if (err) {
        console.error('创建通知表失败:', err.message)
        return
      }
      console.log('通知表创建成功')

      db.run(createNotificationRecipientsTable, function (err) {
        if (err) {
          console.error('创建通知接收者表失败:', err.message)
          return
        }
        console.log('通知接收者表创建成功')

        db.run(createNotificationProgressTable, function (err) {
          if (err) {
            console.error('创建通知进度表失败:', err.message)
            return
          }
          console.log('通知进度表创建成功')

          db.run(createReminderRulesTable, function (err) {
            if (err) {
              console.error('创建提醒规则表失败:', err.message)
              return
            }
            console.log('提醒规则表创建成功')

            db.run(createReminderHistoryTable, function (err) {
              if (err) {
                console.error('创建提醒历史表失败:', err.message)
                return
              }
              console.log('提醒历史表创建成功')
              console.log('所有通知系统相关表创建完成')

              // 插入默认的提醒规则
              insertDefaultReminderRules()
            })
          })
        })
      })
    })
  })
}

// 插入默认的提醒规则
function insertDefaultReminderRules() {
  console.log('开始插入默认提醒规则...')

  const defaultRules = [
    {
      rule_type: 'age',
      rule_name: '60岁提醒',
      rule_value: '60',
      reminder_days: 1,
      description: '居民满60岁前1天提醒'
    },
    {
      rule_type: 'age',
      rule_name: '80岁提醒',
      rule_value: '80',
      reminder_days: 7,
      description: '居民满80岁前7天提醒'
    },
    {
      rule_type: 'age',
      rule_name: '90岁提醒',
      rule_value: '90',
      reminder_days: 14,
      description: '居民满90岁前14天提醒'
    },
    {
      rule_type: 'age',
      rule_name: '100岁提醒',
      rule_value: '100',
      reminder_days: 30,
      description: '居民满100岁前30天提醒'
    }
  ]

  const insertRuleSql = `
    INSERT OR IGNORE INTO reminder_rules (rule_type, rule_name, rule_value, reminder_days, description, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `

  defaultRules.forEach((rule) => {
    db.run(
      insertRuleSql,
      [
        rule.rule_type,
        rule.rule_name,
        rule.rule_value,
        rule.reminder_days,
        rule.description,
        'active'
      ],
      function (err) {
        if (err) {
          console.error('插入默认提醒规则失败:', err.message)
          return
        }
        console.log(`插入默认提醒规则成功: ${rule.rule_name}`)
      }
    )
  })
}

// 运行创建表的函数
createNotificationTables()
