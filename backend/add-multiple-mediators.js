const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./app.db');

console.log('开始添加多调解员支持...\n');

// 创建调解记录-调解员关联表
const createMediationMediatorsTable = `
CREATE TABLE IF NOT EXISTS mediation_record_mediators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mediation_record_id INTEGER NOT NULL,
    mediator_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mediation_record_id) REFERENCES mediation_records(id) ON DELETE CASCADE,
    FOREIGN KEY (mediator_id) REFERENCES mediators(id),
    UNIQUE(mediation_record_id, mediator_id)
)
`;

db.run(createMediationMediatorsTable, (err) => {
  if (err) {
    console.error('❌ 创建调解记录-调解员关联表失败:', err.message);
  } else {
    console.log('✅ 调解记录-调解员关联表创建成功');
  }

  // 检查mediation_records表是否有mediator_id字段
  db.all("PRAGMA table_info(mediation_records)", (err, columns) => {
    if (err) {
      console.error('❌ 检查表结构失败:', err.message);
      db.close();
      return;
    }

    const hasMediatorId = columns.some(col => col.name === 'mediator_id');
    console.log(`\nmediation_records表${hasMediatorId ? '有' : '没有'}mediator_id字段`);

    db.close();
  });
});
