const db = require('./db')

// 直接测试数据库操作
function testDirectSQL() {
  console.log('开始测试直接SQL操作...')

  // 生成唯一的家庭编号
  const householdNumber = `HH${Date.now()}${Math.floor(Math.random() * 1000)}`
  console.log('生成的家庭编号:', householdNumber)

  // 创建家庭的SQL语句
  const insertHouseholdSql = `INSERT INTO households 
    (household_number, village_group, household_head_name, household_head_id_card, ethnicity, 
     gender, status, registered_date, household_type, housing_type, address, phone_number) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

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
  ]

  console.log('执行SQL:', insertHouseholdSql)
  console.log('参数:', householdParams)

  // 执行SQL语句
  db.run(insertHouseholdSql, householdParams, function (err) {
    if (err) {
      console.error('创建家庭失败:', err.message)
      db.close()
      return
    }

    console.log('创建家庭成功，ID:', this.lastID)
    db.close()
  })
}

// 运行测试
testDirectSQL()
