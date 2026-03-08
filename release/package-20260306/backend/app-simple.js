const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const db = require('./db')

const app = express()
const port = 3002

// 中间件
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// 测试API
app.get('/test', (req, res) => {
  console.log('收到测试请求...')
  res.json({ code: 20000, message: '测试API正常工作！' })
})

// 测试数据库连接
app.get('/test-db', (req, res) => {
  console.log('测试数据库连接...')

  db.all('SELECT COUNT(*) AS count FROM households', [], (err, rows) => {
    if (err) {
      console.error('数据库查询失败:', err.message)
      res.status(500).json({ code: 500, message: '数据库查询失败', error: err.message })
      return
    }

    console.log('数据库查询成功，households表记录数:', rows[0].count)
    res.json({ code: 20000, message: '数据库连接正常', data: { count: rows[0].count } })
  })
})

// 简化版导入API
app.post('/import-residents', (req, res) => {
  console.log('收到居民数据导入请求...')

  const { headers, data, mapping } = req.body

  if (!headers || !data || !mapping) {
    return res.status(400).json({ code: 400, message: '缺少必要的导入数据' })
  }

  console.log(`开始处理 ${data.length} 条数据...`)

  // 解析第一条数据进行测试
  const firstRow = data[0]
  const rowData = {}

  // 映射字段
  mapping.forEach((mapItem, mapIndex) => {
    if (mapItem.dbField) {
      const value = firstRow[mapIndex]
      if (value !== undefined && value !== null && value !== '') {
        rowData[mapItem.dbField] = value
      }
    }
  })

  console.log('解析的数据:', rowData)

  // 测试创建家庭
  const householdNumber = `HH${Date.now()}${Math.floor(Math.random() * 1000)}`
  console.log('生成的家庭编号:', householdNumber)

  const insertHouseholdSql = `INSERT INTO households 
    (household_number, village_group, household_head_name, household_head_id_card, ethnicity, 
     gender, status, registered_date, household_type, housing_type, address, phone_number) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

  const householdParams = [
    householdNumber,
    rowData.village_group || '未知',
    rowData.name || '未知',
    rowData.id_card || '未知',
    rowData.ethnicity || '汉族',
    rowData.gender || '未知',
    'active',
    new Date().toISOString().split('T')[0],
    '农业户口',
    '自有住房',
    rowData.address || '未知地址',
    rowData.phone_number || ''
  ]

  console.log('执行SQL:', insertHouseholdSql)
  console.log('参数:', householdParams)

  db.run(insertHouseholdSql, householdParams, function (err) {
    if (err) {
      console.error('创建家庭失败:', err.message)
      return res.status(500).json({ code: 500, message: '创建家庭失败', error: err.message })
    }

    console.log('创建家庭成功，ID:', this.lastID)
    res.json({ code: 20000, message: '导入测试成功', data: { householdId: this.lastID } })
  })
})

// 启动服务器
app.listen(port, () => {
  console.log(`简化版后端服务运行在 http://localhost:${port}`)
})
