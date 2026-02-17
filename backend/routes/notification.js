const express = require('express')
const router = express.Router()
const db = require('../db')
const { checkPermission } = require('../middleware/auth')

const toInt = (value, defaultValue = 0) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? defaultValue : parsed
}

const normalizePagination = (query) => {
  const page = Math.max(toInt(query.page, 1), 1)
  const size = Math.max(toInt(query.size || query.pageSize, 20), 1)
  return {
    page,
    size,
    offset: (page - 1) * size
  }
}

const buildWhereClause = (query) => {
  const where = []
  const params = []

  if (query.type) {
    where.push('type = ?')
    params.push(query.type)
  }

  if (query.status) {
    where.push('status = ?')
    params.push(query.status)
  }

  if (query.is_read !== undefined && query.is_read !== '') {
    where.push('is_read = ?')
    params.push(toInt(query.is_read, 0))
  }

  if (query.keyword) {
    where.push('(title LIKE ? OR content LIKE ?)')
    params.push(`%${query.keyword}%`, `%${query.keyword}%`)
  }

  return {
    clause: where.length > 0 ? ` WHERE ${where.join(' AND ')}` : '',
    params
  }
}

const mapRow = (row) => ({
  ...row,
  id: toInt(row.id, 0),
  is_read: toInt(row.is_read, 0),
  progress: row.progress === null || row.progress === undefined ? null : toInt(row.progress, 0)
})

const getNextId = async () => {
  const [rows] = await db.pool.execute(
    'SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM notification'
  )
  return toInt(rows?.[0]?.next_id, 1)
}

router.get('/', checkPermission('todo:view'), async (req, res) => {
  const { page, size, offset } = normalizePagination(req.query)
  const { clause, params } = buildWhereClause(req.query)

  try {
    const [countRows] = await db.pool.execute(
      `SELECT COUNT(1) AS total FROM notification${clause}`,
      params
    )
    const total = toInt(countRows?.[0]?.total, 0)

    const listSql = `
      SELECT id, title, content, type, status, created_at, updated_at, is_read, progress, resident_id, event_id
      FROM notification${clause}
      ORDER BY
        CASE WHEN created_at IS NULL OR created_at = '' THEN 1 ELSE 0 END,
        created_at DESC,
        id DESC
      LIMIT ? OFFSET ?
    `
    const [rows] = await db.pool.execute(listSql, [...params, size, offset])

    res.json({
      code: 20000,
      data: rows.map(mapRow),
      total,
      page,
      size
    })
  } catch (err) {
    console.error('获取待办提醒列表失败:', err.message)
    res.status(500).json({ code: 50000, message: err.message })
  }
})

router.get('/stats', checkPermission('todo:view'), async (_req, res) => {
  try {
    const [totalRows] = await db.pool.execute('SELECT COUNT(1) AS total FROM notification')
    const [unreadRows] = await db.pool.execute(
      'SELECT COUNT(1) AS unread FROM notification WHERE COALESCE(is_read, 0) = 0'
    )
    const [typeRows] = await db.pool.execute(
      'SELECT type, COUNT(1) AS cnt FROM notification GROUP BY type'
    )

    const byType = {}
    ;(typeRows || []).forEach((row) => {
      byType[row.type || 'unknown'] = toInt(row.cnt, 0)
    })

    const total = toInt(totalRows?.[0]?.total, 0)
    const unread = toInt(unreadRows?.[0]?.unread, 0)

    res.json({
      code: 20000,
      data: {
        total,
        unread,
        read: Math.max(total - unread, 0),
        byType
      }
    })
  } catch (err) {
    console.error('获取待办提醒统计失败:', err.message)
    res.status(500).json({ code: 50000, message: err.message })
  }
})

router.get('/latest', checkPermission('todo:view'), async (req, res) => {
  const limit = Math.max(toInt(req.query.limit, 5), 1)

  try {
    const [rows] = await db.pool.execute(
      `
      SELECT id, title, content, type, status, created_at, updated_at, is_read, progress, resident_id, event_id
      FROM notification
      ORDER BY
        CASE WHEN created_at IS NULL OR created_at = '' THEN 1 ELSE 0 END,
        created_at DESC,
        id DESC
      LIMIT ?
      `,
      [limit]
    )

    res.json({ code: 20000, data: rows.map(mapRow) })
  } catch (err) {
    console.error('获取最新待办提醒失败:', err.message)
    res.status(500).json({ code: 50000, message: err.message })
  }
})

router.get('/unread-count', checkPermission('todo:view'), async (_req, res) => {
  try {
    const [rows] = await db.pool.execute(
      'SELECT COUNT(1) AS unread_count FROM notification WHERE COALESCE(is_read, 0) = 0'
    )
    res.json({
      code: 20000,
      data: {
        unreadCount: toInt(rows?.[0]?.unread_count, 0)
      }
    })
  } catch (err) {
    console.error('获取未读数量失败:', err.message)
    res.status(500).json({ code: 50000, message: err.message })
  }
})

router.post('/mark-read', checkPermission('todo:edit'), async (req, res) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.map((id) => toInt(id, 0)).filter((id) => id > 0)
    : []

  if (!ids.length) {
    return res.status(400).json({ code: 40000, message: 'ids 不能为空' })
  }

  const placeholders = ids.map(() => '?').join(',')

  try {
    const [result] = await db.pool.execute(
      `UPDATE notification SET is_read = 1, status = 'read', updated_at = NOW() WHERE id IN (${placeholders})`,
      ids
    )
    res.json({ code: 20000, data: { affected: result.affectedRows } })
  } catch (err) {
    console.error('批量标记已读失败:', err.message)
    res.status(500).json({ code: 50000, message: err.message })
  }
})

