const sqlite3 = require('sqlite3').verbose()
const path = require('path')

// 连接到SQLite数据库
const dbPath = path.join(__dirname, 'app.db')
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('连接数据库失败:', err.message)
    process.exit(1)
  }
  console.log('成功连接到SQLite数据库\n')
})

// 创建班子成员表
const createCommitteeMembersTable = `
CREATE TABLE IF NOT EXISTS committee_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  resident_id INTEGER NOT NULL,
  organization_type TEXT NOT NULL,
  term_number INTEGER NOT NULL,
  term_start_date TEXT NOT NULL,
  term_end_date TEXT,
  position TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'current',
  remarks TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (resident_id) REFERENCES residents(id),
  CHECK (
    organization_type IN (
      'branch_committee',
      'village_committee',
      'economic_council',
      'economic_supervisor',
      'supervisory_committee',
      'group_leader',
      'village_representative',
      'youth_women_org'
    ) AND
    status IN ('current', 'history')
  )
)
`

db.run(createCommitteeMembersTable, (err) => {
  if (err) {
    console.error('创建 committee_members 表失败:', err.message)
    db.close()
    process.exit(1)
  }

  console.log('✓ committee_members 表创建成功！\n')

  // 创建索引
  const indexes = [
    { name: 'idx_committee_members_resident_id', column: 'resident_id' },
    { name: 'idx_committee_members_org_type', column: 'organization_type' },
    { name: 'idx_committee_members_status', column: 'status' },
    { name: 'idx_committee_members_term_number', column: 'term_number' },
    { name: 'idx_committee_members_org_term', column: 'organization_type, term_number' }
  ]

  let indexCount = 0
  indexes.forEach((idx) => {
    const sql = `CREATE INDEX IF NOT EXISTS ${idx.name} ON committee_members(${idx.column});`
    db.run(sql, (err) => {
      if (err) {
        console.error(`创建索引 ${idx.name} 失败:`, err.message)
      } else {
        console.log(`✓ 索引 ${idx.name} 创建成功`)
      }
      indexCount++
      if (indexCount === indexes.length) {
        console.log('\n所有表和索引创建完成！')
        db.close()
      }
    })
  })
})

// 机构类型说明
/*
organization_type 字段可选值:
- branch_committee: 支部委员会
- village_committee: 村民委员会
- economic_council: 集体经济组织理事会
- economic_supervisor: 集体经济组织监事会
- supervisory_committee: 村务监督委员会
- group_leader: 村民小组长
- village_representative: 村民代表
- youth_women_org: 青年团妇组织

status 字段可选值:
- current: 现任
- history: 历届
*/
