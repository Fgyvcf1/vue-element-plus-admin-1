const express = require('express')
const router = express.Router()
const db = require('../db')
const { checkPermission } = require('../middleware/auth')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const axios = require('axios')

// 发送通知的辅助函数
async function sendNotification(title, content, type = 'info', priority = 1, status = 'active') {
  try {
    // 调用通知模块的API发送通知
    const response = await axios.post('http://localhost:3000/api/notifications', {
      title,
      content,
      type,
      priority,
      status
    })
    console.log('发送通知成功:', response.data)
    return response.data
  } catch (error) {
    console.error('发送通知失败:', error.message)
    return null
  }
}

const archiveStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/archive-images'
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const ext = path.extname(file.originalname)
    cb(null, `${timestamp}-${randomStr}${ext}`)
  }
})

// 解码中文文件名的辅助函数
function decodeFilename(filename) {
  try {
    // 尝试解码 URI 编码的文件名
    if (/%[0-9A-Fa-f]{2}/.test(filename)) {
      return decodeURIComponent(filename)
    }
    // 尝试将 Latin-1 编码的中文转换为 UTF-8
    const buffer = Buffer.from(filename, 'latin1')
    const utf8Filename = buffer.toString('utf8')
    return utf8Filename
  } catch (error) {
    // 如果解码失败，返回原始文件名
    return filename
  }
}

const archiveUpload = multer({
  storage: archiveStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|bmp|webp/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    if (mimetype && extname) return cb(null, true)
    else cb(new Error('只允许上传图片文件!'))
  }
})

function getLocalTime() {
  const now = new Date()
  const timezoneOffset = now.getTimezoneOffset() * 60000
  const localDate = new Date(now.getTime() - timezoneOffset)
  return localDate.toISOString().slice(0, 19).replace('T', ' ')
}

// 获取调解档案状态统计（用于仪表盘事项进度图）
router.get('/archives/status-stats', async (req, res) => {
  try {
    const sql = `
      SELECT 
        status,
        COUNT(*) as count
      FROM mediation_archives
      GROUP BY status
    `

    const [rows] = await db.pool.execute(sql)

    // 初始化所有状态为0
    const statusMap = {
      completed: { name: '已完成', value: 0, color: '#67C23A' },
      in_progress: { name: '处理中', value: 0, color: '#E6A23C' },
      pending: { name: '待处理', value: 0, color: '#F56C6C' }
    }

    // 合并查询结果
    rows.forEach((row) => {
      if (statusMap[row.status]) {
        statusMap[row.status].value = row.count
      }
    })

    res.json({
      code: 20000,
      success: true,
      data: Object.values(statusMap)
    })
  } catch (err) {
    console.error('获取调解状态统计失败:', err.message)
    res.status(500).json({ code: 500, message: '获取调解状态统计失败: ' + err.message })
  }
})

// 获取调解档案月度统计（用于仪表盘趋势图）- 必须放在 /archives/:id 之前
router.get('/archives/mediation-monthly-stats', async (req, res) => {
  try {
    // 获取最近6个月的调解档案数量统计
    const sql = `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count
      FROM mediation_archives
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `

    const [rows] = await db.pool.execute(sql)

    // 生成最近6个月的完整数据（包括没有数据的月份）
    const result = []
    const now = new Date()

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = `${d.getMonth() + 1}月`

      const existingData = rows.find((r) => r.month === monthKey)
      result.push({
        month: monthLabel,
        count: existingData ? existingData.count : 0
      })
    }

    res.json({
      code: 20000,
      success: true,
      data: result
    })
  } catch (err) {
    console.error('获取调解月度统计失败:', err.message)
    res.status(500).json({ code: 500, message: '获取调解月度统计失败: ' + err.message })
  }
})

router.get('/archives', async (req, res) => {
  const { page = 1, pageSize = 20, status, keyword } = req.query
  const offset = (parseInt(page) - 1) * parseInt(pageSize)

  try {
    let sql = `SELECT a.*,
      (SELECT GROUP_CONCAT(name SEPARATOR '、') FROM mediation_applicants WHERE archive_id = a.archive_id) as applicant_names,
      (SELECT COUNT(*) FROM mediation_applicants WHERE archive_id = a.archive_id) as applicant_count,
      (SELECT GROUP_CONCAT(name SEPARATOR '、') FROM mediation_respondents WHERE archive_id = a.archive_id) as respondent_names,
      (SELECT COUNT(*) FROM mediation_respondents WHERE archive_id = a.archive_id) as respondent_count
      FROM mediation_archives a WHERE 1=1`

    const params = []
    if (status) {
      sql += ' AND a.status = ?'
      params.push(status)
    }
    if (keyword) {
      sql += ' AND a.archive_id LIKE ?'
      params.push(`%${keyword}%`)
    }
    sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?'
    params.push(parseInt(pageSize), offset)

    const [rows] = await db.pool.execute(sql, params)

    let countSql = 'SELECT COUNT(*) as total FROM mediation_archives WHERE 1=1'
    const countParams = []
    if (status) {
      countSql += ' AND status = ?'
      countParams.push(status)
    }
    if (keyword) {
      countSql += ' AND archive_id LIKE ?'
      countParams.push(`%${keyword}%`)
    }

    const [countRows] = await db.pool.execute(countSql, countParams)
    const total = countRows[0].total

    const formattedRows = rows.map((row) => {
      const formatPeople = (names, count) => {
        if (!names || count === 0) return '-'
        if (count === 1) return names
        return `${names.split('、')[0]}等${count}人`
      }
      return {
        ...row,
        applicant_display: formatPeople(row.applicant_names, row.applicant_count),
        respondent_display: formatPeople(row.respondent_names, row.respondent_count)
      }
    })

    res.json({ code: 20000, data: { items: formattedRows, total } })
  } catch (err) {
    console.error('获取档案列表失败:', err.message)
    res.status(500).json({ code: 500, message: '获取档案列表失败: ' + err.message })
  }
})

