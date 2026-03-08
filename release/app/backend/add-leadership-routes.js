// ==================== 班子成员管理API ====================

const express = require('express')
const sqlite3 = require('sqlite3').verbose()
const router = express.Router()

// 数据库连接
const dbPath = './app.db'
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message)
  }
})

// 获取班子成员列表
router.get('/', (req, res) => {
  console.log('收到/committee-members请求，查询参数:', req.query)

  const { organization_type, term_number, status, page, pageSize, keyword } = req.query

  let sql = `SELECT cm.*, r.name, r.gender, r.phone_number, r.id_card
             FROM committee_members cm
             JOIN residents r ON cm.resident_id = r.id
             WHERE 1=1`
  const params = []

  if (organization_type) {
    sql += ` AND cm.organization_type = ?`
    params.push(organization_type)
  }

  if (term_number) {
    sql += ` AND cm.term_number = ?`
    params.push(term_number)
  }

  if (status) {
    sql += ` AND cm.status = ?`
    params.push(status)
  }

  if (keyword) {
    sql += ` AND (r.name LIKE ? OR cm.position LIKE ?)`
    params.push(`%${keyword}%`, `%${keyword}%`)
  }

  sql += ` ORDER BY cm.term_number DESC, cm.created_at DESC`

  // 分页
  if (pageSize) {
    const offset = ((parseInt(page) || 1) - 1) * parseInt(pageSize)
    sql += ` LIMIT ? OFFSET ?`
    params.push(parseInt(pageSize), offset)
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('查询班子成员失败:', err.message)
      res.json({ code: 20000, data: [], total: 0 })
      return
    }

    console.log('查询到班子成员数据:', rows.length, '条')

    // 获取总数
    let countSql = sql.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) as total FROM')
    if (pageSize) {
      countSql = countSql.replace(/LIMIT\s+\d+\s+OFFSET\s+\d+$/i, '')
    }
    db.get(countSql, params.slice(0, -2), (countErr, countRow) => {
      res.json({
        code: 20000,
        data: rows,
        total: countRow ? countRow.total : rows.length
      })
    })
  })
})

// 获取单个成员
router.get('/:id', (req, res) => {
  const { id } = req.params

  const sql = `SELECT cm.*, r.name, r.gender, r.phone_number, r.id_card
             FROM committee_members cm
             JOIN residents r ON cm.resident_id = r.id
             WHERE cm.id = ?`

  db.get(sql, [id], (err, row) => {
    if (err) {
      console.error('查询成员失败:', err.message)
      res.json({ code: 500, message: '查询失败' })
      return
    }
    res.json({ code: 20000, data: row })
  })
})

// 添加成员
router.post('/', (req, res) => {
  console.log('收到添加成员请求:', req.body)
  // 同时支持驼峰命名和下划线命名的字段
  const {
    residentId,
    resident_id,
    organizationType,
    organization_type,
    termNumber,
    term_number,
    termStartDate,
    term_start_date,
    termEndDate,
    term_end_date,
    position,
    status,
    remarks
  } = req.body

  // 优先使用驼峰命名，如果没有则使用下划线命名
  const residentIdValue = residentId || resident_id
  const organizationTypeValue = organizationType || organization_type
  const termNumberValue = termNumber || term_number
  const termStartDateValue = termStartDate || term_start_date
  const termEndDateValue = termEndDate || term_end_date

  const sql = `INSERT INTO committee_members
               (resident_id, organization_type, term_number, term_start_date,
                term_end_date, position, status, remarks, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`

  const params = [
    residentIdValue,
    organizationTypeValue,
    termNumberValue,
    termStartDateValue,
    termEndDateValue,
    position,
    status || 'current',
    remarks
  ]

  db.run(sql, params, function (err) {
    if (err) {
      console.error('添加成员失败:', err.message)
      res.status(500).json({ code: 500, message: '添加失败: ' + err.message })
      return
    }
    console.log('添加成员成功，ID:', this.lastID)
    res.json({
      code: 20000,
      message: '添加成功',
      data: { id: this.lastID }
    })
  })
})

