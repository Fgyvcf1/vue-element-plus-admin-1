#!/usr/bin/env node

const db = require('./db');

// 测试数据：1966年2月8日出生，2026年1月9日检查时应该触发60岁提前30天提醒
const testResident = {
  name: '测试年龄提醒人员',
  gender: '男',
  dateOfBirth: '1966-02-08',
  idCard: '11010119660208001X', // 使用唯一的身份证号
  villageGroup: '测试村组',
  household_id: 1, // 假设存在ID为1的户
  relationship_to_head: '户主',
  ethnicity: '汉族',
  marital_status: '已婚',
  political_status: '党员',
  military_service: '已服兵役',
  education_level: '高中',
  phone_number: '13800138000',
  Home_address: '测试地址123号',
  bank_card: '6225880012345678',
  bank_name: '测试银行',
  status: 'active'
};

console.log('准备添加测试居民数据...');
console.log('姓名:', testResident.name);
console.log('出生日期:', testResident.dateOfBirth);
console.log('身份证号:', testResident.idCard);
console.log('性别:', testResident.gender);

// 检查该身份证号是否已存在
const checkSql = 'SELECT id, name, date_of_birth FROM residents WHERE id_card = ?';
db.get(checkSql, [testResident.idCard], (err, row) => {
  if (err) {
    console.error('检查居民是否存在时出错:', err.message);
    process.exit(1);
  }
  
  if (row) {
    console.log(`❌ 该身份证号已存在！`);
    console.log(`   已有居民: ${row.name}, 出生日期: ${row.date_of_birth}`);
    console.log('   如需重新测试，请先删除该居民或使用其他身份证号');
    process.exit(1);
  }
  
  // 插入测试数据
  const insertSql = `INSERT INTO residents 
                     (household_id, name, gender, date_of_birth, id_card, relationship_to_head, ethnicity, 
                      marital_status, political_status, military_service, bank_card, bank_name, village_group, 
                      education_level, phone_number, registered_date, status, Home_address) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  const params = [
    testResident.household_id,
    testResident.name,
    testResident.gender,
    testResident.dateOfBirth,
    testResident.idCard,
    testResident.relationship_to_head,
    testResident.ethnicity,
    testResident.marital_status,
    testResident.political_status,
    testResident.military_service,
    testResident.bank_card,
    testResident.bank_name,
    testResident.villageGroup,
    testResident.education_level,
    testResident.phone_number,
    new Date().toISOString().split('T')[0], // registered_date
    testResident.status,
    testResident.Home_address
  ];
  
  db.run(insertSql, params, function(err) {
    if (err) {
      console.error('❌ 添加测试居民失败:', err.message);
      process.exit(1);
    }
    
    console.log(`✅ 测试居民添加成功！`);
    console.log(`   居民ID: ${this.lastID}`);
    console.log(`   姓名: ${testResident.name}`);
    console.log(`   出生日期: ${testResident.dateOfBirth}`);
    console.log(`   当前年龄计算: 2026 - 1966 = 60岁，但生日在2月8日，现在是1月9日所以实际59岁`);
    console.log(`   距离60岁生日: 30天`);
    console.log(`   预期: 应该触发60岁提前30天提醒`);
    console.log('');
    console.log('下一步操作:');
    console.log('1. 重启后端服务（如果正在运行）');
    console.log('2. 访问 http://localhost:3000/api/check-age-reminders 手动触发检查');
    console.log('3. 或在浏览器控制台调用 checkAgeReminders() 函数');
    console.log('4. 检查通知列表和铃铛是否显示年龄提醒');
    
    process.exit(0);
  });
});