router.get('/archives/prefixes', async (req, res) => {
  try {
    const [rows] = await db.pool.execute(
      'SELECT prefix, current_number FROM archive_sequences ORDER BY prefix'
    )
    res.json({ code: 20000, data: rows })
  } catch (err) {
    console.error('获取前缀列表失败:', err.message)
    res.status(500).json({ code: 500, message: '获取前缀列表失败: ' + err.message })
  }
})

router.post('/archives/prefixes', async (req, res) => {
  const { prefix } = req.body
  if (!prefix) return res.status(400).json({ code: 400, message: '前缀不能为空' })

  try {
    const [rows] = await db.pool.execute('SELECT id FROM archive_sequences WHERE prefix = ?', [
      prefix
    ])
    if (rows.length > 0) return res.status(400).json({ code: 400, message: '前缀已存在' })

    await db.pool.execute(
      'INSERT INTO archive_sequences (prefix, current_number, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
      [prefix, 0]
    )
    res.json({ code: 20000, message: '前缀添加成功', data: { prefix, current_number: 0 } })
  } catch (err) {
    console.error('添加前缀失败:', err.message)
    res.status(500).json({ code: 500, message: '添加前缀失败: ' + err.message })
  }
})

router.delete('/archives/prefixes/:prefix', async (req, res) => {
  const { prefix } = req.params

  try {
    const [rows] = await db.pool.execute('SELECT id FROM mediation_archives WHERE prefix = ?', [
      prefix
    ])
    if (rows.length > 0)
      return res.status(400).json({ code: 400, message: '该前缀已被档案使用，无法删除' })

    await db.pool.execute('DELETE FROM archive_sequences WHERE prefix = ?', [prefix])
    res.json({ code: 20000, message: '前缀删除成功' })
  } catch (err) {
    console.error('删除前缀失败:', err.message)
    res.status(500).json({ code: 500, message: '删除前缀失败: ' + err.message })
  }
})

router.post('/archives', async (req, res) => {
  const { prefix } = req.body
  if (!prefix) return res.status(400).json({ code: 400, message: '请选择档案编号前缀' })

  let connection
  try {
    connection = await db.pool.getConnection()
    await connection.beginTransaction()

    // 查询该前缀在档案表中实际存在的最大序号（而非计数器表）
    // 这样可以实现删除档案后重用编号
    const [maxSeqRows] = await connection.execute(
      'SELECT MAX(sequence_number) as maxSeq FROM mediation_archives WHERE prefix = ?',
      [prefix]
    )
    const maxSeq = maxSeqRows[0].maxSeq || 0
    const newNumber = maxSeq + 1
    const paddedNumber = String(newNumber).padStart(3, '0')
    const archiveId = `${prefix}-${paddedNumber}`

    // 同时更新计数器表，保持同步（可选，用于兼容旧逻辑）
    const [seqRows] = await connection.execute(
      'SELECT current_number FROM archive_sequences WHERE prefix = ?',
      [prefix]
    )
    if (seqRows[0]) {
      await connection.execute(
        'UPDATE archive_sequences SET current_number = ?, updated_at = NOW() WHERE prefix = ?',
        [newNumber, prefix]
      )
    } else {
      await connection.execute(
        'INSERT INTO archive_sequences (prefix, current_number, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
        [prefix, newNumber]
      )
    }

    // 获取档案表最大ID并生成新ID
    const [maxArchiveIdResult] = await connection.execute(
      'SELECT MAX(id) as maxId FROM mediation_archives'
    )
    const newArchiveId = (maxArchiveIdResult[0].maxId || 0) + 1

    // 创建档案
    await connection.execute(
      'INSERT INTO mediation_archives (id, archive_id, prefix, sequence_number, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [newArchiveId, archiveId, prefix, newNumber, 'draft']
    )

    await connection.commit()
    res.json({
      code: 20000,
      message: '档案创建成功',
      data: { archive_id: archiveId, prefix, sequence_number: newNumber, status: 'draft' }
    })
  } catch (err) {
    console.error('创建档案失败:', err.message)
    if (connection) await connection.rollback()
    res.status(500).json({ code: 500, message: '创建档案失败: ' + err.message })
  } finally {
    if (connection) connection.release()
  }
})

