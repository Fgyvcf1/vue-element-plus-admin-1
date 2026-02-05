// 测试单条数据导入
const db = require('./db.js');
const { generateUniqueHouseholdId } = require('./utils/householdIdGenerator');

// 检查户编号是否存在的辅助函数
const checkHouseholdNumberExists = async (householdNumber) => {
  const [rows] = await db.pool.execute('SELECT household_number FROM households WHERE household_number = ?', [householdNumber]);
  return rows.length > 0;
};

// 测试数据
const testData = {
  name: '倪清春',
  household_head_name: '倪清春',
  relationship_to_head: '本人',
  gender: '男',
  ethnicity: '汉族',
  village_group: '德划组',
  address: '汉豪乡大车村德划组7号',
  date_of_birth: '1963-04-08',
  id_card: '45242519630408121X',
  age: '62',
  phone_number: '18077440502'
};

async function testImport() {
  try {
    console.log('=== 开始测试单条数据导入 ===\n');
    console.log('测试数据:', testData);
    
    // 检查是否已存在
    const [existing] = await db.pool.execute('SELECT id FROM residents WHERE id_card = ?', [testData.id_card]);
    if (existing.length > 0) {
      console.log('该居民已存在，ID:', existing[0].id);
      return;
    }
    
    // 开始事务
    await db.pool.execute('START TRANSACTION');
    
    const currentDate = new Date().toISOString().split('T')[0];
    
    // 生成户编号
    const householdNumber = await generateUniqueHouseholdId(testData.village_group, testData.id_card, checkHouseholdNumberExists);
    console.log('生成的户编号:', householdNumber);
    
    // 插入 households 表
    const householdColumns = ['household_number', 'household_head_name', 'village_group', 'address', 'phone_number', 'ethnicity', 'gender', 'status', 'registered_date'];
    const householdValues = [
      householdNumber,
      testData.household_head_name,
      testData.village_group,
      testData.address,
      testData.phone_number,
      testData.ethnicity,
      testData.gender,
      'active',
      currentDate
    ];
    
    console.log('插入 households 表...');
    console.log('字段:', householdColumns);
    console.log('值:', householdValues);
    
    const [householdResult] = await db.pool.execute(
      `INSERT INTO households (${householdColumns.join(',')}) VALUES (${householdValues.map(() => '?').join(',')})`,
      householdValues
    );
    
    console.log('households 插入成功, insertId:', householdResult.insertId);
    
    // 插入 residents 表
    const residentColumns = ['household_id', 'name', 'gender', 'date_of_birth', 'id_card', 'relationship_to_head', 'ethnicity', 'marital_status', 'political_status', 'military_service', 'bank_card', 'bank_name', 'village_group', 'education_level', 'phone_number', 'registered_date', 'status', 'Home_address', 'equity_shares'];
    const residentValues = [
      householdNumber,
      testData.name,
      testData.gender,
      testData.date_of_birth,
      testData.id_card,
      '本人',
      testData.ethnicity,
      '已婚',
      '群众',
      '未服兵役',
      '',
      '',
      testData.village_group,
      '小学',
      testData.phone_number,
      currentDate,
      'active',
      testData.address,
      0
    ];
    
    console.log('插入 residents 表...');
    console.log('字段:', residentColumns);
    console.log('值:', residentValues);
    
    const [residentResult] = await db.pool.execute(
      `INSERT INTO residents (${residentColumns.join(',')}) VALUES (${residentValues.map(() => '?').join(',')})`,
      residentValues
    );
    
    console.log('residents 插入成功, insertId:', residentResult.insertId);
    
    // 提交事务
    await db.pool.execute('COMMIT');
    
    console.log('\n=== 测试成功 ===');
    console.log('户编号:', householdNumber);
    console.log('居民ID:', residentResult.insertId);
    
    process.exit(0);
  } catch (err) {
    console.error('测试失败:', err.message);
    console.error(err.stack);
    
    // 回滚事务
    try {
      await db.pool.execute('ROLLBACK');
    } catch (rollbackErr) {
      console.error('回滚失败:', rollbackErr.message);
    }
    
    process.exit(1);
  }
}

testImport();
