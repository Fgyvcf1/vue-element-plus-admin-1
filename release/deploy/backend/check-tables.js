const db = require('./db')

async function checkAndCreateTables() {
  try {
    // 检查表是否存在
    const [tables] = await db.pool.execute("SHOW TABLES LIKE 'low_income%'")
    console.log('现有表:', tables)

    if (tables.length === 0) {
      console.log('表不存在，尝试创建...')

      // 创建低收入人员表
      const createPersonsTable = `
        CREATE TABLE IF NOT EXISTS low_income_persons (
          id BIGINT PRIMARY KEY AUTO_INCREMENT,
          resident_id BIGINT NOT NULL,
          low_income_type VARCHAR(50) NOT NULL COMMENT '低收入类型（享受政策）',
          approval_date DATE COMMENT '审批日期',
          status ENUM('active', 'suspended', 'cancelled') DEFAULT 'active' COMMENT '状态',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE,
          INDEX idx_resident_id (resident_id),
          INDEX idx_status (status),
          INDEX idx_low_income_type (low_income_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `

      // 创建政策记录表
      const createPolicyRecordsTable = `
        CREATE TABLE IF NOT EXISTS low_income_policy_records (
          id BIGINT PRIMARY KEY AUTO_INCREMENT,
          low_income_person_id BIGINT NOT NULL,
          policy_type VARCHAR(50) COMMENT '政策类型',
          enjoy_level VARCHAR(50) COMMENT '享受档次',
          has_subsidy BOOLEAN DEFAULT FALSE COMMENT '是否有补贴',
          start_date DATE COMMENT '开始日期',
          end_date DATE COMMENT '结束日期',
          subsidy_amount DECIMAL(10, 2) COMMENT '补贴金额',
          subsidy_cycle VARCHAR(20) COMMENT '补贴周期',
          account_name VARCHAR(50) COMMENT '账户名称',
          account_relationship VARCHAR(50) COMMENT '与开户人关系',
          bank_name VARCHAR(100) COMMENT '银行名称',
          bank_account VARCHAR(50) COMMENT '银行账户',
          status ENUM('active', 'expired', 'adjusted') DEFAULT 'active' COMMENT '状态',
          remark TEXT COMMENT '备注',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (low_income_person_id) REFERENCES low_income_persons(id) ON DELETE CASCADE,
          INDEX idx_low_income_person_id (low_income_person_id),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `

      await db.pool.execute(createPersonsTable)
      console.log('✅ low_income_persons 表创建成功')

      await db.pool.execute(createPolicyRecordsTable)
      console.log('✅ low_income_policy_records 表创建成功')
    } else {
      console.log('✅ 表已存在')
    }

    // 再次检查
    const [finalTables] = await db.pool.execute("SHOW TABLES LIKE 'low_income%'")
    console.log('最终表列表:', finalTables)

    process.exit(0)
  } catch (error) {
    console.error('❌ 错误:', error.message)
    process.exit(1)
  }
}

checkAndCreateTables()