router.get('/archives/:id', async (req, res) => {
  const { id } = req.params

  try {
    // 获取档案信息 - 使用档案编号查询
    const [archiveRows] = await db.pool.execute(
      'SELECT * FROM mediation_archives WHERE archive_id = ?',
      [id]
    )
    if (archiveRows.length === 0) return res.status(404).json({ code: 404, message: '档案不存在' })
    const archive = archiveRows[0]
    const archiveIdStr = archive.archive_id // 获取字符串形式的archive_id用于后续查询

    // 获取申请书信息
    const [applicationRows] = await db.pool.execute(
      'SELECT * FROM mediation_applications WHERE archive_id = ?',
      [archiveIdStr]
    )
    const application = applicationRows[0] || null

    // 获取申请人信息（包含新添加的字段）
    const [applicantRows] = await db.pool.execute(
      `SELECT a.id, a.archive_id, a.is_resident, a.resident_id, a.name, a.id_card, a.phone, a.address,
              a.gender, a.ethnicity, a.age, a.occupation,
              r.name as resident_name, r.id_card as resident_id_card, r.phone_number as resident_phone, r.Home_address as resident_address,
              r.gender as resident_gender, r.ethnicity as resident_ethnicity, r.date_of_birth as resident_birth_date, r.occupation as resident_occupation
       FROM mediation_applicants a LEFT JOIN residents r ON a.resident_id = r.id WHERE a.archive_id = ? ORDER BY a.id`,
      [archiveIdStr]
    )

    // 获取被申请人信息（包含新添加的字段）
    const [respondentRows] = await db.pool.execute(
      `SELECT a.id, a.archive_id, a.is_resident, a.resident_id, a.name, a.id_card, a.phone, a.address,
              a.gender, a.ethnicity, a.age, a.occupation,
              r.name as resident_name, r.id_card as resident_id_card, r.phone_number as resident_phone, r.Home_address as resident_address,
              r.gender as resident_gender, r.ethnicity as resident_ethnicity, r.date_of_birth as resident_birth_date, r.occupation as resident_occupation
       FROM mediation_respondents a LEFT JOIN residents r ON a.resident_id = r.id WHERE a.archive_id = ? ORDER BY a.id`,
      [archiveIdStr]
    )

    // 获取调解记录
    const [recordRows] = await db.pool.execute(
      'SELECT * FROM mediation_records WHERE archive_id = ? ORDER BY mediation_date DESC',
      [archiveIdStr]
    )

    // 获取调解协议
    const [agreementRows] = await db.pool.execute(
      'SELECT * FROM mediation_agreements WHERE archive_id = ?',
      [archiveIdStr]
    )
    const agreement = agreementRows[0] || null

    // 获取附件
    const [attachmentRows] = await db.pool.execute(
      'SELECT * FROM archive_attachments WHERE archive_id = ? ORDER BY created_at',
      [archiveIdStr]
    )

    res.json({
      code: 20000,
      data: {
        archive,
        application,
        applicants: applicantRows,
        respondents: respondentRows,
        record: recordRows[0] || null,
        records: recordRows,
        agreement,
        attachments: attachmentRows
      }
    })
  } catch (err) {
    console.error('获取档案详情失败:', err.message)
    res.status(500).json({ code: 500, message: '获取档案详情失败: ' + err.message })
  }
})

router.delete('/archives/:id', async (req, res) => {
  const { id } = req.params
  try {
    await db.pool.execute('DELETE FROM mediation_archives WHERE archive_id = ?', [id])
    res.json({ code: 20000, message: '档案删除成功' })
  } catch (err) {
    console.error('删除档案失败:', err.message)
    res.status(500).json({ code: 500, message: '删除档案失败: ' + err.message })
  }
})

