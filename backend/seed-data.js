const fs = require('fs')
const path = require('path')
const mysql = require('mysql2/promise')
const sqlite3 = require('sqlite3').verbose()

const ROOT_DIR = __dirname
const CONFIG_PATH = path.join(ROOT_DIR, 'config.json')
const SEED_MENU = path.join(ROOT_DIR, 'seed', 'sys_menu.json')
const SQLITE_DB = path.join(ROOT_DIR, 'app.db')

const readConfig = () => {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8')
  const cfg = JSON.parse(raw)
  return {
    host: cfg.host || '127.0.0.1',
    port: Number(cfg.port || 3306),
    user: cfg.user || 'app_user',
    password: cfg.password || '',
    database: cfg.database || 'village'
  }
}

const readSqliteDictionaries = () =>
  new Promise((resolve, reject) => {
    if (!fs.existsSync(SQLITE_DB)) return resolve([])
    const db = new sqlite3.Database(SQLITE_DB, (err) => {
      if (err) return reject(err)
    })
    db.all(
      'SELECT id, category, value, display_order, status, created_at, updated_at FROM dictionaries ORDER BY id',
      (err, rows) => {
        db.close()
        if (err) return reject(err)
        resolve(rows || [])
      }
    )
  })

const tableExists = async (conn, name) => {
  const [rows] = await conn.execute(
    "SELECT COUNT(*) as cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
    [conn.config.database, name]
  )
  return (rows[0]?.cnt || 0) > 0
}

const seedDictionaries = async (conn) => {
  if (!(await tableExists(conn, 'dictionaries'))) return false
  const [countRows] = await conn.execute('SELECT COUNT(*) as cnt FROM dictionaries')
  if ((countRows[0]?.cnt || 0) > 0) return false

  const rows = await readSqliteDictionaries()
  if (!rows.length) return false

  const sql =
    'INSERT INTO dictionaries (id, category, value, display_order, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  for (const row of rows) {
    await conn.execute(sql, [
      row.id,
      row.category,
      row.value,
      row.display_order,
      row.status,
      row.created_at,
      row.updated_at
    ])
  }
  return true
}

const seedMenus = async (conn) => {
  if (!(await tableExists(conn, 'sys_menu'))) return false
  if (!fs.existsSync(SEED_MENU)) return false

  const [countRows] = await conn.execute('SELECT COUNT(*) as cnt FROM sys_menu')
  if ((countRows[0]?.cnt || 0) > 0) return false

  const rows = JSON.parse(fs.readFileSync(SEED_MENU, 'utf8'))
  if (!Array.isArray(rows) || rows.length === 0) return false

  await conn.execute('SET FOREIGN_KEY_CHECKS = 0')
  await conn.execute('DELETE FROM role_menu')
  await conn.execute('DELETE FROM sys_menu')
  await conn.execute('ALTER TABLE sys_menu AUTO_INCREMENT = 1')

  const sql =
    'INSERT INTO sys_menu (id, parent_id, name, path, component, redirect, title, icon, menu_type, permission_code, sort_order, hidden, always_show, no_cache, affix, active_menu, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'

  for (const row of rows) {
    await conn.execute(sql, [
      row.id,
      row.parent_id,
      row.name,
      row.path,
      row.component,
      row.redirect,
      row.title,
      row.icon,
      row.menu_type,
      row.permission_code,
      row.sort_order,
      row.hidden,
      row.always_show,
      row.no_cache,
      row.affix,
      row.active_menu,
      row.status
    ])
  }

  const [roleRows] = await conn.execute(
    "SELECT id FROM roles WHERE role_code = 'superadmin' LIMIT 1"
  )
  if (roleRows.length) {
    await conn.execute(
      'INSERT IGNORE INTO role_menu (role_id, menu_id) SELECT ?, id FROM sys_menu',
      [roleRows[0].id]
    )
  }

  await conn.execute('SET FOREIGN_KEY_CHECKS = 1')
  return true
}

const main = async () => {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error('未找到 config.json，跳过种子数据导入')
    process.exit(0)
  }

  const cfg = readConfig()
  const conn = await mysql.createConnection({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
    charset: 'utf8mb4'
  })

  try {
    const seededDict = await seedDictionaries(conn)
    const seededMenu = await seedMenus(conn)
    console.log(
      `种子数据导入完成：字典=${seededDict ? '已导入' : '跳过'}，菜单=${seededMenu ? '已导入' : '跳过'}`
    )
  } finally {
    await conn.end()
  }
}

main().catch((err) => {
  console.error('种子数据导入失败:', err)
  process.exit(1)
})
