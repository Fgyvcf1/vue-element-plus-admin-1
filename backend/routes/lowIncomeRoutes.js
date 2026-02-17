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

const pickLowIncomeType = (body) => {
  return (
    body.low_income_type ||
    body.lowIncomeType ||
    body.policy_type ||
    body.policyType ||
    body.enjoyPolicyType ||
    null
  )
}

const buildLowIncomeFilters = (query) => {
  const filters = []
  const params = []

  if (query.status !== undefined && query.status !== '') {
    filters.push('l.status = ?')
    params.push(query.status)
  }

  if (query.name) {
    filters.push('r.name LIKE ?')
    params.push(`%${query.name}%`)
  }

  if (query.idCard) {
    filters.push('r.id_card LIKE ?')
    params.push(`%${query.idCard}%`)
  }

  if (query.lowIncomeType) {
    filters.push('l.low_income_type = ?')
    params.push(query.lowIncomeType)
  }

  if (query.keyword) {
    filters.push('(r.name LIKE ? OR r.id_card LIKE ? OR l.low_income_type LIKE ?)')
    params.push(`%${query.keyword}%`, `%${query.keyword}%`, `%${query.keyword}%`)
  }

  return {
    clause: filters.length ? ` WHERE ${filters.join(' AND ')}` : '',
    params
  }
}

