const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 使用绝对路径
const dbPath = path.join(__dirname, 'app.db');
console.log('数据库路径:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('连接数据库失败:', err.message);
    process.exit(1);
  }
  console.log('成功连接到数据库\n');
});

// 查询所有残疾人记录
const sql = `SELECT id, disability_type, disability_level, certificate_number,
                    issue_date, validity_period, guardian_name, guardian_phone, certificate_status
             FROM disabled_persons`;

db.all(sql, [], (err, rows) => {
  if (err) {
    console.error('查询失败:', err.message);
    process.exit(1);
  }

  console.log('=== 残疾人记录 ===');
  console.log('共', rows.length, '条记录\n');

  rows.forEach((row, index) => {
    console.log(`记录 ${index + 1}:`);
    console.log('  ID:', row.id);
    console.log('  残疾类型:', row.disability_type);
    console.log('  残疾等级:', row.disability_level);
    console.log('  残疾证号:', row.certificate_number);
    console.log('  初次发证日期:', row.issue_date);
    console.log('  有效期至:', row.validity_period);
    console.log('  监护人姓名:', row.guardian_name);
    console.log('  监护人联系电话:', row.guardian_phone);
    console.log('  持证状态:', row.certificate_status);
    console.log('');
  });

  db.close();
});