router.post('/archives/:id/application', async (req, res) => {
  const { id } = req.params
  const {
    dispute_type,
    dispute_description,
    request_content,
    occurrence_date,
    occurrence_location,
    apply_date,
    applicants,
    respondents
  } = req.body

  console.log('收到保存申请书请求:', {
    id,
    dispute_type,
    occurrence_date,
    occurrence_location,
    apply_date
  })
  console.log('申请人数据:', JSON.stringify(applicants))
  console.log('被申请人数据:', JSON.stringify(respondents))

  let connection
  try {
    connection = await db.pool.getConnection()
    await connection.beginTransaction()

    // 删除旧的申请人和被申请人
    await connection.execute('DELETE FROM mediation_applicants WHERE archive_id = ?', [id])
    await connection.execute('DELETE FROM mediation_respondents WHERE archive_id = ?', [id])
    await connection.execute('DELETE FROM mediation_applications WHERE archive_id = ?', [id])

    // 获取申请书最大ID并生成新ID
    const [maxAppIdResult] = await connection.execute(
      'SELECT MAX(id) as maxId FROM mediation_applications'
    )
    const newAppId = (maxAppIdResult[0].maxId || 0) + 1

    // 插入申请书（apply_date 使用当前日期）
    const currentDate = new Date().toISOString().split('T')[0]
    await connection.execute(
      `INSERT INTO mediation_applications (id, archive_id, dispute_type, dispute_description, request_content, occurrence_date, occurrence_location, apply_date, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        newAppId,
        id,
        dispute_type || '',
        dispute_description || '',
        request_content || '',
        occurrence_date || null,
        occurrence_location || null,
        currentDate
      ]
    )

    // 插入申请人（包含新字段）
    if (applicants && applicants.length > 0) {
      // 获取最大ID
      const [maxIdResult] = await connection.execute(
        'SELECT MAX(id) as maxId FROM mediation_applicants'
      )
      let maxId = maxIdResult[0].maxId || 0

      for (const item of applicants) {
        maxId++
        const isResident = item.isResident || (item.residentId ? true : false)
        const residentId = item.residentId || null
        await connection.execute(
          `INSERT INTO mediation_applicants (id, archive_id, is_resident, resident_id, name, id_card, phone, address, 
            gender, ethnicity, age, occupation, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            maxId,
            id,
            isResident ? 1 : 0,
            residentId,
            item.name || '',
            item.idCard || null,
            item.phone || null,
            item.address || null,
            item.gender || null,
            item.ethnicity || '汉族',
            item.age || null,
            item.occupation || null
          ]
        )
      }
    }

    // 插入被申请人（包含新字段）
    if (respondents && respondents.length > 0) {
      // 获取最大ID
      const [maxIdResult] = await connection.execute(
        'SELECT MAX(id) as maxId FROM mediation_respondents'
      )
      let maxId = maxIdResult[0].maxId || 0

      for (const item of respondents) {
        maxId++
        const isResident = item.isResident || (item.residentId ? true : false)
        const residentId = item.residentId || null
        await connection.execute(
          `INSERT INTO mediation_respondents (id, archive_id, is_resident, resident_id, name, id_card, phone, address, 
            gender, ethnicity, age, occupation, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            maxId,
            id,
            isResident ? 1 : 0,
            residentId,
            item.name || '',
            item.idCard || null,
            item.phone || null,
            item.address || null,
            item.gender || null,
            item.ethnicity || '汉族',
            item.age || null,
            item.occupation || null
          ]
        )
      }
    }

    // 更新档案状态
    await connection.execute(
      'UPDATE mediation_archives SET status = ?, updated_at = NOW() WHERE archive_id = ?',
      ['in_progress', id]
    )

    await connection.commit()

    // 发送案件状态变化通知
    try {
      const title = `案件状态变化通知`
      const content = `档案编号为 ${id} 的案件已从"草稿"状态变为"进行中"状态。`
      await sendNotification(title, content, 'info', 1, 'active')
    } catch (notifyErr) {
      console.error('发送通知失败:', notifyErr.message)
      // 通知失败不影响主流程
    }

    res.json({ code: 20000, message: '申请书保存成功' })
  } catch (err) {
    console.error('保存申请书失败:', err.message)
    if (connection) await connection.rollback()
    res.status(500).json({ code: 500, message: '保存申请书失败: ' + err.message })
  } finally {
    if (connection) connection.release()
  }
})

// 保存调解记录
router.post('/archives/:id/records', async (req, res) => {
  const { id } = req.params
  const {
    mediation_date,
    mediation_location,
    mediators,
    process_record,
    mediation_result,
    agreement
  } = req.body

  let connection
  try {
    connection = await db.pool.getConnection()
    await connection.beginTransaction()

    // 获取最大ID并生成新ID
    const [maxIdResult] = await connection.execute('SELECT MAX(id) as maxId FROM mediation_records')
    const newId = (maxIdResult[0].maxId || 0) + 1

    await connection.execute(
      `INSERT INTO mediation_records (id, archive_id, mediation_date, mediation_location, mediators, process_record, mediation_result, agreement, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        newId,
        id,
        mediation_date,
        mediation_location,
        mediators,
        process_record,
        mediation_result,
        agreement
      ]
    )

    // 如果达成协议，更新档案状态为已完成
    if (agreement === 'yes') {
      await connection.execute(
        'UPDATE mediation_archives SET status = ?, updated_at = NOW() WHERE archive_id = ?',
        ['completed', id]
      )
    }

    await connection.commit()
    res.json({ code: 20000, message: '保存调解记录成功' })
  } catch (err) {
    console.error('保存调解记录失败:', err.message)
    if (connection) await connection.rollback()
    res.status(500).json({ code: 500, message: '保存调解记录失败: ' + err.message })
  } finally {
    if (connection) connection.release()
  }
})

