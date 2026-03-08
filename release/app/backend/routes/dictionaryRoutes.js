/**
 * 字典管理模块 - API路由
 * 适配 MariaDB 数据库
 */

const express = require('express')
const router = express.Router()
const db = require('../db')
const { checkPermission } = require('../middleware/auth')

const isNoSuchTable = (err) => err && err.code === 'ER_NO_SUCH_TABLE'

/**
 * 根据分类获取字典数据（仅启用）
 * GET /dictionary/category?category=xxx
 */
router.get('/category', async (req, res) => {
  try {
    const { category } = req.query
    if (!category) {
      return res.status(400).json({ code: 400, message: '分类参数不能为空' })
    }

    const sql =
      "SELECT id, category, value, display_order, status, created_at, updated_at FROM dictionaries WHERE category = ? AND status = 'active' ORDER BY display_order ASC, id ASC"
    const [rows] = await db.pool.execute(sql, [category])
    const formatted = rows.map((r) => ({ ...r, label: r.value }))
    res.json({ code: 20000, message: 'success', data: formatted })
  } catch (error) {
    console.error('获取字典数据失败:', error)
    if (isNoSuchTable(error)) {
      return res.json({ code: 20000, message: '字典表不存在，返回空数据', data: [] })
    }
    res.status(500).json({ code: 50000, message: '获取字典数据失败: ' + error.message })
  }
})

/**
 * 获取所有字典分类
 * GET /dictionary/categories?withCount=1
 */
router.get('/categories', async (req, res) => {
  try {
    const withCount = String(req.query.withCount || '') === '1'
    if (withCount) {
      const [rows] = await db.pool.execute(
        'SELECT category, COUNT(*) as count FROM dictionaries GROUP BY category ORDER BY category ASC'
      )
      return res.json({ code: 20000, message: 'success', data: rows })
    }

    const [rows] = await db.pool.execute(
      'SELECT DISTINCT category FROM dictionaries ORDER BY category ASC'
    )
    res.json({
      code: 20000,
      message: 'success',
      data: rows.map((row) => row.category)
    })
  } catch (error) {
    console.error('获取字典分类失败:', error)
    if (isNoSuchTable(error)) {
      return res.json({ code: 20000, message: '字典表不存在，返回空数据', data: [] })
    }
    res.status(500).json({ code: 50000, message: '获取字典分类失败: ' + error.message })
  }
})

/**
 * 获取字典项列表
 * GET /dictionary?category=xxx&include_all=1
 */
router.get('/', async (req, res) => {
  try {
    const { category, include_all } = req.query
    if (!category) {
      return res.status(400).json({ code: 400, message: '分类参数不能为空' })
    }

    const includeAll = String(include_all || '') === '1'
    let sql =
      'SELECT id, category, value, display_order, status, created_at, updated_at FROM dictionaries WHERE category = ?'
    const params = [category]
    if (!includeAll) {
      sql += " AND status = 'active'"
    }
    sql += ' ORDER BY display_order ASC, id ASC'

    const [rows] = await db.pool.execute(sql, params)
    res.json({ code: 20000, message: 'success', data: rows })
  } catch (error) {
    console.error('获取字典项失败:', error)
    if (isNoSuchTable(error)) {
      return res.json({ code: 20000, message: '字典表不存在，返回空数据', data: [] })
    }
    res.status(500).json({ code: 50000, message: '获取字典项失败: ' + error.message })
  }
})

/**
 * 获取单个字典项
 * GET /dictionary/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const [rows] = await db.pool.execute(
      'SELECT id, category, value, display_order, status, created_at, updated_at FROM dictionaries WHERE id = ?',
      [id]
    )
    if (rows.length === 0) {
      return res.status(404).json({ code: 40400, message: '字典项不存在' })
    }
    res.json({ code: 20000, data: rows[0] })
  } catch (error) {
    console.error('获取字典项失败:', error)
    if (isNoSuchTable(error)) {
      return res.status(404).json({ code: 40400, message: '字典表不存在' })
    }
    res.status(500).json({ code: 50000, message: '获取字典项失败: ' + error.message })
  }
})

/**
 * 新增字典项
 * POST /dictionary
 */
