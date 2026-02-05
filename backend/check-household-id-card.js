const db = require('./db');

// 检查households表结构和数据
function checkHouseholdIdCardField() {
  console.log('开始检查households表结构和数据...');

  // 检查表结构
  db.all("PRAGMA table_info(households)", (err, columns) => {
    if (err) {
      console.error('获取表结构失败:', err.message);
      return;
    }

    console.log('\nhouseholds表字段信息:');
    columns.forEach(column => {
      console.log(`  ${column.name} (${column.type}${column.notnull ? ', NOT NULL' : ''}${column.pk ? ', PRIMARY KEY' : ''})`);
    });

    // 检查是否存在household_head_id_card字段
    const hasIdCardField = columns.some(column => column.name === 'household_head_id_card');
    console.log(`\n是否存在household_head_id_card字段: ${hasIdCardField ? '是' : '否'}`);

    // 如果存在该字段，检查数据
    if (hasIdCardField) {
      // 查询前5条数据，查看household_head_id_card字段是否有值
      db.all("SELECT id, household_number, household_head_name, household_head_id_card FROM households LIMIT 5", (err, rows) => {
        if (err) {
          console.error('查询数据失败:', err.message);
          return;
        }

        console.log('\n前5条数据的household_head_id_card字段值:');
        rows.forEach(row => {
          console.log(`  ID: ${row.id}, 户号: ${row.household_number}, 户主姓名: ${row.household_head_name}, 身份证号: ${row.household_head_id_card || '空'}`);
        });

        // 查询有多少条记录的household_head_id_card字段是空的
        db.get("SELECT COUNT(*) as emptyCount FROM households WHERE household_head_id_card IS NULL OR household_head_id_card = ''", (err, result) => {
          if (err) {
            console.error('查询空值记录失败:', err.message);
            return;
          }

          // 查询总记录数
          db.get("SELECT COUNT(*) as totalCount FROM households", (err, totalResult) => {
            if (err) {
              console.error('查询总记录数失败:', err.message);
              return;
            }

            console.log(`\n空值记录数: ${result.emptyCount}/${totalResult.totalCount}`);
            console.log('\n检查完成。');
            process.exit(0);
          });
        });
      });
    } else {
      console.log('\n检查完成。');
      process.exit(0);
    }
  });
}

// 运行检查
checkHouseholdIdCardField();