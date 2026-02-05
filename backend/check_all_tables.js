const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'app.db');
const db = new sqlite3.Database(dbPath);

console.log('检查数据库中的所有表...');
db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, tables) => {
  if (err) {
    console.error('查询表列表失败:', err.message);
    db.close();
    return;
  }
  
  console.log('数据库中存在的表:');
  tables.forEach((table, index) => {
    console.log(`${index + 1}. ${table.name}`);
  });
  
  // 检查并创建必要的表
  const tablesToCheck = [
    {
      name: 'residents',
      createSql: `
        CREATE TABLE IF NOT EXISTS residents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          id_card TEXT NOT NULL,
          gender TEXT NOT NULL,
          date_of_birth TEXT NOT NULL,
          village_group TEXT NOT NULL,
          bank_card TEXT,
          phone_number TEXT,
          bank_name TEXT,
          household_id INTEGER NOT NULL,
          household_head_id INTEGER NOT NULL,
          ethnicity TEXT NOT NULL DEFAULT '汉族',
          relationship_to_head TEXT NOT NULL DEFAULT '其他',
          marital_status TEXT NOT NULL DEFAULT '未婚',
          political_status TEXT NOT NULL DEFAULT '群众',
          military_service TEXT NOT NULL DEFAULT '未服兵役',
          education_level TEXT NOT NULL DEFAULT '小学',
          status TEXT NOT NULL DEFAULT 'active',
          registered_permanent_residence INTEGER NOT NULL DEFAULT 1,
          registered_date TEXT NOT NULL,
          address TEXT,
          status_updated_at TEXT,
          status_change_reason TEXT
        );
      `
    },
    {
      name: 'household_change_log',
      createSql: `
        CREATE TABLE IF NOT EXISTS household_change_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          resident_id INTEGER NOT NULL,
          change_type TEXT NOT NULL,
          change_date TEXT NOT NULL,
          change_reason TEXT,
          previous_status TEXT,
          new_status TEXT,
          operator TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (resident_id) REFERENCES residents (id)
        );
      `
    }
  ];
  
  // 检查并创建表
  let tablesCreated = 0;
  const totalTables = tablesToCheck.length;
  
  tablesToCheck.forEach(tableInfo => {
    if (!tables.some(table => table.name === tableInfo.name)) {
      console.log(`\n创建${tableInfo.name}表...`);
      
      db.run(tableInfo.createSql, (err) => {
        if (err) {
          console.error(`创建${tableInfo.name}表失败:`, err.message);
        } else {
          console.log(`${tableInfo.name}表创建成功！`);
          // 再次检查表结构
          db.all(`PRAGMA table_info(${tableInfo.name});`, (err, rows) => {
            if (err) {
              console.error('查询新创建的表结构失败:', err.message);
            } else {
              console.log(`\n新创建的${tableInfo.name}表结构:`);
              rows.forEach((row, index) => {
                console.log(`${index + 1}. ${row.name} (${row.type}) - ${row.notnull ? 'NOT NULL' : 'NULL'} ${row.pk ? 'PRIMARY KEY' : ''}`);
              });
            }
            
            tablesCreated++;
            if (tablesCreated === totalTables) {
              db.close();
            }
          });
        }
      });
    } else {
      tablesCreated++;
      if (tablesCreated === totalTables) {
        db.close();
      }
    }
  });
});