const sqlite3 = require('sqlite3').verbose()
const path = require('path')

// 连接到app.db数据库
const dbPath = path.join(__dirname, 'app.db')
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('连接app.db数据库失败:', err.message)
    process.exit(1)
  } else {
    console.log('成功连接到app.db数据库')
  }
})

// 检查表是否存在的函数
function tableExists(tableName) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`,
      (err, row) => {
        if (err) {
          reject(err)
          return
        }
        resolve(!!row)
      }
    )
  })
}

// 执行SQL语句的函数
function executeSql(sql) {
  return new Promise((resolve, reject) => {
    db.run(sql, (err) => {
      if (err) {
        reject(err)
        return
      }
      resolve()
    })
  })
}

// 移植表的函数
async function migrateTables() {
  try {
    // 特殊人群相关表的创建语句
    const tables = [
      {
        name: 'disabled_persons',
        sql: `CREATE TABLE IF NOT EXISTS disabled_persons (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          resident_id INTEGER NOT NULL,
          disability_type VARCHAR(50),
          disability_level INTEGER,
          certificate_number VARCHAR(50),
          issue_date DATE,
          validity_period DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (resident_id) REFERENCES residents(id)
        )`
      },
      {
        name: 'low_income_persons',
        sql: `CREATE TABLE IF NOT EXISTS low_income_persons (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          resident_id INTEGER NOT NULL,
          low_income_type VARCHAR(50) NOT NULL,
          apply_date DATE,
          approval_date DATE,
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (resident_id) REFERENCES residents(id)
        )`
      },
      {
        name: 'low_income_policy_records',
        sql: `CREATE TABLE IF NOT EXISTS low_income_policy_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          low_income_person_id INTEGER NOT NULL,
          policy_type VARCHAR(50) NOT NULL,
          has_subsidy BOOLEAN DEFAULT FALSE,
          start_date DATE NOT NULL,
          end_date DATE,
          subsidy_amount DECIMAL(10,2),
          subsidy_cycle VARCHAR(20),
          enjoy_level VARCHAR(20),
          account_name VARCHAR(100),
          account_relationship VARCHAR(50),
          bank_name VARCHAR(100),
          bank_account VARCHAR(50),
          status VARCHAR(20) DEFAULT 'active',
          remark VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (low_income_person_id) REFERENCES low_income_persons(id)
        )`
      }
    ]

    // 遍历创建表
    for (const table of tables) {
      const exists = await tableExists(table.name)
      if (exists) {
        console.log(`表 ${table.name} 已存在，跳过创建`)
      } else {
        console.log(`开始创建表 ${table.name}...`)
        await executeSql(table.sql)
        console.log(`表 ${table.name} 创建成功`)
      }
    }

    // 验证创建结果
    console.log('\n=== 移植结果验证 ===')
    for (const table of tables) {
      const exists = await tableExists(table.name)
      console.log(`${table.name}: ${exists ? '✓ 已存在' : '✗ 不存在'}`)
    }

    console.log('\n特殊人群相关表移植完成！')
  } catch (err) {
    console.error('移植表失败:', err.message)
  } finally {
    db.close()
  }
}

// 执行移植
migrateTables()
