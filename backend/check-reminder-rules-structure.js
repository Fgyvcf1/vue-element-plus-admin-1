const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, 'app.db');

// 连接数据库
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
    process.exit(1);
  }
  console.log('已连接到数据库');
});

// 检查reminder_rules表结构
db.get("PRAGMA table_info(reminder_rules)", (err, columns) => {
  if (err) {
    console.error('查询表结构失败:', err.message);
    db.close();
    process.exit(1);
  }
  
  console.log('\nreminder_rules 表结构:');
  console.log('字段名\t\t类型\t\t非空\t主键');
  console.log('--------------------------------------------------');
  columns.forEach(col => {
    console.log(`${col.name}\t\t${col.type}\t\t${col.notnull ? '是' : '否'}\t${col.pk ? '是' : '否'}`);
  });
  
  // 检查reminder_rules表数据
  console.log('\nreminder_rules 表数据:');
  db.all("SELECT * FROM reminder_rules", (err, rows) => {
    if (err) {
      console.error('查询数据失败:', err.message);
    } else {
      if (rows.length === 0) {
        console.log('表中暂无数据');
      } else {
        console.log('ID\t规则类型\t规则名称\t规则值\t描述\t状态\t创建时间\t更新时间');
        console.log('----------------------------------------------------------------------------------------');
        rows.forEach(row => {
          console.log(`${row.id}\t${row.rule_type}\t\t${row.rule_name}\t${row.rule_value}\t${row.description || ''}\t${row.status}\t${row.created_at}\t${row.updated_at}`);
        });
      }
    }
    
    db.close((err) => {
      if (err) {
        console.error('关闭数据库失败:', err.message);
      } else {
        console.log('\n数据库连接已关闭');
      }
      process.exit(0);
    });
  });
});
