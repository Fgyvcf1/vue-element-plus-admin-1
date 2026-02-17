const axios = require('axios')

// 测试导入API的新字段映射逻辑
async function testImportAPI() {
  console.log('开始测试导入API...')

  try {
    // 准备测试数据 - 正常导入场景
    const testData1 = {
      headers: ['姓名', '身份证号', '性别', '出生日期', '与户主关系', '户主姓名', '联系电话'],
      data: [
        ['张三', '110101199001011234', '男', '1990-01-01', '本人', '张三', '13800138000'],
        ['李四', '110101199001011235', '女', '1990-01-02', '配偶', '张三', '13800138001']
      ],
      mapping: [
        { dbField: 'name', excelField: '姓名' },
        { dbField: 'id_card', excelField: '身份证号' },
        { dbField: 'gender', excelField: '性别' },
        { dbField: 'date_of_birth', excelField: '出生日期' },
        { dbField: 'relationship_to_head', excelField: '与户主关系' },
        { dbField: 'household_head_name', excelField: '户主姓名' },
        { dbField: 'phone_number', excelField: '联系电话' }
      ]
    }

    // 准备测试数据 - 户主姓名重复场景
    const testData2 = {
      headers: ['姓名', '身份证号', '性别', '出生日期', '与户主关系', '户主姓名', '联系电话'],
      data: [
        ['王五', '110101199001011236', '男', '1990-01-03', '本人', '王五', '13800138002'],
        ['赵六', '110101199001011237', '女', '1990-01-04', '子女', '王五', '13800138003'],
        ['钱七', '110101199001011238', '男', '1990-01-05', '子女', '王五', '13800138004']
      ],
      mapping: [
        { dbField: 'name', excelField: '姓名' },
        { dbField: 'id_card', excelField: '身份证号' },
        { dbField: 'gender', excelField: '性别' },
        { dbField: 'date_of_birth', excelField: '出生日期' },
        { dbField: 'relationship_to_head', excelField: '与户主关系' },
        { dbField: 'household_head_name', excelField: '户主姓名' },
        { dbField: 'phone_number', excelField: '联系电话' }
      ]
    }

    // 准备测试数据 - 部分数据失败场景
    const testData3 = {
      headers: ['姓名', '身份证号', '性别', '出生日期', '与户主关系', '户主姓名', '联系电话'],
      data: [
        ['孙八', '110101199001011239', '男', '1990-01-06', '本人', '孙八', '13800138005'],
        ['周九', '', '女', '1990-01-07', '配偶', '孙八', '13800138006'], // 缺少身份证号
        ['吴十', '110101199001011240', '男', '1990-01-08', '子女', '', '13800138007'] // 缺少户主姓名
      ],
      mapping: [
        { dbField: 'name', excelField: '姓名' },
        { dbField: 'id_card', excelField: '身份证号' },
        { dbField: 'gender', excelField: '性别' },
        { dbField: 'date_of_birth', excelField: '出生日期' },
        { dbField: 'relationship_to_head', excelField: '与户主关系' },
        { dbField: 'household_head_name', excelField: '户主姓名' },
        { dbField: 'phone_number', excelField: '联系电话' }
      ]
    }

    // 测试场景1：正常导入
    console.log('\n=== 测试场景1：正常导入 ===')
    const response1 = await axios.post('http://localhost:3002/import-residents', testData1)
    console.log('正常导入测试结果:', response1.data)

    // 测试场景2：户主姓名重复
    console.log('\n=== 测试场景2：户主姓名重复 ===')
    const response2 = await axios.post('http://localhost:3002/import-residents', testData2)
    console.log('户主姓名重复测试结果:', response2.data)

    // 测试场景3：部分数据失败
    console.log('\n=== 测试场景3：部分数据失败 ===')
    const response3 = await axios.post('http://localhost:3002/import-residents', testData3)
    console.log('部分数据失败测试结果:', response3.data)

    console.log('\n所有测试完成！')
  } catch (error) {
    console.error('测试失败:', error.message)
    if (error.response) {
      console.error('响应数据:', error.response.data)
    }
  }
}

// 运行测试
testImportAPI()