// 获取低收入人员列表
const listLowIncome = async (req, res) => {
  const { pageNum, pageSize, offset } = normalizePagination(req.query)
  const { clause, params } = buildLowIncomeFilters(req.query)

  const listSql = `
    SELECT
      l.id,
      l.resident_id,
      l.low_income_type,
      l.apply_date,
      l.approval_date,
      l.status,
      l.created_at,
      l.updated_at,
      r.name,
      r.id_card AS idCard,
      r.gender,
      r.ethnicity,
      TIMESTAMPDIFF(YEAR, r.date_of_birth, CURDATE()) AS age,
      r.phone_number AS phoneNumber,
      r.relationship_to_head AS relationshipToHead,
      h.household_head_name AS householdHeadName,
      (
        SELECT COUNT(1)
        FROM residents r2
        WHERE r2.household_id = r.household_id
      ) AS totalHouseholdMembers,
      (
        SELECT COUNT(1)
        FROM low_income_persons l2
        JOIN residents r2 ON l2.resident_id = r2.id
        WHERE r2.household_id = r.household_id
          AND l2.status = 'active'
      ) AS lowIncomeHouseholdMembers,
      (
        SELECT COALESCE(SUM(
          CASE
            WHEN lp2.subsidy_cycle = 'quarterly' THEN COALESCE(lp2.subsidy_amount, 0) / 3
            WHEN lp2.subsidy_cycle = 'yearly' THEN COALESCE(lp2.subsidy_amount, 0) / 12
            ELSE COALESCE(lp2.subsidy_amount, 0)
          END
        ), 0)
        FROM low_income_persons l2
        JOIN residents r2 ON l2.resident_id = r2.id
        LEFT JOIN low_income_policy_records lp2 ON lp2.id = (
          SELECT lp3.id
          FROM low_income_policy_records lp3
          WHERE lp3.low_income_person_id = l2.id
            AND (lp3.status = 'active' OR lp3.status IS NULL)
          ORDER BY lp3.created_at DESC, lp3.id DESC
          LIMIT 1
        )
        WHERE r2.household_id = r.household_id
          AND l2.status = 'active'
      ) AS monthlyHouseholdAmount,
      p.policy_type,
      p.enjoy_level,
      p.has_subsidy,
      p.start_date,
      p.end_date,
      p.subsidy_amount,
      p.subsidy_cycle,
      p.account_name,
      p.account_relationship,
      p.bank_name,
      p.bank_account,
      p.remark
    FROM low_income_persons l
    LEFT JOIN residents r ON l.resident_id = r.id
    LEFT JOIN households h ON r.household_id = h.household_number
    LEFT JOIN low_income_policy_records p ON p.id = (
      SELECT lp2.id
      FROM low_income_policy_records lp2
      WHERE lp2.low_income_person_id = l.id
      ORDER BY lp2.created_at DESC, lp2.id DESC
      LIMIT 1
    )
    ${clause}
    ORDER BY l.created_at DESC, l.id DESC
    LIMIT ? OFFSET ?
  `

  const countSql = `
    SELECT COUNT(1) AS total
    FROM low_income_persons l
    LEFT JOIN residents r ON l.resident_id = r.id
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
    console.error('查询低收入人员列表失败:', err.message)
    res.status(500).json({ code: 500, message: '查询低收入人员列表失败' })
  }
}

router.get('/low-income', checkPermission('special:view'), listLowIncome)
router.get('/low-income-persons', checkPermission('special:view'), listLowIncome)

// 获取低收入人员详情
const getLowIncomeDetail = async (req, res) => {
  const id = toInt(req.params.id, 0)
  if (!id) {
    return res.status(400).json({ code: 400, message: 'id 参数错误' })
  }

  const detailSql = `
    SELECT
      l.id,
      l.resident_id,
      l.low_income_type,
      l.apply_date,
      l.approval_date,
      l.status,
      l.created_at,
      l.updated_at,
      r.name,
      r.id_card AS idCard,
      r.gender,
      r.ethnicity,
      TIMESTAMPDIFF(YEAR, r.date_of_birth, CURDATE()) AS age,
      r.phone_number AS phoneNumber,
      r.relationship_to_head AS relationshipToHead,
      h.household_head_name AS householdHeadName,
      (
        SELECT COUNT(1)
        FROM residents r2
        WHERE r2.household_id = r.household_id
      ) AS totalHouseholdMembers,
      (
        SELECT COUNT(1)
        FROM low_income_persons l2
        JOIN residents r2 ON l2.resident_id = r2.id
        WHERE r2.household_id = r.household_id
          AND l2.status = 'active'
      ) AS lowIncomeHouseholdMembers,
      (
        SELECT COALESCE(SUM(
          CASE
            WHEN lp2.subsidy_cycle = 'quarterly' THEN COALESCE(lp2.subsidy_amount, 0) / 3
            WHEN lp2.subsidy_cycle = 'yearly' THEN COALESCE(lp2.subsidy_amount, 0) / 12
            ELSE COALESCE(lp2.subsidy_amount, 0)
          END
        ), 0)
        FROM low_income_persons l2
        JOIN residents r2 ON l2.resident_id = r2.id
        LEFT JOIN low_income_policy_records lp2 ON lp2.id = (
          SELECT lp3.id
          FROM low_income_policy_records lp3
          WHERE lp3.low_income_person_id = l2.id
            AND (lp3.status = 'active' OR lp3.status IS NULL)
          ORDER BY lp3.created_at DESC, lp3.id DESC
          LIMIT 1
        )
        WHERE r2.household_id = r.household_id
          AND l2.status = 'active'
      ) AS monthlyHouseholdAmount,
      p.policy_type,
      p.enjoy_level,
      p.has_subsidy,
      p.start_date,
      p.end_date,
      p.subsidy_amount,
      p.subsidy_cycle,
      p.account_name,
      p.account_relationship,
      p.bank_name,
      p.bank_account,
      p.remark
    FROM low_income_persons l
    LEFT JOIN residents r ON l.resident_id = r.id
    LEFT JOIN households h ON r.household_id = h.household_number
    LEFT JOIN low_income_policy_records p ON p.id = (
      SELECT lp2.id
      FROM low_income_policy_records lp2
      WHERE lp2.low_income_person_id = l.id
      ORDER BY lp2.created_at DESC, lp2.id DESC
      LIMIT 1
    )
    WHERE l.id = ?
    LIMIT 1
  `

  try {
    const [rows] = await db.pool.execute(detailSql, [id])
    if (!rows.length) {
      return res.status(404).json({ code: 404, message: '低收入人员不存在' })
    }

    res.json({ code: 20000, data: rows[0] })
  } catch (err) {
    console.error('查询低收入人员详情失败:', err.message)
    res.status(500).json({ code: 500, message: '查询低收入人员详情失败' })
  }
}

router.get('/low-income/:id', checkPermission('special:view'), getLowIncomeDetail)
router.get('/low-income-persons/:id', checkPermission('special:view'), getLowIncomeDetail)

// 新增低收入人员
const createLowIncome = async (req, res) => {
  const residentId = toInt(req.body.resident_id || req.body.residentId, 0)
  const lowIncomeType = pickLowIncomeType(req.body)

  if (!residentId || !lowIncomeType) {
    return res.status(400).json({ code: 400, message: '缺少必要参数' })
  }

  try {
    const [residents] = await db.pool.execute('SELECT id FROM residents WHERE id = ?', [residentId])
    if (!residents.length) {
      return res.status(404).json({ code: 404, message: '居民不存在' })
    }

    const [existing] = await db.pool.execute(
      'SELECT id FROM low_income_persons WHERE resident_id = ? AND status = "active"',
      [residentId]
    )
    if (existing.length) {
      return res.status(400).json({ code: 400, message: '该居民已经是低收入人员' })
    }

    const applyDate = normalizeValue(
      req.body.apply_date || req.body.applyDate || req.body.start_date || req.body.startDate,
      true
    )
    const approvalDate = normalizeValue(req.body.approval_date || req.body.approvalDate, true)
    const status = req.body.status || 'active'

    const insertSql = `
      INSERT INTO low_income_persons
      (resident_id, low_income_type, apply_date, approval_date, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `
    const [result] = await db.pool.execute(insertSql, [
      residentId,
      lowIncomeType,
      applyDate,
      approvalDate,
      status
    ])

    res.json({ code: 20000, message: '新增低收入人员成功', data: { id: result.insertId } })
  } catch (err) {
    console.error('新增低收入人员失败:', err.message)
    res.status(500).json({ code: 500, message: '新增低收入人员失败' })
  }
}

router.post('/low-income', checkPermission('special:add'), createLowIncome)
router.post('/low-income-persons', checkPermission('special:add'), createLowIncome)

// 新增低收入人员及政策记录（事务）
router.post('/low-income-persons-with-policy', checkPermission('special:add'), async (req, res) => {
  const residentId = toInt(req.body.resident_id || req.body.residentId, 0)
  const lowIncomeType = pickLowIncomeType(req.body)

  if (!residentId || !lowIncomeType) {
    return res.status(400).json({ code: 400, message: '缺少必要参数' })
  }

  const applyDate = normalizeValue(
    req.body.apply_date || req.body.applyDate || req.body.start_date || req.body.startDate,
    true
  )
  const approvalDate = normalizeValue(req.body.approval_date || req.body.approvalDate, true)
  const status = req.body.status || 'active'

  const policyType = req.body.policy_type || req.body.policyType || lowIncomeType
  const hasSubsidy = req.body.has_subsidy
  const hasSubsidyValue = hasSubsidy === undefined || hasSubsidy === null ? null : hasSubsidy ? 1 : 0
  const startDate = normalizeValue(req.body.start_date || req.body.startDate, true)
  const endDate = normalizeValue(req.body.end_date || req.body.endDate, true)
  const subsidyAmount = normalizeValue(req.body.subsidy_amount || req.body.subsidyAmount, true)
  const subsidyCycle = normalizeValue(req.body.subsidy_cycle || req.body.subsidyCycle, true)
  const enjoyLevel = normalizeValue(req.body.enjoy_level || req.body.enjoyLevel, true)
  const accountName = normalizeValue(req.body.account_name || req.body.accountName, true)
  const accountRelationship = normalizeValue(
    req.body.account_relationship || req.body.accountRelationship,
    true
  )
  const bankName = normalizeValue(req.body.bank_name || req.body.bankName, true)
  const bankAccount = normalizeValue(req.body.bank_account || req.body.bankAccount, true)
  const remark = normalizeValue(req.body.remark, true)

  let connection
  try {
    const [residents] = await db.pool.execute('SELECT id FROM residents WHERE id = ?', [residentId])
    if (!residents.length) {
      return res.status(404).json({ code: 404, message: '居民不存在' })
    }

    connection = await db.beginTransaction()

    const [personResult] = await connection.execute(
      `
        INSERT INTO low_income_persons
        (resident_id, low_income_type, apply_date, approval_date, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [residentId, lowIncomeType, applyDate, approvalDate, status]
    )

    const lowIncomePersonId = personResult.insertId

    await connection.execute(
      `
        INSERT INTO low_income_policy_records
        (low_income_person_id, policy_type, has_subsidy, start_date, end_date, subsidy_amount, subsidy_cycle, enjoy_level,
         account_name, account_relationship, bank_name, bank_account, status, remark, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        lowIncomePersonId,
        policyType,
        hasSubsidyValue,
        startDate,
        endDate,
        subsidyAmount,
        subsidyCycle,
        enjoyLevel,
        accountName,
        accountRelationship,
        bankName,
        bankAccount,
        status,
        remark
      ]
    )

    await db.commit(connection)

    res.json({
      code: 20000,
      message: '新增低收入人员及政策记录成功',
      data: { id: lowIncomePersonId }
    })
  } catch (err) {
    if (connection) {
      await db.rollback(connection)
    }
    console.error('新增低收入人员及政策记录失败:', err.message)
    res.status(500).json({ code: 500, message: '新增低收入人员及政策记录失败' })
  }
})

// 更新低收入人员信息
const updateLowIncome = async (req, res) => {
  const id = toInt(req.params.id, 0)
  if (!id) {
    return res.status(400).json({ code: 400, message: 'id 参数错误' })
  }

  const lowIncomeType = pickLowIncomeType(req.body)
  const applyDate = normalizeValue(req.body.apply_date || req.body.applyDate || req.body.start_date || req.body.startDate)
  const approvalDate = normalizeValue(req.body.approval_date || req.body.approvalDate)
  const status = req.body.status

  const fields = []
  const params = []

  if (lowIncomeType !== null && lowIncomeType !== undefined) {
    fields.push('low_income_type = ?')
    params.push(lowIncomeType)
  }

  if (applyDate !== undefined) {
    fields.push('apply_date = ?')
    params.push(applyDate)
  }

  if (approvalDate !== undefined) {
    fields.push('approval_date = ?')
    params.push(approvalDate)
  }

  if (status !== undefined) {
    fields.push('status = ?')
    params.push(status || 'active')
  }

  if (!fields.length) {
    return res.status(400).json({ code: 400, message: '无可更新字段' })
  }

  fields.push('updated_at = NOW()')
  params.push(id)

  try {
    const [result] = await db.pool.execute(
      `UPDATE low_income_persons SET ${fields.join(', ')} WHERE id = ?`,
      params
    )

    if (!result.affectedRows) {
      return res.status(404).json({ code: 404, message: '低收入人员不存在' })
    }

    res.json({ code: 20000, message: '更新低收入人员成功' })
  } catch (err) {
    console.error('更新低收入人员失败:', err.message)
    res.status(500).json({ code: 500, message: '更新低收入人员失败' })
  }
}

router.put('/low-income/:id', checkPermission('special:edit'), updateLowIncome)
router.put('/low-income-persons/:id', checkPermission('special:edit'), updateLowIncome)

// 删除/取消低收入人员
const deleteLowIncome = async (req, res) => {
  const id = toInt(req.params.id, 0)
  if (!id) {
    return res.status(400).json({ code: 400, message: 'id 参数错误' })
  }

  try {
    const [result] = await db.pool.execute(
      "UPDATE low_income_persons SET status = 'cancelled', updated_at = NOW() WHERE id = ?",
      [id]
    )

    if (!result.affectedRows) {
      return res.status(404).json({ code: 404, message: '低收入人员不存在' })
    }

    res.json({ code: 20000, message: '删除低收入人员成功' })
  } catch (err) {
    console.error('删除低收入人员失败:', err.message)
    res.status(500).json({ code: 500, message: '删除低收入人员失败' })
  }
}

router.delete('/low-income/:id', checkPermission('special:delete'), deleteLowIncome)
router.delete('/low-income-persons/:id', checkPermission('special:delete'), deleteLowIncome)

// 获取政策记录列表
router.get('/low-income-policy-records', checkPermission('special:view'), async (req, res) => {
  const lowIncomePersonId = toInt(
    req.query.low_income_person_id || req.query.lowIncomePersonId,
    0
  )

  if (!lowIncomePersonId) {
    return res.status(400).json({ code: 400, message: 'low_income_person_id 参数必填' })
  }

  const { pageNum, pageSize, offset } = normalizePagination(req.query)

  try {
    const [rows] = await db.pool.execute(
      `
        SELECT *
        FROM low_income_policy_records
        WHERE low_income_person_id = ?
        ORDER BY created_at DESC, id DESC
        LIMIT ? OFFSET ?
      `,
      [lowIncomePersonId, pageSize, offset]
    )

    const [countRows] = await db.pool.execute(
      'SELECT COUNT(1) AS total FROM low_income_policy_records WHERE low_income_person_id = ?',
      [lowIncomePersonId]
    )

    res.json({
      code: 20000,
      data: rows,
      total: countRows?.[0]?.total || 0,
      page: pageNum,
      pageSize
    })
  } catch (err) {
    console.error('获取政策记录失败:', err.message)
    res.status(500).json({ code: 500, message: '获取政策记录失败' })
  }
})

// 新增政策记录
router.post('/low-income-policy-records', checkPermission('special:add'), async (req, res) => {
  const lowIncomePersonId = toInt(
    req.body.low_income_person_id || req.body.lowIncomePersonId,
    0
  )

  if (!lowIncomePersonId) {
    return res.status(400).json({ code: 400, message: 'low_income_person_id 参数必填' })
  }

  const policyType = normalizeValue(req.body.policy_type || req.body.policyType, true)
  const hasSubsidy = req.body.has_subsidy
  const hasSubsidyValue = hasSubsidy === undefined || hasSubsidy === null ? null : hasSubsidy ? 1 : 0
  const startDate = normalizeValue(req.body.start_date || req.body.startDate, true)
  const endDate = normalizeValue(req.body.end_date || req.body.endDate, true)
  const subsidyAmount = normalizeValue(req.body.subsidy_amount || req.body.subsidyAmount, true)
  const subsidyCycle = normalizeValue(req.body.subsidy_cycle || req.body.subsidyCycle, true)
  const enjoyLevel = normalizeValue(req.body.enjoy_level || req.body.enjoyLevel, true)
  const accountName = normalizeValue(req.body.account_name || req.body.accountName, true)
  const accountRelationship = normalizeValue(
    req.body.account_relationship || req.body.accountRelationship,
    true
  )
  const bankName = normalizeValue(req.body.bank_name || req.body.bankName, true)
  const bankAccount = normalizeValue(req.body.bank_account || req.body.bankAccount, true)
  const status = normalizeValue(req.body.status) || 'active'
  const remark = normalizeValue(req.body.remark, true)

  try {
    const [result] = await db.pool.execute(
      `
        INSERT INTO low_income_policy_records
        (low_income_person_id, policy_type, has_subsidy, start_date, end_date, subsidy_amount, subsidy_cycle, enjoy_level,
         account_name, account_relationship, bank_name, bank_account, status, remark, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        lowIncomePersonId,
        policyType,
        hasSubsidyValue,
        startDate,
        endDate,
        subsidyAmount,
        subsidyCycle,
        enjoyLevel,
        accountName,
        accountRelationship,
        bankName,
        bankAccount,
        status,
        remark
      ]
    )

    res.json({
      code: 20000,
      message: '新增政策记录成功',
      data: { id: result.insertId }
    })
  } catch (err) {
    console.error('新增政策记录失败:', err.message)
    res.status(500).json({ code: 500, message: '新增政策记录失败' })
  }
})