router.post('/mark-all-read', checkPermission('todo:edit'), async (_req, res) => {
  try {
    const [result] = await db.pool.execute(
      "UPDATE notification SET is_read = 1, status = 'read', updated_at = NOW() WHERE COALESCE(is_read, 0) = 0"
    )
    res.json({ code: 20000, data: { affected: result.affectedRows } })
  } catch (err) {
    console.error('全部标记已读失败:', err.message)
    res.status(500).json({ code: 50000, message: err.message })
  }
})

router.post('/batch-delete', checkPermission('todo:delete'), async (req, res) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.map((id) => toInt(id, 0)).filter((id) => id > 0)
    : []

  if (!ids.length) {
    return res.status(400).json({ code: 40000, message: 'ids 不能为空' })
  }

  const placeholders = ids.map(() => '?').join(',')

  try {
    const [result] = await db.pool.execute(
      `DELETE FROM notification WHERE id IN (${placeholders})`,
      ids
    )
    res.json({ code: 20000, data: { affected: result.affectedRows } })
  } catch (err) {
    console.error('批量删除待办提醒失败:', err.message)
    res.status(500).json({ code: 50000, message: err.message })
  }
})

router.get('/:id', checkPermission('todo:view'), async (req, res) => {
  const id = toInt(req.params.id, 0)

  if (!id) {
    return res.status(400).json({ code: 40000, message: 'id 参数错误' })
  }

  try {
    const [rows] = await db.pool.execute(
      'SELECT id, title, content, type, status, created_at, updated_at, is_read, progress, resident_id, event_id FROM notification WHERE id = ? LIMIT 1',
      [id]
    )

    if (!rows.length) {
      return res.status(404).json({ code: 40400, message: '记录不存在' })
    }

    res.json({ code: 20000, data: mapRow(rows[0]) })
  } catch (err) {
    console.error('获取待办提醒详情失败:', err.message)
    res.status(500).json({ code: 50000, message: err.message })
  }
})

router.post('/', checkPermission('todo:add'), async (req, res) => {
  const {
    title,
    content,
    type = 'task',
    progress = 0,
    status = 'pending',
    is_read = 0,
    resident_id = null,
    event_id = null
  } = req.body || {}

  if (!title || !content) {
    return res.status(400).json({ code: 40000, message: 'title 和 content 不能为空' })
  }

  try {
    const id = await getNextId()

    await db.pool.execute(
      `
      INSERT INTO notification
      (id, title, content, type, status, created_at, updated_at, is_read, progress, resident_id, event_id)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, ?, ?)
      `,
      [
        id,
        title,
        content,
        type,
        status,
        toInt(is_read, 0),
        toInt(progress, 0),
        resident_id,
        event_id
      ]
    )

    res.json({
      code: 20000,
      data: {
        id,
        title,
        content,
        type,
        status,
        is_read: toInt(is_read, 0),
        progress: toInt(progress, 0),
        resident_id,
        event_id
      }
    })
  } catch (err) {
    console.error('新增待办提醒失败:', err.message)
    res.status(500).json({ code: 50000, message: err.message })
  }
})

router.put('/:id', checkPermission('todo:edit'), async (req, res) => {
  const id = toInt(req.params.id, 0)

  if (!id) {
    return res.status(400).json({ code: 40000, message: 'id 参数错误' })
  }

  const { title, content, type, progress, status, is_read, resident_id, event_id } = req.body || {}

  const fields = []
  const params = []

  if (title !== undefined) {
    fields.push('title = ?')
    params.push(title)
  }
  if (content !== undefined) {
    fields.push('content = ?')
    params.push(content)
  }
  if (type !== undefined) {
    fields.push('type = ?')
    params.push(type)
  }
  if (progress !== undefined) {
    fields.push('progress = ?')
    params.push(toInt(progress, 0))
  }
  if (status !== undefined) {
    fields.push('status = ?')
    params.push(status)
  }
  if (is_read !== undefined) {
    fields.push('is_read = ?')
    params.push(toInt(is_read, 0))
  }
  if (resident_id !== undefined) {
    fields.push('resident_id = ?')
    params.push(resident_id)
  }
  if (event_id !== undefined) {
    fields.push('event_id = ?')
    params.push(event_id)
  }

  if (!fields.length) {
    return res.status(400).json({ code: 40000, message: '无可更新字段' })
  }

  fields.push('updated_at = NOW()')
  params.push(id)

  try {
    const [result] = await db.pool.execute(
      `UPDATE notification SET ${fields.join(', ')} WHERE id = ?`,
      params
    )
    res.json({ code: 20000, data: { affected: result.affectedRows } })
  } catch (err) {
    console.error('更新待办提醒失败:', err.message)
    res.status(500).json({ code: 50000, message: err.message })
  }
})

router.delete('/:id', checkPermission('todo:delete'), async (req, res) => {
  const id = toInt(req.params.id, 0)

  if (!id) {
    return res.status(400).json({ code: 40000, message: 'id 参数错误' })
  }

  try {
    const [result] = await db.pool.execute('DELETE FROM notification WHERE id = ?', [id])
    res.json({ code: 20000, data: { affected: result.affectedRows } })
  } catch (err) {
    console.error('删除待办提醒失败:', err.message)
    res.status(500).json({ code: 50000, message: err.message })
  }
})

module.exports = router
