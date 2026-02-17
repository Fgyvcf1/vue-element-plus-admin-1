const db = require('./db')

db.all(
  "SELECT config_key, config_value FROM system_config WHERE config_key LIKE 'birth_%'",
  [],
  (err, rows) => {
    if (err) {
      console.error('错误:', err.message)
    } else {
      console.log('生日提醒配置:')
      rows.forEach((r) => console.log('  ' + r.config_key + ' = ' + r.config_value))
    }
    process.exit(0)
  }
)
