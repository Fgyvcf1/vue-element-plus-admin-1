const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库路径
const dbPath = path.join(__dirname, 'app.db');

// 连接数据库
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('连接数据库失败:', err.message);
    process.exit(1);
  }
  console.log('成功连接到SQLite数据库');
});

// 开始事务
db.serialize(() => {
  try {
    // 1. 查询所有居民记录
    console.log('1. 查询所有居民记录...');
    db.all(`SELECT id, household_id FROM residents`, (err, residents) => {
      if (err) {
        console.error('查询居民记录失败:', err.message);
        return;
      }
      
      console.log(`查询到 ${residents.length} 条居民记录`);
      
      // 统计变量
      let updatedCount = 0;
      let errorCount = 0;
      
      // 2. 遍历所有居民记录，更新household_id
      const updateResident = (index) => {
        if (index >= residents.length) {
          // 所有记录处理完成
          console.log(`\n✅ 更新完成！`);
          console.log(`成功更新: ${updatedCount} 条记录`);
          console.log(`更新失败: ${errorCount} 条记录`);
          db.close();
          return;
        }
        
        const resident = residents[index];
        const residentId = resident.id;
        const oldHouseholdId = resident.household_id;
        
        // 跳过household_id为空的记录
        if (!oldHouseholdId) {
          updateResident(index + 1);
          return;
        }
        
        // 3. 查询对应的households记录，获取household_number
        console.log(`\n处理居民ID: ${residentId}, 当前household_id: ${oldHouseholdId}`);
        db.get(`SELECT household_number FROM households WHERE id = ?`, [oldHouseholdId], (err, household) => {
          if (err) {
            console.error(`查询居民ID ${residentId} 的家庭信息失败:`, err.message);
            errorCount++;
            updateResident(index + 1);
            return;
          }
          
          if (!household) {
            console.error(`居民ID ${residentId} 对应的家庭不存在 (household_id: ${oldHouseholdId})`);
            errorCount++;
            updateResident(index + 1);
            return;
          }
          
          const newHouseholdId = household.household_number;
          console.log(`居民ID ${residentId}: 将household_id从 ${oldHouseholdId} 更新为 ${newHouseholdId}`);
          
          // 4. 更新居民记录的household_id
          db.run(`UPDATE residents SET household_id = ? WHERE id = ?`, [newHouseholdId, residentId], (err) => {
            if (err) {
              console.error(`更新居民ID ${residentId} 失败:`, err.message);
              errorCount++;
            } else {
              console.log(`✅ 居民ID ${residentId} 更新成功`);
              updatedCount++;
            }
            
            // 处理下一条记录
            updateResident(index + 1);
          });
        });
      };
      
      // 开始处理第一条记录
      updateResident(0);
    });
  } catch (error) {
    console.error('更新过程中发生错误:', error.message);
    db.close();
  }
});
