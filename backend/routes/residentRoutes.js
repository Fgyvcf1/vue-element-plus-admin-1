const express = require('express');
const router = express.Router();
const db = require('../db');

// 获取当前本地时间（北京时间）的辅助函数
function getLocalTime() {
  const now = new Date();
  // 使用toISOString()获取UTC时间，然后手动调整时区
  const timezoneOffset = now.getTimezoneOffset() * 60000; // 转换为毫秒
  const localDate = new Date(now.getTime() - timezoneOffset);
  return localDate.toISOString().slice(0, 19).replace('T', ' ');
}

// 生成户主ID的辅助函数
function generateHouseholdId(villageGroup, idCard) {
  return new Promise((resolve, reject) => {
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
    
    db.all(checkSql, [`${baseHouseholdId}%`], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (rows.length === 0) {
        // 不存在相同的，直接返回基础ID
        resolve(baseHouseholdId);
        return;
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
      resolve(newHouseholdId);
    });
  });
}

// 居民信息API - 从真实数据库获取数据
router.get('/residents', (req, res) => {
  console.log('收到/residents请求，查询参数:', req.query);
  
  // 构建SQL查询 - 关联households表获取家庭地址和户主信息
  let sql = `SELECT 
              r.id, 
              r.name, 
              r.id_card AS idCard, 
              r.gender,
              r.ethnicity,
              r.date_of_birth AS dateOfBirth, 
              YEAR(CURDATE()) - YEAR(r.date_of_birth) AS age, 
              r.village_group AS villageGroup, 
              h.address, 
              r.bank_card AS bankCard, 
              r.phone_number AS phoneNumber, 
              r.household_id,
              h.household_head_name,
              r.relationship_to_head,
              h.household_number,
              r.status,
              r.equity_shares,
              r.occupation
            FROM residents r
            LEFT JOIN households h ON r.household_id = h.household_number
            WHERE h.status = 'active'`;
  
  // 接收所有查询参数
  console.log('收到/residents请求，查询参数:', req.query);
  
  // 添加查询条件
  const params = [];
  
  // 添加居民状态筛选
  if (req.query.status) {
    sql += ` AND r.status = ?`;
    params.push(req.query.status);
  } else {
    // 默认查询active状态的居民
    sql += ` AND r.status = 'active'`;
  }
  
  // 支持keyword参数，同时搜索姓名和身份证号（优先级最高）
  if (req.query.keyword && req.query.keyword.trim() !== '') {
    console.log('执行关键字搜索:', req.query.keyword);
    sql += ` AND (r.name LIKE ? OR r.id_card LIKE ?)`;
    params.push(`%${req.query.keyword.trim()}%`, `%${req.query.keyword.trim()}%`);
  } else {
    // 如果没有keyword，才检查其他单独的参数
    if (req.query.name) {
      sql += ` AND r.name LIKE ?`;
      params.push(`%${req.query.name}%`);
    }
    if (req.query.idCard) {
      sql += ` AND r.id_card LIKE ?`;
      params.push(`%${req.query.idCard}%`);
    }
  }
  
  if (req.query.gender) {
    sql += ` AND r.gender = ?`;
    params.push(req.query.gender);
  }
  if (req.query.villageGroup && req.query.villageGroup.trim() !== '') {
    sql += ` AND r.village_group = ?`;
    params.push(req.query.villageGroup);
  }
  if (req.query.birthYear) {
    sql += ` AND YEAR(r.date_of_birth) = ?`;
    params.push(req.query.birthYear);
  }
  if (req.query.phoneNumber) {
    sql += ` AND r.phone_number LIKE ?`;
    params.push(`%${req.query.phoneNumber}%`);
  }
  if (req.query.household_id) {
    sql += ` AND r.household_id = ?`;
    params.push(req.query.household_id);
  }
  if (req.query.isHouseholdHead !== undefined) {
    if (req.query.isHouseholdHead === 'true' || req.query.isHouseholdHead === true) {
      sql += ` AND (r.relationship_to_head = '本人' OR r.relationship_to_head = '户主')`;
    } else if (req.query.isHouseholdHead === 'false' || req.query.isHouseholdHead === false) {
      sql += ` AND r.relationship_to_head != '本人' AND r.relationship_to_head != '户主'`;
    }
  }

  // 特殊处理户主姓名查询（支持 householdHeadName 和 householderName 两种参数名）
  const householdHeadName = req.query.householdHeadName || req.query.householderName;
  if (householdHeadName) {
    // 先查询对应家庭的household_number
    const householdsSql = `SELECT household_number FROM households WHERE household_head_name LIKE ? AND status = 'active'`;
    db.all(householdsSql, [`%${householdHeadName}%`], (householdErr, households) => {
      if (householdErr) {
        console.error('查询家庭失败:', householdErr.message);
        res.status(500).json({ code: 500, message: '查询居民数据失败' });
        return;
      }
      
      if (households.length > 0) {
          // 有匹配的家庭，查询这些家庭的所有居民
          const householdNumbers = households.map(h => h.household_number);
          const numbersPlaceholders = householdNumbers.map(() => '?').join(',');
          const finalSql = `${sql} AND r.household_id IN (${numbersPlaceholders})`;
          const finalParams = [...params, ...householdNumbers];
        
        // 执行完整查询获取所有数据
        db.all(finalSql, finalParams, (allErr, allResidents) => {
          if (allErr) {
            console.error('查询所有居民数据失败:', allErr.message);
            res.status(500).json({ code: 500, message: '查询居民数据失败' });
            return;
          }
          
          // 计算总人数和总户数
          const totalPersons = allResidents.length;
          const uniqueHouseholdIds = new Set(allResidents.map(resident => resident.household_id).filter(Boolean));
          const totalHouseholds = uniqueHouseholdIds.size;
          
          // 获取分页数据
          const pageNum = parseInt(req.query.pageNum) || 1;
          const pageSize = parseInt(req.query.pageSize) || 10;
          const offset = (pageNum - 1) * pageSize;
          const pageResidents = allResidents.slice(offset, offset + pageSize);
          
          // 返回结果
          res.json({
            code: 20000,
            data: pageResidents,
            total: totalPersons,
            totalHouseholds: totalHouseholds,
            totalPersons: totalPersons
          });
        });
      } else {
        // 没有匹配的家庭，返回空结果
        res.json({
          code: 20000,
          data: [],
          total: 0,
          totalHouseholds: 0,
          totalPersons: 0
        });
      }
    });
    return;
  }
  
  // 执行完整查询获取所有数据
  db.all(sql, params, (allErr, allResidents) => {
    if (allErr) {
      console.error('查询所有居民数据失败:', allErr.message);
      res.status(500).json({ code: 500, message: '查询居民数据失败' });
      return;
    }
    
    // 计算总人数和总户数
    const totalPersons = allResidents.length;
    const uniqueHouseholdIds = new Set(allResidents.map(resident => resident.household_id).filter(Boolean));
    const totalHouseholds = uniqueHouseholdIds.size;
    
    // 获取分页数据
    const pageNum = parseInt(req.query.pageNum) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (pageNum - 1) * pageSize;
    const pageResidents = allResidents.slice(offset, offset + pageSize);
    
    // 返回结果
    res.json({
      code: 20000,
      data: pageResidents,
      total: totalPersons,
      totalHouseholds: totalHouseholds,
      totalPersons: totalPersons
    });
  });
});

