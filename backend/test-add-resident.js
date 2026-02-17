const db = require('./db.js')

// 测试同户新增居民
async function testAddResident() {
  try {
    const residentData = {
      name: '测试居民',
      id_card: '110101199001011234',
      gender: '男',
      date_of_birth: '1990-01-01',
      village_group: '一组',
      Home_address: '测试地址',
      bank_card: '6222021234567890123',
      phone_number: '13800138000',
      bank_name: '工商银行',
      household_id: '1',
      household_head_id: null,
      ethnicity: '汉族',
      relationship_to_head: '配偶',
      marital_status: '已婚',
      political_status: '群众',
      military_service: '未服兵役',
      education_level: '本科',
      status: 'active',
      registered_permanent_residence: '测试地址',
      registered_date: '2026-02-01'
    }

    console.log('测试数据:', residentData)

    const sql = `INSERT INTO residents 
                 (household_id, name, gender, date_of_birth, id_card, relationship_to_head, ethnicity, 
                  marital_status, political_status, military_service, bank_card, bank_name, village_group, 
                  education_level, phone_number, registered_date, status, household_head_id, Home_address) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

    const params = [
      residentData.household_id,
      residentData.name,
      residentData.gender,
      residentData.date_of_birth,
      residentData.id_card,
      residentData.relationship_to_head,
      residentData.ethnicity,
      residentData.marital_status,
      residentData.political_status,
      residentData.military_service,
      residentData.bank_card,
      residentData.bank_name,
      residentData.village_group,
      residentData.education_level,
      residentData.phone_number,
      residentData.registered_date,
      residentData.status,
      residentData.household_head_id,
      residentData.Home_address
    ]

    console.log('SQL:', sql)
    console.log('参数:', params)

    const [result] = await db.pool.execute(sql, params)
    console.log('插入成功, ID:', result.insertId)
  } catch (err) {
    console.error('插入失败:', err.message)
    console.error('错误详情:', err)
  }
  process.exit(0)
}

testAddResident()
