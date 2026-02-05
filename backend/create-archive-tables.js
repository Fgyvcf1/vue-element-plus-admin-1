// 创建人民调解档案管理系统的数据库表
const db = require('./db.js');

console.log('=== 创建人民调解档案管理系统表结构 ===\n');

// 创建档案主表
const createArchivesTable = `
CREATE TABLE IF NOT EXISTS mediation_archives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  archive_id VARCHAR(50) UNIQUE NOT NULL,
  prefix VARCHAR(20) NOT NULL,
  sequence_number INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

// 创建调解申请书表
const createApplicationsTable = `
CREATE TABLE IF NOT EXISTS mediation_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  archive_id VARCHAR(50) NOT NULL UNIQUE,
  dispute_type VARCHAR(50) NOT NULL,
  dispute_description TEXT NOT NULL,
  request_content TEXT NOT NULL,
  occurrence_date DATE,
  occurrence_location VARCHAR(200),
  apply_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (archive_id) REFERENCES mediation_archives(archive_id) ON DELETE CASCADE
);
`;

// 创建申请人表
const createApplicantsTable = `
CREATE TABLE IF NOT EXISTS mediation_applicants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  archive_id VARCHAR(50) NOT NULL,
  is_resident INTEGER DEFAULT 0,
  resident_id INTEGER,
  name VARCHAR(50) NOT NULL,
  id_card VARCHAR(18),
  phone VARCHAR(20),
  address TEXT,
  relationship VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (archive_id) REFERENCES mediation_archives(archive_id) ON DELETE CASCADE,
  FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE SET NULL
);
`;

// 创建被申请人表
const createRespondentsTable = `
CREATE TABLE IF NOT EXISTS mediation_respondents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  archive_id VARCHAR(50) NOT NULL,
  is_resident INTEGER DEFAULT 0,
  resident_id INTEGER,
  name VARCHAR(50) NOT NULL,
  id_card VARCHAR(18),
  phone VARCHAR(20),
  address TEXT,
  relationship VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (archive_id) REFERENCES mediation_archives(archive_id) ON DELETE CASCADE,
  FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE SET NULL
);
`;

// 创建调解记录表
const createRecordsTable = `
CREATE TABLE IF NOT EXISTS mediation_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  archive_id VARCHAR(50) NOT NULL UNIQUE,
  mediation_date DATE NOT NULL,
  mediation_location VARCHAR(100),
  mediators TEXT NOT NULL,
  process_record TEXT NOT NULL,
  mediation_result TEXT,
  agreement VARCHAR(10) DEFAULT 'no',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (archive_id) REFERENCES mediation_archives(archive_id) ON DELETE CASCADE
);
`;

// 创建调解协议书表
const createAgreementsTable = `
CREATE TABLE IF NOT EXISTS mediation_agreements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  archive_id VARCHAR(50) NOT NULL UNIQUE,
  agreement_date DATE NOT NULL,
  agreement_content TEXT NOT NULL,
  performance_period VARCHAR(100),
  breach_liability TEXT,
  party_a_sign VARCHAR(50),
  party_b_sign VARCHAR(50),
  mediator_sign VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (archive_id) REFERENCES mediation_archives(archive_id) ON DELETE CASCADE
);
`;

// 创建档案编号序号表
const createSequencesTable = `
CREATE TABLE IF NOT EXISTS archive_sequences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prefix VARCHAR(20) UNIQUE NOT NULL,
  current_number INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

// 创建附件表
const createAttachmentsTable = `
CREATE TABLE IF NOT EXISTS archive_attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  archive_id VARCHAR(50) NOT NULL,
  record_id INTEGER,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (archive_id) REFERENCES mediation_archives(archive_id) ON DELETE CASCADE,
  FOREIGN KEY (record_id) REFERENCES mediation_records(id) ON DELETE CASCADE
);
`;

// 初始化默认档案编号前缀
const initPrefixes = `
INSERT INTO archive_sequences (prefix, current_number) VALUES 
  ('大车村', 0),
  ('茶地坪组', 0),
  ('一组', 0),
  ('二组', 0),
  ('三组', 0)
ON CONFLICT(prefix) DO UPDATE SET current_number = 0;
`;

// 创建索引
const createIndexes = `
CREATE INDEX IF NOT EXISTS idx_archives_archive_id ON mediation_archives(archive_id);
CREATE INDEX IF NOT EXISTS idx_archives_status ON mediation_archives(status);
CREATE INDEX IF NOT EXISTS idx_archives_prefix ON mediation_archives(prefix);
CREATE INDEX IF NOT EXISTS idx_applications_archive_id ON mediation_applications(archive_id);
CREATE INDEX IF NOT EXISTS idx_applicants_archive_id ON mediation_applicants(archive_id);
CREATE INDEX IF NOT EXISTS idx_respondents_archive_id ON mediation_respondents(archive_id);
CREATE INDEX IF NOT EXISTS idx_records_archive_id ON mediation_records(archive_id);
CREATE INDEX IF NOT EXISTS idx_agreements_archive_id ON mediation_agreements(archive_id);
CREATE INDEX IF NOT EXISTS idx_attachments_archive_id ON archive_attachments(archive_id);
CREATE INDEX IF NOT EXISTS idx_attachments_record_id ON archive_attachments(record_id);
`;

const tables = [
  { sql: createArchivesTable, name: '档案主表 (mediation_archives)' },
  { sql: createSequencesTable, name: '档案编号序号表 (archive_sequences)' },
  { sql: createApplicationsTable, name: '调解申请书表 (mediation_applications)' },
  { sql: createApplicantsTable, name: '申请人表 (mediation_applicants)' },
  { sql: createRespondentsTable, name: '被申请人表 (mediation_respondents)' },
  { sql: createRecordsTable, name: '调解记录表 (mediation_records)' },
  { sql: createAgreementsTable, name: '调解协议书表 (mediation_agreements)' },
  { sql: createAttachmentsTable, name: '附件表 (archive_attachments)' }
];

const initData = [
  { sql: initPrefixes, name: '初始化默认前缀数据' }
];

const createIndexData = [
  { sql: createIndexes, name: '创建索引' }
];

let completed = 0;
const total = tables.length + initData.length + createIndexData.length;

const executeSql = (sql, name) => {
  db.run(sql, (err) => {
    completed++;
    if (err) {
      console.log(`❌ ${name}: ${err.message}`);
    } else {
      console.log(`✅ ${name}: 成功`);
    }
    
    if (completed === total) {
      console.log('\n=== 所有表创建完成 ===');
      db.close();
    }
  });
};

console.log('准备创建以下表:');
tables.forEach(t => console.log(`  - ${t.name}`));
console.log('准备初始化数据:');
initData.forEach(t => console.log(`  - ${t.name}`));
console.log('准备创建索引:');
createIndexData.forEach(t => console.log(`  - ${t.name}`));
console.log('');

// 先创建所有表
tables.forEach(table => executeSql(table.sql, table.name));

// 等待表创建完成后再初始化数据
setTimeout(() => {
  initData.forEach(data => executeSql(data.sql, data.name));
}, 500);

// 再等待数据初始化完成后创建索引
setTimeout(() => {
  createIndexData.forEach(index => executeSql(index.sql, index.name));
}, 1000);