// 更新政策记录
router.put('/low-income-policy-records/:id', checkPermission('special:edit'), async (req, res) => {
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

  setIfDefined('policy_type', normalizeValue(req.body.policy_type || req.body.policyType))
  if (req.body.has_subsidy !== undefined) {
    fields.push('has_subsidy = ?')
    params.push(req.body.has_subsidy ? 1 : 0)
  }
  setIfDefined('start_date', normalizeValue(req.body.start_date || req.body.startDate))
  setIfDefined('end_date', normalizeValue(req.body.end_date || req.body.endDate))
  setIfDefined('subsidy_amount', normalizeValue(req.body.subsidy_amount || req.body.subsidyAmount))
  setIfDefined('subsidy_cycle', normalizeValue(req.body.subsidy_cycle || req.body.subsidyCycle))
  setIfDefined('enjoy_level', normalizeValue(req.body.enjoy_level || req.body.enjoyLevel))
  setIfDefined('account_name', normalizeValue(req.body.account_name || req.body.accountName))
  setIfDefined('account_relationship', normalizeValue(req.body.account_relationship || req.body.accountRelationship))
  setIfDefined('bank_name', normalizeValue(req.body.bank_name || req.body.bankName))
  setIfDefined('bank_account', normalizeValue(req.body.bank_account || req.body.bankAccount))
  setIfDefined('status', normalizeValue(req.body.status))
  setIfDefined('remark', normalizeValue(req.body.remark))

  if (!fields.length) {
    return res.status(400).json({ code: 400, message: '无可更新字段' })
  }

  fields.push('updated_at = NOW()')
  params.push(id)

  try {
    const [result] = await db.pool.execute(
      `UPDATE low_income_policy_records SET ${fields.join(', ')} WHERE id = ?`,
      params
    )

    if (!result.affectedRows) {
      return res.status(404).json({ code: 404, message: '政策记录不存在' })
    }

    res.json({ code: 20000, message: '更新政策记录成功' })
  } catch (err) {
    console.error('更新政策记录失败:', err.message)
    res.status(500).json({ code: 500, message: '更新政策记录失败' })
  }
})

