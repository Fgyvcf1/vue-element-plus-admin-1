const db = require('./db')

// 创建archive_files表用于存储PDF文件信息
db.serialize(() => {
  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      console.error('开始事务失败:', err)
      return
    }

    // 创建archive_files表
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS archive_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        archive_id VARCHAR(50) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_url VARCHAR(500),
        type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expired_at TIMESTAMP,
        FOREIGN KEY (archive_id) REFERENCES mediation_archives(archive_id) ON DELETE CASCADE
      )
    `

    db.run(createTableSQL, (err) => {
      if (err) {
        console.error('创建archive_files表失败:', err)
        db.run('ROLLBACK')
        return
      }

      // 创建索引以提高查询性能
      const createIndexSQL = `
        CREATE INDEX IF NOT EXISTS idx_archive_files_archive_id ON archive_files(archive_id);
        CREATE INDEX IF NOT EXISTS idx_archive_files_type ON archive_files(type);
      `

      db.run(createIndexSQL, (err) => {
        if (err) {
          console.error('创建索引失败:', err)
          db.run('ROLLBACK')
          return
        }

        db.run('COMMIT', (err) => {
          if (err) {
            console.error('提交事务失败:', err)
            return
          }
          console.log('archive_files表创建成功')
        })
      })
    })
  })
})
