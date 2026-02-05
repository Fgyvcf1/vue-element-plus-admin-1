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

// 要插入的字典数据
const dictionaryData = [
  // 婚姻状况
  {
    category: '婚姻状况',
    values: ['未婚', '已婚', '离异', '丧偶']
  },
  // 兵役状况
  {
    category: '兵役状况',
    values: ['未服兵役', '服现役', '已服兵役', '服预备役']
  },
  // 文化程度
  {
    category: '文化程度',
    values: ['无学历', '小学', '初中', '高中', '中职（高职）', '大专', '本科', '硕士研究生', '博士研究生']
  }
];

// 开始插入数据
console.log('开始插入字典数据...');

// 插入字典项
function insertDictionaryItems(category, values) {
  return new Promise((resolve, reject) => {
    // 检查是否已有相关数据
    const checkSql = `SELECT COUNT(*) as count FROM dictionaries WHERE category = ?`;
    db.get(checkSql, [category], (err, row) => {
      if (err) {
        reject(`检查现有数据失败 (${category}): ${err.message}`);
        return;
      }
      
      if (row.count > 0) {
        console.log(`已存在 ${row.count} 条 ${category} 数据，跳过插入`);
        resolve({ category, inserted: 0 });
        return;
      }
      
      // 插入数据
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
    for (const item of dictionaryData) {
      const result = await insertDictionaryItems(item.category, item.values);
      if (result.inserted > 0) {
        console.log(`成功插入 ${result.inserted} 条 ${result.category} 数据`);
      }
    }
    
    // 验证插入结果
    console.log('\n验证插入结果:');
    for (const item of dictionaryData) {
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
        if (item === dictionaryData[dictionaryData.length - 1]) {
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