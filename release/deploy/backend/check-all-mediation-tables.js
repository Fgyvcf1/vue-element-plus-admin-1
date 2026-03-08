const db = require('./db.js')

const tables = [
  'mediation_archives',
  'mediation_applications',
  'mediation_applicants',
  'mediation_respondents',
  'mediation_records',
  'mediation_agreements',
  'mediation_investigations',
  'mediation_case_analysis'
]

async function checkTables() {
  for (const table of tables) {
    try {
      const rows = await new Promise((resolve, reject) => {
        db.all(`SHOW CREATE TABLE ${table}`, [], (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        })
      })

      console.log(`\n========================`)
      console.log(`${table} 表结构:`)
      console.log(`========================`)

      // 解析表结构，检查id字段
      const createTable = rows[0]['Create Table']
      const lines = createTable.split('\n')

      lines.forEach((line) => {
        if (
          line.includes('`id`') ||
          line.includes('PRIMARY KEY') ||
          line.includes('AUTO_INCREMENT')
        ) {
          console.log(line.trim())
        }
      })
    } catch (err) {
      console.log(`\n${table}: 表不存在或查询失败 - ${err.message}`)
    }
  }
  process.exit(0)
}

checkTables()
