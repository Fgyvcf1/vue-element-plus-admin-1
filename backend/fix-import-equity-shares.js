const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'app.db');
const db = new sqlite3.Database(dbPath);

console.log('开始修复导入功能的equity_shares字段问题...\n');

// 在导入API中添加equity_shares字段支持
const filePath = path.join(__dirname, 'routes.js');
const fs = require('fs');

console.log('读取routes.js文件...');
let routesContent = fs.readFileSync(filePath, 'utf8');

// 检查是否已经有equity_shares字段
if (routesContent.includes('equity_shares')) {
  console.log('equity_shares字段已存在，无需修改');
  console.log('');
  console.log('数据库操作完成！');
  process.exit(0);
}

console.log('正在添加equity_shares字段到导入API...');

// 1. 在INSERT语句中添加equity_shares字段
routesContent = routesContent.replace(
  'status, household_head_id, Home_address) \n              VALUES',
  'status, household_head_id, Home_address, equity_shares) \n              VALUES'
);

// 2. 在数据处理逻辑中添加equity_shares字段
routesContent = routesContent.replace(
  'residentData.marital_status || \'未婚\',\n',
  'residentData.marital_status || \'未婚\',\n              residentData.equity_shares || 0'
);

// 3. 在数据映射中添加equity_shares字段支持（在mapping部分）
const mappingSection = `// 处理每行数据
      const row = data[index];
      const householdData = {};
      const residentData = {};
      
      // 映射字段
      mapping.forEach((mapItem, mapIndex) => {
        if (mapItem.dbField) {
          const value = row[mapIndex];
          if (value !== undefined && value !== null && value !== '') {
            if (mapItem.dbField.startsWith('household_')) {
              householdData[mapItem.dbField] = value;
            } else {
              residentData[mapItem.dbField] = value;
            }
          }
        }
      });
      
      // 检查必要字段
      if (!residentData.name || !residentData.id_card) {
        errorCount++;
        errors.push(\`第\${index + 2}行: 缺少姓名或身份证号\`);
        processRow(index + 1, callback);
        return;
      }
      
      // 检查是否已存在该居民
      const checkSql = \`SELECT id, household_id FROM residents WHERE id_card = ?\`;
      db.get(checkSql, [residentData.id_card], (checkErr, existingResident) => {
        if (checkErr) {
          errorCount++;
          errors.push(\`第\${index + 2}行: 检查居民失败 - \${checkErr.message}\`);
          processRow(index + 1, callback);
          return;
        }
        
        if (existingResident) {
          // 居民已存在，更新信息
          const updateSql = \`UPDATE residents SET 
            name = ?, 
            gender = ?, 
            date_of_birth = ?, 
            village_group = ?, 
            bank_card = ?, 
            bank_name = ?, 
            phone_number = ?, 
            ethnicity = ?, 
            relationship_to_head = ?, 
            marital_status = ?, 
            political_status = ?, 
            military_service = ?, 
            education_level = ? 
            equity_shares = ?,
            WHERE id = ?\`;
          
          const params = [
            residentData.name || '',
            residentData.gender || '',
            residentData.date_of_birth || '',
            residentData.village_group || '',
            residentData.bank_card || '',
            residentData.bank_name || '',
            residentData.phone_number || '',
            residentData.ethnicity || '汉族',
            residentData.relationship_to_head || '其他',
            residentData.marital_status || '未婚',
            residentData.political_status || '群众',
            residentData.military_service || '未服兵役',
            residentData.education_level || '小学',
            residentData.equity_shares || 0,
            existingResident.id
          ];
          
          db.run(updateSql, params, (updateErr) => {
            if (updateErr) {
              errorCount++;
              errors.push(\`第\${index + 2}行: 更新居民失败 - \${updateErr.message}\`);
            } else {
              successCount++;
            }
            processRow(index + 1, callback);
          });
        } else {
          // 新居民，需要创建
          let householdId = null;
          
          // 处理家庭关系逻辑
          if (residentData.relationship_to_head === '本人') {
            // 与户主关系为"本人"，需要创建或查找户主信息
            const householdHeadName = householdData.household_head_name || residentData.name;
            
            // 检查是否已存在该家庭
            const checkHouseholdSql = \`SELECT id FROM households WHERE household_head_name = ?\`;
            db.get(checkHouseholdSql, [householdHeadName], (householdErr, existingHousehold) => {
              if (householdErr) {
                errorCount++;
                errors.push(\`第\${index + 2}行: 检查家庭失败 - \${householdErr.message}\`);
                processRow(index + 1, callback);
                return;
              }
              
              if (existingHousehold) {
                // 家庭已存在
                householdId = existingHousehold.id;
                insertResident();
              } else {
                // 创建新家庭
                const insertHouseholdSql = \`INSERT INTO households 
                  (household_head_name, village_group, address, phone_number, ethnicity, gender, status, registered_date) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)\`;
                
                const householdParams = [
                  householdHeadName,
                  householdData.village_group || residentData.village_group || '',
                  householdData.address || residentData.address || '',
                  householdData.phone_number || residentData.phone_number || '',
                  householdData.ethnicity || residentData.ethnicity || '汉族',
                  householdData.gender || residentData.gender || '',
                  'active',
                  new Date().toISOString().split('T')[0]
                ];
                
                db.run(insertHouseholdSql, householdParams, function(insertHouseholdErr) {
                  if (insertHouseholdErr) {
                    errorCount++;
                    errors.push(\`第\${index + 2}行: 创建家庭失败 - \${insertHouseholdErr.message}\`);
                    processRow(index + 1, callback);
                    return;
                  }
                  
                  householdId = this.lastID;
                  insertResident();
                });
              }
            });
          } else {
            // 与户主关系不是"本人"，需要关联到现有户主
            const householdHeadName = householdData.household_head_name;
            
            if (householdHeadName) {
              // 有户主姓名，查找对应家庭
              const checkHouseholdSql = \`SELECT id FROM households WHERE household_head_name = ?\`;
              db.get(checkHouseholdSql, [householdHeadName], (householdErr, existingHousehold) => {
                if (householdErr) {
                  errorCount++;
                  errors.push(\`第\${index + 2}行: 检查家庭失败 - \${householdErr.message}\`);
                  processRow(index + 1, callback);
                  return;
                }
                
                if (existingHousehold) {
                  householdId = existingHousehold.id;
                  insertResident();
                } else {
                  errorCount++;
                  errors.push(\`第\${index + 2}行: 找不到对应的户主信息\`);
                  processRow(index + 1, callback);
                }
              });
            } else {
              // 没有户主姓名，使用默认家庭ID
              householdId = 1;
              insertResident();
            }
          }
        }
      });
      
      console.log('导入完成！共处理', data.length, '条数据，成功', successCount, '条，失败', errorCount, '条');`;

console.log('正在写入修复后的routes.js...');`;

try {
  fs.writeFileSync(filePath, routesContent, 'utf8');
  console.log('✓ routes.js修复成功！');
} catch (err) {
  console.error('✗ 写入文件失败:', err.message);
  console.error('');
  process.exit(1);
}

console.log('');
console.log('数据库equity_shares字段检查结果:');