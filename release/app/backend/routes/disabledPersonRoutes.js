const express = require('express')
const router = express.Router()
const db = require('../db')
const { checkPermission } = require('../middleware/auth')

const toInt = (value, defaultValue = 0) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? defaultValue : parsed
}

const normalizePagination = (query) => {
  const pageNum = Math.max(toInt(query.pageNum || query.page || 1, 1), 1)
  const pageSize = Math.max(toInt(query.pageSize || query.size || 10, 10), 1)
  return {
    pageNum,
    pageSize,
    offset: (pageNum - 1) * pageSize
  }
}

const normalizeValue = (value, toNull = false) => {
  if (value === undefined) return toNull ? null : undefined
  if (value === '') return null
  return value
}

const buildFilters = (query) => {
  const filters = []
  const params = []

  if (query.name) {
    filters.push('r.name LIKE ?')
    params.push(`%${query.name}%`)
  }

  if (query.idCard) {
    filters.push('r.id_card LIKE ?')
    params.push(`%${query.idCard}%`)
  }

  if (query.disabilityType) {
    filters.push('d.disability_type = ?')
    params.push(query.disabilityType)
  }

  if (query.disabilityLevel) {
    filters.push('d.disability_level = ?')
    params.push(query.disabilityLevel)
  }

  if (query.keyword) {
    filters.push(
      '(r.name LIKE ? OR r.id_card LIKE ? OR d.disability_type LIKE ? OR d.disability_level LIKE ?)'
    )
    params.push(`%${query.keyword}%`, `%${query.keyword}%`, `%${query.keyword}%`, `%${query.keyword}%`)
  }

  return {
    clause: filters.length ? ` WHERE ${filters.join(' AND ')}` : '',
    params
  }
}

// 获取残疾人列表
router.get('/disabled-persons', checkPermission('special:view'), async (req, res) => {
  const { pageNum, pageSize, offset } = normalizePagination(req.query)
  const { clause, params } = buildFilters(req.query)

  const listSql = `
    SELECT
      d.id,
      d.resident_id,
      d.disability_type AS disabilityType,
      d.disability_level AS disabilityLevel,
      d.certificate_number AS certificateNumber,
      d.issue_date AS issueDate,
      d.validity_period AS validityPeriod,
      d.guardian_name AS guardianName,
      d.guardian_phone AS guardianPhone,
      d.guardian_relationship AS guardianRelationship,
      d.certificate_status AS certificateStatus,
      d.created_at,
      d.updated_at,
      r.name,
      r.id_card AS idCard,
      r.gender,
      TIMESTAMPDIFF(YEAR, r.date_of_birth, CURDATE()) AS age,
      r.phone_number AS phoneNumber,
      r.Home_address AS address
    FROM disabled_persons d
    LEFT JOIN residents r ON d.resident_id = r.id
    ${clause}
    ORDER BY d.created_at DESC, d.id DESC
    LIMIT ? OFFSET ?
  `

  const countSql = `
    SELECT COUNT(1) AS total
    FROM disabled_persons d
    LEFT JOIN residents r ON d.resident_id = r.id
    ${clause}
  `

  try {
    const [rows] = await db.pool.execute(listSql, [...params, pageSize, offset])
    const [countRows] = await db.pool.execute(countSql, params)
    const total = countRows?.[0]?.total || 0

    res.json({
      code: 20000,
      data: rows,
      total,
      page: pageNum,
      pageSize
    })
  } catch (err) {
    console.error('查询残疾人列表失败:', err.message)
    res.status(500).json({ code: 500, message: '查询残疾人列表失败' })
  }
})

