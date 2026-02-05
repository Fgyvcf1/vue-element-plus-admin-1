const db = require('./db.js');

console.log('=== 删除人民调解模块的所有相关表 ===\n');

// 要删除的调解相关表列表
const tablesToDelete = [
  'mediation_cases',
  'mediation_records',
  'mediation_types',
  'mediators',
  'mediation_record_mediators',
  'mediation_record_images'
];

let completed = 0;
const total = tablesToDelete.length;

const deleteTable = (tableName) => {
  db.run(`DROP TABLE IF EXISTS ${tableName}`, (err) => {
    completed++;

    if (err) {
      console.log(`❌ 删除表 ${tableName} 失败: ${err.message}`);
    } else {
      console.log(`✅ 删除表 ${tableName} 成功`);
    }

    if (completed === total) {
      console.log('\n=== 所有调解表删除完成 ===');

      // 验证删除结果
      db.all("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%mediation%' ORDER BY name", [], (err, rows) => {
        if (err) {
          console.error('验证查询失败:', err.message);
        } else {
          if (rows.length === 0) {
            console.log('\n✅ 验证: 数据库中已无调解相关表');
          } else {
            console.log('\n⚠️ 警告: 仍有调解相关表存在:');
            rows.forEach(row => console.log(`  - ${row.name}`));
          }
        }
        db.close();
      });
    }
  });
};

// 开始删除所有表
console.log('准备删除以下表:');
tablesToDelete.forEach(t => console.log(`  - ${t}`));
console.log('');

tablesToDelete.forEach(table => deleteTable(table));
