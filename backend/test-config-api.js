const axios = require('axios');

async function testConfigAPI() {
  try {
    // 测试更新 birth_remind_days 为 1
    console.log('测试更新 birth_remind_days 为 1:');
    const response = await axios.put('http://localhost:3001/api/config/birth_remind_days', {
      value: '1'
    });
    console.log('响应:', response.data);

    // 查询更新后的值
    console.log('\n查询更新后的值:');
    const getRes = await axios.get('http://localhost:3001/api/config/birth_remind_days');
    console.log('当前值:', getRes.data.data.config_value);

  } catch (err) {
    console.error('测试失败:', err.response ? err.response.data : err.message);
  }
}

testConfigAPI();