// 保存调解协议
router.post('/archives/:id/agreement', async (req, res) => {
  const { id } = req.params
  const {
    agreement_date,
    agreement_content,
    performance_period,
    breach_liability,
    party_a_sign,
    party_b_sign,
    mediator_sign
  } = req.body

  let connection
  try {
    connection = await db.pool.getConnection()
    await connection.beginTransaction()

    // 先删除旧记录
    await connection.execute('DELETE FROM mediation_agreements WHERE archive_id = ?', [id])

    // 获取最大ID并生成新ID
    const [maxIdResult] = await connection.execute(
      'SELECT MAX(id) as maxId FROM mediation_agreements'
    )
    const newId = (maxIdResult[0].maxId || 0) + 1

    // 插入新记录
    await connection.execute(
      `INSERT INTO mediation_agreements (id, archive_id, agreement_date, agreement_content, performance_period, breach_liability, party_a_sign, party_b_sign, mediator_sign, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        newId,
        id,
        agreement_date,
        agreement_content,
        performance_period,
        breach_liability,
        party_a_sign,
        party_b_sign,
        mediator_sign
      ]
    )

    // 更新档案状态为已完成
    await connection.execute(
      'UPDATE mediation_archives SET status = ?, updated_at = NOW() WHERE archive_id = ?',
      ['completed', id]
    )

    await connection.commit()
    res.json({ code: 20000, message: '保存调解协议成功' })
  } catch (err) {
    console.error('保存调解协议失败:', err.message)
    if (connection) await connection.rollback()
    res.status(500).json({ code: 500, message: '保存调解协议失败: ' + err.message })
  } finally {
    if (connection) connection.release()
  }
})

// 生成调解申请书PDF
router.post('/archives/:id/generate-pdf/application', async (req, res) => {
  const { id } = req.params
  const archiveService = require('../services/archiveService')
  const pdfService = require('../services/pdfService')

  try {
    // 获取档案详情
    const archiveDetail = await archiveService.getArchiveDetail(id)

    if (!archiveDetail || !archiveDetail.application) {
      return res.status(400).json({ code: 400, message: '档案或申请书不存在' })
    }

    // 生成PDF
    const pdfResult = await pdfService.generateApplicationPDF({
      archive_id: id,
      ...archiveDetail.application,
      applicants: archiveDetail.applicants,
      respondents: archiveDetail.respondents
    })

    res.json({
      code: 20000,
      message: 'PDF生成成功',
      data: pdfResult
    })
  } catch (error) {
    console.error('生成PDF失败:', error)
    res.status(500).json({ code: 500, message: '生成PDF失败: ' + error.message })
  }
})

// 生成调解记录PDF
router.post('/archives/:id/generate-pdf/record', async (req, res) => {
  const { id } = req.params
  const recordId = req.body?.recordId
  const archiveService = require('../services/archiveService')
  const pdfService = require('../services/pdfService')

  try {
    // 获取档案详情
    const archiveDetail = await archiveService.getArchiveDetail(id)

    if (!archiveDetail || !archiveDetail.records || archiveDetail.records.length === 0) {
      return res.status(400).json({ code: 400, message: '档案或调解记录不存在' })
    }

    // 选择指定的记录或最新记录
    const record = recordId
      ? archiveDetail.records.find((r) => r.id === recordId)
      : archiveDetail.records[0]

    if (!record) {
      return res.status(400).json({ code: 400, message: '指定的调解记录不存在' })
    }

    // 生成PDF
    const pdfResult = await pdfService.generateRecordPDF(record, archiveDetail.attachments || [])

    res.json({
      code: 20000,
      message: 'PDF生成成功',
      data: pdfResult
    })
  } catch (error) {
    console.error('生成PDF失败:', error)
    res.status(500).json({ code: 500, message: '生成PDF失败: ' + error.message })
  }
})

// 生成调解协议书PDF
router.post('/archives/:id/generate-pdf/agreement', async (req, res) => {
  const { id } = req.params
  const archiveService = require('../services/archiveService')
  const pdfService = require('../services/pdfService')

  try {
    // 获取档案详情
    const archiveDetail = await archiveService.getArchiveDetail(id)

    if (!archiveDetail || !archiveDetail.agreement) {
      return res.status(400).json({ code: 400, message: '档案或调解协议不存在' })
    }

    // 生成PDF
    const pdfResult = await pdfService.generateAgreementPDF(archiveDetail.agreement)

    res.json({
      code: 20000,
      message: 'PDF生成成功',
      data: pdfResult
    })
  } catch (error) {
    console.error('生成PDF失败:', error)
    res.status(500).json({ code: 500, message: '生成PDF失败: ' + error.message })
  }
})

// 获取档案的PDF文件列表
router.get('/archives/:id/files', async (req, res) => {
  const { id } = req.params

  try {
    const [rows] = await db.pool.execute(
      'SELECT * FROM archive_files WHERE archive_id = ? ORDER BY created_at',
      [id]
    )
    res.json({ code: 20000, data: rows })
  } catch (err) {
    console.error('获取文件列表失败:', err.message)
    res.status(500).json({ code: 500, message: '获取文件列表失败: ' + err.message })
  }
})

// 获取档案的附件列表
router.get('/archives/:id/attachments', async (req, res) => {
  const { id } = req.params

  try {
    const [rows] = await db.pool.execute(
      'SELECT * FROM archive_attachments WHERE archive_id = ? ORDER BY created_at',
      [id]
    )
    res.json({ code: 20000, data: rows })
  } catch (err) {
    console.error('获取附件列表失败:', err.message)
    res.status(500).json({ code: 500, message: '获取附件列表失败: ' + err.message })
  }
})

// 上传档案附件
router.post('/archives/:id/attachments', archiveUpload.array('file', 10), async (req, res) => {
  const { id } = req.params
  const files = req.files

  if (!files || files.length === 0) {
    return res.status(400).json({ code: 400, message: '请选择要上传的文件' })
  }

  let connection
  try {
    connection = await db.pool.getConnection()
    await connection.beginTransaction()

    // 获取最大ID
    const [maxIdResult] = await connection.execute(
      'SELECT MAX(id) as maxId FROM archive_attachments'
    )
    let maxId = maxIdResult[0].maxId || 0

    const insertedAttachments = []

    for (const file of files) {
      maxId++
      // 解码中文文件名
      const decodedFilename = decodeFilename(file.originalname)
      await connection.execute(
        `INSERT INTO archive_attachments (id, archive_id, record_id, file_name, file_path, file_type, file_size, description, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          maxId,
          id,
          null, // record_id
          decodedFilename,
          `/uploads/archive-images/${file.filename}`,
          path.extname(decodedFilename).slice(1).toLowerCase(),
          file.size,
          '' // description
        ]
      )

      insertedAttachments.push({
        id: maxId,
        archive_id: id,
        file_name: decodedFilename,
        file_path: `/uploads/archive-images/${file.filename}`,
        file_type: path.extname(decodedFilename).slice(1).toLowerCase(),
        file_size: file.size
      })
    }

    await connection.commit()
    res.json({ code: 20000, message: '附件上传成功', data: insertedAttachments })
  } catch (err) {
    console.error('上传附件失败:', err.message)
    if (connection) await connection.rollback()
    res.status(500).json({ code: 500, message: '上传附件失败: ' + err.message })
  } finally {
    if (connection) connection.release()
  }
})

