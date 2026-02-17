const express = require('express')
const router = express.Router()
const db = require('../../../../db') // 使用MariaDB连接

// 管理员权限验证中间件
const requireAdmin = (req, res, next) => {
  // TODO: 根据实际的用户认证系统实现权限验证
  // 这里暂时跳过验证，实际使用时需要实现
  // if (req.user && req.user.role === 'admin') {
  //   next();
  // } else {
  //   res.status(403).json({ code: 50003, message: '需要管理员权限' });
  // }
  next()
}

// 获取配置列表（支持分页和分组过滤）
router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, group, keyword } = req.query
  const offset = (page - 1) * pageSize

  let whereClause = 'WHERE 1=1'
  const params = []

  if (group) {
    whereClause += ' AND config_group = ?'
    params.push(group)
  }

  if (keyword) {
    whereClause += ' AND (config_name LIKE ? OR config_key LIKE ? OR description LIKE ?)'
    const likePattern = `%${keyword}%`
    params.push(likePattern, likePattern, likePattern)
  }

  // 查询总数
  db.get(`SELECT COUNT(*) as total FROM system_config ${whereClause}`, params, (err, row) => {
    if (err) {
      return res.status(500).json({
        code: 50000,
        message: '查询配置列表失败',
        error: err.message
      })
    }

    const total = row.total

    // 查询列表数据
    db.all(
      `SELECT * FROM system_config ${whereClause} ORDER BY config_group, config_key LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), parseInt(offset)],
      (err, rows) => {
        if (err) {
          return res.status(500).json({
            code: 50000,
            message: '查询配置列表失败',
            error: err.message
          })
        }

        res.json({
          code: 20000,
          data: {
            list: rows,
            total,
            page: parseInt(page),
            pageSize: parseInt(pageSize)
          }
        })
      }
    )
  })
})

// 获取所有配置组（必须在 :key 之前定义）
router.get('/groups', (req, res) => {
  db.all(
    'SELECT DISTINCT config_group FROM system_config ORDER BY config_group',
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          code: 50000,
          message: '查询配置组失败',
          error: err.message
        })
      }

      const groups = rows.map((row) => ({
        label:
          row.config_group === 'notification'
            ? '通知配置'
            : row.config_group === 'system'
              ? '系统配置'
              : row.config_group === 'dictionary'
                ? '字典配置'
                : row.config_group,
        value: row.config_group
      }))

      res.json({
        code: 20000,
        data: groups
      })
    }
  )
})

// 获取单个配置
router.get('/:key', (req, res) => {
  const { key } = req.params

  db.get('SELECT * FROM system_config WHERE config_key = ?', [key], (err, row) => {
    if (err) {
      return res.status(500).json({
        code: 50000,
        message: '查询配置失败',
        error: err.message
      })
    }

    if (!row) {
      return res.status(404).json({
        code: 40400,
        message: '配置不存在'
      })
    }

    res.json({
      code: 20000,
      data: row
    })
  })
})

// 批量获取配置
router.post('/batch', (req, res) => {
  const { keys } = req.body

  if (!Array.isArray(keys) || keys.length === 0) {
    return res.status(400).json({
      code: 40000,
      message: '请提供要查询的配置key列表'
    })
  }

  const placeholders = keys.map(() => '?').join(',')

  db.all(`SELECT * FROM system_config WHERE config_key IN (${placeholders})`, keys, (err, rows) => {
    if (err) {
      return res.status(500).json({
        code: 50000,
        message: '批量查询配置失败',
        error: err.message
      })
    }

    // 转换为key-value对象
    const configMap = {}
    rows.forEach((row) => {
      configMap[row.config_key] = row.config_value
    })

    res.json({
      code: 20000,
      data: configMap
    })
  })
})

// 更新单个配置（需要管理员权限）
router.put('/:key', requireAdmin, (req, res) => {
  const { key } = req.params
  const { value } = req.body

  if (value === undefined) {
    return res.status(400).json({
      code: 40000,
      message: '配置值不能为空'
    })
  }

  db.run(
    'UPDATE system_config SET config_value = ?, updated_at = NOW() WHERE config_key = ?',
    [value, key],
    function (err) {
      if (err) {
        return res.status(500).json({
          code: 50000,
          message: '更新配置失败',
          error: err.message
        })
      }

      if (this.changes === 0) {
        return res.status(404).json({
          code: 40400,
          message: '配置不存在'
        })
      }

      res.json({
        code: 20000,
        message: '配置更新成功'
      })
    }
  )
})

// 批量更新配置（需要管理员权限）
router.put('/', requireAdmin, async (req, res) => {
  const { configs } = req.body

  if (!Array.isArray(configs) || configs.length === 0) {
    return res.status(400).json({
      code: 40000,
      message: '请提供要更新的配置列表'
    })
  }

  try {
    const connection = await db.beginTransaction()
    let updated = 0

    for (const config of configs) {
      if (!config.key || config.value === undefined) {
        await db.rollback(connection)
        return res.status(400).json({
          code: 40000,
          message: '配置项格式不正确'
        })
      }

      const result = await db.runInTransaction(
        connection,
        'UPDATE system_config SET config_value = ?, updated_at = NOW() WHERE config_key = ?',
        [config.value, config.key]
      )
      updated += result.changes
    }

    await db.commit(connection)
    res.json({
      code: 20000,
      message: `成功更新 ${updated} 条配置`,
      data: { updated }
    })
  } catch (error) {
    res.status(500).json({
      code: 50000,
      message: '批量更新配置失败',
      error: error.message
    })
  }
})

// 新增配置（需要管理员权限）
router.post('/', requireAdmin, (req, res) => {
  const { key, value, name, group, type, description, isSystem } = req.body

  if (!key || !value || !name) {
    return res.status(400).json({
      code: 40000,
      message: '配置键、值和名称不能为空'
    })
  }

  db.run(
    `INSERT INTO system_config (config_key, config_value, config_name, config_group, value_type, description, is_system)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [key, value, name, group || 'system', type || 'string', description || '', isSystem ? 1 : 0],
    function (err) {
      if (err) {
        if (err.message.includes('Duplicate entry') || err.message.includes('UNIQUE constraint')) {
          return res.status(400).json({
            code: 40000,
            message: '配置键已存在'
          })
        }
        return res.status(500).json({
          code: 50000,
          message: '创建配置失败',
          error: err.message
        })
      }

      res.json({
        code: 20000,
        message: '配置创建成功',
        data: { id: this.lastID }
      })
    }
  )
})

// 删除配置（需要管理员权限）
router.delete('/:key', requireAdmin, (req, res) => {
  const { key } = req.params

  db.get('SELECT is_system FROM system_config WHERE config_key = ?', [key], (err, row) => {
    if (err) {
      return res.status(500).json({
        code: 50000,
        message: '查询配置失败',
        error: err.message
      })
    }

    if (!row) {
      return res.status(404).json({
        code: 40400,
        message: '配置不存在'
      })
    }

    if (row.is_system === 1) {
      return res.status(403).json({
        code: 40300,
        message: '系统配置不允许删除'
      })
    }

    db.run('DELETE FROM system_config WHERE config_key = ?', [key], function (err) {
      if (err) {
        return res.status(500).json({
          code: 50000,
          message: '删除配置失败',
          error: err.message
        })
      }

      res.json({
        code: 20000,
        message: '配置删除成功'
      })
    })
  })
})

module.exports = router
