const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const dbPath = path.join(__dirname, 'app.db')
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message)
    process.exit(1)
  }
  console.log('成功连接到数据库:', dbPath)
})

// 创建班子成员表
db.run(
  `
  CREATE TABLE IF NOT EXISTS committee_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resident_id INTEGER NOT NULL,
    organization_type TEXT NOT NULL,
    term_number INTEGER NOT NULL,
    term_start_date TEXT,
    term_end_date TEXT,
    position TEXT,
    status TEXT DEFAULT 'current',
    remarks TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resident_id) REFERENCES residents(id)
  )
`,
  (err) => {
    if (err) {
      console.error('创建 committee_members 表失败:', err.message)
    } else {
      console.log('committee_members 表创建成功')
    }
  }
)

// 创建索引
const indexes = [
  'CREATE INDEX IF NOT EXISTS idx_committee_members_resident_id ON committee_members(resident_id)',
  'CREATE INDEX IF NOT EXISTS idx_committee_members_org_type ON committee_members(organization_type)',
  'CREATE INDEX IF NOT EXISTS idx_committee_members_term ON committee_members(organization_type, term_number)',
  'CREATE INDEX IF NOT EXISTS idx_committee_members_status ON committee_members(status)',
  'CREATE INDEX IF NOT EXISTS idx_committee_members_position ON committee_members(position)'
]

let completed = 0
indexes.forEach((sql, index) => {
  db.run(sql, (err) => {
    if (err) {
      console.error(`创建索引 ${index + 1} 失败:`, err.message)
    } else {
      console.log(`索引 ${index + 1} 创建成功`)
    }
    completed++
    if (completed === indexes.length) {
      console.log('所有索引创建完成')
      db.close()
    }
  })
})

// 插入职务字典数据
const positions = [
  // 支部委员会
  { org: 'branch_committee', position: '书记' },
  { org: 'branch_committee', position: '副书记' },
  { org: 'branch_committee', position: '委员' },
  // 村民委员会
  { org: 'villager_committee', position: '主任' },
  { org: 'villager_committee', position: '副主任' },
  { org: 'villager_committee', position: '委员' },
  // 集体经济组织理事会
  { org: 'collective_council', position: '理事长' },
  { org: 'collective_council', position: '副理事长' },
  { org: 'collective_council', position: '理事' },
  // 集体经济组织监事会
  { org: 'collective_supervisors', position: '监事长' },
  { org: 'collective_supervisors', position: '监事' },
  // 村务监督委员会
  { org: 'village_supervisors', position: '主任' },
  { org: 'village_supervisors', position: '委员' },
  // 村民小组长
  { org: 'village_group_leader', position: '村民小组长' },
  // 村民代表
  { org: 'village_representative', position: '村民代表' },
  // 青年团妇组织
  { org: 'youth_women', position: '团委书记' },
  { org: 'youth_women', position: '妇联主任' }
]

// 检查字典表是否存在并插入数据
db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='dictionaries'", (err, rows) => {
  if (err) {
    console.error('查询字典表失败:', err.message)
    return
  }

  if (rows.length === 0) {
    console.log('字典表不存在，跳过职务字典插入')
    return
  }

  console.log('开始插入职务字典数据...')

  const insertSql = `INSERT OR IGNORE INTO dictionaries (category, key, value, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`
  let count = 0

  positions.forEach((pos) => {
    db.run(insertSql, ['position', `${pos.org}_${pos.position}`, pos.position], (err) => {
      if (err) {
        console.error(`插入职务 ${pos.position} 失败:`, err.message)
      }
      count++
      if (count === positions.length) {
        console.log(`职务字典插入完成，共 ${positions.length} 条`)
      }
    })
  })
})

console.log('班子成员模块初始化完成！')
