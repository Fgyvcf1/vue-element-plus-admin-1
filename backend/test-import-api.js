const express = require('express');
const router = express.Router();
const db = require('./db');

// 测试导入API端点 - 只用于测试家庭创建
router.post('/test-import-api', (req, res) => {
  console.log('收到测试导入请求...');
  
  try {
    // 生成唯一的家庭编号
    const householdNumber = `HH${Date.now()}${Math.floor(Math.random() * 1000)}`;
    console.log('测试家庭编号:', householdNumber);
    
    // 使用正确的SQL语句格式
    const insertHouseholdSql = `INSERT INTO households 
      (household_number, village_group, household_head_name, household_head_id_card, ethnicity, 
       gender, status, registered_date, household_type, housing_type, address, phone_number) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const householdParams = [
      householdNumber,
      '测试组',
      '测试户主',
      '110101199001011234',
      '汉族',
      '男',
      'active',
      new Date().toISOString().split('T')[0],
      '农业户口',
      '自有住房',
      '测试地址',
      '13800138000'
    ];
    
    console.log('执行SQL:', insertHouseholdSql);
    console.log('参数:', householdParams);
    
    db.run(insertHouseholdSql, householdParams, function(err) {
      if (err) {
        console.error('创建家庭失败:', err.message);
        return res.status(500).json({ code: 500, message: '创建家庭失败', error: err.message });
      }
      
      console.log('创建家庭成功，ID:', this.lastID);
      res.json({ code: 20000, message: '创建家庭成功', data: { householdId: this.lastID, householdNumber } });
    });
  } catch (error) {
    console.error('测试导入API发生异常:', error.message);
    res.status(500).json({ code: 500, message: '测试导入API发生异常', error: error.message });
  }
});

module.exports = router;