// 删除政策记录
router.delete('/low-income-policy-records/:id', checkPermission('special:delete'), async (req, res) => {
  const id = toInt(req.params.id, 0)
  if (!id) {
    return res.status(400).json({ code: 400, message: 'id 参数错误' })
  }

  try {
    const [result] = await db.pool.execute(
      'DELETE FROM low_income_policy_records WHERE id = ?',
      [id]
    )

    if (!result.affectedRows) {
      return res.status(404).json({ code: 404, message: '政策记录不存在' })
    }

    res.json({ code: 20000, message: '删除政策记录成功' })
  } catch (err) {
    console.error('删除政策记录失败:', err.message)
    res.status(500).json({ code: 500, message: '删除政策记录失败' })
  }
})

// 获取单个成员的历史享受政策月数
router.get('/low-income-persons/:id/total-months', checkPermission('special:view'), async (req, res) => {
  const id = toInt(req.params.id, 0)
  if (!id) {
    return res.status(400).json({ code: 400, message: 'id 参数错误' })
  }

  try {
    const [rows] = await db.pool.execute(
      `
        SELECT
          COALESCE(SUM(TIMESTAMPDIFF(MONTH, start_date, COALESCE(end_date, CURDATE())) + 1), 0) AS totalMonths
        FROM low_income_policy_records
        WHERE low_income_person_id = ?
      `,
      [id]
    )

    res.json({
      code: 20000,
      data: { totalMonths: rows?.[0]?.totalMonths || 0 }
    })
  } catch (err) {
    console.error('获取成员历史月数失败:', err.message)
    res.status(500).json({ code: 500, message: '获取成员历史月数失败' })
  }
})

