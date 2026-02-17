const express = require('express')
const router = express.Router()
const db = require('../db')
const { checkPermission, requireAuth } = require('../middleware/auth')

const toInt = (value, fallback = 0) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

const normalizePermissionIds = (value) => {
  if (!Array.isArray(value)) return []
  return value.map((id) => toInt(id, 0)).filter((id) => id > 0)
}

const toBool = (value) => Number(value) === 1

const buildMenuTree = (rows) => {
  const nodes = new Map()
  const order = []

  rows.forEach((row) => {
    const node = {
      path: row.path,
      name: row.name,
      redirect: row.redirect || undefined,
      component: row.component || undefined,
      meta: {
        title: row.title,
        icon: row.icon || undefined,
        hidden: toBool(row.hidden),
        alwaysShow: toBool(row.always_show),
        noCache: toBool(row.no_cache),
        affix: toBool(row.affix),
        activeMenu: row.active_menu || undefined,
        permission: row.permission_code || undefined
      },
      children: []
    }
    nodes.set(row.id, node)
    order.push(row)
  })

  const roots = []
  order.forEach((row) => {
    const node = nodes.get(row.id)
    if (!node) return
    if (row.parent_id && nodes.has(row.parent_id)) {
      nodes.get(row.parent_id).children.push(node)
    } else {
      roots.push(node)
    }
  })

  const prune = (list) => {
    list.forEach((item) => {
      if (item.children && item.children.length === 0) {
        delete item.children
      } else if (item.children) {
        prune(item.children)
      }
      if (!item.meta?.permission) {
        delete item.meta.permission
      }
      if (!item.meta?.icon) {
        delete item.meta.icon
      }
      if (!item.meta?.activeMenu) {
        delete item.meta.activeMenu
      }
    })
  }
  prune(roots)

  return roots
}

// ============================================
// 角色管理接口
// ============================================

// 获取所有角色
router.get('/roles', checkPermission('system:role'), async (req, res) => {
  try {
    const [rows] = await db.pool.execute('SELECT * FROM roles ORDER BY id ASC')
    res.json({
      code: 20000,
      data: rows
    })
  } catch (error) {
    console.error('获取角色列表异常:', error)
    res.status(500).json({ code: 500, message: '服务器内部错误' })
  }
})

// 获取角色详情
router.get('/roles/:id', checkPermission('system:role'), async (req, res) => {
  const id = toInt(req.params.id, 0)
  if (!id) {
    return res.status(400).json({ code: 400, message: 'id 参数错误' })
  }
  try {
    const [rows] = await db.pool.execute('SELECT * FROM roles WHERE id = ?', [id])
    if (!rows.length) {
      return res.status(404).json({ code: 404, message: '角色不存在' })
    }

    const [permRows] = await db.pool.execute(
      'SELECT permission_id FROM role_permissions WHERE role_id = ?',
      [id]
    )

    const permissionIds = permRows.map((row) => row.permission_id)

    res.json({
      code: 20000,
      data: {
        ...rows[0],
        permissionIds
      }
    })
  } catch (error) {
    console.error('获取角色详情异常:', error)
    res.status(500).json({ code: 500, message: '服务器内部错误' })
  }
})

