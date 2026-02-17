// 测试API
const http = require('http')

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/archives/status-stats',
  method: 'GET'
}

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`)

  let data = ''
  res.on('data', (chunk) => {
    data += chunk
  })

  res.on('end', () => {
    console.log('响应数据:', data)
    try {
      const json = JSON.parse(data)
      console.log('解析后的JSON:', JSON.stringify(json, null, 2))
    } catch (e) {
      console.log('不是JSON格式')
    }
  })
})

req.on('error', (e) => {
  console.error(`请求错误: ${e.message}`)
})

req.end()
