const express = require('express')
const app = express()
const importRoutes = require('./import-route')

app.use(express.json())
app.use('/', importRoutes)

app.listen(3002, () => {
  console.log('测试服务器运行在 http://localhost:3002')

  // 模拟导入请求
  const testData = {
    headers: ['姓名', '身份证', '与户主关系', '户主姓名'],
    data: [['张三', '110101199001011234', '本人', '张三']],
    mapping: [
      { excelField: '姓名', dbField: 'name' },
      { excelField: '身份证', dbField: 'id_card' },
      { excelField: '与户主关系', dbField: 'relationship_to_head' },
      { excelField: '户主姓名', dbField: 'household_head_name' }
    ]
  }

  // 等待1秒后发送请求
  setTimeout(() => {
    const http = require('http')
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/import-residents',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        console.log('\n响应:', data)
        process.exit(0)
      })
    })

    req.on('error', (e) => {
      console.error('请求错误:', e.message)
      process.exit(1)
    })

    req.write(JSON.stringify(testData))
    req.end()
  }, 1000)
})
