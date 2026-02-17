const axios = require('axios')

// 测试后端服务状态
async function testServerStatus() {
  console.log('测试后端服务状态...')

  try {
    // 测试一个简单的API端点，比如/residents
    const response = await axios.get('http://localhost:3001/residents')
    console.log('后端服务正常运行!')
    console.log('返回数据:', response.data)
  } catch (error) {
    console.error('后端服务测试失败:', error.message)
    if (error.response) {
      console.error('响应状态:', error.response.status)
      console.error('响应数据:', error.response.data)
    }
  }
}

// 运行测试
testServerStatus()
  .then(() => {
    console.log('测试完成!')
  })
  .catch((err) => {
    console.error('测试出错:', err)
  })