router.post('/', checkPermission('system:role'), async (req, res) => {
  try {
    const { category, value, display_order, status } = req.body
    if (!category || !value) {
      return res.status(400).json({ code: 40000, message: '分类和字典值不能为空' })
    }

    let order = display_order
    if (order === undefined || order === null) {
      const [rows] = await db.pool.execute(
        'SELECT MAX(display_order) as max_order FROM dictionaries WHERE category = ?',
        [category]
      )
      order = (rows[0]?.max_order || 0) + 1
    }

    const itemStatus = status || 'active'
    const [result] = await db.pool.execute(
      `INSERT INTO dictionaries (category, value, display_order, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [category, value, order, itemStatus]
    )

    res.json({ code: 20000, message: '字典项创建成功', data: { id: result.insertId } })
  } catch (error) {
    console.error('创建字典项失败:', error)
    if (isNoSuchTable(error)) {
      return res.status(500).json({ code: 50000, message: '字典表不存在' })
    }
    res.status(500).json({ code: 50000, message: '创建字典项失败: ' + error.message })
  }
})

/**
 * 更新字典项
 * PUT /dictionary/:id
 */
router.put('/:id', checkPermission('system:role'), async (req, res) => {
  try {
    const { id } = req.params
    const { category, value, display_order } = req.body

    const updates = []
    const params = []
    if (category !== undefined) {
      updates.push('category = ?')
      params.push(category)
    }
    if (value !== undefined) {
      updates.push('value = ?')
      params.push(value)
    }
    if (display_order !== undefined) {
      updates.push('display_order = ?')
      params.push(display_order)
    }
    updates.push('updated_at = NOW()')

    if (updates.length === 1) {
      return res.status(400).json({ code: 40000, message: '没有可更新的字段' })
    }

    params.push(id)
    const [result] = await db.pool.execute(
      `UPDATE dictionaries SET ${updates.join(', ')} WHERE id = ?`,
      params
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 40400, message: '字典项不存在' })
    }
    res.json({ code: 20000, message: '字典项更新成功' })
  } catch (error) {
    console.error('更新字典项失败:', error)
    if (isNoSuchTable(error)) {
      return res.status(500).json({ code: 50000, message: '字典表不存在' })
    }
    res.status(500).json({ code: 50000, message: '更新字典项失败: ' + error.message })
  }
})

/**
 * 更新字典项状态
 * PUT /dictionary/:id/status
 */
router.put('/:id/status', checkPermission('system:role'), async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ code: 40000, message: '状态值不正确' })
    }

    const [result] = await db.pool.execute(
      'UPDATE dictionaries SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 40400, message: '字典项不存在' })
    }

    res.json({ code: 20000, message: '状态更新成功' })
  } catch (error) {
    console.error('更新字典项状态失败:', error)
    if (isNoSuchTable(error)) {
      return res.status(500).json({ code: 50000, message: '字典表不存在' })
    }
    res.status(500).json({ code: 50000, message: '更新字典项状态失败: ' + error.message })
  }
})

/**
 * 删除字典项
 * DELETE /dictionary/:id
 */
router.delete('/:id', checkPermission('system:role'), async (req, res) => {
  try {
    const { id } = req.params
    const [result] = await db.pool.execute('DELETE FROM dictionaries WHERE id = ?', [id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 40400, message: '字典项不存在' })
    }

    res.json({ code: 20000, message: '字典项删除成功' })
  } catch (error) {
    console.error('删除字典项失败:', error)
    if (isNoSuchTable(error)) {
      return res.status(500).json({ code: 50000, message: '字典表不存在' })
    }
    res.status(500).json({ code: 50000, message: '删除字典项失败: ' + error.message })
  }
})

module.exports = router
