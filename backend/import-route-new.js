// Excel导入API - 优化后的批量导入逻辑
const express = require('express');
const router = express.Router();
const db = require('./db');

// 将db的回调函数转换为Promise
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

// 生成户主ID的辅助函数
const generateHouseholdId = async (villageGroup, idCard) => {
  // 1. 生成基础户主ID：村组名字首个字母大写 + 身份证后6位
  // 提取村组名称的前两个字的首字母大写
  let groupCode = '';
  if (villageGroup && villageGroup.length > 0) {
    // 简单的中文首字母提取函数
    const getChineseFirstLetter = (char) => {
      const unicode = char.charCodeAt(0);
      // 常用汉字拼音首字母映射表（简化版）
      const pinyinMap = {
        '大': 'D', '车': 'C', '组': 'Z', '村': 'C', '庄': 'Z', '乡': 'X', '镇': 'Z',
        '街': 'J', '道': 'D', '区': 'Q', '县': 'X', '市': 'S', '省': 'S', '国': 'G',
        '家': 'J', '李': 'L', '张': 'Z', '王': 'W', '刘': 'L', '陈': 'C', '杨': 'Y',
        '赵': 'Z', '黄': 'H', '周': 'Z', '吴': 'W', '徐': 'X', '孙': 'S', '胡': 'H',
        '朱': 'Z', '高': 'G', '林': 'L', '何': 'H', '郭': 'G', '马': 'M', '罗': 'L',
        '梁': 'L', '宋': 'S', '郑': 'Z', '谢': 'X', '韩': 'H', '唐': 'T', '冯': 'F',
        '于': 'Y', '董': 'D', '萧': 'X', '程': 'C', '曹': 'C', '袁': 'Y', '邓': 'D',
        '许': 'X', '傅': 'F', '沈': 'S', '曾': 'Z', '彭': 'P', '吕': 'L', '苏': 'S',
        '卢': 'L', '蒋': 'J', '蔡': 'C', '贾': 'J', '丁': 'D', '魏': 'W', '薛': 'X',
        '叶': 'Y', '阎': 'Y', '余': 'Y', '潘': 'P', '杜': 'D', '戴': 'D', '夏': 'X',
        '钟': 'Z', '汪': 'W', '田': 'T', '任': 'R', '姜': 'J', '范': 'F', '方': 'F',
        '石': 'S', '姚': 'Y', '谭': 'T', '廖': 'L', '邹': 'Z', '熊': 'X', '金': 'J',
        '陆': 'L', '郝': 'H', '孔': 'K', '白': 'B', '崔': 'C', '康': 'K', '毛': 'M',
        '邱': 'Q', '秦': 'Q', '江': 'J', '史': 'S', '顾': 'G', '侯': 'H', '邵': 'S',
        '孟': 'M', '龙': 'L', '万': 'W', '段': 'D', '漕': 'C', '钱': 'Q', '汤': 'T',
        '尹': 'Y', '黎': 'L', '易': 'Y', '常': 'C', '武': 'W', '乔': 'Q', '贺': 'H',
        '赖': 'L', '龚': 'G', '文': 'W'
      };
      
      // 先检查是否在映射表中
      if (pinyinMap[char]) {
        return pinyinMap[char];
      }
      
      // 如果不在映射表中，返回空字符串或默认值
      return '';
    };
    
    // 提取前两个字的首字母
    const chars = villageGroup.split('');
    let initials = '';
    for (let i = 0; i < chars.length && initials.length < 2; i++) {
      const initial = getChineseFirstLetter(chars[i]);
      if (initial) {
        initials += initial;
      }
    }
    
    groupCode = initials || 'UNKNOWN';
  } else {
    groupCode = 'UNKNOWN';
  }
  
  // 提取身份证后6位
  const idCardSuffix = idCard.substring(idCard.length - 6);
  
  let baseHouseholdId = `${groupCode}${idCardSuffix}`;
  
  // 2. 检查是否已存在，如果存在则自动加1
  const checkSql = `SELECT household_number FROM households WHERE household_number LIKE ?`;
  const rows = await dbAll(checkSql, [`${baseHouseholdId}%`]);
  
  if (rows.length === 0) {
    // 不存在相同的，直接返回基础ID
    return baseHouseholdId;
  }
  
  // 存在相同的，找到最大的后缀数字并加1
  let maxSuffix = 0;
  
  rows.forEach(row => {
    const existingId = row.household_number;
    if (existingId === baseHouseholdId) {
      // 完全相同，后缀为0
      maxSuffix = Math.max(maxSuffix, 0);
    } else if (existingId.startsWith(baseHouseholdId)) {
      // 以基础ID开头，提取后缀数字
      const suffix = existingId.substring(baseHouseholdId.length);
      const suffixNum = parseInt(suffix);
      if (!isNaN(suffixNum)) {
        maxSuffix = Math.max(maxSuffix, suffixNum);
      }
    }
  });
  
  // 生成新的户主ID
  const newHouseholdId = maxSuffix === 0 ? `${baseHouseholdId}1` : `${baseHouseholdId}${maxSuffix + 1}`;
  return newHouseholdId;
};

