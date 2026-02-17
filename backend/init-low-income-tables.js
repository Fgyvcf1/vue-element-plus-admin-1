/**
 * 低收入人员管理模块 - MariaDB 数据库表初始化脚本
 * 从 SQLite 迁移到 MariaDB
 */

const db = require('./db')

async function initLowIncomeTables() {
  try {
    console.log('开始初始化低收入人员管理模块数据库表...')

    // 1. 创建低收入人员主表
    await db.pool.execute(`
      CREATE TABLE IF NOT EXISTS low_income_persons (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        resident_id BIGINT NOT NULL,
        low_income_type VARCHAR(50) NOT NULL COMMENT '低收入类型（享受政策）',
        apply_date DATE COMMENT '申请日期',
        approval_date DATE COMMENT '审批日期',
        status VARCHAR(20) DEFAULT 'active' COMMENT '状态：active(在享)/suspended(暂停)/cancelled(取消)',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_resident_id (resident_id),
        INDEX idx_status (status),
        INDEX idx_low_income_type (low_income_type),
        FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='低收入人员主表'
    `)
    console.log('✅ low_income_persons 表创建成功')

    // 2. 创建低收入政策享受记录表
    await db.pool.execute(`
      CREATE TABLE IF NOT EXISTS low_income_policy_records (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        low_income_person_id BIGINT NOT NULL,
        policy_type VARCHAR(50) NOT NULL COMMENT '政策类型',
        start_date DATE NOT NULL COMMENT '开始日期',
        end_date DATE COMMENT '结束日期',
        subsidy_amount DECIMAL(10,2) COMMENT '补助金额',
        subsidy_cycle VARCHAR(20) COMMENT '补助周期：monthly(月)/quarterly(季)/yearly(年)',
        enjoy_level VARCHAR(20) COMMENT '享受档次',
        bank_account VARCHAR(100) COMMENT '银行账户',
        account_name VARCHAR(100) COMMENT '账户名称',
        bank_name VARCHAR(100) COMMENT '银行名称',
        account_relationship VARCHAR(50) COMMENT '与开户人关系',
        status VARCHAR(20) DEFAULT 'active' COMMENT '状态',
        remark VARCHAR(255) COMMENT '备注',
        has_subsidy BOOLEAN DEFAULT false COMMENT '是否有补贴',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_low_income_person_id (low_income_person_id),
        INDEX idx_status (status),
        INDEX idx_policy_type (policy_type),
        FOREIGN KEY (low_income_person_id) REFERENCES low_income_persons(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='低收入政策享受记录表'
    `)
    console.log('✅ low_income_policy_records 表创建成功')

    // 3. 插入字典数据（如果不存在）
    const dictionaries = [
      { category: '享受政策', value: '最低生活保证金', label: '最低生活保证金' },
      { category: '享受政策', value: '事实无人抚养儿童', label: '事实无人抚养儿童' },
      { category: '享受政策', value: '低保边缘户', label: '低保边缘户' },
      { category: '享受政策', value: '特困供养户', label: '特困供养户' },
      { category: '档次', value: 'A档', label: 'A档' },
      { category: '档次', value: 'B档', label: 'B档' },
      { category: '档次', value: 'C档', label: 'C档' },
      { category: '补贴周期', value: 'monthly', label: '按月' },
      { category: '补贴周期', value: 'quarterly', label: '按季' },
      { category: '补贴周期', value: 'yearly', label: '按年' }
    ]

    for (const dict of dictionaries) {
      try {
        await db.pool.execute(
          `
          INSERT INTO dictionaries (category, value, label, status, created_at, updated_at)
          VALUES (?, ?, ?, 'active', NOW(), NOW())
          ON DUPLICATE KEY UPDATE updated_at = NOW()
        `,
          [dict.category, dict.value, dict.label]
        )
      } catch (err) {
        // 如果表不存在或重复，忽略错误
        console.log(`字典数据插入（可能已存在）: ${dict.category} - ${dict.value}`)
      }
    }
    console.log('✅ 字典数据初始化完成')

    console.log('\n🎉 低收入人员管理模块数据库表初始化完成！')
    process.exit(0)
  } catch (error) {
    console.error('❌ 初始化失败:', error.message)
    process.exit(1)
  }
}

// 执行初始化
initLowIncomeTables()
