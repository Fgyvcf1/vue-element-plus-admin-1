const axios = require('axios');

// 测试新的测试API端点
async function testTestApi() {
  console.log('测试新的测试API端点...');
  
  try {
    const response = await axios.post('http://localhost:3001/test-import-api', {});
    console.log('测试API端点响应:', response.data);
  } catch (error) {
    console.error('测试API端点失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
testTestApi().then(() => {
  console.log('测试完成!');
}).catch(err => {
  console.error('测试出错:', err);
});
