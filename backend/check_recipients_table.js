const db = require('./db');

console.log('=== 检查通知接收者相关表结构 ===');

// 检查表是否存在
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('查询表结构失败:', err.message);
    return;
  }
  
  console.log('数据库中的表:');
  tables.forEach(table => {
    console.log(`- ${table.name}`);
  });
  
  // 检查是否有通知接收者相关的表
  const hasRecipientsTable = tables.some(table => 
    table.name.includes('recipient') || table.name.includes('notification')
  );
  
  console.log(`\n是否存在通知接收者相关表: ${hasRecipientsTable}`);
  
  // 如果存在通知接收者表，查看其结构
  db.all("PRAGMA table_info(notification_recipients)", (err, columns) => {
    if (err) {
      console.error('查询notification_recipients表结构失败:', err.message);
    } else if (columns && columns.length > 0) {
      console.log('\nnotification_recipients表结构:');
      columns.forEach(col => {
        console.log(`- ${col.name} (${col.type})`);
      });
    } else {
      console.log('\nnotification_recipients表不存在');
    }
  });
});