// 删除档案附件
router.delete('/archives/:id/attachments/:attachmentId', async (req, res) => {
  const { id, attachmentId } = req.params

  let connection
  try {
    connection = await db.pool.getConnection()
    await connection.beginTransaction()

    // 先获取附件信息，用于删除文件
    const [rows] = await connection.execute(
      'SELECT * FROM archive_attachments WHERE id = ? AND archive_id = ?',
      [attachmentId, id]
    )
    const attachment = rows[0]

    if (!attachment) {
      await connection.rollback()
      return res.status(404).json({ code: 404, message: '附件不存在' })
    }

    // 删除附件记录
    await connection.execute('DELETE FROM archive_attachments WHERE id = ? AND archive_id = ?', [
      attachmentId,
      id
    ])

    await connection.commit()

    // 删除本地文件（事务提交后再删除文件）
    try {
      const filePath = path.join(__dirname, '..', attachment.file_path.slice(1)) // 移除开头的/
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch (fileErr) {
      console.error('删除本地文件失败:', fileErr.message)
      // 文件删除失败不影响API响应
    }

    res.json({ code: 20000, message: '附件删除成功' })
  } catch (err) {
    console.error('删除附件失败:', err.message)
    if (connection) await connection.rollback()
    res.status(500).json({ code: 500, message: '删除附件失败: ' + err.message })
  } finally {
    if (connection) connection.release()
  }
})

// 获取调解档案列表 - 需要view权限
router.get('/mediation-archives', (req, res) => {
  checkPermission('mediation:view')(req, res, () => {
    // 原有的处理逻辑
    const { page = 1, pageSize = 10, keyword, disputeType, status, dateRange } = req.query

    let sql = `
      SELECT ma.*, 
      GROUP_CONCAT(DISTINCT mr.name) as mediators_name,
      GROUP_CONCAT(DISTINCT ra.name) as applicants_name,
      GROUP_CONCAT(DISTINCT rb.name) as respondents_name
      FROM mediation_archives ma
      LEFT JOIN mediation_records mr ON ma.id = mr.archive_id
      LEFT JOIN archive_participants ap_a ON ma.id = ap_a.archive_id AND ap_a.type = 'applicant'
      LEFT JOIN residents ra ON ap_a.resident_id = ra.id
      LEFT JOIN archive_participants ap_b ON ma.id = ap_b.archive_id AND ap_b.type = 'respondent'
      LEFT JOIN residents rb ON ap_b.resident_id = rb.id
      WHERE ma.status != 'deleted'
    `
    const params = []

    // 添加关键词搜索条件
    if (keyword) {
      sql += ` AND (ma.case_title LIKE ? OR ma.case_description LIKE ? OR ma.archive_id LIKE ?`
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
      
      // 添加当事人姓名搜索
      sql += ` OR ra.name LIKE ? OR rb.name LIKE ?`
      params.push(`%${keyword}%`, `%${keyword}%`)
      
      sql += ')'
    }

    // 添加纠纷类型筛选
    if (disputeType) {
      sql += ' AND ma.dispute_type = ?'
      params.push(disputeType)
    }

    // 添加状态筛选
    if (status) {
      sql += ' AND ma.status = ?'
      params.push(status)
    }

    // 添加日期范围筛选
    if (dateRange && Array.isArray(dateRange) && dateRange.length === 2) {
      sql += ' AND ma.created_at BETWEEN ? AND ?'
      params.push(`${dateRange[0]} 00:00:00`, `${dateRange[1]} 23:59:59`)
    }

    sql += ' GROUP BY ma.id ORDER BY ma.created_at DESC'
    
    // 添加分页
    sql += ' LIMIT ? OFFSET ?'
    params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize))

    // 执行查询
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('查询调解档案列表失败:', err.message)
        return res.status(500).json({ code: 500, message: '查询调解档案列表失败' })
      }

      // 查询总数
      let countSql = 'SELECT COUNT(DISTINCT ma.id) as total FROM mediation_archives ma WHERE ma.status != "deleted"'
      const countParams = []

      // 添加同样的筛选条件
      if (keyword) {
        countSql += ` AND (ma.case_title LIKE ? OR ma.case_description LIKE ? OR ma.archive_id LIKE ? OR EXISTS(SELECT 1 FROM archive_participants ap INNER JOIN residents r ON ap.resident_id = r.id WHERE ap.archive_id = ma.id AND r.name LIKE ?))`
        countParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
      }

      if (disputeType) {
        countSql += ' AND ma.dispute_type = ?'
        countParams.push(disputeType)
      }

      if (status) {
        countSql += ' AND ma.status = ?'
        countParams.push(status)
      }

      if (dateRange && Array.isArray(dateRange) && dateRange.length === 2) {
        countSql += ' AND ma.created_at BETWEEN ? AND ?'
        countParams.push(`${dateRange[0]} 00:00:00`, `${dateRange[1]} 23:59:59`)
      }

      db.get(countSql, countParams, (err, countRow) => {
        if (err) {
          console.error('查询调解档案总数失败:', err.message)
          return res.status(500).json({ code: 500, message: '查询调解档案总数失败' })
        }

        res.json({
          code: 20000,
          data: {
            list: rows,
            total: countRow.total,
            page: parseInt(page),
            pageSize: parseInt(pageSize)
          }
        })
      })
    })
  })
})

