// 修复调解相关表的自增ID问题
const db = require('./db.js')

console.log('=== 修复调解相关表自增ID ===\n')

// 修复 mediation_archives 表
const fixArchivesTable = `
ALTER TABLE mediation_archives 
MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY;
`

// 修复 mediation_applications 表
const fixApplicationsTable = `
ALTER TABLE mediation_applications 
MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY;
`

// 修复 mediation_applicants 表
const fixApplicantsTable = `
ALTER TABLE mediation_applicants 
MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY;
`

// 修复 mediation_respondents 表
const fixRespondentsTable = `
ALTER TABLE mediation_respondents 
MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY;
`

// 修复 mediation_records 表
const fixRecordsTable = `
ALTER TABLE mediation_records 
MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY;
`

// 修复 mediation_agreements 表
const fixAgreementsTable = `
ALTER TABLE mediation_agreements 
MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY;
`

// 修复 archive_attachments 表
const fixAttachmentsTable = `
ALTER TABLE archive_attachments 
MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY;
`

// 修复 archive_sequences 表
const fixSequencesTable = `
ALTER TABLE archive_sequences 
MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY;
`

const fixes = [
  { sql: fixArchivesTable, name: 'mediation_archives' },
  { sql: fixApplicationsTable, name: 'mediation_applications' },
  { sql: fixApplicantsTable, name: 'mediation_applicants' },
  { sql: fixRespondentsTable, name: 'mediation_respondents' },
  { sql: fixRecordsTable, name: 'mediation_records' },
  { sql: fixAgreementsTable, name: 'mediation_agreements' },
  { sql: fixAttachmentsTable, name: 'archive_attachments' },
  { sql: fixSequencesTable, name: 'archive_sequences' }
]

let completed = 0

const executeFix = async (fix) => {
  try {
    await db.pool.execute(fix.sql)
    console.log(`✅ ${fix.name}: 修复成功`)
  } catch (err) {
    console.log(`❌ ${fix.name}: ${err.message}`)
  }

  completed++
  if (completed === fixes.length) {
    console.log('\n=== 所有表修复完成 ===')
    process.exit(0)
  }
}

console.log('开始修复以下表:')
fixes.forEach((f) => console.log(`  - ${f.name}`))
console.log('')

// 依次执行修复
fixes.forEach((fix, index) => {
  setTimeout(() => executeFix(fix), index * 500)
})
