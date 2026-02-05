const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库路径
const dbPath = path.join(__dirname, '../../../../app.db');

console.log('正在初始化配置表...');
console.log('数据库路径:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
    process.exit(1);
  }
  console.log('数据库连接成功');
});

// 创建配置表
const createTableSQL = `
  CREATE TABLE IF NOT EXISTS system_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key TEXT UNIQUE NOT NULL,
    config_value TEXT,
    config_name TEXT NOT NULL,
    config_group TEXT DEFAULT 'system',
    value_type TEXT DEFAULT 'string',
    description TEXT,
    is_system INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_config_key ON system_config(config_key);
  CREATE INDEX IF NOT EXISTS idx_config_group ON system_config(config_group);
`;

// 默认配置数据
const defaultConfigs = [
  {
    key: 'birth_remind_days',
    value: '7',
    name: '生日提醒提前天数',
    group: 'notification',
    type: 'number',
    description: '生日提醒功能启动前多少天发送通知'
  },
  {
    key: 'birth_remind_enabled',
    value: '1',
    name: '生日提醒启用状态',
    group: 'notification',
    type: 'boolean',
    description: '是否启用生日提醒功能，1-启用，0-禁用'
  },
  {
    key: 'birth_remind_time',
    value: '09:00:00',
    name: '生日提醒发送时间',
    group: 'notification',
    type: 'time',
    description: '每天发送生日提醒的时间点'
  }
];

// 插入默认配置数据
const insertConfigSQL = `
  INSERT OR IGNORE INTO system_config
    (config_key, config_value, config_name, config_group, value_type, description, is_system)
  VALUES (?, ?, ?, ?, ?, ?, 1)
`;

// 执行初始化
db.serialize(() => {
  // 创建表和索引
  db.exec(createTableSQL, (err) => {
    if (err) {
      console.error('创建表失败:', err.message);
      db.close();
      process.exit(1);
    }
    console.log('✓ 配置表创建成功');
    
    // 插入默认配置
    let inserted = 0;
    
    defaultConfigs.forEach(config => {
      db.run(insertConfigSQL, [config.key, config.value, config.name, config.group, config.type, config.description], function(err) {
        if (err) {
          console.error(`插入配置 ${config.key} 失败:`, err.message);
        } else {
          inserted++;
          console.log(`✓ 配置项已插入: ${config.name} = ${config.value}`);
        }
        
        if (inserted === defaultConfigs.length) {
          console.log('\n========================================');
          console.log(`✓ 配置表初始化完成，共插入 ${inserted} 条默认配置`);
          console.log('========================================');
          db.close();
        }
      });
    });
  });
});

// 处理错误
db.on('error', (err) => {
  console.error('数据库错误:', err.message);
});