// 独立成户 API - 必须放在 /residents/:id 之前，避免被拦截
router.post('/residents/:id/split-household', async (req, res) => {
  const { id } = req.params;
  const { keepAddress = true, keepVillageGroup = true } = req.body;

  console.log('收到独立成户请求:', { residentId: id, keepAddress, keepVillageGroup });

  try {
    // 开启事务
    await new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 1. 查询当前居民信息
    const resident = await new Promise((resolve, reject) => {
      db.get(
        `SELECT r.*, h.address as household_address, h.village_group as household_village_group
         FROM residents r
         LEFT JOIN households h ON r.household_id = h.household_number
         WHERE r.id = ? AND r.status = 'active'`,
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!resident) {
      await new Promise((resolve) => db.run('ROLLBACK', resolve));
      return res.status(404).json({ code: 404, message: '未找到居民信息' });
    }

    // 检查是否是户主
    if (resident.relationship_to_head === '本人' || resident.relationship_to_head === '户主') {
      await new Promise((resolve) => db.run('ROLLBACK', resolve));
      return res.status(400).json({ code: 400, message: '户主不能独立成户，请先更换户主' });
    }

    const oldHouseholdId = resident.household_id;

    // 2. 生成新的户编号
    const villageGroup = keepVillageGroup ? resident.household_village_group || resident.village_group : resident.village_group;
    const idCardSuffix = resident.id_card ? resident.id_card.slice(-6) : '000000';
    
    // 获取村组首字母
    let groupCode = 'XX';
    if (villageGroup) {
      const pinyinMap = {
        '一': 'Y', '二': 'E', '三': 'S', '四': 'S', '五': 'W',
        '六': 'L', '七': 'Q', '八': 'B', '九': 'J', '十': 'S',
        '大': 'D', '小': 'X', '前': 'Q', '后': 'H', '东': 'D',
        '西': 'X', '南': 'N', '北': 'B', '中': 'Z', '山': 'S',
        '河': 'H', '村': 'C', '庄': 'Z', '镇': 'Z', '乡': 'X'
      };
      const firstChar = villageGroup.charAt(0);
      const secondChar = villageGroup.charAt(1);
      groupCode = (pinyinMap[firstChar] || firstChar) + (pinyinMap[secondChar] || secondChar);
    }
    
    let newHouseholdNumber = `${groupCode}${idCardSuffix}`;
    
    // 检查户编号是否已存在，如果存在则添加后缀
    const checkHouseholdNumber = async (number, suffix = 0) => {
      const checkNumber = suffix === 0 ? number : `${number}-${suffix}`;
      const exists = await new Promise((resolve, reject) => {
        db.get('SELECT 1 FROM households WHERE household_number = ?', [checkNumber], (err, row) => {
          if (err) reject(err);
          else resolve(!!row);
        });
      });
      if (exists) {
        return checkHouseholdNumber(number, suffix + 1);
      }
      return checkNumber;
    };

    newHouseholdNumber = await checkHouseholdNumber(newHouseholdNumber);

    // 3. 创建新的 households 记录
    const address = keepAddress ? resident.household_address || resident.Home_address : resident.Home_address;
    const registeredDate = new Date().toISOString().split('T')[0]; // 当前日期
    
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO households (
          household_number, household_head_name, household_head_id_card,
          village_group, address, gender, ethnicity,
          household_type, housing_type, status, registered_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, '农业户口', '自有住房', 'active', ?)`,
        [
          newHouseholdNumber,
          resident.name,
          resident.id_card,
          villageGroup,
          address,
          resident.gender,
          resident.ethnicity,
          registeredDate
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // 4. 更新居民信息
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE residents SET
          household_id = ?,
          household_head_id = ?,
          relationship_to_head = '本人',
          Home_address = ?,
          village_group = ?
         WHERE id = ?`,
        [newHouseholdNumber, id, address, villageGroup, id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // 提交事务
    await new Promise((resolve, reject) => {
      db.run('COMMIT', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('独立成户成功:', { residentId: id, newHouseholdNumber });

    res.json({
      code: 20000,
      success: true,
      message: '独立成户成功',
      data: {
        newHouseholdNumber,
        residentName: resident.name
      }
    });

  } catch (error) {
    console.error('独立成户失败:', error);
    await new Promise((resolve) => db.run('ROLLBACK', resolve));
    res.status(500).json({ code: 500, message: '独立成户失败: ' + error.message });
  }
});

// 跨户迁移 API - 将居民迁移到另一个家庭
router.post('/residents/:id/migrate-household', async (req, res) => {
  const { id } = req.params;
  const { targetHouseholdNumber, targetHouseholdHeadId, relationshipToHead } = req.body;

  console.log('收到跨户迁移请求:', { 
    residentId: id, 
    targetHouseholdNumber, 
    targetHouseholdHeadId, 
    relationshipToHead 
  });

  if (!targetHouseholdNumber || !targetHouseholdHeadId || !relationshipToHead) {
    return res.status(400).json({ 
      code: 400, 
      message: '缺少必要参数：目标家庭编号、目标户主ID或与户主关系' 
    });
  }

  try {
    // 开启事务
    await new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 1. 查询当前居民信息
    const resident = await new Promise((resolve, reject) => {
      db.get(
        `SELECT r.*, h.address as household_address, h.village_group as household_village_group
         FROM residents r
         LEFT JOIN households h ON r.household_id = h.household_number
         WHERE r.id = ? AND r.status = 'active'`,
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!resident) {
      await new Promise((resolve) => db.run('ROLLBACK', resolve));
      return res.status(404).json({ code: 404, message: '未找到居民信息' });
    }

    // 检查是否是户主
    if (resident.relationship_to_head === '本人' || resident.relationship_to_head === '户主') {
      await new Promise((resolve) => db.run('ROLLBACK', resolve));
      return res.status(400).json({ code: 400, message: '户主不能跨户迁移，请先更换户主' });
    }

    // 2. 查询目标家庭信息
    const targetHousehold = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM households WHERE household_number = ? AND status = 'active'`,
        [targetHouseholdNumber],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!targetHousehold) {
      await new Promise((resolve) => db.run('ROLLBACK', resolve));
      return res.status(404).json({ code: 404, message: '目标家庭不存在' });
    }

    // 3. 更新居民信息 - 迁移到目标家庭
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE residents SET
          household_id = ?,
          household_head_id = ?,
          relationship_to_head = ?,
          Home_address = ?,
          village_group = ?
         WHERE id = ?`,
        [
          targetHouseholdNumber,
          targetHouseholdHeadId,
          relationshipToHead,
          targetHousehold.address || resident.Home_address,
          targetHousehold.village_group || resident.village_group,
          id
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // 4. 记录迁移日志（可选）
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO household_change_log (
          resident_id, change_type, change_date, change_reason, 
          previous_status, new_status, operator
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          'migration_in',
          new Date().toISOString().split('T')[0],
          `从家庭 ${resident.household_id} 迁移到家庭 ${targetHouseholdNumber}`,
          resident.household_id,
          targetHouseholdNumber,
          'system'
        ],
        (err) => {
          if (err) {
            console.error('记录迁移日志失败:', err.message);
            // 日志记录失败不影响主流程
          }
          resolve();
        }
      );
    });

    // 提交事务
    await new Promise((resolve, reject) => {
      db.run('COMMIT', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('跨户迁移成功:', { 
      residentId: id, 
      residentName: resident.name,
      fromHousehold: resident.household_id,
      toHousehold: targetHouseholdNumber
    });

    res.json({
      code: 20000,
      success: true,
      message: '跨户迁移成功',
      data: {
        residentId: id,
        residentName: resident.name,
        targetHouseholdNumber,
        relationshipToHead
      }
    });

  } catch (error) {
    console.error('跨户迁移失败:', error);
    await new Promise((resolve) => db.run('ROLLBACK', resolve));
    res.status(500).json({ code: 500, message: '跨户迁移失败: ' + error.message });
  }
});

// 获取单个居民详情
router.get('/residents/:id', (req, res) => {
  const { id } = req.params;
  
  const sql = `SELECT
                r.id,
                r.name,
                r.id_card AS idCard,
                r.gender,
                r.date_of_birth AS dateOfBirth,
                YEAR(CURDATE()) - YEAR(r.date_of_birth) AS age,
                r.village_group AS villageGroup,
                r.Home_address AS homeAddress,
                r.bank_card AS bankCard,
                r.bank_name AS bankName,
                r.phone_number AS phoneNumber,
                r.household_id AS householdId,
                r.status,
                r.relationship_to_head AS relationshipToHead,
                r.ethnicity,
                r.marital_status AS maritalStatus,
                r.political_status AS politicalStatus,
                r.military_service AS militaryService,
                r.education_level AS educationLevel,
                r.equity_shares,
                r.household_registration_status AS householdRegistrationStatus,
                r.migration_in_date AS migrationInDate,
                r.migration_out_date AS migrationOutDate,
                r.death_date AS deathDate,
                r.account_cancellation_date AS accountCancellationDate
              FROM residents r
              WHERE r.id = ?`;
  
  db.get(sql, [id], (err, resident) => {
    if (err) {
      console.error('查询居民详情失败:', err.message);
      res.status(500).json({ code: 500, message: '查询居民详情失败' });
      return;
    }
    
    // 查询最新的户籍变动记录，获取完整的变动信息
    const changeLogSql = `SELECT 
                           migration_in_date, migration_in_reason, 
                           migration_out_date, migration_out_reason, 
                           death_date, death_reason
                         FROM household_change_log 
                         WHERE resident_id = ? 
                         ORDER BY created_at DESC 
                         LIMIT 1`;
    
    db.get(changeLogSql, [id], (logErr, latestLog) => {
      if (logErr) {
        console.error('查询户籍变动记录失败:', logErr.message);
        // 即使查询失败，也返回基本的居民信息
        res.json({ code: 20000, data: { ...resident } });
        return;
      }
      
      // 合并居民信息和最新的变动记录
      const fullResidentData = { ...resident, ...latestLog };
      res.json({ code: 20000, data: fullResidentData });
    });
  });
});

// 创建户主
router.post('/households', async (req, res) => {
  const { household_number, village_group, household_head_name, household_head_id_card, ethnicity, household_type, housing_type, address, phone_number, gender } = req.body;
  
  // 设置默认值，确保所有必填字段都有值
  const status = 'active';
  const registered_date = new Date().toISOString().split('T')[0]; // 默认是当前日期
  const defaultEthnicity = ethnicity || '汉族'; // 为ethnicity设置默认值
  const defaultHouseholdType = household_type || ''; // 为household_type设置默认值
  const defaultHousingType = housing_type || ''; // 为housing_type设置默认值
  const defaultAddress = address || ''; // 为address设置默认值
  const defaultGender = gender || ''; // 为gender设置默认值
  
  try {
    // 优先使用前端传入的户编号，如果没有则自动生成
    let finalHouseholdNumber = household_number;
    if (!finalHouseholdNumber) {
      finalHouseholdNumber = await generateHouseholdId(village_group, household_head_id_card);
    }
    
    // 使用 MariaDB 的 pool 直接执行，避免 db.run 的语法转换问题
    const sql = `INSERT INTO households 
                 (household_number, village_group, household_head_name, household_head_id_card, ethnicity, household_type, housing_type, address, phone_number, gender, status, registered_date) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const params = [finalHouseholdNumber, village_group, household_head_name, household_head_id_card, defaultEthnicity, defaultHouseholdType, defaultHousingType, defaultAddress, phone_number, defaultGender, status, registered_date];
    
    // 使用 pool.execute 直接执行，获取 insertId
    db.pool.execute(sql, params)
      .then(([result]) => {
        res.json({ code: 20000, message: '创建户主成功', data: { id: result.insertId, householdNumber: finalHouseholdNumber } });
      })
      .catch(err => {
        console.error('创建户主失败:', err.message);
        res.status(500).json({ code: 500, message: '创建户主失败: ' + err.message });
      });
  } catch (error) {
    console.error('生成户主ID失败:', error.message);
    res.status(500).json({ code: 500, message: '生成户主ID失败: ' + error.message });
  }
});

// 根据户主姓名查询户主信息
router.get('/households', (req, res) => {
  const { household_head_name } = req.query;
  
  if (!household_head_name) {
    return res.status(400).json({ code: 400, message: '缺少户主姓名参数' });
  }
  
  const sql = `SELECT * FROM households WHERE household_head_name LIKE ? AND status = 'active'`;
  const params = [`%${household_head_name}%`];
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('查询户主信息失败:', err.message);
      return res.status(500).json({ code: 500, message: '查询户主信息失败' });
    }
    
    res.json({ code: 20000, data: rows });
  });
});

// 更换户主 API - 必须放在 /households/:id 之前，避免被拦截
router.post('/households/:id/change-head', async (req, res) => {
  const { id } = req.params;
  const { newHeadResidentId, oldHeadNewRelationship } = req.body;

  console.log('收到更换户主请求:', { householdId: id, newHeadResidentId, oldHeadNewRelationship });

  if (!newHeadResidentId || !oldHeadNewRelationship) {
    return res.status(400).json({ code: 400, message: '缺少必要参数' });
  }

  try {
    // 开启事务
    await new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 1. 查询当前户主信息
    const currentHead = await new Promise((resolve, reject) => {
      db.get(
        `SELECT id, name, id_card, household_id FROM residents 
         WHERE household_id = ? AND (relationship_to_head = '本人' OR relationship_to_head = '户主') AND status = 'active'`,
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!currentHead) {
      await new Promise((resolve) => db.run('ROLLBACK', resolve));
      return res.status(404).json({ code: 404, message: '未找到当前户主' });
    }

    // 2. 查询新户主信息（获取 residents 表中的完整信息）
    const newHead = await new Promise((resolve, reject) => {
      db.get(
        `SELECT id, name, id_card, gender, ethnicity, village_group, Home_address, phone_number 
         FROM residents 
         WHERE id = ? AND household_id = ? AND status = 'active'`,
        [newHeadResidentId, id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!newHead) {
      await new Promise((resolve) => db.run('ROLLBACK', resolve));
      return res.status(404).json({ code: 404, message: '未找到新户主成员' });
    }

    // 3. 更新原户主的 relationship_to_head
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE residents SET relationship_to_head = ? WHERE id = ?`,
        [oldHeadNewRelationship, currentHead.id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // 4. 更新新户主的 relationship_to_head 为“本人”
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE residents SET relationship_to_head = '本人' WHERE id = ?`,
        [newHead.id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // 5. 更新 households 表的户主信息（使用新户主在 residents 表中的完整信息）
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE households SET 
          household_head_name = ?,
          household_head_id_card = ?,
          gender = ?,
          ethnicity = ?,
          village_group = ?,
          address = ?,
          phone_number = ?
         WHERE household_number = ?`,
        [
          newHead.name, 
          newHead.id_card, 
          newHead.gender, 
          newHead.ethnicity, 
          newHead.village_group || '',
          newHead.Home_address || '',
          newHead.phone_number || '',
          id
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // 6. 更新所有成员的 household_head_id
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE residents SET household_head_id = ? WHERE household_id = ?`,
        [newHead.id, id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // 提交事务
    await new Promise((resolve, reject) => {
      db.run('COMMIT', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('更换户主成功:', { oldHead: currentHead.name, newHead: newHead.name });

    res.json({
      code: 20000,
      success: true,
      message: '更换户主成功',
      data: {
        oldHead: { id: currentHead.id, name: currentHead.name },
        newHead: { id: newHead.id, name: newHead.name }
      }
    });

  } catch (error) {
    console.error('更换户主失败:', error);
    await new Promise((resolve) => db.run('ROLLBACK', resolve));
    res.status(500).json({ code: 500, message: '更换户主失败: ' + error.message });
  }
});

// 更新户主信息
router.put('/households/:id', (req, res) => {
  const { id } = req.params;
  
  // 添加成功更新的日志，便于调试
  console.log('收到更新户主信息请求，ID:', id);
  console.log('更新数据:', req.body);
  
  // 只更新传递的字段
  const updateFields = [];
  const params = [];
  
  // 同时处理驼峰命名和下划线命名的字段
  if (req.body.household_number !== undefined) {
    updateFields.push('household_number = ?');
    params.push(req.body.household_number);
  }
  if (req.body.village_group !== undefined) {
    updateFields.push('village_group = ?');
    params.push(req.body.village_group);
  }
  if (req.body.household_head_name !== undefined) {
    updateFields.push('household_head_name = ?');
    params.push(req.body.household_head_name);
  }
  if (req.body.household_head_id_card !== undefined) {
    updateFields.push('household_head_id_card = ?');
    params.push(req.body.household_head_id_card);
  }
  if (req.body.ethnicity !== undefined) {
    updateFields.push('ethnicity = ?');
    params.push(req.body.ethnicity);
  }
  if (req.body.household_type !== undefined) {
    updateFields.push('household_type = ?');
    params.push(req.body.household_type);
  }
  if (req.body.housing_type !== undefined) {
    updateFields.push('housing_type = ?');
    params.push(req.body.housing_type);
  }
  if (req.body.address !== undefined) {
    updateFields.push('address = ?');
    params.push(req.body.address);
  }
  if (req.body.phone_number !== undefined) {
    updateFields.push('phone_number = ?');
    params.push(req.body.phone_number);
  }
  if (req.body.gender !== undefined) {
    updateFields.push('gender = ?');
    params.push(req.body.gender);
  }
  if (req.body.household_head_id !== undefined) {
    updateFields.push('household_head_id = ?');
    params.push(req.body.household_head_id);
  }
  
  // 如果没有要更新的字段，直接返回成功
  if (updateFields.length === 0) {
    console.log('没有要更新的字段，直接返回成功');
    return res.json({ code: 20000, message: '更新户主信息成功' });
  }
  
  // 构建SQL语句 - 支持通过id或household_number更新
  let sql;
  // 判断id是否为数字（自增ID）还是字符串（户编号）
  if (/^\d+$/.test(id)) {
    // 数字ID，使用id字段查询
    sql = `UPDATE households SET ${updateFields.join(', ')} WHERE id = ?`;
  } else {
    // 非数字，认为是户编号，使用household_number字段查询
    sql = `UPDATE households SET ${updateFields.join(', ')} WHERE household_number = ?`;
  }
  params.push(id);
  
  console.log('执行SQL:', sql);
  console.log('SQL参数:', params);
  
  db.run(sql, params, function(err) {
    if (err) {
      console.error('更新户主信息失败:', err.message);
      return res.status(500).json({ code: 500, message: '更新户主信息失败: ' + err.message });
    }
    // 添加成功更新的日志，便于调试
    console.log('更新户主信息成功，ID:', id);
    res.json({ code: 20000, message: '更新户主信息成功' });
  });
});

// 获取单个户主详情
router.get('/households/:id', (req, res) => {
  const { id } = req.params;

  // 支持通过id或household_number查询
  const sql = `SELECT * FROM households WHERE id = ? OR household_number = ?`;

  db.get(sql, [id, id], (err, household) => {
    if (err) {
      console.error('查询户主详情失败:', err.message);
      res.status(500).json({ code: 500, message: '查询户主详情失败' });
      return;
    }

    res.json({ code: 20000, data: household });
  });
});

// 检查户编号是否已存在
router.get('/households/check-household-number', (req, res) => {
  const { household_number } = req.query;

  if (!household_number) {
    return res.status(400).json({ code: 400, message: '缺少户编号参数' });
  }

  const sql = `SELECT COUNT(*) as count FROM households WHERE household_number = ?`;

  db.get(sql, [household_number], (err, result) => {
    if (err) {
      console.error('检查户编号失败:', err.message);
      res.status(500).json({ code: 500, message: '检查户编号失败' });
      return;
    }

    const exists = result.count > 0;
    res.json({ code: 20000, exists });
  });
});

router.get('/households/:id/members', (req, res) => {
  const { id } = req.params;
  
  // 构建SQL查询，获取该户主下的所有成员，包括非active状态
  const sql = `SELECT 
                r.id, 
                r.name, 
                r.id_card, 
                r.gender, 
                r.date_of_birth, 
                YEAR(CURDATE()) - YEAR(r.date_of_birth) AS age, 
                r.village_group, 
                r.bank_card, 
                r.bank_name, 
                r.phone_number, 
                r.household_id, 
                r.status, 
                r.relationship_to_head, 
                r.ethnicity, 
                r.marital_status, 
                r.political_status, 
                r.military_service, 
                r.education_level 
              FROM residents r 
              WHERE r.household_id = ?`;
  
  db.all(sql, [id], (err, members) => {
    if (err) {
      console.error('查询家庭成员失败:', err.message);
      res.status(500).json({ code: 500, message: '查询家庭成员失败' });
      return;
    }
    
    res.json({ code: 20000, data: members });
  });
});

// 更新居民状态
router.put('/residents/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, death_date, death_reason, migration_in_date, migration_in_reason, migration_out_date, migration_out_reason } = req.body;

  // 验证status值
  const validStatuses = ['active', 'migrated_out', 'deceased'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ code: 400, message: '无效的状态值' });
  }

  let connection;
  try {
    // 获取数据库连接
    connection = await db.pool.getConnection();
    
    // 开始事务
    await connection.beginTransaction();

    // 首先获取居民的当前状态
    const [rows] = await connection.execute('SELECT status FROM residents WHERE id = ?', [id]);
    const previousStatus = rows.length > 0 ? rows[0].status : null;
    const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // 更新residents表中的status字段
    await connection.execute('UPDATE residents SET status = ? WHERE id = ?', [status, id]);

    // 确定变更类型
    let changeType = '';
    let changeDate = currentTime;
    let changeReason = '';

    if (migration_in_date) {
      changeType = '迁入';
      changeDate = migration_in_date;
      changeReason = migration_in_reason || '';
    } else if (migration_out_date) {
      changeType = '迁出';
      changeDate = migration_out_date;
      changeReason = migration_out_reason || '';
    } else if (death_date) {
      changeType = '死亡注销';
      changeDate = death_date;
      changeReason = death_reason || '';
    } else if (status === 'active' && previousStatus === 'active') {
      changeType = '状态恢复';
      changeDate = currentTime;
    } else {
      changeType = '状态变更';
      changeDate = currentTime;
    }

    // 向户籍变动记录表中插入一条记录
    const logSql = `INSERT INTO household_change_log
                   (resident_id, change_type, change_date, change_reason, previous_status, new_status, 
                    migration_in_date, migration_in_reason, migration_out_date, migration_out_reason, 
                    death_date, death_reason, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

    const logParams = [
      id, changeType, changeDate, changeReason, previousStatus, status,
      migration_in_date || null, migration_in_reason || null,
      migration_out_date || null, migration_out_reason || null,
      death_date || null, death_reason || null
    ];

    await connection.execute(logSql, logParams);

    // 联动更新低收入人员状态
    if (status === 'deceased' || status === 'migrated_out') {
      // 将对应的低收入人员状态设置为 inactive
      await connection.execute(
        'UPDATE low_income_persons SET status = ?, updated_at = NOW() WHERE resident_id = ? AND status = ?',
        ['inactive', id, 'active']
      );
      console.log(`已更新居民 ${id} 的低收入人员状态为 inactive`);

      // 将对应的残疾人状态设置为 注销
      await connection.execute(
        'UPDATE disabled_persons SET certificate_status = ?, updated_at = NOW() WHERE resident_id = ? AND certificate_status = ?',
        ['注销', id, '在持']
      );
      console.log(`已更新居民 ${id} 的残疾人状态为 注销`);
    } else if (status === 'active' && (previousStatus === 'deceased' || previousStatus === 'migrated_out')) {
      // 如果居民从死亡/迁出状态恢复为在住，可以选择恢复低收入和残疾人状态
      // 这里根据业务需求决定是否恢复，暂时不自动恢复
      console.log(`居民 ${id} 状态恢复为 active，但不自动恢复低收入和残疾人状态`);
    }

    // 提交事务
    await connection.commit();
    
    res.json({ code: 20000, message: '状态更新成功' });
  } catch (err) {
    console.error('更新居民状态失败:', err.message);
    if (connection) {
      await connection.rollback();
    }
    res.status(500).json({ code: 500, message: '更新居民状态失败: ' + err.message });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// 更新居民信息
router.put('/residents/:id', (req, res) => {
  const { id } = req.params;
  // 同时处理驼峰命名和下划线命名的字段
  const name = req.body.name;
  const id_card = req.body.idCard || req.body.id_card;
  const gender = req.body.gender;
  const date_of_birth = req.body.dateOfBirth || req.body.date_of_birth;
  const village_group = req.body.villageGroup || req.body.village_group;
  // 处理Home_address字段
  const home_address = req.body.Home_address || req.body.address;
  const bank_card = req.body.bankCard || req.body.bank_card;
  const phone_number = req.body.phoneNumber || req.body.phone_number;
  const bank_name = req.body.bankName || req.body.bank_name;
  const ethnicity = req.body.ethnicity;
  const relationship_to_head = req.body.relationship_to_head;
  const marital_status = req.body.marital_status;
  const political_status = req.body.political_status;
  const military_service = req.body.military_service;
  const education_level = req.body.education_level;
  
  // 添加成功更新的日志，便于调试
  console.log('收到更新居民信息请求，ID:', id);
  console.log('更新数据:', req.body);
  
  // 检查必要字段是否存在
  if (!name || !id_card) {
    console.error('更新居民信息失败: 缺少必要字段');
    return res.status(400).json({ code: 400, message: '更新居民信息失败: 缺少必要字段' });
  }
  
  // 添加equity_shares字段的处理
  const equity_shares = req.body.equity_shares || req.body.equityShares || 0;
  
  const sql = `UPDATE residents 
               SET name = ?, 
                   id_card = ?, 
                   gender = ?, 
                   date_of_birth = ?, 
                   village_group = ?, 
                   Home_address = ?, 
                   bank_card = ?, 
                   phone_number = ?, 
                   bank_name = ?, 
                   ethnicity = ?, 
                   relationship_to_head = ?, 
                   marital_status = ?, 
                   political_status = ?, 
                   military_service = ?, 
                   education_level = ?, 
                   equity_shares = ? 
               WHERE id = ?`;
  
  const params = [name, id_card, gender, date_of_birth, village_group, home_address, bank_card, phone_number, bank_name, ethnicity, relationship_to_head, marital_status, political_status, military_service, education_level, equity_shares, id];
  
  db.run(sql, params, function(err) {
    if (err) {
      console.error('更新居民信息失败:', err.message);
      return res.status(500).json({ code: 500, message: '更新居民信息失败: ' + err.message });
    }
    // 添加成功更新的日志，便于调试
    console.log('更新居民信息成功，ID:', id);
    res.json({ code: 20000, message: '更新居民信息成功' });
  });
});

// 新增居民
router.post('/residents', async (req, res) => {
  console.log('========== 收到新增居民请求 ==========');
  console.log('原始数据:', JSON.stringify(req.body, null, 2));

  try {
    // 接收前端传递的数据，处理字段名不匹配的问题
    const name = req.body.name;
    const idCard = req.body.idCard || req.body.id_card;
    const gender = req.body.gender;
    const dateOfBirth = req.body.dateOfBirth || req.body.date_of_birth;
    const villageGroup = req.body.village_group || req.body.villageGroup || '未知';
    const homeAddress = req.body.Home_address || req.body.address || '';
    const bankCard = req.body.bank_card || req.body.bankCard || null;
    const phoneNumber = req.body.phone_number || req.body.phoneNumber || null;
    const bankName = req.body.bank_name || req.body.bankName || null;
    const household_id = req.body.household_id;
    
    // 检查 household_id 是否为空
    if (!household_id) {
      console.error('错误: household_id 为空');
      return res.status(400).json({ code: 400, message: '户ID不能为空' });
    }
    
    // household_head_id 应该是整数类型，但前端传的是字符串 household_id
    // 暂时设为 null，后续可以从 households 表查询对应的户主 resident_id
    const household_head_id = null; 
    const status = req.body.status || 'active';
    
    const relationship_to_head = req.body.relationship_to_head || '其他';
    const ethnicity = req.body.ethnicity || '汉族';
    const marital_status = req.body.marital_status || '';
    const political_status = req.body.political_status || '群众';
    const military_service = req.body.military_service || '未服兵役';
    const education_level = req.body.education_level || '';
    const registered_date = req.body.registered_date || new Date().toISOString().split('T')[0];
    const equity_shares = req.body.equity_shares || req.body.equityShares || 0;
    
    // 新增字段：职业和健康状况
    const occupation = req.body.occupation || null;
    const health_status = req.body.health_status || null;
    
    console.log('解析后的数据:', { household_id, name, idCard, gender, dateOfBirth, occupation, health_status });
    
    const sql = `INSERT INTO residents 
                 (household_id, name, gender, date_of_birth, id_card, relationship_to_head, ethnicity, 
                  marital_status, political_status, military_service, bank_card, bank_name, village_group, 
                  education_level, phone_number, registered_date, status, household_head_id, Home_address, equity_shares,
                  occupation, health_status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const params = [household_id, name, gender, dateOfBirth, idCard, relationship_to_head, ethnicity, 
                    marital_status, political_status, military_service, bankCard, bankName, villageGroup, 
                    education_level, phoneNumber, registered_date, status, household_head_id, homeAddress, equity_shares,
                    occupation, health_status];
    
    console.log('执行SQL:', sql);
    console.log('SQL参数:', params);
    
    const [result] = await db.pool.execute(sql, params);
    console.log('插入成功, insertId:', result.insertId);
    
    res.json({ code: 20000, message: '新增居民成功', data: { id: result.insertId } });
  } catch (err) {
    console.error('========== 新增居民失败 ==========');
    console.error('错误信息:', err.message);
    console.error('错误代码:', err.code);
    console.error('错误详情:', err.sqlMessage || err.message);
    console.error('完整错误:', err);
    
    if (err.message.includes('Duplicate entry') && err.message.includes('id_card')) {
      return res.status(400).json({ code: 400, message: '身份证号已存在，无法重复添加' });
    }
    return res.status(500).json({ code: 500, message: '新增居民失败: ' + (err.sqlMessage || err.message) });
  }
});

// 搜索建议API - 返回居民姓名和户主姓名的搜索建议
router.get('/search-suggestions', (req, res) => {
  const { keyword, type } = req.query;
  console.log('收到/search-suggestions请求，关键字:', keyword, '类型:', type);

  if (!keyword) {
    res.json({ code: 20000, residentNames: [], householdHeadNames: [] });
    return;
  }

  // 构建查询参数
  const searchKeyword = `%${keyword}%`;
  const results = {
    residentNames: [],
    householdHeadNames: []
  };

  // 查询居民姓名建议
  if (!type || type === 'residentNames') {
    const residentSql = `SELECT DISTINCT name FROM residents WHERE name LIKE ? AND status = 'active' LIMIT 10`;
    db.all(residentSql, [searchKeyword], (residentErr, residentRows) => {
      if (residentErr) {
        console.error('查询居民姓名建议失败:', residentErr.message);
      } else {
        results.residentNames = residentRows.map(row => ({
          value: row.name,
          label: row.name
        }));
      }
      
      // 如果只需要居民姓名建议，直接返回结果
      if (type === 'residentNames') {
        res.json({ code: 20000, ...results });
      }
    });
  }

  // 查询户主姓名建议
  if (!type || type === 'householdHeadNames') {
    const householdSql = `SELECT 
                            household_number,
                            household_head_name,
                            address,
                            village_group,
                            id as householdHeadId
                          FROM households 
                          WHERE household_head_name LIKE ? AND status = 'active' 
                          LIMIT 10`;
    db.all(householdSql, [searchKeyword], (householdErr, householdRows) => {
      if (householdErr) {
        console.error('查询户主姓名建议失败:', householdErr.message);
      } else {
        results.householdHeadNames = householdRows.map(row => ({
          householdNumber: row.household_number,
          householdHeadName: row.household_head_name,
          address: row.address,
          villageGroup: row.village_group,
          householdHeadId: row.householdHeadId,
          value: row.household_head_name
        }));
      }
      
      // 如果只需要户主姓名建议，或者需要所有建议，返回结果
      if (type === 'householdHeadNames' || !type) {
        res.json({ code: 20000, ...results });
      }
    });
  }
});

// 按姓名搜索居民并返回详细信息
router.get('/residents/search-by-name', (req, res) => {
  const { name } = req.query;
  console.log('收到按姓名搜索居民请求，姓名:', name);

  if (!name) {
    res.json({ code: 20000, data: [] });
    return;
  }

  // 构建查询参数
  const searchKeyword = `%${name}%`;
  const sql = `SELECT 
                r.id, 
                r.name, 
                r.id_card AS idCard,
                r.gender,
                r.ethnicity,
                r.date_of_birth AS dateOfBirth,
                r.age,
                r.phone_number AS phoneNumber,
                r.homehold_id,
                r.Home_address AS homeAddress,
                r.occupation
              FROM residents r
              WHERE r.name LIKE ? AND r.status = 'active'
              LIMIT 10`;

  db.all(sql, [searchKeyword], (err, rows) => {
    if (err) {
      console.error('按姓名搜索居民失败:', err.message);
      res.status(500).json({ code: 500, message: '搜索失败' });
      return;
    }

    // 转换结果格式
    const result = rows.map(row => ({
      id: row.id,
      name: row.name,
      idCard: row.idCard,
      gender: row.gender,
      ethnicity: row.ethnicity,
      dateOfBirth: row.dateOfBirth,
      age: row.age,
      phoneNumber: row.phoneNumber,
      householdId: row.household_id,
      homeAddress: row.homeAddress,
      occupation: row.occupation
    }));

    console.log('搜索到居民:', result.length, '条');
    res.json({ code: 20000, data: result });
  });
});

// 字典API - 返回字典表中的数据
router.get('/dictionaries', (req, res) => {
  const { category } = req.query;
  
  console.log('收到字典API请求，category:', category);
  
  // 构建查询条件
  let sql = `SELECT id, category, value, display_order, status, created_at, updated_at 
             FROM dictionaries 
             WHERE status = 'active'`;
  const params = [];
  
  if (category) {
    sql += ` AND category = ?`;
    params.push(category);
    console.log('添加category查询条件:', category);
  }
  
  // 添加排序
  sql += ` ORDER BY display_order ASC`;
  
  console.log('执行SQL:', sql);
  console.log('SQL参数:', params);
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('查询字典数据失败:', err.message);
      // 查询失败时返回空数组，而不是错误的模拟数据
      res.json({ code: 20000, data: [] });
      return;
    }
    
    console.log('查询到字典数据:', rows.length, '条');
    rows.forEach(row => {
      console.log('  ID:', row.id, 'Category:', row.category, 'Value:', row.value);
    });
    
    // 返回真实字典数据
    res.json({ code: 20000, data: rows });
  });
});

// 获取人口结构统计
router.get('/population-structure', async (req, res) => {
  console.log('获取人口结构统计...');

  try {
    // 按年龄段分组查询居民数据，需要从date_of_birth计算age
    const [rows] = await db.pool.execute(
      `SELECT
        CASE
          WHEN (YEAR(CURDATE()) - YEAR(date_of_birth)) < 7 THEN '0-6岁'
          WHEN (YEAR(CURDATE()) - YEAR(date_of_birth)) BETWEEN 7 AND 17 THEN '7-17岁'
          WHEN (YEAR(CURDATE()) - YEAR(date_of_birth)) BETWEEN 18 AND 59 THEN '18-59岁'
          WHEN (YEAR(CURDATE()) - YEAR(date_of_birth)) BETWEEN 60 AND 69 THEN '60-69岁'
          WHEN (YEAR(CURDATE()) - YEAR(date_of_birth)) BETWEEN 70 AND 79 THEN '70-79岁'
          WHEN (YEAR(CURDATE()) - YEAR(date_of_birth)) BETWEEN 80 AND 89 THEN '80-89岁'
          WHEN (YEAR(CURDATE()) - YEAR(date_of_birth)) BETWEEN 90 AND 99 THEN '90-99岁'
          ELSE '100岁以上'
        END as ageGroup,
        COUNT(*) as count
      FROM residents
      WHERE status = 'active'
      GROUP BY
        CASE
          WHEN (YEAR(CURDATE()) - YEAR(date_of_birth)) < 7 THEN '0-6岁'
          WHEN (YEAR(CURDATE()) - YEAR(date_of_birth)) BETWEEN 7 AND 17 THEN '7-17岁'
          WHEN (YEAR(CURDATE()) - YEAR(date_of_birth)) BETWEEN 18 AND 59 THEN '18-59岁'
          WHEN (YEAR(CURDATE()) - YEAR(date_of_birth)) BETWEEN 60 AND 69 THEN '60-69岁'
          WHEN (YEAR(CURDATE()) - YEAR(date_of_birth)) BETWEEN 70 AND 79 THEN '70-79岁'
          WHEN (YEAR(CURDATE()) - YEAR(date_of_birth)) BETWEEN 80 AND 89 THEN '80-89岁'
          WHEN (YEAR(CURDATE()) - YEAR(date_of_birth)) BETWEEN 90 AND 99 THEN '90-99岁'
          ELSE '100岁以上'
        END
      ORDER BY
        CASE
          WHEN (YEAR(CURDATE()) - YEAR(date_of_birth)) < 7 THEN 0
          WHEN (YEAR(CURDATE()) - YEAR(date_of_birth)) BETWEEN 7 AND 17 THEN 1
          WHEN (YEAR(CURDATE()) - YEAR(date_of_birth)) BETWEEN 18 AND 59 THEN 2
          WHEN (YEAR(CURDATE()) - YEAR(date_of_birth)) BETWEEN 60 AND 69 THEN 3
          WHEN (YEAR(CURDATE()) - YEAR(date_of_birth)) BETWEEN 70 AND 79 THEN 4
          WHEN (YEAR(CURDATE()) - YEAR(date_of_birth)) BETWEEN 80 AND 89 THEN 5
          WHEN (YEAR(CURDATE()) - YEAR(date_of_birth)) BETWEEN 90 AND 99 THEN 6
          ELSE 7
        END
    `);

    // 确保所有年龄段都存在，即使数量为0
    const allAgeGroups = [
      { ageGroup: '0-6岁', count: 0 },
      { ageGroup: '7-17岁', count: 0 },
      { ageGroup: '18-59岁', count: 0 },
      { ageGroup: '60-69岁', count: 0 },
      { ageGroup: '70-79岁', count: 0 },
      { ageGroup: '80-89岁', count: 0 },
      { ageGroup: '90-99岁', count: 0 },
      { ageGroup: '100岁以上', count: 0 }
    ];

    // 合并查询结果
    rows.forEach(row => {
      const existingGroup = allAgeGroups.find(g => g.ageGroup === row.ageGroup);
      if (existingGroup) {
        existingGroup.count = row.count;
      }
    });

    res.json({
      code: 20000,
      success: true,
      message: '获取人口结构统计成功',
      data: allAgeGroups
    });
  } catch (err) {
    console.error('查询人口结构统计失败:', err.message);
    res.status(500).json({ code: 500, message: '查询人口结构统计失败: ' + err.message });
  }
});

// 获取居民的户籍变动记录 - 必须放在 /residents/:id 之前
router.get('/residents/:id/change-logs', (req, res) => {
  const { id } = req.params;

  const sql = `SELECT * FROM household_change_log WHERE resident_id = ? ORDER BY change_date DESC`;

  db.all(sql, [id], (err, rows) => {
    if (err) {
      console.error('获取户籍变动记录失败:', err.message);
      return res.status(500).json({ code: 500, message: '获取户籍变动记录失败' });
    }

    res.json({ code: 20000, data: rows });
  });
});

module.exports = router;