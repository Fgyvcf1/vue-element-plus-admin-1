const express = require('express')
const router = express.Router()
const db = require('../db')
const { requireAuth } = require('../middleware/auth')

let cachedUserColumns = null

const getUserColumns = async () => {
  if (cachedUserColumns) return cachedUserColumns
  const [rows] = await db.pool.execute('SHOW COLUMNS FROM users')
  cachedUserColumns = rows.map((row) => row.Field)
  return cachedUserColumns
}

const hasColumn = (columns, name) => columns.includes(name)

// 获取当前登录用户资料
router.get('/user/profile', requireAuth, async (req, res) => {
  try {
    const columns = await getUserColumns()
    const selectFields = ['u.id', 'u.username', 'u.real_name', 'u.role_id', 'r.role_name', 'r.role_code']

    if (hasColumn(columns, 'phone_number')) {
      selectFields.push('u.phone_number')
    }
    if (hasColumn(columns, 'email')) {
      selectFields.push('u.email')
    }
    if (hasColumn(columns, 'avatar_url')) {
      selectFields.push('u.avatar_url')
    }

    const [rows] = await db.pool.execute(
      `
      SELECT ${selectFields.join(', ')}
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
      `,
      [req.user.id]
    )

    if (!rows.length) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }

    const user = rows[0]
    res.json({
      code: 20000,
      data: {
        id: user.id,
        username: user.username,
        realName: user.real_name || '',
        phoneNumber: user.phone_number || '',
        email: user.email || '',
        avatarUrl: user.avatar_url || '',
        roleList: user.role_name ? [user.role_name] : []
      }
    })
  } catch (error) {
    console.error('获取个人资料失败:', error)
    res.status(500).json({ code: 500, message: '获取个人资料失败' })
  }
})

// 更新当前登录用户资料
router.put('/user/profile', requireAuth, async (req, res) => {
  try {
    const columns = await getUserColumns()

    const fields = []
    const params = []
    const missingFields = []

    if (req.body.realName !== undefined) {
      fields.push('real_name = ?')
      params.push(req.body.realName)
    }
    if (req.body.phoneNumber !== undefined) {
      if (hasColumn(columns, 'phone_number')) {
        fields.push('phone_number = ?')
        params.push(req.body.phoneNumber)
      } else {
        missingFields.push('phone_number')
      }
    }
    if (req.body.email !== undefined) {
      if (hasColumn(columns, 'email')) {
        fields.push('email = ?')
        params.push(req.body.email)
      } else {
        missingFields.push('email')
      }
    }
    if (req.body.avatarUrl !== undefined) {
      if (hasColumn(columns, 'avatar_url')) {
        fields.push('avatar_url = ?')
        params.push(req.body.avatarUrl)
      } else {
        missingFields.push('avatar_url')
      }
    }

    if (!fields.length) {
      const message = missingFields.length
        ? `用户表缺少字段: ${missingFields.join(', ')}`
        : '无可更新字段'
      return res.status(400).json({ code: 400, message })
    }

    fields.push('updated_at = NOW()')
    params.push(req.user.id)

    const [result] = await db.pool.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      params
    )

    if (!result.affectedRows) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }

    const selectFields = ['u.id', 'u.username', 'u.real_name', 'r.role_name']
    if (hasColumn(columns, 'phone_number')) {
      selectFields.push('u.phone_number')
    }
    if (hasColumn(columns, 'email')) {
      selectFields.push('u.email')
    }
    if (hasColumn(columns, 'avatar_url')) {
      selectFields.push('u.avatar_url')
    }

    const [rows] = await db.pool.execute(
      `
      SELECT ${selectFields.join(', ')}
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
      `,
      [req.user.id]
    )

    const user = rows[0]
    res.json({
      code: 20000,
      message: '更新成功',
      data: {
        id: user.id,
        username: user.username,
        realName: user.real_name || '',
        phoneNumber: user.phone_number || '',
        email: user.email || '',
        avatarUrl: user.avatar_url || '',
        roleList: user.role_name ? [user.role_name] : []
      }
    })
  } catch (error) {
    console.error('更新个人资料失败:', error)
    res.status(500).json({ code: 500, message: '更新个人资料失败' })
  }
})

module.exports = router
