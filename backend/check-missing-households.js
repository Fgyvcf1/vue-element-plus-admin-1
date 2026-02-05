// 检查缺失的户主关联
const db = require('./db.js');

async function checkMissing() {
  try {
    console.log('=== 检查缺失的户主关联 ===\n');
    
    // 检查 households 表中有，但 residents 表中没有对应户主的情况
    const [missingHouseholds] = await db.pool.execute(`
      SELECT h.household_number, h.household_head_name, h.status
      FROM households h
      LEFT JOIN residents r ON h.household_number = r.household_id 
        AND r.relationship_to_head IN ('本人', '户主')
      WHERE h.status = 'active'
      AND r.id IS NULL
    `);
    
    console.log(`households 表中有，但 residents 表中没有对应户主的家庭: ${missingHouseholds.length} 个`);
    if (missingHouseholds.length > 0) {
      console.log('\n前10个缺失的家庭:');
      missingHouseholds.slice(0, 10).forEach(row => {
        console.log(`  户号: ${row.household_number}, 户主: ${row.household_head_name}`);
      });
    }
    
    // 检查 residents 表中是户主，但 households 表中 status 不是 active 的情况
    const [inactiveHouseholds] = await db.pool.execute(`
      SELECT r.id, r.name, r.household_id, r.status as resident_status, h.status as household_status
      FROM residents r
      LEFT JOIN households h ON r.household_id = h.household_number
      WHERE r.relationship_to_head IN ('本人', '户主')
      AND r.status = 'active'
      AND (h.status != 'active' OR h.status IS NULL)
    `);
    
    console.log(`\nresidents 表中是户主且 active，但 households 表不是 active 的: ${inactiveHouseholds.length} 个`);
    if (inactiveHouseholds.length > 0) {
      console.log('\n前10个:');
      inactiveHouseholds.slice(0, 10).forEach(row => {
        console.log(`  居民: ${row.name}, 户号: ${row.household_id}, 居民状态: ${row.resident_status}, 家庭状态: ${row.household_status}`);
      });
    }
    
    console.log('\n=== 检查完成 ===');
    process.exit(0);
  } catch (err) {
    console.error('检查失败:', err.message);
    process.exit(1);
  }
}

checkMissing();
