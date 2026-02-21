const express = require('express')
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const db = require('../db')

const router = express.Router()

const sanitizeParams = (params) =>
  params.map((value) => (value === undefined ? null : value))

const CONFIG_META = {
  app_title: {
    name: '系统标题',
    description: '浏览器标题与系统名称'
  },
  app_logo_mode: {
    name: 'Logo显示方式',
    description: 'image | text | both'
  },
  app_logo_text: {
    name: 'Logo文字',
    description: '用于顶部左侧品牌区域的文字'
  },
  app_logo_url: {
    name: 'Logo图片地址',
    description: '支持 /logo.png 或 /uploads/branding/logo.png'
  },
  app_favicon_url: {
    name: '浏览器图标地址',
    description: '浏览器 favicon'
  }
}

const DEFAULTS = {
  app_title: 'ElementAdmin',
  app_logo_mode: 'image',
  app_logo_text: '',
  app_logo_url: '/logo.png',
  app_favicon_url: '/favicon.ico'
}

const ensureSystemConfigTable = async () => {
  try {
    const [tables] = await db.pool.execute("SHOW TABLES LIKE 'system_config'")
    if (tables.length > 0) return
  } catch (error) {
    console.warn('检查 system_config 表失败，尝试直接读取:', error?.message || error)
    try {
      await db.pool.execute('SELECT 1 FROM system_config LIMIT 1')
      return
    } catch (innerError) {
      console.warn('读取 system_config 表失败，继续尝试创建:', innerError?.message || innerError)
    }
  }

  const createTableSql = `
    CREATE TABLE IF NOT EXISTS system_config (
      id INT PRIMARY KEY AUTO_INCREMENT,
      config_key VARCHAR(128) UNIQUE NOT NULL,
      config_value TEXT,
      config_name VARCHAR(255) NOT NULL,
      config_group VARCHAR(64) DEFAULT 'system',
      value_type VARCHAR(32) DEFAULT 'string',
      description TEXT,
      is_system TINYINT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `

  try {
    await db.pool.execute(createTableSql)
  } catch (error) {
    const err = new Error(
      `system_config 表不存在且无法创建，请使用管理员账号创建。原因：${error.message}`
    )
    err.cause = error
    throw err
  }

  try {
    await db.pool.execute('CREATE INDEX idx_config_group ON system_config(config_group)')
  } catch (error) {
    // 忽略索引创建失败（可能无权限或已存在）
    console.warn('跳过创建 system_config 索引:', error?.message || error)
  }
}

const ensureBrandingConfigs = async () => {
  await ensureSystemConfigTable()
  const keys = Object.keys(DEFAULTS)
  if (keys.length === 0) return

  const keyPlaceholders = keys.map(() => '?').join(',')
  const [rows] = await db.pool.execute(
    `SELECT config_key FROM system_config WHERE config_key IN (${keyPlaceholders})`,
    sanitizeParams(keys)
  )
  const existing = new Set(rows.map((row) => row.config_key))
  const pending = keys.filter((key) => !existing.has(key))

  if (pending.length === 0) return

  const placeholders = pending.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ')
  const params = []

  pending.forEach((key) => {
    const meta = CONFIG_META[key] || {}
    params.push(
      key,
      DEFAULTS[key],
      meta.name || key,
      'system',
      'string',
      meta.description || '',
      1
    )
  })

  const sql = `
    INSERT INTO system_config
      (config_key, config_value, config_name, config_group, value_type, description, is_system)
    VALUES ${placeholders}
  `

  await db.pool.execute(sql, sanitizeParams(params))
}

const dbAll = (sql, params) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })

const normalizeLogoMode = (value) => {
  if (value === 'image' || value === 'text' || value === 'both') return value
  return 'image'
}

router.get('/', async (_req, res) => {
  try {
    await ensureBrandingConfigs()
    const keys = Object.keys(DEFAULTS)
    const placeholders = keys.map(() => '?').join(',')
    const rows = await dbAll(
      `SELECT
        config_key,
        SUBSTRING_INDEX(
          GROUP_CONCAT(
            config_value
            ORDER BY COALESCE(updated_at, '0000-00-00 00:00:00') DESC
            SEPARATOR '\n'
          ),
          '\n',
          1
        ) AS config_value
      FROM system_config
      WHERE config_key IN (${placeholders})
      GROUP BY config_key`,
      keys
    )

    const map = { ...DEFAULTS }
    rows.forEach((row) => {
      map[row.config_key] = row.config_value ?? ''
    })

    res.json({
      code: 20000,
      data: {
        title: map.app_title,
        logoMode: normalizeLogoMode(map.app_logo_mode),
        logoText: map.app_logo_text,
        logoUrl: map.app_logo_url,
        faviconUrl: map.app_favicon_url
      }
    })
  } catch (error) {
    res.status(500).json({
      code: 50000,
      message: '获取系统品牌配置失败',
      error: error.message
    })
  }
})

router.put('/', async (req, res) => {
  try {
    const payload = req.body || {}
    const updates = {
      app_title: payload.title,
      app_logo_mode: payload.logoMode ? normalizeLogoMode(payload.logoMode) : undefined,
      app_logo_text: payload.logoText,
      app_logo_url: payload.logoUrl,
      app_favicon_url: payload.faviconUrl
    }

    const entries = Object.entries(updates).filter(([, value]) => value !== undefined)
    if (entries.length === 0) {
      return res.status(400).json({ code: 40000, message: '没有需要更新的配置' })
    }

    await ensureBrandingConfigs()

    const connection = await db.beginTransaction()
    try {
      for (const [key, value] of entries) {
        // 将 undefined 转换为 null，将 null 转换为空字符串，其他值保持不变
        const safeValue = value === undefined || value === null ? '' : value
        await db.runInTransaction(
          connection,
          'UPDATE system_config SET config_value = ?, updated_at = NOW() WHERE config_key = ?',
          [safeValue, key]
        )
      }
      await db.commit(connection)
    } catch (error) {
      await db.rollback(connection)
      throw error
    }

    res.json({ code: 20000, message: '品牌配置已更新' })
  } catch (error) {
    res.status(500).json({
      code: 50000,
      message: '更新系统品牌配置失败',
      error: error.message
    })
  }
})

const uploadDir = path.join(__dirname, '..', 'uploads', 'branding')
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(uploadDir, { recursive: true })
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const type = String(req.query.type || '').toLowerCase()
    const ext = path.extname(file.originalname) || (type === 'favicon' ? '.ico' : '.png')
    const name = type === 'favicon' ? 'favicon' : 'logo'
    cb(null, `${name}${ext}`)
  }
})

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.svg', '.ico']
    const ext = path.extname(file.originalname).toLowerCase()
    if (!allowed.includes(ext)) {
      return cb(new Error('不支持的文件类型'))
    }
    cb(null, true)
  }
})

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ code: 40000, message: '未收到文件' })
  }

  const url = `/uploads/branding/${req.file.filename}`
  res.json({
    code: 20000,
    data: { url }
  })
})

module.exports = router