// 创建调解档案 - 需要add权限
router.post('/mediation-archives', async (req, res) => {
  checkPermission('mediation:add')(req, res, async () => {
    // 原有的处理逻辑
    const {
      case_title, case_description, dispute_type, case_stage, applicants, respondents, 
      mediators, applicant_info, respondent_info, attachments
    } = req.body

    // 生成档案编号
    const archiveId = `MD-${Date.now()}-${Math.floor(Math.random() * 10000)}`

    // 开始事务
    const stmt = db.prepare(`
      INSERT INTO mediation_archives 
      (archive_id, case_title, case_description, dispute_type, case_stage, status, created_by, created_at) 
      VALUES (?, ?, ?, ?, ?, 'draft', ?, ?)
    `)

    const createdAt = new Date()
    stmt.run([
      archiveId, case_title, case_description, 
      dispute_type, case_stage || '受理', req.user?.id || null, createdAt
    ])

    const archiveIdNum = stmt.lastInsertRowid

    // 添加当事人信息
    if (applicants && applicants.length > 0) {
      const applicantStmt = db.prepare(`
        INSERT INTO archive_participants 
        (archive_id, resident_id, type, name, phone, address) 
        VALUES (?, ?, 'applicant', ?, ?, ?)
      `)
      
      for (const applicant of applicants) {
        if (typeof applicant === 'object') {
          applicantStmt.run([archiveIdNum, applicant.id, applicant.name, applicant.phone, applicant.address])
        } else {
          // 如果传入的是ID，则需要查询居民信息
          const resident = await new Promise((resolve) => {
            db.get('SELECT name, phone, household_address FROM residents WHERE id = ?', [applicant], (err, row) => {
              resolve(err ? null : row)
            })
          })
          
          if (resident) {
            applicantStmt.run([archiveIdNum, applicant, resident.name, resident.phone, resident.household_address])
          }
        }
      }
      applicantStmt.finalize()
    }

    // 添加被申请人信息
    if (respondents && respondents.length > 0) {
      const respondentStmt = db.prepare(`
        INSERT INTO archive_participants 
        (archive_id, resident_id, type, name, phone, address) 
        VALUES (?, ?, 'respondent', ?, ?, ?)
      `)
      
      for (const respondent of respondents) {
        if (typeof respondent === 'object') {
          respondentStmt.run([archiveIdNum, respondent.id, respondent.name, respondent.phone, respondent.address])
        } else {
          // 如果传入的是ID，则需要查询居民信息
          const resident = await new Promise((resolve) => {
            db.get('SELECT name, phone, household_address FROM residents WHERE id = ?', [respondent], (err, row) => {
              resolve(err ? null : row)
            })
          })
          
          if (resident) {
            respondentStmt.run([archiveIdNum, respondent, resident.name, resident.phone, resident.household_address])
          }
        }
      }
      respondentStmt.finalize()
    }

    // 添加调解员信息
    if (mediators && mediators.length > 0) {
      const mediatorStmt = db.prepare(`
        INSERT INTO archive_mediators (archive_id, mediator_id) 
        VALUES (?, ?)
      `)
      
      for (const mediator of mediators) {
        mediatorStmt.run([archiveIdNum, mediator])
      }
      mediatorStmt.finalize()
    }

    stmt.finalize()

    res.json({ 
      code: 20000, 
      message: '调解档案创建成功', 
      data: { id: archiveIdNum, archive_id: archiveId } 
    })
  })
})

