const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接到SQLite数据库
const dbPath = path.join(__dirname, 'app.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('连接数据库失败:', err.message);
    process.exit(1);
  } else {
    console.log('成功连接到SQLite数据库');
  }
});

// 要插入的政治面貌数据
const politicalStatusData = [
  { category: '政治面貌', values: ['群众', '共青团员', '中共预备党员', '中共党员', '民主党派'] }
];

// 开始插入数据
console.log('开始插入政治面貌字典数据...');

// 插入字典项
function insertDictionaryItems(category, values) {
  return new Promise((resolve, reject) => {
    // 先删除现有数据
    const deleteSql = `DELETE FROM dictionaries WHERE category = ?`;
    db.run(deleteSql, [category], (err) => {
      if (err) {
        reject(`删除现有数据失败 (${category}): ${err.message}`);
        return;
      }
      
      console.log(`已删除现有 ${category} 数据`);
      
      // 插入新数据
      const insertSql = `INSERT INTO dictionaries 
                       (category, value, display_order, status, created_at, updated_at) 
                       VALUES (?, ?, ?, ?, ?, ?)`;
      
      const timestamp = new Date().toISOString();
      let insertedCount = 0;
      
      values.forEach((value, index) => {
        const params = [
          category,       // category
          value,           // value
          index + 1,       // display_order
          'active',        // status
          timestamp,       // created_at
          timestamp        // updated_at
        ];
        
        db.run(insertSql, params, function(err) {
          if (err) {
            reject(`插入数据失败 (${category} - ${value}): ${err.message}`);
            return;
          }
          insertedCount++;
          
          // 所有数据插入完成后返回结果
          if (insertedCount === values.length) {
            resolve({ category, inserted: insertedCount });
          }
        });
      });
    });
  });
}

// 依次插入所有字典数据
async function insertAllDictionaryData() {
  try {
    for (const item of politicalStatusData) {
      const result = await insertDictionaryItems(item.category, item.values);
      if (result.inserted > 0) {
        console.log(`成功插入 ${result.inserted} 条 ${result.category} 数据`);
      }
    }
    
    // 验证插入结果
    console.log('\n验证插入结果:');
    for (const item of politicalStatusData) {
      const checkSql = `SELECT id, category, value, display_order FROM dictionaries WHERE category = ? ORDER BY display_order ASC`;
      db.all(checkSql, [item.category], (err, rows) => {
        if (err) {
          console.error(`查询验证数据失败 (${item.category}):`, err.message);
          return;
        }
        console.log(`\n${item.category}字典数据:`);
        rows.forEach(row => {
          console.log(`id: ${row.id}, category: ${row.category}, value: ${row.value}, display_order: ${row.display_order}`);
        });
        
        // 关闭数据库连接（在最后一个查询完成后）
        if (item === politicalStatusData[politicalStatusData.length - 1]) {
          db.close((err) => {
            if (err) {
              console.error('关闭数据库失败:', err.message);
              process.exit(1);
            }
            console.log('\n数据库连接已关闭，所有插入操作完成');
          });
        }
      });
    }
  } catch (error) {
    console.error('插入字典数据失败:', error);
    db.close();
    process.exit(1);
  }
}

// 执行插入操作
insertAllDictionaryData();