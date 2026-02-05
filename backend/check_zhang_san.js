const sqlite3 = require('sqlite3').verbose();

// 打开数据库连接
const db = new sqlite3.Database('./app.db');

console.log('正在检查是否有姓名为张三的居民...');

// 查询姓名为张三的居民
db.all('SELECT id, name, household_id FROM residents WHERE name LIKE ?', ['%张三%'], (err, rows) => {
  if (err) {
    console.error('查询居民失败:', err.message);
    db.close();
    return;
  }

  console.log(`共找到 ${rows.length} 个姓名包含张三的居民:`);
  rows.forEach(row => {
    console.log(`ID: ${row.id}, 姓名: ${row.name}, 家庭ID: ${row.household_id}`);
  });

  // 如果找到了张三，查询其所属家庭信息
  if (rows.length > 0) {
    const householdId = rows[0].household_id;
    console.log(`\n正在查询家庭ID为 ${householdId} 的家庭信息...`);
    
    db.get('SELECT id, household_head_name, household_number, address FROM households WHERE id = ?', [householdId], (err, household) => {
      if (err) {
        console.error('查询家庭失败:', err.message);
        db.close();
        return;
      }

      if (household) {
        console.log(`家庭信息: ID: ${household.id}, 户主: ${household.household_head_name}, 户号: ${household.household_number}, 地址: ${household.address}`);
      } else {
        console.log('未找到该家庭信息');
      }

      db.close();
    });
  } else {
    db.close();
  }
});