// 更新成员
router.put('/:id', (req, res) => {
  const { id } = req.params
  console.log('收到更新成员请求，ID:', id, '数据:', req.body)
  // 同时支持驼峰命名和下划线命名的字段
  const {
    residentId,
    resident_id,
    organizationType,
    organization_type,
    termNumber,
    term_number,
    termStartDate,
    term_start_date,
    termEndDate,
    term_end_date,
    position,
    status,
    remarks
  } = req.body

  // 优先使用驼峰命名，如果没有则使用下划线命名
  const residentIdValue = residentId || resident_id
  const organizationTypeValue = organizationType || organization_type
  const termNumberValue = termNumber || term_number
  const termStartDateValue = termStartDate || term_start_date
  const termEndDateValue = termEndDate || term_end_date

  const sql = `UPDATE committee_members
               SET resident_id = ?, organization_type = ?, term_number = ?,
                   term_start_date = ?, term_end_date = ?, position = ?,
                   status = ?, remarks = ?, updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`

  const params = [
    residentIdValue,
    organizationTypeValue,
    termNumberValue,
    termStartDateValue,
    termEndDateValue,
    position,
    status,
    remarks,
    id
  ]

  db.run(sql, params, function (err) {
    if (err) {
      console.error('更新成员失败:', err.message)
      res.status(500).json({ code: 500, message: '更新失败: ' + err.message })
      return
    }
    console.log('更新成员成功')
    res.json({ code: 20000, message: '更新成功' })
  })
})

// 删除成员
router.delete('/:id', (req, res) => {
  const { id } = req.params
  console.log('收到删除成员请求，ID:', id)

  const sql = `DELETE FROM committee_members WHERE id = ?`

  db.run(sql, [id], function (err) {
    if (err) {
      console.error('删除成员失败:', err.message)
      res.status(500).json({ code: 500, message: '删除失败' })
      return
    }
    console.log('删除成员成功')
    res.json({ code: 20000, message: '删除成功' })
  })
})

// 获取届数列表
router.get('/term-numbers', (req, res) => {
  const { organization_type } = req.query
  console.log('收到届数列表请求，机构类型:', organization_type)

  if (!organization_type) {
    res.json({ code: 20000, data: [] })
    return
  }

  const sql = `SELECT DISTINCT term_number,
                MIN(term_start_date) as term_start_date,
                MAX(CASE WHEN term_end_date IS NOT NULL THEN term_end_date ELSE '当前' END) as term_end_date
             FROM committee_members
             WHERE organization_type = ?
             GROUP BY term_number
             ORDER BY term_number DESC`

  db.all(sql, [organization_type], (err, rows) => {
    if (err) {
      console.error('查询届数失败:', err.message)
      res.json({ code: 500, message: '查询失败', data: [] })
      return
    }
    console.log('查询到届数:', rows.length, '个')
    res.json({ code: 20000, data: rows || [] })
  })
})

// 获取成员历史任职记录
router.get('/history', (req, res) => {
  const { resident_id } = req.query
  console.log('收到成员历史记录请求，resident_id:', resident_id)

  if (!resident_id) {
    res.json({ code: 20000, data: [] })
    return
  }

  const sql = `SELECT cm.*, r.name, r.gender, r.phone_number, r.id_card
             FROM committee_members cm
             JOIN residents r ON cm.resident_id = r.id
             WHERE cm.resident_id = ?
             ORDER BY cm.term_number DESC`

  db.all(sql, [resident_id], (err, rows) => {
    if (err) {
      console.error('查询成员历史记录失败:', err.message)
      res.json({ code: 500, message: '查询失败', data: [] })
      return
    }
    res.json({ code: 20000, data: rows || [] })
  })
})

module.exports = router
console.log('班子成员管理API路由已加载')