// 创建角色
router.post('/roles', checkPermission('system:role'), async (req, res) => {
  const { role_name, role_code, description, status = 'active' } = req.body
  const permissionIds = normalizePermissionIds(req.body.permissionIds)

  if (!role_name || !role_code) {
    return res.status(400).json({ code: 400, message: '角色名称和角色编码不能为空' })
  }

  let connection
  try {
    connection = await db.beginTransaction()

    const [result] = await connection.execute(
      'INSERT INTO roles (role_name, role_code, description, status) VALUES (?, ?, ?, ?)',
      [role_name, role_code, description, status]
    )
    const roleId = result.insertId

    if (permissionIds.length > 0) {
      const placeholders = permissionIds.map(() => '(?, ?)').join(', ')
      const values = permissionIds.flatMap((permId) => [roleId, permId])
      await connection.execute(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ${placeholders}`,
        values
      )
    }

    await db.commit(connection)

    res.json({
      code: 20000,
      message: '创建成功',
      data: { id: roleId }
    })
  } catch (error) {
    if (connection) {
      await db.rollback(connection)
    }
    if (error.message && (error.message.includes('UNIQUE') || error.message.includes('Duplicate'))) {
      return res.status(400).json({ code: 400, message: '角色编码已存在' })
    }
    console.error('创建角色异常:', error)
    res.status(500).json({ code: 500, message: '服务器内部错误' })
  }
})

// 更新角色
router.put('/roles/:id', checkPermission('system:role'), async (req, res) => {
  const id = toInt(req.params.id, 0)
  const { role_name, role_code, description, status } = req.body
  const permissionIds = normalizePermissionIds(req.body.permissionIds)

  if (!id) {
    return res.status(400).json({ code: 400, message: 'id 参数错误' })
  }

  let connection
  try {
    connection = await db.beginTransaction()

    const [result] = await connection.execute(
      'UPDATE roles SET role_name = ?, role_code = ?, description = ?, status = ? WHERE id = ?',
      [role_name, role_code, description, status, id]
    )

    if (!result.affectedRows) {
      await db.rollback(connection)
      return res.status(404).json({ code: 404, message: '角色不存在' })
    }

    await connection.execute('DELETE FROM role_permissions WHERE role_id = ?', [id])

    if (permissionIds.length > 0) {
      const placeholders = permissionIds.map(() => '(?, ?)').join(', ')
      const values = permissionIds.flatMap((permId) => [id, permId])
      await connection.execute(
        `INSERT INTO role_permissions (role_id, permission_id) VALUES ${placeholders}`,
        values
      )
    }

    await db.commit(connection)

    res.json({
      code: 20000,
      message: '更新成功'
    })
  } catch (error) {
    if (connection) {
      await db.rollback(connection)
    }
    if (error.message && (error.message.includes('UNIQUE') || error.message.includes('Duplicate'))) {
      return res.status(400).json({ code: 400, message: '角色编码已存在' })
    }
    console.error('更新角色异常:', error)
    res.status(500).json({ code: 500, message: '服务器内部错误' })
  }
})

// 删除角色
router.delete('/roles/:id', checkPermission('system:role'), async (req, res) => {
  const id = toInt(req.params.id, 0)
  if (!id) {
    return res.status(400).json({ code: 400, message: 'id 参数错误' })
  }

  try {
    // 检查是否有关联的用户
    const [rows] = await db.pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE role_id = ?',
      [id]
    )
    if ((rows?.[0]?.count || 0) > 0) {
      return res.status(400).json({ code: 400, message: '该角色下有关联用户，无法删除' })
    }

    await db.pool.execute('DELETE FROM role_permissions WHERE role_id = ?', [id])

    const [result] = await db.pool.execute('DELETE FROM roles WHERE id = ?', [id])
    if (!result.affectedRows) {
      return res.status(404).json({ code: 404, message: '角色不存在' })
    }

    res.json({
      code: 20000,
      message: '删除成功'
    })
  } catch (error) {
    console.error('删除角色异常:', error)
    res.status(500).json({ code: 500, message: '服务器内部错误' })
  }
})

// ============================================
// 权限管理接口
// ============================================

// 获取当前用户权限 + 菜单树
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id
    const [users] = await db.pool.execute(
      `
      SELECT u.role_id, u.role AS user_role, r.role_code
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
      `,
      [userId]
    )

    if (!users.length) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }

    const user = users[0]
    const isSuperAdmin = user.role_code === 'superadmin' || user.user_role === 'superadmin'

    let permissions = []
    if (isSuperAdmin) {
      const [permRows] = await db.pool.execute('SELECT permission_code FROM permissions')
      permissions = permRows.map((row) => row.permission_code)
    } else if (user.role_id) {
      const [permRows] = await db.pool.execute(
        `
        SELECT p.permission_code
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = ?
        `,
        [user.role_id]
      )
      permissions = permRows.map((row) => row.permission_code)
    }

    let menus = []
    if (isSuperAdmin) {
      const [menuRows] = await db.pool.execute(
        `
        SELECT *
        FROM sys_menu
        WHERE status = 1 AND menu_type != 3
        ORDER BY sort_order ASC, id ASC
        `
      )
      menus = buildMenuTree(menuRows)
    } else if (user.role_id) {
      const [roleMenuRows] = await db.pool.execute(
        'SELECT menu_id FROM role_menu WHERE role_id = ?',
        [user.role_id]
      )
      const allowedIds = new Set(roleMenuRows.map((row) => row.menu_id))
      if (allowedIds.size > 0) {
        const [allMenus] = await db.pool.execute(
          `
          SELECT *
          FROM sys_menu
          WHERE status = 1 AND menu_type != 3
          ORDER BY sort_order ASC, id ASC
          `
        )
        const menuMap = new Map(allMenus.map((row) => [row.id, row]))
        const addAncestors = (menuId) => {
          let current = menuMap.get(menuId)
          while (current && current.parent_id && current.parent_id !== 0) {
            if (!allowedIds.has(current.parent_id)) {
              allowedIds.add(current.parent_id)
            }
            current = menuMap.get(current.parent_id)
          }
        }
        Array.from(allowedIds).forEach((id) => addAncestors(id))
        const filteredMenus = allMenus.filter((row) => allowedIds.has(row.id))
        menus = buildMenuTree(filteredMenus)
      }
    }

    res.json({
      code: 20000,
      data: {
        permissions,
        menus
      }
    })
  } catch (error) {
    console.error('获取用户权限失败:', error)
    res.status(500).json({ code: 500, message: '获取用户权限失败' })
  }
})

// 获取所有权限（树形结构）
router.get('/permissions', checkPermission('system:role'), async (req, res) => {
  try {
    const [rows] = await db.pool.execute(
      'SELECT * FROM permissions ORDER BY module ASC, action ASC, id ASC'
    )
    res.json({
      code: 20000,
      data: {
        list: rows,
        total: rows.length
      }
    })
  } catch (error) {
    console.error('获取权限列表异常:', error)
    res.status(500).json({ code: 500, message: '服务器内部错误' })
  }
})

// 获取权限（按模块分组）
router.get('/permissions/by-module', checkPermission('system:role'), async (_req, res) => {
  try {
    const [rows] = await db.pool.execute(
      'SELECT * FROM permissions ORDER BY module ASC, action ASC, id ASC'
    )
    const grouped = rows.reduce((acc, row) => {
      const key = row.module || 'unknown'
      if (!acc[key]) acc[key] = []
      acc[key].push(row)
      return acc
    }, {})

    res.json({
      code: 20000,
      data: grouped
    })
  } catch (error) {
    console.error('获取权限列表异常:', error)
    res.status(500).json({ code: 500, message: '服务器内部错误' })
  }
})

// 获取权限详情
router.get('/permissions/:id', checkPermission('system:role'), async (req, res) => {
  const id = toInt(req.params.id, 0)
  if (!id) {
    return res.status(400).json({ code: 400, message: 'id 参数错误' })
  }
  try {
    const [rows] = await db.pool.execute('SELECT * FROM permissions WHERE id = ?', [id])
    if (!rows.length) {
      return res.status(404).json({ code: 404, message: '权限不存在' })
    }
    res.json({
      code: 20000,
      data: rows[0]
    })
  } catch (error) {
    console.error('获取权限详情异常:', error)
    res.status(500).json({ code: 500, message: '服务器内部错误' })
  }
})

// 创建权限
router.post('/permissions', checkPermission('system:role'), async (req, res) => {
  const { module, action, permission_code, description } = req.body

  if (!module || !action || !permission_code) {
    return res
      .status(400)
      .json({ code: 400, message: 'module/action/permission_code 不能为空' })
  }

  try {
    const [result] = await db.pool.execute(
      `INSERT INTO permissions (module, action, permission_code, description) VALUES (?, ?, ?, ?)`,
      [module, action, permission_code, description || null]
    )
    res.json({
      code: 20000,
      message: '创建成功',
      data: { id: result.insertId }
    })
  } catch (error) {
    console.error('创建权限异常:', error)
    res.status(500).json({ code: 500, message: '服务器内部错误' })
  }
})

// 更新权限
router.put('/permissions/:id', checkPermission('system:role'), async (req, res) => {
  const id = toInt(req.params.id, 0)
  const { module, action, permission_code, description } = req.body

  if (!id) {
    return res.status(400).json({ code: 400, message: 'id 参数错误' })
  }

  try {
    const [result] = await db.pool.execute(
      `UPDATE permissions SET module = ?, action = ?, permission_code = ?, description = ? WHERE id = ?`,
      [module, action, permission_code, description || null, id]
    )
    if (!result.affectedRows) {
      return res.status(404).json({ code: 404, message: '权限不存在' })
    }
    res.json({
      code: 20000,
      message: '更新成功'
    })
  } catch (error) {
    console.error('更新权限异常:', error)
    res.status(500).json({ code: 500, message: '服务器内部错误' })
  }
})

// 删除权限
router.delete('/permissions/:id', checkPermission('system:role'), async (req, res) => {
  const id = toInt(req.params.id, 0)
  if (!id) {
    return res.status(400).json({ code: 400, message: 'id 参数错误' })
  }

  try {
    await db.pool.execute('DELETE FROM role_permissions WHERE permission_id = ?', [id])
    const [result] = await db.pool.execute('DELETE FROM permissions WHERE id = ?', [id])
    if (!result.affectedRows) {
      return res.status(404).json({ code: 404, message: '权限不存在' })
    }
    res.json({
      code: 20000,
      message: '删除成功'
    })
  } catch (error) {
    console.error('删除权限异常:', error)
    res.status(500).json({ code: 500, message: '服务器内部错误' })
  }
})

// ============================================
// 角色权限分配接口
// ============================================

// 获取角色的权限
router.get('/roles/:id/permissions', checkPermission('system:role'), async (req, res) => {
  const id = toInt(req.params.id, 0)
  if (!id) {
    return res.status(400).json({ code: 400, message: 'id 参数错误' })
  }
  try {
    const sql = `
      SELECT p.* FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
      ORDER BY p.module ASC, p.action ASC, p.id ASC
    `
    const [rows] = await db.pool.execute(sql, [id])
    res.json({
      code: 20000,
      data: rows
    })
  } catch (error) {
    console.error('获取角色权限异常:', error)
    res.status(500).json({ code: 500, message: '服务器内部错误' })
  }
})

// 分配角色权限
router.post('/roles/:id/permissions', checkPermission('system:role'), async (req, res) => {
  const id = toInt(req.params.id, 0)
  const permissionIds = normalizePermissionIds(req.body.permission_ids)

  if (!id) {
    return res.status(400).json({ code: 400, message: 'id 参数错误' })
  }

  if (!Array.isArray(req.body.permission_ids)) {
    return res.status(400).json({ code: 400, message: 'permission_ids必须是数组' })
  }

  try {
    // 开启事务
    const connection = await db.beginTransaction()
    
    try {
      // 删除原有权限
      await new Promise((resolve, reject) => {
        connection.execute('DELETE FROM role_permissions WHERE role_id = ?', [id], (err) => {
          if (err) reject(err)
          else resolve()
        })
      })

      // 插入新权限
      if (permissionIds.length > 0) {
        const placeholders = permissionIds.map(() => '(?, ?)').join(', ')
        const values = permissionIds.flatMap((pid) => [id, pid])
        
        await new Promise((resolve, reject) => {
          connection.execute(
            `INSERT INTO role_permissions (role_id, permission_id) VALUES ${placeholders}`,
            values,
            (err) => {
              if (err) reject(err)
              else resolve()
            }
          )
        })
      }

      await db.commit(connection)
      res.json({
        code: 20000,
        message: '分配成功'
      })
    } catch (err) {
      await db.rollback(connection)
      console.error('分配角色权限失败:', err)
      res.status(500).json({ code: 500, message: '分配角色权限失败' })
    }
  } catch (error) {
    console.error('分配角色权限异常:', error)
    res.status(500).json({ code: 500, message: '服务器内部错误' })
  }
})

// ============================================
// 用户管理接口
// ============================================

// 获取用户列表
router.get('/users', checkPermission('system:user'), async (_req, res) => {
  try {
    const [rows] = await db.pool.execute(`
      SELECT
        u.id,
        u.username,
        u.real_name,
        u.status,
        u.role_id,
        r.role_name,
        r.role_code
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.id DESC
    `)

    res.json({ code: 20000, data: rows })
  } catch (error) {
    console.error('获取用户列表异常:', error)
    res.status(500).json({ code: 500, message: '服务器内部错误' })
  }
})

// 创建用户
router.post('/users', checkPermission('system:user'), async (req, res) => {
  const { username, password, real_name, role_id, status = 'active' } = req.body
  if (!username || !password || !real_name) {
    return res.status(400).json({ code: 400, message: '用户名/密码/姓名不能为空' })
  }

  try {
    const [exists] = await db.pool.execute('SELECT id FROM users WHERE username = ?', [username])
    if (exists.length) {
      return res.status(400).json({ code: 400, message: '用户名已存在' })
    }

    let roleCode = 'user'
    if (role_id) {
      const [roles] = await db.pool.execute('SELECT role_code FROM roles WHERE id = ?', [role_id])
      if (roles.length) {
        roleCode = roles[0].role_code
      }
    }

    const [result] = await db.pool.execute(
      `INSERT INTO users
        (username, password, password_hash, real_name, role, role_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [username, password, password, real_name, roleCode, role_id || null, status]
    )

    res.json({ code: 20000, message: '创建成功', data: { id: result.insertId } })
  } catch (error) {
    console.error('创建用户异常:', error)
    res.status(500).json({ code: 500, message: '服务器内部错误' })
  }
})

// 更新用户
router.put('/users/:id', checkPermission('system:user'), async (req, res) => {
  const id = toInt(req.params.id, 0)
  if (!id) {
    return res.status(400).json({ code: 400, message: 'id 参数错误' })
  }

  const { real_name, role_id, status } = req.body
  try {
    let roleCode = undefined
    if (role_id !== undefined) {
      const [roles] = await db.pool.execute('SELECT role_code FROM roles WHERE id = ?', [role_id])
      roleCode = roles.length ? roles[0].role_code : null
    }

    const fields = []
    const params = []
    if (real_name !== undefined) {
      fields.push('real_name = ?')
      params.push(real_name)
    }
    if (role_id !== undefined) {
      fields.push('role_id = ?')
      params.push(role_id || null)
      fields.push('role = ?')
      params.push(roleCode || 'user')
    }
    if (status !== undefined) {
      fields.push('status = ?')
      params.push(status)
    }

    if (!fields.length) {
      return res.status(400).json({ code: 400, message: '无可更新字段' })
    }

    fields.push('updated_at = NOW()')
    params.push(id)

    const [result] = await db.pool.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      params
    )

    if (!result.affectedRows) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }

    res.json({ code: 20000, message: '更新成功' })
  } catch (error) {
    console.error('更新用户异常:', error)
    res.status(500).json({ code: 500, message: '服务器内部错误' })
  }
})

