const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库路径
const dbPath = path.join(__dirname, 'app.db');

console.log('========================================');
console.log('开始检查数据库数据...');
console.log('数据库路径:', dbPath);
console.log('========================================\n');

// 连接到数据库
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 连接数据库失败:', err.message);
    console.error('错误码:', err.code);
    console.error('请检查数据库文件是否存在');
    process.exit(1);
  }
  console.log('✅ 成功连接到 SQLite 数据库\n');
});

// 检查数据库中的表
function checkTables() {
  return new Promise((resolve, reject) => {
    console.log('1. 检查数据库中的表:');
    db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, rows) => {
      if (err) {
        console.error('❌ 查询失败:', err.message);
        reject(err);
        return;
      }
      console.log('   找到 ' + rows.length + ' 个表:');
      rows.forEach(row => {
        console.log('   - ' + row.name);
      });
      console.log('');
      resolve();
    });
  });
}

// 检查 committee_members 表结构
function checkCommitteeMembersStructure() {
  return new Promise((resolve, reject) => {
    console.log('2. 检查 committee_members 表结构:');
    db.all("PRAGMA table_info(committee_members)", (err, rows) => {
      if (err) {
        console.error('❌ 查询失败:', err.message);
        reject(err);
        return;
      }
      console.log('   找到 ' + rows.length + ' 个字段:');
      rows.forEach(row => {
        console.log('   - ' + row.name + ' (' + row.type + ')');
      });
      console.log('');
      resolve();
    });
  });
}

// 检查 committee_members 表记录数
function checkCommitteeMembersCount() {
  return new Promise((resolve, reject) => {
    console.log('3. 检查 committee_members 表记录数:');
    db.get("SELECT COUNT(*) as count FROM committee_members", (err, row) => {
      if (err) {
        console.error('❌ 查询失败:', err.message);
        reject(err);
        return;
      }
      console.log('   记录数: ' + row.count + ' 条\n');
      resolve();
    });
  });
}

// 检查 committee_members 表数据
function checkCommitteeMembersData() {
  return new Promise((resolve, reject) => {
    console.log('4. 检查 committee_members 表前 5 条数据:');
    db.all("SELECT id, resident_id, organization_type, term_number, position FROM committee_members LIMIT 5", (err, rows) => {
      if (err) {
        console.error('❌ 查询失败:', err.message);
        reject(err);
        return;
      }
      if (rows.length === 0) {
        console.log('   ⚠️  committee_members 表中没有数据\n');
      } else {
        console.log('   查询到 ' + rows.length + ' 条数据:');
        rows.forEach((row, index) => {
          console.log('   第 ' + (index + 1) + ' 条:');
          console.log('     - ID: ' + row.id);
          console.log('     - 居民ID: ' + row.resident_id);
          console.log('     - 机构类型: ' + row.organization_type);
          console.log('     - 届数: ' + row.term_number);
          console.log('     - 职务: ' + row.position);
        });
      }
      console.log('');
      resolve();
    });
  });
}

// 检查是否有 residents 关联问题
function checkResidentsAssociation() {
  return new Promise((resolve, reject) => {
    console.log('5. 检查 residents 表关联情况:');
    db.all("SELECT cm.id, cm.resident_id, r.id as resident_exists FROM committee_members cm LEFT JOIN residents r ON cm.resident_id = r.id WHERE r.id IS NULL LIMIT 10", (err, rows) => {
      if (err) {
        console.error('❌ 查询失败:', err.message);
        reject(err);
        return;
      }
      if (rows.length > 0) {
        console.log('   ⚠️  发现 ' + rows.length + ' 条记录没有对应的居民:');
        rows.forEach((row, index) => {
          console.log('   第 ' + (index + 1) + ' 条:');
          console.log('     - 成员ID: ' + row.id);
          console.log('     - 居民ID: ' + row.resident_id + ' (不存在)');
        });
      } else {
        console.log('   ✅ 所有记录都有对应的居民\n');
      }
      console.log('');
      resolve();
    });
  });
}

// 检查 LEFT JOIN 查询
function checkLeftJoinQuery() {
  return new Promise((resolve, reject) => {
    console.log('6. 测试 LEFT JOIN 查询（模拟前端请求）:');
    db.all("SELECT cm.*, r.name, r.gender, r.phone_number FROM committee_members cm LEFT JOIN residents r ON cm.resident_id = r.id WHERE cm.organization_type = ? LIMIT 5", ['branch_committee'], (err, rows) => {
      if (err) {
        console.error('❌ 查询失败:', err.message);
        reject(err);
        return;
      }
      if (rows.length === 0) {
        console.log('   ⚠️  没有查询到数据\n');
      } else {
        console.log('   查询到 ' + rows.length + ' 条数据:');
        rows.forEach((row, index) => {
          console.log('   第 ' + (index + 1) + ' 条:');
          console.log('     - 成员ID: ' + row.id);
          console.log('     - 姓名: ' + (row.name || 'NULL'));
          console.log('     - 性别: ' + (row.gender || 'NULL'));
          console.log('     - 电话: ' + (row.phone_number || 'NULL'));
        });
      }
      console.log('');
      resolve();
    });
  });
}

// 检查 residents 表
function checkResidentsTable() {
  return new Promise((resolve, reject) => {
    console.log('7. 检查 residents 表:');
    db.get("SELECT COUNT(*) as count FROM residents", (err, row) => {
      if (err) {
        console.error('❌ 查询失败:', err.message);
        reject(err);
        return;
      }
      console.log('   记录数: ' + row.count + ' 条\n');
      resolve();
    });
  });
}

// 检查 dictionaries 表（职务数据）
function checkDictionaries() {
  return new Promise((resolve, reject) => {
    console.log('8. 检查 dictionaries 表（职务数据）:');
    db.get("SELECT COUNT(*) as count FROM dictionaries WHERE category = '职务'", (err, row) => {
      if (err) {
        console.error('❌ 查询失败:', err.message);
        reject(err);
        return;
      }
      console.log('   职务数据记录数: ' + row.count + ' 条\n');
      resolve();
    });
  });
}

// 主函数
async function main() {
  try {
    await checkTables();
    await checkCommitteeMembersStructure();
    await checkCommitteeMembersCount();
    await checkCommitteeMembersData();
    await checkResidentsAssociation();
    await checkLeftJoinQuery();
    await checkResidentsTable();
    await checkDictionaries();
    
    console.log('========================================');
    console.log('✅ 所有检查完成！');
    console.log('========================================');
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  } finally {
    db.close();
  }
}

// 运行主函数
main();