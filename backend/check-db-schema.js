const db = require('./db');

// 查询表结构的函数
function checkTableSchema(tableName) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve({ tableName, columns: rows });
      }
    });
  });
}

// 执行查询
async function main() {
  try {
    const tables = ['low_income_persons', 'residents', 'households'];
    const results = await Promise.all(tables.map(table => checkTableSchema(table)));
    
    results.forEach(result => {
      console.log(`\n=== ${result.tableName} 表结构 ===`);
      result.columns.forEach(col => {
        console.log(`${col.cid}: ${col.name} (${col.type}) - ${col.pk ? '主键' : ''}`);
      });
    });
  } catch (err) {
    console.error('查询表结构失败:', err.message);
  } finally {
    db.close();
  }
}

main();