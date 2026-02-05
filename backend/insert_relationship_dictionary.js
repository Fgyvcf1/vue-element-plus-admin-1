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

// 要插入的与户主关系数据
const relationships = [
  '本人', '配偶', '子', '女', '儿媳', '女婿', '孙子', '孙女', 
  '父亲', '母亲', '祖父', '祖母', '外祖父', '外祖母', 
  '兄弟', '姐妹', '兄嫂', '弟媳', '姐夫', '妹夫', 
  '伯父', '叔父', '侄子', '侄女', '其他亲属', '非亲属'
];

// 开始事务
console.log('开始插入与户主关系字典数据...');

// 先检查是否已有相关数据
const checkSql = 'SELECT COUNT(*) as count FROM dictionaries WHERE category = "relationship_to_head"';
db.get(checkSql, (err, row) => {
  if (err) {
    console.error('检查现有数据失败:', err.message);
    db.close();
    process.exit(1);
  }
  
  if (row.count > 0) {
    console.log(`已存在 ${row.count} 条与户主关系数据，跳过插入`);
    db.close();
    process.exit(0);
  }
  
  // 插入数据
  const insertSql = `INSERT INTO dictionaries 
                   (category, value, display_order, status, created_at, updated_at) 
                   VALUES (?, ?, ?, ?, ?, ?)`;
  
  const timestamp = new Date().toISOString();
  let insertedCount = 0;
  
  relationships.forEach((relationship, index) => {
    const params = [
      'relationship_to_head', // category
      relationship,           // value
      index + 1,              // display_order
      'active',               // status
      timestamp,              // created_at
      timestamp               // updated_at
    ];
    
    db.run(insertSql, params, function(err) {
      if (err) {
        console.error(`插入数据失败 (${relationship}):`, err.message);
        db.close();
        process.exit(1);
      }
      insertedCount++;
      
      // 所有数据插入完成后验证结果
      if (insertedCount === relationships.length) {
        console.log(`成功插入 ${insertedCount} 条与户主关系数据`);
        
        // 验证插入结果
        db.all('SELECT id, category, value, display_order FROM dictionaries WHERE category = "relationship_to_head" ORDER BY display_order ASC', (err, rows) => {
          if (err) {
            console.error('查询验证数据失败:', err.message);
            db.close();
            process.exit(1);
          }
          console.log('\n验证结果 - 与户主关系字典数据:');
          rows.forEach(row => {
            console.log(`id: ${row.id}, category: ${row.category}, value: ${row.value}, display_order: ${row.display_order}`);
          });
          
          db.close((err) => {
            if (err) {
              console.error('关闭数据库失败:', err.message);
              process.exit(1);
            }
            console.log('\n数据库连接已关闭，插入操作完成');
          });
        });
      }
    });
  });
});
