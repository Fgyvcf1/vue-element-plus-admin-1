const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('app.db');

// 测试数据
const testData = [
  {
    low_income_person_id: 1,
    policy_type: '低保',
    has_subsidy: true,
    start_date: '2023-01-01',
    end_date: null,
    subsidy_amount: 500.00,
    subsidy_cycle: '月',
    account_name: '张三',
    account_relationship: '本人',
    bank_name: '中国银行',
    bank_account: '6222021234567890123',
    status: 'active',
    remark: ''
  },
  {
    low_income_person_id: 2,
    policy_type: '低保',
    has_subsidy: true,
    start_date: '2023-03-01',
    end_date: null,
    subsidy_amount: 450.00,
    subsidy_cycle: '月',
    account_name: '李四',
    account_relationship: '本人',
    bank_name: '中国农业银行',
    bank_account: '6228481234567890123',
    status: 'active',
    remark: ''
  },
  {
    low_income_person_id: 3,
    policy_type: '低保边缘户',
    has_subsidy: true,
    start_date: '2023-05-01',
    end_date: null,
    subsidy_amount: 300.00,
    subsidy_cycle: '月',
    account_name: '王五',
    account_relationship: '本人',
    bank_name: '中国建设银行',
    bank_account: '6217001234567890123',
    status: 'active',
    remark: ''
  },
  {
    low_income_person_id: 4,
    policy_type: '特困供养户',
    has_subsidy: true,
    start_date: '2023-07-01',
    end_date: null,
    subsidy_amount: 600.00,
    subsidy_cycle: '月',
    account_name: '赵六',
    account_relationship: '本人',
    bank_name: '中国工商银行',
    bank_account: '6222081234567890123',
    status: 'active',
    remark: ''
  },
  {
    low_income_person_id: 5,
    policy_type: '事实无人抚养儿童',
    has_subsidy: true,
    start_date: '2023-09-01',
    end_date: null,
    subsidy_amount: 700.00,
    subsidy_cycle: '月',
    account_name: '孙七',
    account_relationship: '监护人',
    bank_name: '中国邮政储蓄银行',
    bank_account: '6217991234567890123',
    status: 'active',
    remark: ''
  }
];

// 插入数据
const sql = `INSERT INTO low_income_policy_records (
  low_income_person_id, policy_type, has_subsidy, 
  start_date, end_date, subsidy_amount, subsidy_cycle,
  account_name, account_relationship, 
  bank_name, bank_account, status, remark
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

db.serialize(() => {
  // 开始事务
  db.run('BEGIN TRANSACTION');
  
  // 插入每条记录
  const stmt = db.prepare(sql);
  testData.forEach(data => {
    stmt.run(
      data.low_income_person_id,
      data.policy_type,
      data.has_subsidy,
      data.start_date,
      data.end_date,
      data.subsidy_amount,
      data.subsidy_cycle,
      data.account_name,
      data.account_relationship,
      data.bank_name,
      data.bank_account,
      data.status,
      data.remark
    );
  });
  
  stmt.finalize();
  
  // 提交事务
  db.run('COMMIT', (err) => {
    if (err) {
      console.error('插入数据失败:', err.message);
      db.run('ROLLBACK');
    } else {
      console.log('成功插入', testData.length, '条测试数据');
    }
    db.close();
  });
});
