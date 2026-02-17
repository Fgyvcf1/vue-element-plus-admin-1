// 测试后端/notifications API
const http = require('http')

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/notifications?start_date=2026-01-01&end_date=2026-01-31',
  method: 'GET'
}

console.log('正在测试后端/notifications API...')
console.log('请求路径:', options.path)

const req = http.request(options, (res) => {
  console.log(`\n状态码: ${res.statusCode}`)
  console.log('响应头:')
  console.log(res.headers)

  let data = ''
  res.on('data', (chunk) => {
    data += chunk
  })

  res.on('end', () => {
    console.log('\n响应数据:')
    try {
      const parsedData = JSON.parse(data)
      console.log(JSON.stringify(parsedData, null, 2))
    } catch (e) {
      console.log(data)
    }
    process.exit(0)
  })
})

req.on('error', (e) => {
  console.error(`请求失败: ${e.message}`)
  process.exit(1)
})

req.end()
