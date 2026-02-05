// 检查调解相关表结构的脚本
const db = require('./db.js');

console.log('=== 检查调解相关表结构 ===\n');

// 查询所有调解相关表
const tables = ['mediators', 'mediation_cases', 'mediation_records', 'mediation_types'];

let completed = 0;
const total = tables.length;

const checkTable = (table) => {
  db.all(`PRAGMA table_info(${table})`, (err, columns) => {
    completed++;
    
    if (err) {
      console.log(`❌ ${table}: ${err.message}`);
    } else if (columns.length === 0) {
      console.log(`⚠️ ${table}: 表不存在`);
    } else {
      console.log(`✅ ${table}:`);
      columns.forEach(col => {
        console.log(`  - ${col.name} (${col.type})${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
      });
    }
    
    if (completed === total) {
      console.log('\n=== 检查完成 ===');
      process.exit(0);
    }
  });
};

// 开始检查所有表
tables.forEach(table => checkTable(table));
