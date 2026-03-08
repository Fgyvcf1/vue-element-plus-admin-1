// 创建缺失的调解相关表
const db = require('./db.js')

console.log('=== 创建调解相关表 ===\n')

// 创建mediation_types表（调解类型表）
const createMediationTypes = `
CREATE TABLE IF NOT EXISTS mediation_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type_name VARCHAR(50) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`

// 创建mediation_cases表（调解案件表）
const createMediationCases = `
CREATE TABLE IF NOT EXISTS mediation_cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_number VARCHAR(50) NOT NULL,
  case_name VARCHAR(100) NOT NULL,
  case_type VARCHAR(50) NOT NULL,
  applicant_id INTEGER NOT NULL,
  respondent_id INTEGER NOT NULL,
  mediator_id INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  case_status VARCHAR(20) DEFAULT 'pending',
  dispute_description TEXT,
  mediation_result VARCHAR(100),
  follow_up_status VARCHAR(20),
  remark TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (applicant_id) REFERENCES residents(id),
  FOREIGN KEY (respondent_id) REFERENCES residents(id),
  FOREIGN KEY (mediator_id) REFERENCES mediators(id)
);
`

// 初始化默认调解类型数据
const initMediationTypes = `
INSERT INTO mediation_types (type_name, description) VALUES 
('邻里纠纷', '邻里之间因生活琐事产生的纠纷'),
('家庭纠纷', '家庭成员之间的纠纷'),
('婚姻纠纷', '婚姻关系相关的纠纷'),
('财产纠纷', '财产权益相关的纠纷'),
('合同纠纷', '合同履行相关的纠纷'),
('劳动纠纷', '劳动权益相关的纠纷'),
('其他纠纷', '其他类型的纠纷')
ON CONFLICT DO NOTHING;
`

// 执行创建表和初始化数据
let completed = 0
const total = 3

const executeSql = (sql, description) => {
  db.run(sql, (err) => {
    completed++
    if (err) {
      console.log(`❌ ${description}: ${err.message}`)
    } else {
      console.log(`✅ ${description}: 成功`)
    }

    if (completed === total) {
      console.log('\n=== 所有操作完成 ===')
      process.exit(0)
    }
  })
}

// 开始执行
executeSql(createMediationTypes, '创建调解类型表')
executeSql(createMediationCases, '创建调解案件表')
executeSql(initMediationTypes, '初始化调解类型数据')
