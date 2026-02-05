const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接到SQLite数据库
const dbPath = path.join(__dirname, 'app.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('连接数据库失败:', err.message);
    process.exit(1);
  }
  console.log('成功连接到SQLite数据库\n');
});

// 全局索引定义
const indexes = [
  // ========== 居民表 (residents) ==========
  {
    table: 'residents',
    name: 'idx_residents_name',
    column: 'name',
    desc: '居民姓名索引 - 用于所有表单下拉查询'
  },
  {
    table: 'residents',
    name: 'idx_residents_id_card',
    column: 'id_card',
    desc: '居民身份证索引 - 用于快速查找和关联查询'
  },
  {
    table: 'residents',
    name: 'idx_residents_village_group',
    column: 'village_group',
    desc: '村组索引 - 用于按村组筛选'
  },
  {
    table: 'residents',
    name: 'idx_residents_status',
    column: 'status',
    desc: '居民状态索引 - 用于筛选正常/迁出/死亡状态'
  },
  {
    table: 'residents',
    name: 'idx_residents_household_id',
    column: 'household_id',
    desc: '户ID索引 - 用于户成员查询'
  },

  // ========== 调解员表 (mediators) ==========
  {
    table: 'mediators',
    name: 'idx_mediators_resident_id',
    column: 'resident_id',
    desc: '调解员居民ID索引 - 用于关联居民信息'
  },
  {
    table: 'mediators',
    name: 'idx_mediators_status',
    column: 'status',
    desc: '调解员状态索引 - 用于筛选激活/停用状态'
  },

  // ========== 调解记录表 (mediation_records) ==========
  {
    table: 'mediation_records',
    name: 'idx_mediation_records_applicant_id',
    column: 'applicant_id',
    desc: '申请人索引 - 用于查询申请人相关记录'
  },
  {
    table: 'mediation_records',
    name: 'idx_mediation_records_respondent_id',
    column: 'respondent_id',
    desc: '被申请人索引 - 用于查询被申请人相关记录'
  },
  {
    table: 'mediation_records',
    name: 'idx_mediation_records_mediator_id',
    column: 'mediator_id',
    desc: '调解员索引 - 用于查询调解员相关记录'
  },
  {
    table: 'mediation_records',
    name: 'idx_mediation_records_date',
    column: 'mediation_date',
    desc: '调解日期索引 - 用于按日期查询和统计'
  },

  // ========== 调解记录图片表 (mediation_record_images) ==========
  {
    table: 'mediation_record_images',
    name: 'idx_mediation_images_record_id',
    column: 'record_id',
    desc: '调解记录ID索引 - 用于查询某条记录的所有图片'
  },

  // ========== 调解记录-调解员关联表 (mediation_record_mediators) ==========
  {
    table: 'mediation_record_mediators',
    name: 'idx_mediators_rel_record_id',
    column: 'record_id',
    desc: '记录ID索引 - 用于查询某条记录的所有调解员'
  },
  {
    table: 'mediation_record_mediators',
    name: 'idx_mediators_rel_mediator_id',
    column: 'mediator_id',
    desc: '调解员ID索引 - 用于查询某调解员参与的所有记录'
  },

  // ========== 通知表 (notifications) ==========
  {
    table: 'notifications',
    name: 'idx_notifications_type',
    column: 'type',
    desc: '通知类型索引 - 用于按类型筛选'
  },
  {
    table: 'notifications',
    name: 'idx_notifications_status',
    column: 'status',
    desc: '通知状态索引 - 用于筛选草稿/已发送/已完成'
  },
  {
    table: 'notifications',
    name: 'idx_notifications_created_at',
    column: 'created_at',
    desc: '创建时间索引 - 用于按时间排序和查询'
  },

  // ========== 提醒规则表 (reminder_rules) ==========
  {
    table: 'reminder_rules',
    name: 'idx_reminder_rules_rule_type',
    column: 'rule_type',
    desc: '规则类型索引 - 用于按类型筛选(age/date/event)'
  },
  {
    table: 'reminder_rules',
    name: 'idx_reminder_rules_status',
    column: 'status',
    desc: '规则状态索引 - 用于筛选启用/禁用状态'
  },

  // ========== 低收入人员表 (low_income_persons) ==========
  {
    table: 'low_income_persons',
    name: 'idx_low_income_resident_id',
    column: 'resident_id',
    desc: '居民ID索引 - 用于关联居民信息'
  },
  {
    table: 'low_income_persons',
    name: 'idx_low_income_status',
    column: 'status',
    desc: '状态索引 - 用于筛选状态'
  },

  // ========== 残疾人表 (disabled_persons) ==========
  {
    table: 'disabled_persons',
    name: 'idx_disabled_resident_id',
    column: 'resident_id',
    desc: '居民ID索引 - 用于关联居民信息'
  },

  // ========== 班子成员表 (committee_members) - 新模块 ==========
  {
    table: 'committee_members',
    name: 'idx_committee_members_resident_id',
    column: 'resident_id',
    desc: '成员居民ID索引 - 用于关联居民信息和下拉查询'
  },
  {
    table: 'committee_members',
    name: 'idx_committee_members_org_type',
    column: 'organization_type',
    desc: '机构类型索引 - 用于按机构筛选(Tab切换)'
  },
  {
    table: 'committee_members',
    name: 'idx_committee_members_status',
    column: 'status',
    desc: '成员状态索引 - 用于筛选现任/历届'
  },
  {
    table: 'committee_members',
    name: 'idx_committee_members_term_start',
    column: 'term_start_date',
    desc: '任期开始索引 - 用于按任期查询和排序'
  }
];

// 创建所有索引
let createdCount = 0;
let skippedCount = 0;
let errorCount = 0;

console.log('========== 开始创建全局索引 ==========\n');

indexes.forEach((index, indexNum) => {
  // 检查表是否存在
  db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='${index.table}';`, (err, row) => {
    if (err) {
      console.error(`[错误] 检查表 ${index.table} 失败:`, err.message);
      errorCount++;
      return;
    }

    if (!row) {
      console.log(`[跳过] 表 ${index.table} 不存在，跳过索引创建`);
      skippedCount++;
      return;
    }

    // 创建索引
    const createIndexSql = `CREATE INDEX IF NOT EXISTS ${index.name} ON ${index.table}(${index.column});`;

    db.run(createIndexSql, (err) => {
      if (err) {
        console.error(`[错误] 创建索引失败 ${index.name}:`, err.message);
        errorCount++;
      } else {
        createdCount++;
        console.log(`[${createdCount + skippedCount + errorCount}/${indexes.length}] ✓ ${index.desc}`);
      }

      // 检查是否所有索引都处理完成
      if (createdCount + skippedCount + errorCount === indexes.length) {
        printSummary();
      }
    });
  });
});

// 打印汇总信息
function printSummary() {
  console.log('\n========== 索引创建完成 ==========');
  console.log(`总计: ${indexes.length} 个索引`);
  console.log(`成功: ${createdCount} 个`);
  console.log(`跳过: ${skippedCount} 个 (表不存在)`);
  console.log(`失败: ${errorCount} 个`);

  // 查询所有索引
  db.all("SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%';", (err, indexes) => {
    if (err) {
      console.error('\n查询索引列表失败:', err.message);
    } else {
      console.log(`\n当前数据库中存在的所有索引: ${indexes.length} 个`);
      indexes.forEach(idx => {
        console.log(`  - ${idx.name}`);
      });
    }

    db.close(() => {
      console.log('\n数据库连接已关闭');
    });
  });
}
