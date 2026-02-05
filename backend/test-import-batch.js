// 测试批量导入5条数据
const db = require('./db.js');
const { generateUniqueHouseholdId } = require('./utils/householdIdGenerator');

// 检查户编号是否存在的辅助函数
const checkHouseholdNumberExists = async (householdNumber) => {
  const [rows] = await db.pool.execute('SELECT household_number FROM households WHERE household_number = ?', [householdNumber]);
  return rows.length > 0;
};

// 测试数据（5条）
const testData = [
  ['1', '倪清春', '倪清春', '本人', '男', '汉族', '德划组', '汉豪乡大车村德划组7号', '1963-04-08', '45242519630408121X', '62', '18077440502'],
  ['2', '黄秀荣', '倪清春', '妻子', '女', '汉族', '德划组', '汉豪乡大车村德划组7号', '1968-05-10', '452425196805101225', '57', ''],
  ['3', '谢鹏', '倪清春', '子', '男', '汉族', '德划组', '汉豪乡大车村德划组7号', '1990-10-04', '450423199010042111', '35', ''],
  ['4', '谢海宁', '倪清春', '女', '女', '汉族', '德划组', '汉豪乡大车村德划组7号', '2000-05-05', '450423200005052122', '25', ''],
  ['5', '谢姗姗', '倪清春', '孙女', '女', '汉族', '德划组', '汉豪乡大车村德划组7号', '2018-04-18', '450423201804182145', '7', '']
];

// 模拟映射关系
const mapping = [
  { excelField: '序号', dbField: '' },
  { excelField: '姓名', dbField: 'name' },
  { excelField: '户主姓名', dbField: 'household_head_name' },
  { excelField: '与户主关系', dbField: 'relationship_to_head' },
  { excelField: '性别', dbField: 'gender' },
  { excelField: '民族', dbField: 'ethnicity' },
  { excelField: '组别', dbField: 'village_group' },
  { excelField: '户籍详细地址', dbField: 'Home_address' },
  { excelField: '出生日期', dbField: 'date_of_birth' },
  { excelField: '身份证号码', dbField: 'id_card' },
  { excelField: '年龄', dbField: '' },
  { excelField: '联系方式', dbField: 'phone_number' }
];

async function testImport() {
  try {
    console.log('=== 开始测试批量导入 ===\n');
    console.log('测试数据条数:', testData.length);
    
    const currentDate = new Date().toISOString().split('T')[0];
    const headOfHouseholdRows = [];
    const familyMemberRows = [];
    
    // 解析数据
    for (let rowIndex = 0; rowIndex < testData.length; rowIndex++) {
      const row = testData[rowIndex];
      const rowData = {
        rowIndex: rowIndex + 2,
        householdData: {},
        residentData: {},
        isHeadOfHousehold: false
      };
      
      for (let mapIndex = 0; mapIndex < mapping.length; mapIndex++) {
        const mapItem = mapping[mapIndex];
        if (mapItem.dbField) {
          const value = row[mapIndex];
          if (value !== undefined && value !== null && value !== '') {
            if (mapItem.dbField === 'household_head_name') {
              rowData.householdData['household_head_name'] = value;
            } else if (mapItem.dbField.startsWith('household_')) {
              const fieldName = mapItem.dbField.substring(11);
              rowData.householdData[fieldName] = value;
            } else {
              rowData.residentData[mapItem.dbField] = value;
              if (mapItem.dbField === 'relationship_to_head' && value === '本人') {
                rowData.isHeadOfHousehold = true;
              }
            }
          }
        }
      }
      
      console.log(`第${rowIndex + 2}行数据:`, JSON.stringify(rowData.residentData), 'isHeadOfHousehold:', rowData.isHeadOfHousehold);
      
      if (!rowData.residentData.name || !rowData.residentData.id_card) {
        console.log(`第${rowIndex + 2}行: 缺少姓名或身份证号`);
        continue;
      }
      
      if (rowData.isHeadOfHousehold) {
        headOfHouseholdRows.push(rowData);
      } else {
        familyMemberRows.push(rowData);
      }
    }
    
    console.log('\n解析完成 - 户主:', headOfHouseholdRows.length, '人, 家庭成员:', familyMemberRows.length, '人');
    
    // 预检查所有身份证号
    const allIdCards = [...headOfHouseholdRows, ...familyMemberRows].map(row => row.residentData.id_card);
    console.log('所有身份证号:', allIdCards);
    
    const [existingResidents] = await db.pool.execute(
      `SELECT id, id_card, household_id FROM residents WHERE id_card IN (${allIdCards.map(() => '?').join(',')})`,
      allIdCards
    );
    
    console.log('已存在的居民:', existingResidents.length, '人');
    existingResidents.forEach(r => {
      console.log('  ID:', r.id, '身份证:', r.id_card, '户编号:', r.household_id);
    });
    
    const existingIdCardMap = new Map(existingResidents.map(r => [r.id_card, r]));
    
    // 分离新户主和现有户主
    const newHeads = headOfHouseholdRows.filter(row => !existingIdCardMap.has(row.residentData.id_card));
    const existingHeads = headOfHouseholdRows.filter(row => existingIdCardMap.has(row.residentData.id_card));
    
    console.log('\n新户主:', newHeads.length, '人');
    console.log('现有户主:', existingHeads.length, '人');
    
    if (newHeads.length === 0 && existingHeads.length === 0) {
      console.log('没有需要处理的户主数据');
    }
    
    console.log('\n=== 测试完成 ===');
    process.exit(0);
  } catch (err) {
    console.error('测试失败:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

testImport();