// 批量插入数据的辅助函数
const bulkInsert = async (table, columns, valuesList) => {
  if (valuesList.length === 0) return [];
  
  // 对于SQLite，需要逐个插入以获取正确的ID
  const insertedIds = [];
  for (const values of valuesList) {
    const placeholders = values.map(() => '?').join(',');
    const sql = `INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`;
    const result = await dbRun(sql, values);
    insertedIds.push(result.lastID);
  }
  
  return insertedIds;
};

router.post('/import-residents', async (req, res) => {
  // 减少日志输出，只保留关键信息
  console.log('========================================');
  console.log('收到居民数据导入请求');
  console.log('请求体:', JSON.stringify(req.body, null, 2).substring(0, 500));
  console.log('总行数:', req.body.data?.length);

  const { headers, data, mapping } = req.body;

  if (!headers || !data || !mapping) {
    console.error('缺少必要的导入数据');
    return res.status(400).json({ code: 400, message: '缺少必要的导入数据' });
  }

  try {
    // 快速解析和验证数据
    const parseErrors = [];
    const allRows = []; // 所有行数据
    const currentDate = new Date().toISOString().split('T')[0];

    // 第一阶段：快速解析数据
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex];
      const rowData = {
        rowIndex: rowIndex + 2,
        name: '',
        idCard: '',
        gender: '',
        dateOfBirth: '',
        villageGroup: '',
        address: '',
        phoneNumber: '',
        bankCard: '',
        bankName: '',
        ethnicity: '',
        relationshipToHead: '',
        maritalStatus: '',
        politicalStatus: '',
        militaryService: '',
        educationLevel: '',
        householdHeadName: '',
        householdType: '',
        housingType: ''
      };

      // 映射字段
      for (let mapIndex = 0; mapIndex < mapping.length; mapIndex++) {
        const mapItem = mapping[mapIndex];
        if (mapItem.dbField) {
          const value = row[mapIndex];
          if (value !== undefined && value !== null && value !== '') {
            switch (mapItem.dbField) {
              case 'name':
                rowData.name = value;
                break;
              case 'id_card':
                rowData.idCard = value;
                break;
              case 'gender':
                rowData.gender = value;
                break;
              case 'date_of_birth':
                rowData.dateOfBirth = value;
                break;
              case 'village_group':
                rowData.villageGroup = value;
                break;
              case 'address':
                rowData.address = value;
                break;
              case 'phone_number':
                rowData.phoneNumber = value;
                break;
              case 'bank_card':
                rowData.bankCard = value;
                break;
              case 'bank_name':
                rowData.bankName = value;
                break;
              case 'ethnicity':
                rowData.ethnicity = value;
                break;
              case 'relationship_to_head':
                rowData.relationshipToHead = value;
                break;
              case 'marital_status':
                rowData.maritalStatus = value;
                break;
              case 'political_status':
                rowData.politicalStatus = value;
                break;
              case 'military_service':
                rowData.militaryService = value;
                break;
              case 'education_level':
                rowData.educationLevel = value;
                break;
              case 'household_head_name':
                rowData.householdHeadName = value;
                break;
              case 'householdType':
                rowData.householdType = value;
                break;
              case 'housingType':
                rowData.housingType = value;
                break;
            }
          }
        }
      }

      // 验证必要字段
      if (!rowData.name || !rowData.idCard) {
        parseErrors.push(`第${rowIndex + 2}行: 缺少姓名或身份证号`);
        continue;
      }

      // 设置默认值
      if (!rowData.householdHeadName) {
        rowData.householdHeadName = rowData.name; // 默认为本人
      }
      if (!rowData.relationshipToHead) {
        rowData.relationshipToHead = '其他';
      }
      if (!rowData.villageGroup) {
        rowData.villageGroup = '未知';
      }

      allRows.push(rowData);
    }

    // 只输出关键统计信息
    console.log('数据解析完成 - 总行数:', allRows.length, '人, 错误:', parseErrors.length, '个');

    if (parseErrors.length > 0) {
      return res.status(400).json({
        code: 400,
        message: `导入失败，共发现${parseErrors.length}条数据格式错误`,
        data: {
          successCount: 0,
          errorCount: parseErrors.length,
          errors: parseErrors.slice(0, 20)
        }
      });
    }

    // 开始事务
    await dbRun('BEGIN TRANSACTION');
    
    let successCount = 0;
    const householdNumberMap = new Map(); // 家庭唯一标识 -> household_number，使用 "户主姓名 + 地址" 作为key
    
    // 预检查所有身份证号，避免重复处理
    const allIdCards = allRows.map(row => row.idCard);
    const existingResidents = await dbAll(`SELECT id, id_card, household_id FROM residents WHERE id_card IN (${allIdCards.map(() => '?').join(',')})`, allIdCards);
    const existingIdCardMap = new Map(existingResidents.map(r => [r.id_card, r]));
    
    console.log('预检查完成，已存在的居民:', existingIdCardMap.size, '人');

    // 处理所有行数据
    for (const rowData of allRows) {
      const { 
        name, idCard, gender, dateOfBirth, villageGroup, address, phoneNumber, 
        bankCard, bankName, ethnicity, relationshipToHead, maritalStatus, 
        politicalStatus, militaryService, educationLevel, householdHeadName, 
        householdType, housingType 
      } = rowData;

      // 跳过已存在的居民
      if (existingIdCardMap.has(idCard)) {
        console.log(`跳过已存在的居民: ${name} (${idCard})`);
        successCount++;
        continue;
      }

      // 生成家庭唯一标识：户主姓名 + 地址
      const householdKey = `${householdHeadName}${address}`;
      
      let householdNumber;
      
      // 检查是否已处理过该家庭
      if (householdNumberMap.has(householdKey)) {
        // 已存在，直接使用
        householdNumber = householdNumberMap.get(householdKey);
        console.log(`使用已存在的家庭编号: ${householdKey} -> ${householdNumber}`);
      } else {
        // 检查数据库中是否已存在该家庭
        const checkHouseholdSql = `SELECT household_number FROM households WHERE household_head_name = ? AND address = ?`;
        const existingHousehold = await dbGet(checkHouseholdSql, [householdHeadName, address]);
        
        if (existingHousehold) {
          // 数据库中已存在，使用现有household_number
          householdNumber = existingHousehold.household_number;
          console.log(`数据库中已存在家庭: ${householdKey} -> ${householdNumber}`);
        } else {
          // 数据库中不存在，创建新家庭
          console.log(`创建新家庭: ${householdKey}`);
          
          // 生成户主ID
          let generatedHouseholdNumber;
          if (relationshipToHead === '本人') {
            // 如果是户主，使用自己的身份证生成
            generatedHouseholdNumber = await generateHouseholdId(villageGroup, idCard);
          } else {
            // 如果不是户主，使用默认方式生成
            generatedHouseholdNumber = await generateHouseholdId(villageGroup, '000000000000000000');
          }
          
          // 插入家庭数据
          const householdColumns = ['household_number', 'household_head_name', 'village_group', 'address', 'phone_number', 'ethnicity', 'gender', 'status', 'registered_date', 'household_type', 'housing_type'];
          const householdValues = [
            generatedHouseholdNumber,
            householdHeadName,
            villageGroup,
            address,
            phoneNumber || '',
            ethnicity || '汉族',
            gender || '',
            'active',
            currentDate,
            householdType || '',
            housingType || ''
          ];
          
          await dbRun(`INSERT INTO households (${householdColumns.join(',')}) VALUES (${householdValues.map(() => '?').join(',')})`, householdValues);
          householdNumber = generatedHouseholdNumber;
          console.log(`创建新家庭成功: ${householdKey} -> ${householdNumber}`);
        }
        
        // 添加到家庭编号映射
        householdNumberMap.set(householdKey, householdNumber);
      }

      // 插入居民数据
      const residentColumns = ['household_id', 'name', 'gender', 'date_of_birth', 'id_card', 'relationship_to_head', 'ethnicity', 'marital_status', 'political_status', 'military_service', 'bank_card', 'bank_name', 'village_group', 'education_level', 'phone_number', 'registered_date', 'status', 'Home_address', 'equity_shares'];
      const residentValues = [
        householdNumber, // 使用household_number作为household_id
        name,
        gender || '',
        dateOfBirth || '',
        idCard,
        relationshipToHead,
        ethnicity || '汉族',
        maritalStatus || '未婚',
        politicalStatus || '群众',
        militaryService || '未服兵役',
        bankCard || '',
        bankName || '',
        villageGroup,
        educationLevel || '',
        phoneNumber || '',
        currentDate,
        'active',
        address || '',
        0
      ];
      
      await dbRun(`INSERT INTO residents (${residentColumns.join(',')}) VALUES (${residentValues.map(() => '?').join(',')})`, residentValues);
      successCount++;
      console.log(`插入居民成功: ${name} (${idCard}) -> 家庭编号: ${householdNumber}`);
    }

    // 提交事务
    await dbRun('COMMIT');

    console.log('导入完成，总成功:', successCount, '人');

    res.json({
      code: 20000,
      message: `导入成功，共处理${data.length}条数据，成功${successCount}条`,
      data: {
        successCount,
        errorCount: 0
      }
    });
  } catch (error) {
    // 回滚事务
    await dbRun('ROLLBACK').catch(err => console.error('回滚事务失败:', err.message));
    
    console.error('导入失败:', error.message);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({
      code: 500,
      message: `导入失败: ${error.message}`,
      data: {
        successCount: 0,
        errorCount: 1,
        errors: [error.message]
      }
    });
  } finally {
    // 关闭数据库连接
    db.close();
  }
});

module.exports = router;
