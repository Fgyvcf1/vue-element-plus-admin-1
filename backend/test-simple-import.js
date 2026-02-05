const axios = require('axios');

// 简单测试脚本 - 只测试单个户主导入
async function testSimpleImport() {
  console.log('测试简单导入场景...');
  
  const testData = {
    headers: ['姓名', '身份证号', '性别', '出生日期', '与户主关系', '户主姓名', '户主身份证号', '地址'],
    data: [
      // 只测试一个户主
      ['张三', '110101199001011234', '男', '1990-01-01', '本人', '张三', '110101199001011234', '北京市朝阳区']
    ],
    mapping: [
      { dbField: 'name', csvField: '姓名' },
      { dbField: 'id_card', csvField: '身份证号' },
      { dbField: 'gender', csvField: '性别' },
      { dbField: 'date_of_birth', csvField: '出生日期' },
      { dbField: 'relationship_to_head', csvField: '与户主关系' },
      { dbField: 'household_head_name', csvField: '户主姓名' },
      { dbField: 'household_head_id_card', csvField: '户主身份证号' },
      { dbField: 'address', csvField: '地址' }
    ]
  };

  try {
    console.log('准备发送请求...');
    const response = await axios.post('http://localhost:3001/import-residents', testData);
    console.log('导入测试结果:', response.data);
  } catch (error) {
    console.error('导入测试失败:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
      console.error('响应状态:', error.response.status);
    }
  }
}

// 运行测试
testSimpleImport().then(() => {
  console.log('测试完成!');
}).catch(err => {
  console.error('测试出错:', err);
});