// 删除用户
router.delete('/users/:id', checkPermission('system:user'), async (req, res) => {
  const id = toInt(req.params.id, 0)
  if (!id) {
    return res.status(400).json({ code: 400, message: 'id 参数错误' })
  }

  try {
    const [result] = await db.pool.execute('DELETE FROM users WHERE id = ?', [id])
    if (!result.affectedRows) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }
    res.json({ code: 20000, message: '删除成功' })
  } catch (error) {
    console.error('删除用户异常:', error)
    res.status(500).json({ code: 500, message: '服务器内部错误' })
  }
})

// 重置密码
router.put('/users/:id/reset-password', checkPermission('system:user'), async (req, res) => {
  const id = toInt(req.params.id, 0)
  const { newPassword } = req.body
  if (!id || !newPassword) {
    return res.status(400).json({ code: 400, message: '参数错误' })
  }

  try {
    const [result] = await db.pool.execute(
      'UPDATE users SET password = ?, password_hash = ?, updated_at = NOW() WHERE id = ?',
      [newPassword, newPassword, id]
    )
    if (!result.affectedRows) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }
    res.json({ code: 20000, message: '重置成功' })
  } catch (error) {
    console.error('重置密码异常:', error)
    res.status(500).json({ code: 500, message: '服务器内部错误' })
  }
})

