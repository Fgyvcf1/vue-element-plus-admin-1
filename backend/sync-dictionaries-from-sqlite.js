const fs = require('fs')
const path = require('path')
const sqlite3 = require('sqlite3').verbose()
const mysql = require('mysql2/promise')

const INSTALL_CONFIG = 'E:\\Vue Element Plus Admin\\backend\\config.json'
const SQLITE_DB = path.join(__dirname, 'app.db')

function readConfig() {
  const raw = fs.readFileSync(INSTALL_CONFIG, 'utf8')
  const cfg = JSON.parse(raw)
  return {
    host: cfg.host || '127.0.0.1',
    port: cfg.port || 3306,
    database: cfg.database || 'village',
    user: cfg.user || 'app_user',
    password: cfg.password || ''
  }
}

function readSqliteRows() {
  return new Promise((resolve, reject) => {
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
}

async function sync() {
  const cfg = readConfig()
  const rows = await readSqliteRows()
  if (!rows.length) {
    console.log('SQLite 字典为空，未导入')
    return
  }

  const conn = await mysql.createConnection({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
    charset: 'utf8mb4'
  })

  await conn.execute('DELETE FROM dictionaries')
  const sql =
    'INSERT INTO dictionaries (id, category, value, display_order, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'

  for (const r of rows) {
    await conn.execute(sql, [
      r.id,
      r.category,
      r.value,
      r.display_order,
      r.status,
      r.created_at,
      r.updated_at
    ])
  }

  await conn.end()
  console.log(`已导入字典 ${rows.length} 条`)
}

sync().catch((err) => {
  console.error('字典同步失败:', err)
  process.exit(1)
})