// 获取残疾人详情
router.get('/disabled-persons/:id', checkPermission('special:view'), async (req, res) => {
  const id = toInt(req.params.id, 0)
  if (!id) {
    return res.status(400).json({ code: 400, message: 'id 参数错误' })
  }

  const detailSql = `
    SELECT
      d.id,
      d.resident_id,
      d.disability_type AS disabilityType,
      d.disability_level AS disabilityLevel,
      d.certificate_number AS certificateNumber,
      d.issue_date AS issueDate,
      d.validity_period AS validityPeriod,
      d.guardian_name AS guardianName,
      d.guardian_phone AS guardianPhone,
      d.guardian_relationship AS guardianRelationship,
      d.certificate_status AS certificateStatus,
      d.created_at,
      d.updated_at,
      r.name,
      r.id_card AS idCard,
      r.gender,
      TIMESTAMPDIFF(YEAR, r.date_of_birth, CURDATE()) AS age,
      r.phone_number AS residentPhoneNumber,
      r.Home_address AS address,
      h.household_head_name AS householdHeadName,
      h.household_head_id_card AS householdHeadIdCard,
      h.phone_number AS phoneNumber
    FROM disabled_persons d
    LEFT JOIN residents r ON d.resident_id = r.id
    LEFT JOIN households h ON r.household_id = h.household_number
    WHERE d.id = ?
    LIMIT 1
  `

  try {
    const [rows] = await db.pool.execute(detailSql, [id])
    if (!rows.length) {
      return res.status(404).json({ code: 404, message: '残疾人不存在' })
    }

    res.json({ code: 20000, data: rows[0] })
  } catch (err) {
    console.error('查询残疾人详情失败:', err.message)
    res.status(500).json({ code: 500, message: '查询残疾人详情失败' })
  }
})

// 新增残疾人
router.post('/disabled-persons', checkPermission('special:add'), async (req, res) => {
  const residentId = toInt(req.body.resident_id || req.body.residentId, 0)
  const disabilityType = normalizeValue(req.body.disability_type ?? req.body.disabilityType, true)
  const disabilityLevel = normalizeValue(req.body.disability_level ?? req.body.disabilityLevel, true)

  if (!residentId || !disabilityType || !disabilityLevel) {
    return res.status(400).json({ code: 400, message: '缺少必要参数' })
  }

  const certificateNumber = normalizeValue(
    req.body.certificate_number ?? req.body.certificateNumber,
    true
  )
  const issueDate = normalizeValue(req.body.issue_date ?? req.body.issueDate, true)
  const validityPeriod = normalizeValue(req.body.validity_period ?? req.body.validityPeriod, true)
  const guardianName = normalizeValue(req.body.guardian_name ?? req.body.guardianName, true)
  const guardianPhone = normalizeValue(req.body.guardian_phone ?? req.body.guardianPhone, true)
  const guardianRelationship = normalizeValue(
    req.body.guardian_relationship ?? req.body.guardianRelationship,
    true
  )
  const certificateStatus = normalizeValue(
    req.body.certificate_status ?? req.body.certificateStatus,
    true
  )

  try {
    const [residents] = await db.pool.execute('SELECT id FROM residents WHERE id = ?', [residentId])
    if (!residents.length) {
      return res.status(404).json({ code: 404, message: '居民不存在' })
    }

    const [existing] = await db.pool.execute(
      'SELECT id, certificate_status FROM disabled_persons WHERE resident_id = ? LIMIT 1',
      [residentId]
    )
    if (existing.length) {
      const status = existing[0]?.certificate_status
      const statusText = status ? `当前证件状态：${status}。` : ''
      return res.status(400).json({
        code: 400,
        message: `该居民已有残疾人记录，${statusText}请在原记录中修改，不要重复新增`
      })
    }

    const insertSql = `
      INSERT INTO disabled_persons
      (resident_id, disability_type, disability_level, certificate_number, issue_date, validity_period,
       guardian_name, guardian_phone, guardian_relationship, certificate_status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `

    const [result] = await db.pool.execute(insertSql, [
      residentId,
      disabilityType,
      disabilityLevel,
      certificateNumber,
      issueDate,
      validityPeriod,
      guardianName,
      guardianPhone,
      guardianRelationship,
      certificateStatus
    ])

    res.json({ code: 20000, message: '新增残疾人成功', data: { id: result.insertId } })
  } catch (err) {
    console.error('新增残疾人失败:', err.message)
    res.status(500).json({ code: 500, message: '新增残疾人失败' })
  }
})