// 获取用户权限
router.get('/users/:id/permissions', checkPermission('system:user'), async (req, res) => {
  const id = toInt(req.params.id, 0)
  if (!id) {
    return res.status(400).json({ code: 400, message: 'id 参数错误' })
  }

  try {
    const [users] = await db.pool.execute(
      'SELECT u.role_id, r.role_code FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ?',
      [id]
    )
    if (!users.length) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }

    let permissions = []
    if (users[0].role_code === 'superadmin') {
      const [permRows] = await db.pool.execute('SELECT permission_code FROM permissions')
      permissions = permRows.map((row) => row.permission_code)
    } else if (users[0].role_id) {
      const [permRows] = await db.pool.execute(
        `SELECT p.permission_code
         FROM role_permissions rp
         JOIN permissions p ON rp.permission_id = p.id
         WHERE rp.role_id = ?`,
        [users[0].role_id]
      )
      permissions = permRows.map((row) => row.permission_code)
    }

    res.json({ code: 20000, data: permissions })
  } catch (error) {
    console.error('获取用户权限异常:', error)
    res.status(500).json({ code: 500, message: '服务器内部错误' })
  }
})

// 分配用户角色
router.put('/users/:id/role', checkPermission('system:user'), async (req, res) => {
  const id = toInt(req.params.id, 0)
  const roleId = toInt(req.body.roleId, 0)
  if (!id || !roleId) {
    return res.status(400).json({ code: 400, message: '参数错误' })
  }

  try {
    const [roles] = await db.pool.execute('SELECT role_code FROM roles WHERE id = ?', [roleId])
    if (!roles.length) {
      return res.status(404).json({ code: 404, message: '角色不存在' })
    }

    const [result] = await db.pool.execute(
      'UPDATE users SET role_id = ?, role = ?, updated_at = NOW() WHERE id = ?',
      [roleId, roles[0].role_code, id]
    )
    if (!result.affectedRows) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }

    res.json({ code: 20000, message: '分配成功' })
  } catch (error) {
    console.error('分配用户角色异常:', error)
    res.status(500).json({ code: 500, message: '服务器内部错误' })
  }
})

module.exports = router
