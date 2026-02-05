const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// 连接到app.db数据库
const dbPath = path.join(__dirname, 'app.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('连接数据库失败:', err.message);
    process.exit(1);
  } else {
    console.log('成功连接到SQLite数据库');
  }
});

// 生成数据库结构报告
async function generateDbStructure() {
  try {
    // 获取所有表名
    const tables = await getTables();
    
    // 生成Markdown内容
    let markdown = '# 数据库结构表\n\n';
    markdown += `生成时间: ${new Date().toLocaleString()}\n\n`;
    markdown += `数据库文件: ${dbPath}\n\n`;
    markdown += `总表数: ${tables.length}\n\n`;
    
    // 遍历每个表，获取表结构
    for (const tableName of tables) {
      const tableInfo = await getTableInfo(tableName);
      const createStatement = await getCreateStatement(tableName);
      
      markdown += `## ${tableName}\n\n`;
      markdown += `### 创建语句\n\n`;
      markdown += `\`\`sql\n${createStatement}\n\`\`\n\n`;
      
      markdown += `### 字段列表\n\n`;
      markdown += `| 字段名 | 英文描述 | 类型 | 非空 | 主键 |\n`;
      markdown += `|-------|---------|------|------|------|\n`;
      
      tableInfo.forEach(col => {
        const fieldName = col.name;
        const englishDesc = getEnglishDescription(fieldName);
        const type = col.type;
        const notnull = col.notnull ? '是' : '否';
        const pk = col.pk ? '是' : '否';
        
        markdown += `| ${fieldName} | ${englishDesc} | ${type} | ${notnull} | ${pk} |\n`;
      });
      
      markdown += `\n`;
    }
    
    // 保存到文件，输出到根目录
    const outputPath = path.join(__dirname, '..', 'database-structure.md');
    fs.writeFileSync(outputPath, markdown, 'utf8');
    console.log(`数据库结构表已生成: ${outputPath}`);
    
  } catch (err) {
    console.error('生成数据库结构失败:', err.message);
    process.exit(1);
  } finally {
    db.close();
  }
}

// 获取所有表名
function getTables() {
  return new Promise((resolve, reject) => {
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name", (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows.map(row => row.name));
    });
  });
}

// 获取表结构
function getTableInfo(tableName) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

// 获取表的创建语句
function getCreateStatement(tableName) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${tableName}'`, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row.sql);
    });
  });
}

// 获取字段的英文描述（根据字段名生成）
function getEnglishDescription(fieldName) {
  const descMap = {
    // 通用字段
    id: 'ID',
    created_at: 'Created At',
    updated_at: 'Updated At',
    status: 'Status',
    name: 'Name',
    
    // 居民相关字段
    resident_id: 'Resident ID',
    id_card: 'ID Card',
    gender: 'Gender',
    date_of_birth: 'Date of Birth',
    village_group: 'Village Group',
    bank_card: 'Bank Card',
    phone_number: 'Phone Number',
    bank_name: 'Bank Name',
    ethnicity: 'Ethnicity',
    relationship_to_head: 'Relationship to Head',
    marital_status: 'Marital Status',
    political_status: 'Political Status',
    military_service: 'Military Service',
    education_level: 'Education Level',
    registered_date: 'Registered Date',
    household_id: 'Household ID',
    household_head_id: 'Household Head ID',
    home_address: 'Home Address',
    registered_permanent_residence: 'Registered Permanent Residence',
    
    // 家庭相关字段
    household_number: 'Household Number',
    household_head_name: 'Household Head Name',
    household_head_id_card: 'Household Head ID Card',
    household_type: 'Household Type',
    housing_type: 'Housing Type',
    address: 'Address',
    
    // 残疾人相关字段
    disability_type: 'Disability Type',
    disability_level: 'Disability Level',
    certificate_number: 'Certificate Number',
    issue_date: 'Issue Date',
    validity_period: 'Validity Period',
    
    // 低收入人群相关字段
    low_income_type: 'Low Income Type',
    apply_date: 'Apply Date',
    approval_date: 'Approval Date',
    
    // 政策记录相关字段
    low_income_person_id: 'Low Income Person ID',
    policy_type: 'Policy Type',
    has_subsidy: 'Has Subsidy',
    start_date: 'Start Date',
    end_date: 'End Date',
    subsidy_amount: 'Subsidy Amount',
    subsidy_cycle: 'Subsidy Cycle',
    account_name: 'Account Name',
    account_relationship: 'Account Relationship',
    
    // 字典相关字段
    category: 'Category',
    value: 'Value',
    display_order: 'Display Order',
    
    // 版本控制
    version_num: 'Version Number'
  };
  
  return descMap[fieldName] || fieldName;
}

// 执行生成
generateDbStructure();