// 更新残疾人信息
router.put('/disabled-persons/:id', checkPermission('special:edit'), async (req, res) => {
  const id = toInt(req.params.id, 0)
  if (!id) {
    return res.status(400).json({ code: 400, message: 'id 参数错误' })
  }

  const fields = []
  const params = []

  const setIfDefined = (field, value) => {
    if (value !== undefined) {
      fields.push(`${field} = ?`)
      params.push(value)
    }
  }

  setIfDefined('disability_type', normalizeValue(req.body.disability_type ?? req.body.disabilityType))
  setIfDefined('disability_level', normalizeValue(req.body.disability_level ?? req.body.disabilityLevel))
  setIfDefined('certificate_number', normalizeValue(req.body.certificate_number ?? req.body.certificateNumber))
  setIfDefined('issue_date', normalizeValue(req.body.issue_date ?? req.body.issueDate))
  setIfDefined('validity_period', normalizeValue(req.body.validity_period ?? req.body.validityPeriod))
  setIfDefined('guardian_name', normalizeValue(req.body.guardian_name ?? req.body.guardianName))
  setIfDefined('guardian_phone', normalizeValue(req.body.guardian_phone ?? req.body.guardianPhone))
  setIfDefined(
    'guardian_relationship',
    normalizeValue(req.body.guardian_relationship ?? req.body.guardianRelationship)
  )
  setIfDefined(
    'certificate_status',
    normalizeValue(req.body.certificate_status ?? req.body.certificateStatus)
  )

  if (!fields.length) {
    return res.status(400).json({ code: 400, message: '无可更新字段' })
  }

  fields.push('updated_at = NOW()')
  params.push(id)

  try {
    const [result] = await db.pool.execute(
      `UPDATE disabled_persons SET ${fields.join(', ')} WHERE id = ?`,
      params
    )

    if (!result.affectedRows) {
      return res.status(404).json({ code: 404, message: '残疾人不存在' })
    }

    res.json({ code: 20000, message: '更新残疾人成功' })
  } catch (err) {
    console.error('更新残疾人失败:', err.message)
    res.status(500).json({ code: 500, message: '更新残疾人失败' })
  }
})

// 删除残疾人
router.delete('/disabled-persons/:id', checkPermission('special:delete'), async (req, res) => {
  const id = toInt(req.params.id, 0)
  if (!id) {
    return res.status(400).json({ code: 400, message: 'id 参数错误' })
  }

  try {
    const [result] = await db.pool.execute('DELETE FROM disabled_persons WHERE id = ?', [id])

    if (!result.affectedRows) {
      return res.status(404).json({ code: 404, message: '残疾人不存在' })
    }

    res.json({ code: 20000, message: '删除残疾人成功' })
  } catch (err) {
    console.error('删除残疾人失败:', err.message)
    res.status(500).json({ code: 500, message: '删除残疾人失败' })
  }
})

// 获取残疾人类型统计
router.get('/disabled-persons/stats/types', checkPermission('special:view'), async (_req, res) => {
  try {
    const [rows] = await db.pool.execute(
      'SELECT disability_type AS disabilityType, COUNT(*) as count FROM disabled_persons GROUP BY disability_type'
    )
    res.json({ code: 20000, data: rows })
  } catch (err) {
    console.error('查询残疾人类型统计失败:', err.message)
    res.status(500).json({ code: 500, message: '查询残疾人类型统计失败' })
  }
})

// 获取残疾等级统计
router.get('/disabled-persons/stats/levels', checkPermission('special:view'), async (_req, res) => {
  try {
    const [rows] = await db.pool.execute(
      'SELECT disability_level AS disabilityLevel, COUNT(*) as count FROM disabled_persons GROUP BY disability_level'
    )
    res.json({ code: 20000, data: rows })
  } catch (err) {
    console.error('查询残疾等级统计失败:', err.message)
    res.status(500).json({ code: 500, message: '查询残疾等级统计失败' })
  }
})

module.exports = router
