// 检查居民数据
const db = require('./db.js');

async function checkResident() {
  try {
    console.log('=== 检查居民数据 ===\n');
    
    // 查询倪清春
    const [residents] = await db.pool.execute(`
      SELECT r.*, h.household_head_name, h.address as household_address
      FROM residents r
      LEFT JOIN households h ON r.household_id = h.household_number
      WHERE r.id_card = ?
    `, ['45242519630408121X']);
    
    if (residents.length === 0) {
      console.log('未找到该居民');
    } else {
      console.log('找到居民记录:');
      residents.forEach(r => {
        console.log('  ID:', r.id);
        console.log('  姓名:', r.name);
        console.log('  身份证号:', r.id_card);
        console.log('  户编号:', r.household_id);
        console.log('  与户主关系:', r.relationship_to_head);
        console.log('  户主姓名:', r.household_head_name);
        console.log('  状态:', r.status);
        console.log('');
      });
    }
    
    // 查询 households 表中的户主
    const [households] = await db.pool.execute(`
      SELECT * FROM households WHERE household_head_name = ?
    `, ['倪清春']);
    
    console.log(`\nhouseholds 表中户主为"倪清春"的记录: ${households.length} 条`);
    households.forEach(h => {
      console.log('  户编号:', h.household_number);
      console.log('  户主:', h.household_head_name);
      console.log('  状态:', h.status);
      console.log('');
    });
    
    console.log('=== 检查完成 ===');
    process.exit(0);
  } catch (err) {
    console.error('检查失败:', err.message);
    process.exit(1);
  }
}

checkResident();
