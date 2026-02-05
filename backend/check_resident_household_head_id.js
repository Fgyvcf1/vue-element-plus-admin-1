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

// 检查居民表是否有household_head_id字段
console.log('开始检查居民表是否有household_head_id字段...');

// 查询表结构
db.all("PRAGMA table_info(residents)", (err, rows) => {
  if (err) {
    console.error('查询表结构失败:', err.message);
    db.close();
    process.exit(1);
  }
  
  // 检查是否已有household_head_id字段
  const hasHouseholdHeadId = rows.some(row => row.name === 'household_head_id');
  console.log(`居民表${hasHouseholdHeadId ? '已包含' : '不包含'}household_head_id字段`);
  
  // 如果没有household_head_id字段，则添加
  if (!hasHouseholdHeadId) {
    console.log('开始添加household_head_id字段到居民表...');
    db.run("ALTER TABLE residents ADD COLUMN household_head_id INTEGER", (err) => {
      if (err) {
        console.error('添加household_head_id字段失败:', err.message);
        db.close();
        process.exit(1);
      } else {
        console.log('成功添加household_head_id字段到居民表');
        
        // 验证添加结果
        db.all("PRAGMA table_info(residents)", (err, updatedRows) => {
          if (err) {
            console.error('查询更新后的表结构失败:', err.message);
            db.close();
            process.exit(1);
          }
          console.log('\n更新后的居民表结构:');
          updatedRows.forEach(row => {
            if (row.name === 'household_head_id') {
              console.log(`${row.cid}: ${row.name} (${row.type}) - ${row.notnull ? 'NOT NULL' : 'NULL'} - 默认值: ${row.dflt_value}`);
            }
          });
          
          db.close((err) => {
            if (err) {
              console.error('关闭数据库失败:', err.message);
              process.exit(1);
            }
            console.log('\n数据库连接已关闭');
          });
        });
      }
    });
  } else {
    // 已有household_head_id字段，检查字段类型
    const householdHeadIdField = rows.find(row => row.name === 'household_head_id');
    console.log(`\nhousehold_head_id字段信息:`);
    console.log(`${householdHeadIdField.cid}: ${householdHeadIdField.name} (${householdHeadIdField.type}) - ${householdHeadIdField.notnull ? 'NOT NULL' : 'NULL'} - 默认值: ${householdHeadIdField.dflt_value}`);
    
    db.close((err) => {
      if (err) {
        console.error('关闭数据库失败:', err.message);
        process.exit(1);
      }
      console.log('\n数据库连接已关闭');
    });
  }
});
