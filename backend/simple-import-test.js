const http = require('http')

// 最简单的测试数据 - 必须包含所有必填字段
const testData = {
  headers: ['姓名', '身份证号', '与户主关系', '性别'],
  data: [['测试用户', '123456789012345678', '本人', '男']],
  mapping: [
    { excelField: '姓名', dbField: 'name' },
    { excelField: '身份证号', dbField: 'id_card' },
    { excelField: '与户主关系', dbField: 'relationship_to_head' },
    { excelField: '性别', dbField: 'gender' }
  ]
}

const postData = JSON.stringify(testData)

console.log('发送测试请求...')
console.log('数据:', JSON.stringify(testData, null, 2))

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/import-residents',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}

const req = http.request(options, (res) => {
  console.log('\n响应状态码:', res.statusCode)

  let data = ''
  res.on('data', (chunk) => {
    data += chunk
  })
  res.on('end', () => {
    try {
      const response = JSON.parse(data)
      console.log('\n响应内容:')
      console.log(JSON.stringify(response, null, 2))

      if (response.code === 20000) {
        console.log('\n✓ 导入成功!')
      } else {
        console.log('\n✗ 导入失败!')
        if (response.data && response.data.errors) {
          console.log('\n错误详情:')
          response.data.errors.forEach((err) => console.log('  -', err))
        }
      }
    } catch (e) {
      console.log('\n解析响应失败:', e.message)
      console.log('原始响应:', data)
    }
  })
})

req.on('error', (error) => {
  console.error('\n请求失败:', error.message)
})

req.write(postData)
req.end()
