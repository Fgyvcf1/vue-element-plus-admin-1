// 调试导入过程
const db = require('./db.js')
const { generateUniqueHouseholdId } = require('./utils/householdIdGenerator')

// 检查户编号是否存在的辅助函数
const checkHouseholdNumberExists = async (householdNumber) => {
  const [rows] = await db.pool.execute(
    'SELECT household_number FROM households WHERE household_number = ?',
    [householdNumber]
  )
  return rows.length > 0
}

// 模拟导入数据
const importData = {
  headers: [
    '序号',
    '姓名',
    '户主姓名',
    '与户主关系',
    '性别',
    '民族',
    '组别',
    '户籍详细地址',
    '出生日期',
    '身份证号码',
    '年龄',
    '联系方式'
  ],
  data: [
    [
      '1',
      '倪清春',
      '倪清春',
      '本人',
      '男',
      '汉族',
      '德划组',
      '汉豪乡大车村德划组7号',
      '1963-04-08',
      '45242519630408121X',
      '62',
      '18077440502'
    ],
    [
      '2',
      '黄秀荣',
      '倪清春',
      '妻子',
      '女',
      '汉族',
      '德划组',
      '汉豪乡大车村德划组7号',
      '1968-05-10',
      '452425196805101225',
      '57',
      ''
    ],
    [
      '3',
      '谢鹏',
      '倪清春',
      '子',
      '男',
      '汉族',
      '德划组',
      '汉豪乡大车村德划组7号',
      '1990-10-04',
      '450423199010042111',
      '35',
      ''
    ],
    [
      '4',
      '谢海宁',
      '倪清春',
      '女',
      '女',
      '汉族',
      '德划组',
      '汉豪乡大车村德划组7号',
      '2000-05-05',
      '450423200005052122',
      '25',
      ''
    ],
    [
      '5',
      '谢姗姗',
      '倪清春',
      '孙女',
      '女',
      '汉族',
      '德划组',
      '汉豪乡大车村德划组7号',
      '2018-04-18',
      '450423201804182145',
      '7',
      ''
    ]
  ],
  mapping: [
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
  ]
}

async function testImport() {
  try {
    console.log('=== 开始调试导入 ===\n')

    const { headers, data, mapping } = importData
    const currentDate = new Date().toISOString().split('T')[0]

    // 解析数据
    const headOfHouseholdRows = []
    const familyMemberRows = []

    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex]
      const rowData = {
        rowIndex: rowIndex + 2,
        householdData: {},
        residentData: {},
        isHeadOfHousehold: false
      }

      for (let mapIndex = 0; mapIndex < mapping.length; mapIndex++) {
        const mapItem = mapping[mapIndex]
        if (mapItem.dbField) {
          const value = row[mapIndex]
          if (value !== undefined && value !== null && value !== '') {
            if (mapItem.dbField === 'household_head_name') {
              rowData.householdData['household_head_name'] = value
            } else if (mapItem.dbField.startsWith('household_')) {
              const fieldName = mapItem.dbField.substring(11)
              rowData.householdData[fieldName] = value
            } else {
              rowData.residentData[mapItem.dbField] = value
              if (mapItem.dbField === 'relationship_to_head' && value === '本人') {
                rowData.isHeadOfHousehold = true
              }
            }
          }
        }
      }

      if (!rowData.residentData.name || !rowData.residentData.id_card) {
        console.log(`第${rowIndex + 2}行: 缺少姓名或身份证号`)
        continue
      }

      if (rowData.isHeadOfHousehold) {
        headOfHouseholdRows.push(rowData)
      } else {
        familyMemberRows.push(rowData)
      }
    }

    console.log('户主:', headOfHouseholdRows.length, '人')
    console.log('家庭成员:', familyMemberRows.length, '人')

    // 检查倪清春是否已存在
    const [existing] = await db.pool.execute(
      'SELECT id, household_id FROM residents WHERE id_card = ?',
      ['45242519630408121X']
    )
    console.log('倪清春是否存在:', existing.length > 0)
    if (existing.length > 0) {
      console.log('  ID:', existing[0].id, '户编号:', existing[0].household_id)
    }

    // 开始事务
    await db.pool.execute('START TRANSACTION')

    // 处理户主
    for (const rowData of headOfHouseholdRows) {
      const { householdData, residentData } = rowData
      const householdHeadName = householdData.household_head_name || residentData.name

      if (existing.length > 0) {
        // 已存在，检查 households 表
        const [householdRows] = await db.pool.execute(
          'SELECT household_number FROM households WHERE household_number = ?',
          [existing[0].household_id]
        )
        console.log('households 表记录:', householdRows.length)

        if (householdRows.length === 0) {
          // 需要创建 households 记录
          console.log('创建 households 记录...')

          const villageGroup = householdData.village_group || residentData.village_group || ''
          const idCard = residentData.id_card || ''
          const householdNumber = await generateUniqueHouseholdId(
            villageGroup,
            idCard,
            checkHouseholdNumberExists
          )

          const householdColumns = [
            'household_number',
            'household_head_name',
            'household_head_id_card',
            'village_group',
            'address',
            'phone_number',
            'ethnicity',
            'gender',
            'status',
            'registered_date',
            'household_type',
            'housing_type'
          ]
          const householdValues = [
            householdNumber,
            householdHeadName,
            residentData.id_card || '',
            villageGroup,
            householdData.address || '',
            householdData.phone_number || residentData.phone_number || '',
            householdData.ethnicity || residentData.ethnicity || '汉族',
            householdData.gender || residentData.gender || '',
            'active',
            currentDate,
            householdData.householdType || '',
            householdData.housingType || ''
          ]

          console.log('插入 households:', householdColumns)
          console.log('值:', householdValues)

          await db.pool.execute(
            `INSERT INTO households (${householdColumns.join(',')}) VALUES (${householdValues.map(() => '?').join(',')})`,
            householdValues
          )
          console.log('households 插入成功')

          // 更新 residents
          await db.pool.execute('UPDATE residents SET household_id = ? WHERE id = ?', [
            householdNumber,
            existing[0].id
          ])
          console.log('residents 更新成功')
        }
      }
    }

    // 提交事务
    await db.pool.execute('COMMIT')
    console.log('\n=== 调试完成 ===')

    process.exit(0)
  } catch (err) {
    console.error('调试失败:', err.message)
    console.error(err.stack)

    try {
      await db.pool.execute('ROLLBACK')
    } catch (rollbackErr) {
      console.error('回滚失败:', rollbackErr.message)
    }

    process.exit(1)
  }
}

testImport()
