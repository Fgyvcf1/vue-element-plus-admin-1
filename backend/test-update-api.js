const request = require('supertest')
const app = require('./app.js')

// 测试更新API
async function testUpdateAPI() {
  const testData = {
    disability_type: '肢体',
    disability_level: '三级',
    certificate_number: '45242519730328121423',
    issue_date: '2020-06-02',
    validity_period: null,
    guardian_name: '',
    guardian_phone: '',
    guardian_relationship: '',
    certificate_status: '在持'
  }

  console.log('测试数据:', JSON.stringify(testData, null, 2))

  try {
    const response = await request(app)
      .put('/api/disabled-persons/1')
      .send(testData)
      .set('Accept', 'application/json')

    console.log('响应状态:', response.status)
    console.log('响应体:', JSON.stringify(response.body, null, 2))
  } catch (error) {
    console.error('测试失败:', error)
  }
}

// 延迟执行，等待服务器启动
setTimeout(testUpdateAPI, 2000)
