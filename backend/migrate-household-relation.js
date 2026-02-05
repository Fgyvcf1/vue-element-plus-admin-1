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
    // 1. 创建临时表，修改household_id字段类型为VARCHAR(50)
    console.log('1. 创建临时表temp_residents，修改household_id字段类型...');
    db.run(`
      CREATE TABLE temp_residents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        household_id VARCHAR(50) NOT NULL,
        name VARCHAR(50) NOT NULL,
        gender VARCHAR(10) NOT NULL,
        date_of_birth DATE NOT NULL,
        id_card VARCHAR(18) NOT NULL,
        relationship_to_head VARCHAR(20) NOT NULL,
        ethnicity VARCHAR(20) NOT NULL,
        marital_status VARCHAR(20) NOT NULL,
        political_status VARCHAR(20) NOT NULL,
        military_service VARCHAR(20) NOT NULL,
        bank_card VARCHAR(30),
        bank_name VARCHAR(50),
        village_group VARCHAR(50) NOT NULL,
        education_level VARCHAR(20),
        occupation VARCHAR(50),
        phone_number VARCHAR(20),
        health_status VARCHAR(20),
        registered_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL,
        household_registration_status VARCHAR(20),
        migration_in_date DATE,
        migration_out_date DATE,
        death_date DATE,
        account_cancellation_date DATE,
        Home_address VARCHAR(255),
        household_head_id INTEGER,
        equity_shares REAL DEFAULT 0
      );
    `, (err) => {
      if (err) {
        console.error('创建临时表失败:', err.message);
        return;
      }
      console.log('临时表创建成功');

      // 2. 将原表数据插入到临时表
      console.log('2. 将原表数据插入到临时表...');
      db.run(`
        INSERT INTO temp_residents (
          id, household_id, name, gender, date_of_birth, id_card, relationship_to_head,
          ethnicity, marital_status, political_status, military_service, bank_card,
          bank_name, village_group, education_level, occupation, phone_number,
          health_status, registered_date, status, household_registration_status,
          migration_in_date, migration_out_date, death_date, account_cancellation_date,
          Home_address, household_head_id, equity_shares
        )
        SELECT 
          id, household_id, name, gender, date_of_birth, id_card, relationship_to_head,
          ethnicity, marital_status, political_status, military_service, bank_card,
          bank_name, village_group, education_level, occupation, phone_number,
          health_status, registered_date, status, household_registration_status,
          migration_in_date, migration_out_date, death_date, account_cancellation_date,
          Home_address, household_head_id, equity_shares
        FROM residents;
      `, (err) => {
        if (err) {
          console.error('数据迁移失败:', err.message);
          return;
        }
        console.log('数据迁移成功');

        // 3. 删除原表
        console.log('3. 删除原表residents...');
        db.run(`DROP TABLE residents;`, (err) => {
          if (err) {
            console.error('删除原表失败:', err.message);
            return;
          }
          console.log('原表删除成功');

          // 4. 将临时表重命名为原表名
          console.log('4. 将临时表重命名为residents...');
          db.run(`ALTER TABLE temp_residents RENAME TO residents;`, (err) => {
            if (err) {
              console.error('重命名表失败:', err.message);
              return;
            }
            console.log('表重命名成功');

            // 5. 创建索引（如果原表有索引）
            console.log('5. 创建索引...');
            db.run(`CREATE INDEX idx_residents_household_id ON residents(household_id);`, (err) => {
              if (err) {
                console.error('创建索引失败:', err.message);
                return;
              }
              console.log('索引创建成功');

              console.log('\n✅ 迁移完成！residents表的household_id字段类型已修改为VARCHAR(50)');
              db.close();
            });
          });
        });
      });
    });
  } catch (error) {
    console.error('迁移过程中发生错误:', error.message);
    db.close();
  }
});
