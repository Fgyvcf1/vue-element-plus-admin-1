// 调试导入逻辑
const testData = {
  headers: ['姓名', '身份证号', '与户主关系', '户主姓名', '组别', '性别'],
  data: [
    ['张三', '110101199001011234', '本人', '张三', '一组', '男'],
    ['李四', '110101199001011235', '配偶', '张三', '一组', '女']
  ],
  mapping: [
    { excelField: '姓名', dbField: 'name' },
    { excelField: '身份证号', dbField: 'id_card' },
    { excelField: '与户主关系', dbField: 'relationship_to_head' },
    { excelField: '户主姓名', dbField: 'household_head_name' },
    { excelField: '组别', dbField: 'village_group' },
    { excelField: '性别', dbField: 'gender' }
  ]
}

console.log('=== 调试导入数据 ===\n')
console.log('表头:', testData.headers)
console.log('映射:', testData.mapping)
console.log('数据行数:', testData.data.length)
console.log('\n=== 数据解析 ===\n')

const headOfHouseholdRows = []
const familyMemberRows = []
const parseErrors = []

for (let rowIndex = 0; rowIndex < testData.data.length; rowIndex++) {
  const row = testData.data[rowIndex]
  const rowData = {
    rowIndex: rowIndex + 2,
    householdData: {},
    residentData: {},
    isHeadOfHousehold: false
  }

  console.log(`\n第 ${rowIndex + 2} 行:`, row)

  // 映射字段
  for (let mapIndex = 0; mapIndex < testData.mapping.length; mapIndex++) {
    const mapItem = testData.mapping[mapIndex]
    const value = row[mapIndex]

    console.log(`  [${mapIndex}] ${mapItem.excelField} -> ${mapItem.dbField} = "${value}"`)

    if (mapItem.dbField && value !== undefined && value !== null && value !== '') {
      // 判断是否是户主字段
      if (mapItem.dbField === 'household_head_name') {
        rowData.householdData['household_head_name'] = value
        console.log(`    => 存入 householdData.household_head_name`)
      } else if (mapItem.dbField === 'householdType' || mapItem.dbField === 'housingType') {
        rowData.householdData[mapItem.dbField] = value
        console.log(`    => 存入 householdData.${mapItem.dbField}`)
      } else if (mapItem.dbField.startsWith('household_')) {
        const fieldName = mapItem.dbField.substring(11)
        rowData.householdData[fieldName] = value
        console.log(`    => 存入 householdData.${fieldName}`)
      } else {
        rowData.residentData[mapItem.dbField] = value
        console.log(`    => 存入 residentData.${mapItem.dbField}`)
        // 检查是否是户主
        if (mapItem.dbField === 'relationship_to_head' && value === '本人') {
          rowData.isHeadOfHousehold = true
          console.log(`    => 标记为户主`)
        }
      }
    }
  }

  console.log(`  解析结果:`)
  console.log(`    householdData:`, JSON.stringify(rowData.householdData))
  console.log(`    residentData:`, JSON.stringify(rowData.residentData))
  console.log(`    isHeadOfHousehold:`, rowData.isHeadOfHousehold)

  // 验证必要字段
  if (!rowData.residentData.name || !rowData.residentData.id_card) {
    console.log(`  [错误] 缺少姓名或身份证号`)
    parseErrors.push(`第${rowIndex + 2}行: 缺少姓名或身份证号`)
    continue
  }

  // 分组
  if (rowData.isHeadOfHousehold) {
    headOfHouseholdRows.push(rowData)
    console.log(`  [分类] => 户主`)
  } else {
    familyMemberRows.push(rowData)
    console.log(`  [分类] => 家庭成员`)
  }
}

console.log('\n=== 解析完成 ===\n')
console.log('户主数据:', headOfHouseholdRows.length, '人')
console.log('家庭成员:', familyMemberRows.length, '人')
console.log('错误数:', parseErrors.length)
if (parseErrors.length > 0) {
  console.log('错误详情:', parseErrors)
}
