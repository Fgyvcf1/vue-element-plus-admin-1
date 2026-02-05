const db = require('./db');

// 直接测试SQL语句执行
function testSqlDirect() {
  console.log('直接测试SQL语句执行...');
  
  // 生成唯一的家庭编号
  const householdNumber = `HH${Date.now()}${Math.floor(Math.random() * 1000)}`;
  console.log('测试家庭编号:', householdNumber);
  
  // 包含更多必填字段的SQL语句
  const insertSql = `INSERT INTO households (household_number, village_group, household_head_name, household_head_id_card, ethnicity, gender, status, registered_date, household_type, housing_type, address, phone_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  const params = [
    householdNumber,
    '测试组', // village_group
    '测试户主', // household_head_name
    '110101199001011234', // household_head_id_card
    '汉族', // ethnicity
    '男', // gender
    'active', // status
    new Date().toISOString().split('T')[0], // registered_date
    '农业户口', // household_type
    '自有住房', // housing_type
    '测试地址', // address
    '13800138000' // phone_number
  ];
  
  console.log('执行SQL:', insertSql);
  console.log('参数:', params);
  
  db.run(insertSql, params, function(err) {
    if (err) {
      console.error('SQL执行失败:', err.message);
      return;
    }
    console.log('SQL执行成功，插入ID:', this.lastID);
    
    // 查询刚插入的记录
    db.get("SELECT * FROM households WHERE id = ?", [this.lastID], (err, row) => {
      if (err) {
        console.error('查询失败:', err.message);
        return;
      }
      console.log('查询结果:', row);
    });
  });
}

// 运行测试
testSqlDirect();
