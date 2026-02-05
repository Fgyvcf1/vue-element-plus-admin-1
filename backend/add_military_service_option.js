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

// 添加服现役选项
function addMilitaryServiceOption() {
  return new Promise((resolve, reject) => {
    // 检查服现役选项是否已存在
    const checkSql = `SELECT COUNT(*) as count FROM dictionaries WHERE category = '兵役状况' AND value = '服现役'`;
    db.get(checkSql, (err, row) => {
      if (err) {
        reject(`检查服现役选项失败: ${err.message}`);
        return;
      }
      
      if (row.count > 0) {
        console.log('服现役选项已存在，跳过插入');
        resolve(false);
        return;
      }
      
      // 获取当前最大的display_order
      const getMaxOrderSql = `SELECT MAX(display_order) as max_order FROM dictionaries WHERE category = '兵役状况'`;
      db.get(getMaxOrderSql, (err, row) => {
        if (err) {
          reject(`获取最大显示顺序失败: ${err.message}`);
          return;
        }
        
        const nextOrder = (row.max_order || 0) + 1;
        const timestamp = new Date().toISOString();
        
        // 插入服现役选项
        const insertSql = `INSERT INTO dictionaries 
                         (category, value, display_order, status, created_at, updated_at) 
                         VALUES (?, ?, ?, ?, ?, ?)`;
        
        const params = [
          '兵役状况',
          '服现役',
          nextOrder,
          'active',
          timestamp,
          timestamp
        ];
        
        db.run(insertSql, params, function(err) {
          if (err) {
            reject(`插入服现役选项失败: ${err.message}`);
            return;
          }
          console.log(`成功插入服现役选项，ID: ${this.lastID}`);
          resolve(true);
        });
      });
    });
  });
}

// 验证结果
function verifyResult() {
  return new Promise((resolve, reject) => {
    const checkSql = `SELECT id, category, value, display_order FROM dictionaries WHERE category = '兵役状况' ORDER BY display_order ASC`;
    db.all(checkSql, (err, rows) => {
      if (err) {
        reject(`验证结果失败: ${err.message}`);
        return;
      }
      
      console.log('\n兵役状况字典数据:');
      rows.forEach(row => {
        console.log(`id: ${row.id}, category: ${row.category}, value: ${row.value}, display_order: ${row.display_order}`);
      });
      resolve(rows);
    });
  });
}

// 执行操作
async function run() {
  try {
    await addMilitaryServiceOption();
    await verifyResult();
  } catch (error) {
    console.error('操作失败:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('关闭数据库失败:', err.message);
      } else {
        console.log('\n数据库连接已关闭，操作完成');
      }
    });
  }
}

// 运行脚本
run();