// 获取该户所有成员享受总金额
router.get('/low-income-persons/:id/household-total-subsidy', checkPermission('special:view'), async (req, res) => {
  const id = toInt(req.params.id, 0)
  if (!id) {
    return res.status(400).json({ code: 400, message: 'id 参数错误' })
  }

  try {
    const [householdRows] = await db.pool.execute(
      `
        SELECT r.household_id
        FROM low_income_persons l
        JOIN residents r ON l.resident_id = r.id
        WHERE l.id = ?
        LIMIT 1
      `,
      [id]
    )

    const householdId = householdRows?.[0]?.household_id
    if (!householdId) {
      return res.json({ code: 20000, data: { totalSubsidy: 0, totalMonths: 0 } })
    }

    const [rows] = await db.pool.execute(
      `
        SELECT
          COALESCE(SUM(TIMESTAMPDIFF(MONTH, p.start_date, COALESCE(p.end_date, CURDATE())) + 1), 0) AS totalMonths,
          COALESCE(SUM(
            (
              CASE
                WHEN p.subsidy_cycle = 'quarterly' THEN COALESCE(p.subsidy_amount, 0) / 3
                WHEN p.subsidy_cycle = 'yearly' THEN COALESCE(p.subsidy_amount, 0) / 12
                ELSE COALESCE(p.subsidy_amount, 0)
              END
            ) *
            (TIMESTAMPDIFF(MONTH, p.start_date, COALESCE(p.end_date, CURDATE())) + 1)
          ), 0) AS totalSubsidy
        FROM low_income_persons l
        JOIN residents r ON l.resident_id = r.id
        JOIN low_income_policy_records p ON p.low_income_person_id = l.id
        WHERE r.household_id = ?
      `,
      [householdId]
    )

    res.json({
      code: 20000,
      data: {
        totalSubsidy: rows?.[0]?.totalSubsidy || 0,
        totalMonths: rows?.[0]?.totalMonths || 0
      }
    })
  } catch (err) {
    console.error('获取户总补贴失败:', err.message)
    res.status(500).json({ code: 500, message: '获取户总补贴失败' })
  }
})

module.exports = router
