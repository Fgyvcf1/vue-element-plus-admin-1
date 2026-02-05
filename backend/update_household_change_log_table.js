const db = require('./db');

// 更新household_change_log表，逐个添加迁入/迁出/死亡相关字段
const columnsToAdd = [
  'migration_in_date TEXT',
  'migration_in_reason TEXT',
  'migration_out_date TEXT',
  'migration_out_reason TEXT',
  'death_date TEXT',
  'death_reason TEXT'
];

// 逐个执行ALTER TABLE语句
let columnIndex = 0;

function addNextColumn() {
  if (columnIndex >= columnsToAdd.length) {
    // 所有列都添加完成
    console.log('household_change_log表更新成功，已添加所有迁入/迁出/死亡相关字段');
    
    // 检查更新后的表结构
    db.all('PRAGMA table_info(household_change_log);', [], (infoErr, rows) => {
      if (infoErr) {
        console.error('获取表结构失败:', infoErr.message);
      } else {
        console.log('更新后的household_change_log表结构:');
        rows.forEach(row => {
          console.log(`${row.name} (${row.type}) - ${row.notnull ? 'NOT NULL' : 'NULL'}`);
        });
      }
      process.exit(0);
    });
    return;
  }
  
  const columnSql = `ALTER TABLE household_change_log ADD COLUMN ${columnsToAdd[columnIndex]}`;
  console.log(`正在添加列: ${columnsToAdd[columnIndex]}`);
  
  db.run(columnSql, [], (err) => {
    if (err) {
      // 如果列已存在，跳过该列
      if (err.message.includes('duplicate column name')) {
        console.log(`列已存在，跳过: ${columnsToAdd[columnIndex]}`);
        columnIndex++;
        addNextColumn();
      } else {
        console.error('更新household_change_log表失败:', err.message);
        process.exit(1);
      }
    } else {
      console.log(`成功添加列: ${columnsToAdd[columnIndex]}`);
      columnIndex++;
      addNextColumn();
    }
  });
}

// 开始添加列
addNextColumn();
