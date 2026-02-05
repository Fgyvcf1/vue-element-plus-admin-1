// 检查 households 表结构
const db = require('./db.js');

async function checkStructure() {
  try {
    console.log('=== 检查 households 表结构 ===\n');
    
    const [columns] = await db.pool.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'village' 
      AND TABLE_NAME = 'households'
    `);
    
    console.log('表结构:');
    columns.forEach(col => {
      console.log(`  ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'} DEFAULT=${col.COLUMN_DEFAULT}`);
    });
    
    console.log('\n=== 检查完成 ===');
    process.exit(0);
  } catch (err) {
    console.error('检查失败:', err.message);
    process.exit(1);
  }
}

checkStructure();