// 更新调解档案 - 需要edit权限
router.put('/mediation-archives/:id', (req, res) => {
  checkPermission('mediation:edit')(req, res, () => {
    // 原有的处理逻辑
    const { id } = req.params
    const updates = req.body

    // 构建更新语句
    const allowedFields = [
      'case_title', 'case_description', 'dispute_type', 'case_stage', 
      'status', 'resolution_method', 'resolution_result', 'closed_at'
    ]

    let updateFields = []
    let updateValues = []

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`)
        updateValues.push(value)
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ code: 400, message: '没有有效的更新字段' })
    }

    updateValues.push(new Date())
    updateValues.push(id)

    const sql = `UPDATE mediation_archives SET ${updateFields.join(', ')}, updated_at = ? WHERE id = ?`

    db.run(sql, updateValues, function (err) {
      if (err) {
        console.error('更新调解档案失败:', err.message)
        return res.status(500).json({ code: 500, message: '更新调解档案失败' })
      }

      if (this.changes === 0) {
        return res.status(404).json({ code: 404, message: '调解档案不存在' })
      }

      res.json({ code: 20000, message: '调解档案更新成功' })
    })
  })
})

// 删除调解档案 - 需要delete权限
router.delete('/mediation-archives/:id', (req, res) => {
  checkPermission('mediation:delete')(req, res, () => {
    // 原有的处理逻辑
    const { id } = req.params

    // 软删除，将状态改为deleted
    const sql = 'UPDATE mediation_archives SET status = "deleted", updated_at = ? WHERE id = ?'

    db.run(sql, [new Date(), id], function (err) {
      if (err) {
        console.error('删除调解档案失败:', err.message)
        return res.status(500).json({ code: 500, message: '删除调解档案失败' })
      }

      if (this.changes === 0) {
        return res.status(404).json({ code: 404, message: '调解档案不存在' })
      }

      res.json({ code: 20000, message: '调解档案删除成功' })
    })
  })
})

// 获取调解档案详情 - 需要view权限
router.get('/mediation-archives/:id', (req, res) => {
  checkPermission('mediation:view')(req, res, () => {
    // 原有的处理逻辑
    const { id } = req.params

    const sql = `
      SELECT ma.*, 
      GROUP_CONCAT(DISTINCT mr.name) as mediators_name,
      GROUP_CONCAT(DISTINCT ra.name) as applicants_name,
      GROUP_CONCAT(DISTINCT rb.name) as respondents_name
      FROM mediation_archives ma
      LEFT JOIN mediation_records mr ON ma.id = mr.archive_id
      LEFT JOIN archive_participants ap_a ON ma.id = ap_a.archive_id AND ap_a.type = 'applicant'
      LEFT JOIN residents ra ON ap_a.resident_id = ra.id
      LEFT JOIN archive_participants ap_b ON ma.id = ap_b.archive_id AND ap_b.type = 'respondent'
      LEFT JOIN residents rb ON ap_b.resident_id = rb.id
      WHERE ma.id = ?
      GROUP BY ma.id
    `

    db.get(sql, [id], (err, row) => {
      if (err) {
        console.error('查询调解档案详情失败:', err.message)
        return res.status(500).json({ code: 500, message: '查询调解档案详情失败' })
      }

      if (!row) {
        return res.status(404).json({ code: 404, message: '调解档案不存在' })
      }

      res.json({ code: 20000, data: row })
    })
  })
})

module.exports = router
