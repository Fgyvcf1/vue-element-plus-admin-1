const db = require('./db');

const positions = [
  // 支部委员会
  { org: 'branch_committee', position: '书记', category: '支部委员会职务' },
  { org: 'branch_committee', position: '副书记', category: '支部委员会职务' },
  { org: 'branch_committee', position: '委员', category: '支部委员会职务' },
  // 村民委员会
  { org: 'villager_committee', position: '主任', category: '村民委员会职务' },
  { org: 'villager_committee', position: '副主任', category: '村民委员会职务' },
  { org: 'villager_committee', position: '委员', category: '村民委员会职务' },
  // 集体经济组织理事会
  { org: 'collective_council', position: '理事长', category: '理事会职务' },
  { org: 'collective_council', position: '副理事长', category: '理事会职务' },
  { org: 'collective_council', position: '理事', category: '理事会职务' },
  // 集体经济组织监事会
  { org: 'collective_supervisors', position: '监事长', category: '监事会职务' },
  { org: 'collective_supervisors', position: '监事', category: '监事会职务' },
  // 村务监督委员会
  { org: 'village_supervisors', position: '主任', category: '村监委职务' },
  { org: 'village_supervisors', position: '委员', category: '村监委职务' },
  // 村民小组长
  { org: 'village_group_leader', position: '村民小组长', category: '小组长职务' },
  // 村民代表
  { org: 'village_representative', position: '村民代表', category: '代表职务' },
  // 青年团妇组织
  { org: 'youth_women', position: '团委书记', category: '团妇组织职务' },
  { org: 'youth_women', position: '妇联主任', category: '团妇组织职务' }
];

console.log('开始插入职务字典数据...');

const insertSql = `INSERT OR IGNORE INTO dictionaries (category, value, display_order, status, created_at) VALUES (?, ?, ?, 'active', CURRENT_TIMESTAMP)`;
let count = 0;
let successCount = 0;

positions.forEach((pos, index) => {
  db.run(insertSql, [pos.category, pos.position, index + 1], function(err) {
    if (err) {
      console.error(`插入职务 ${pos.position} 失败:`, err.message);
    } else {
      successCount++;
      console.log(`✓ ${pos.category}: ${pos.position}`);
    }
    count++;
    if (count === positions.length) {
      console.log(`\n职务字典插入完成，共 ${positions.length} 条，成功 ${successCount} 条`);
      db.close();
    }
  });
});
