const mysql = require('mysql2/promise');

// MariaDB连接配置
// 注意：生产环境请使用环境变量存储敏感信息
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'app_user',
  password: process.env.DB_PASSWORD || 'strongpass791002',
  database: process.env.DB_NAME || 'village',
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 测试连接
pool.getConnection()
  .then(connection => {
    console.log('成功连接到MariaDB数据库');
    connection.release();
  })
  .catch(err => {
    console.error('连接数据库失败:', err.message);
  });

// SQL语法转换函数：将SQLite语法转换为MySQL语法
function convertSql(sql) {
  if (!sql) return sql;
  
  // last_insert_rowid() → LAST_INSERT_ID()
  sql = sql.replace(/last_insert_rowid\(\)/gi, 'LAST_INSERT_ID()');
  
  // datetime('now') → NOW()
  sql = sql.replace(/datetime\('now'\)/gi, 'NOW()');
  
  // date('now') → CURDATE()
  sql = sql.replace(/date\('now'\)/gi, 'CURDATE()');
  
  // strftime('%Y-%m-%d', date) → DATE_FORMAT(date, '%Y-%m-%d')
  sql = sql.replace(/strftime\('%Y-%m-%d',\s*([^)]+)\)/gi, 'DATE_FORMAT($1, \'%Y-%m-%d\')');
  
  // strftime('%Y', date) → YEAR(date)
  sql = sql.replace(/strftime\('%Y',\s*([^)]+)\)/gi, 'YEAR($1)');
  
  // strftime('%m', date) → MONTH(date)
  sql = sql.replace(/strftime\('%m',\s*([^)]+)\)/gi, 'MONTH($1)');
  
  // strftime('%d', date) → DAY(date)
  sql = sql.replace(/strftime\('%d',\s*([^)]+)\)/gi, 'DAY($1)');
  
  // ORDER BY RANDOM() → ORDER BY RAND()
  sql = sql.replace(/ORDER\s+BY\s+RANDOM\(\)/gi, 'ORDER BY RAND()');
  
  // IFNULL() → COALESCE() (MySQL支持IFNULL，但COALESCE更标准)
  // 注意：MySQL也支持IFNULL，所以这里不需要转换
  
  // GROUP_CONCAT() → GROUP_CONCAT() (MySQL原生支持)
  // 注意：MySQL也支持GROUP_CONCAT，所以这里不需要转换
  
  // sqlite_version() → VERSION()
  sql = sql.replace(/sqlite_version\(\)/gi, 'VERSION()');
  
  // BEGIN TRANSACTION → START TRANSACTION (MySQL语法)
  sql = sql.replace(/BEGIN\s+TRANSACTION/gi, 'START TRANSACTION');
  
  // 处理LIMIT offset, count 语法差异
  // SQLite: LIMIT count OFFSET offset
  // MySQL: LIMIT offset, count 或 LIMIT count OFFSET offset (都支持)
  
  return sql;
}

// 兼容性包装器：模拟sqlite3的回调风格API
const db = {
  // 模拟sqlite3的db.get方法 - 获取单行
  get: function(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    // 自动转换SQLite语法到MySQL语法
    sql = convertSql(sql);
    pool.execute(sql, params)
      .then(([rows]) => {
        callback(null, rows[0] || null);
      })
      .catch(err => {
        callback(err);
      });
  },

  // 模拟sqlite3的db.all方法 - 获取多行
  all: function(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    // 自动转换SQLite语法到MySQL语法
    sql = convertSql(sql);
    pool.execute(sql, params)
      .then(([rows]) => {
        callback(null, rows);
      })
      .catch(err => {
        callback(err);
      });
  },

  // 模拟sqlite3的db.run方法 - 执行INSERT/UPDATE/DELETE
  run: function(sql, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    // 自动转换SQLite语法到MySQL语法
    sql = convertSql(sql);
    pool.execute(sql, params)
      .then(([result]) => {
        // 模拟sqlite3的this对象
        const context = {
          lastID: result.insertId,  // MySQL使用insertId
          changes: result.affectedRows  // MySQL使用affectedRows
        };
        callback.call(context, null);
      })
      .catch(err => {
        callback(err);
      });
  },

  // 原始pool对象，供需要直接使用的地方
  pool: pool,

  // 事务支持：获取连接并开启事务
  beginTransaction: async function() {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    return connection;
  },

  // 提交事务
  commit: async function(connection) {
    await connection.commit();
    connection.release();
  },

  // 回滚事务
  rollback: async function(connection) {
    await connection.rollback();
    connection.release();
  },

  // 在事务中执行SQL（使用连接而不是pool）
  runInTransaction: function(connection, sql, params) {
    return new Promise((resolve, reject) => {
      sql = convertSql(sql);
      console.log('执行事务SQL:', sql);
      console.log('SQL参数:', params);
      connection.execute(sql, params)
        .then(([result]) => {
          console.log('SQL执行结果:', result);
          resolve({
            lastID: result.insertId,
            changes: result.affectedRows
          });
        })
        .catch(err => {
          console.error('SQL执行错误:', err.message);
          reject(err);
        });
    });
  }
};

module.exports = db;
