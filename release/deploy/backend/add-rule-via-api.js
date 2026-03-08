const http = require('http')

console.log('========================================')
console.log('通过API添加生日提醒规则')
console.log('========================================\n')

const newRule = {
  rule_type: 'birthday_after',
  rule_name: '60岁生日后认证提醒',
  rule_value: '60',
  description: '通知60岁居民及时进行养老待遇资格认证',
  status: 'active',
  reminder_days: 1
}

console.log('准备添加的规则:')
console.log(`  规则类型: ${newRule.rule_type}`)
console.log(`  规则名称: ${newRule.rule_name}`)
console.log(`  目标年龄: ${newRule.rule_value}岁`)
console.log(`  描述: ${newRule.description}`)
console.log(`  状态: ${newRule.status}`)
console.log(`  提醒天数: 生日后${newRule.reminder_days}天\n`)

// 构造POST请求
const postData = JSON.stringify(newRule)

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/reminder-rules',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}

console.log('发送请求到: http://localhost:3000/api/reminder-rules\n')

const req = http.request(options, (res) => {
  let data = ''

  res.on('data', (chunk) => {
    data += chunk
  })

  res.on('end', () => {
    console.log('响应状态:', res.statusCode)
    console.log('响应内容:', data)

    try {
      const result = JSON.parse(data)

      if (res.statusCode === 200 && result.code === 20000) {
        console.log('\n✅ 规则添加成功！')
        console.log(`规则ID: ${result.data.id || '未知'}`)
      } else {
        console.log('\n❌ 规则添加失败！')
        console.log('错误信息:', result.message || '未知错误')
      }
    } catch (e) {
      console.log('\n无法解析响应:', data)
    }

    process.exit(0)
  })
})

req.on('error', (error) => {
  console.error('❌ 请求失败:', error.message)
  console.log('\n请确保:')
  console.log('1. 后端服务正在运行 (http://localhost:3000)')
  console.log('2. reminder-rules API已正确实现')
  process.exit(1)
})

req.write(postData)
req.end()
