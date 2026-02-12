const db = require('../db');

// 获取当前本地时间（北京时间）的辅助函数
function getLocalTime() {
  const now = new Date();
  // 使用toISOString()获取UTC时间，然后手动调整时区
  const timezoneOffset = now.getTimezoneOffset() * 60000; // 转换为毫秒
  const localDate = new Date(now.getTime() - timezoneOffset);
  return localDate.toISOString().slice(0, 19).replace('T', ' ');
}

// 特殊人群控制器
const specialPeopleController = {
  // 低收入人群相关API
  
  // 获取所有低收入人群
  getLowIncomePersons: (req, res) => {
    console.log('收到/low-income-persons请求，查询参数:', req.query);
    
    try {
      // 构建SQL查询 - 返回前端需要的所有字段，从low_income_policy_records获取实际政策数据
      let sql = `SELECT
                    l.id,
                    r.name,
                    r.id_card,
                    r.gender,
                    r.ethnicity,
                    YEAR(CURDATE()) - YEAR(r.date_of_birth) AS age,
                    r.relationship_to_head,
                    h.household_head_name,
                    l.low_income_type AS enjoyPolicyType,
                    l.low_income_type AS policy_type,
                    COALESCE((SELECT p.enjoy_level FROM low_income_policy_records p WHERE p.low_income_person_id = l.id ORDER BY p.created_at DESC LIMIT 1), 'A档') AS enjoy_level,
                    COALESCE((SELECT p.subsidy_amount FROM low_income_policy_records p WHERE p.low_income_person_id = l.id ORDER BY p.created_at DESC LIMIT 1), 0) AS subsidy_amount,
                    COALESCE((SELECT p.subsidy_cycle FROM low_income_policy_records p WHERE p.low_income_person_id = l.id ORDER BY p.created_at DESC LIMIT 1), '月') AS subsidy_cycle,
                    COALESCE((SELECT p.start_date FROM low_income_policy_records p WHERE p.low_income_person_id = l.id ORDER BY p.created_at DESC LIMIT 1), l.apply_date) AS start_date,
                    COALESCE((SELECT p.end_date FROM low_income_policy_records p WHERE p.low_income_person_id = l.id ORDER BY p.created_at DESC LIMIT 1), l.approval_date) AS end_date,
                    COALESCE((SELECT p.account_name FROM low_income_policy_records p WHERE p.low_income_person_id = l.id ORDER BY p.created_at DESC LIMIT 1), r.name) AS account_name,
                    COALESCE((SELECT p.bank_name FROM low_income_policy_records p WHERE p.low_income_person_id = l.id ORDER BY p.created_at DESC LIMIT 1), r.bank_name) AS bank_name,
                    COALESCE((SELECT p.bank_account FROM low_income_policy_records p WHERE p.low_income_person_id = l.id ORDER BY p.created_at DESC LIMIT 1), r.bank_card) AS bank_account,
                    (SELECT COUNT(*) FROM residents WHERE household_id = r.household_id AND status = 'active') AS totalHouseholdMembers,
                    (SELECT COUNT(*) FROM residents rr 
                     JOIN low_income_persons ll ON rr.id = ll.resident_id 
                     WHERE rr.household_id = r.household_id AND ll.status = 'active') AS lowIncomeHouseholdMembers,
                    (SELECT SUM(COALESCE(pp.subsidy_amount, 0)) 
                     FROM residents rr 
                     JOIN low_income_persons ll ON rr.id = ll.resident_id 
                     LEFT JOIN (SELECT low_income_person_id, MAX(created_at) AS max_created 
                                FROM low_income_policy_records 
                                GROUP BY low_income_person_id) AS latest ON ll.id = latest.low_income_person_id 
                     LEFT JOIN low_income_policy_records pp ON ll.id = pp.low_income_person_id AND pp.created_at = latest.max_created 
                     WHERE rr.household_id = r.household_id AND ll.status = 'active') AS monthlyHouseholdAmount,
                    l.status
                  FROM low_income_persons l
                  LEFT JOIN residents r ON l.resident_id = r.id
                  LEFT JOIN households h ON r.household_id = h.household_number
                  WHERE 1=1`;
      
      // 添加查询条件
      const params = [];
      
      // 居民状态查询
      if (req.query.status) {
        sql += ` AND l.status = ?`;
        params.push(req.query.status);
      } else {
        // 默认查询active状态的居民
        sql += ` AND l.status = 'active'`;
      }
      
      // 居民姓名查询
      if (req.query.name) {
        sql += ` AND r.name LIKE ?`;
        params.push(`%${req.query.name}%`);
      }
      // 身份证号查询
      if (req.query.idCard) {
        sql += ` AND r.id_card LIKE ?`;
        params.push(`%${req.query.idCard}%`);
      }
      // 低收入类型查询
      if (req.query.lowIncomeType) {
        sql += ` AND l.low_income_type = ?`;
        params.push(req.query.lowIncomeType);
      }
      
      // 添加排序
      sql += ` ORDER BY l.created_at DESC`;
      
      console.log('执行SQL:', sql);
      console.log('SQL参数:', params);
      
      db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('查询低收入人员数据失败:', err.message);
          console.error('SQL:', sql);
          console.error('Params:', params);
          return res.json({ code: 20000, data: [] });
        }
        console.log('查询到低收入人员数据:', rows.length, '条');
        res.json({ code: 20000, data: rows });
      });
    } catch (error) {
      console.error('处理低收入人员请求时出错:', error.message);
      console.error('Error stack:', error.stack);
      res.json({ code: 20000, data: [] });
    }
  },
  
  // 获取单个低收入人员
  getLowIncomePerson: (req, res) => {
    const { id } = req.params;
    const sql = `SELECT
                  l.id,
                  r.name,
                  r.id_card,
                  r.gender,
                  r.date_of_birth,
                  r.phone_number,
                  r.ethnicity,
                  r.household_id,
                  r.relationship_to_head,
                  r.health_status,
                  r.bank_card,
                  r.bank_name,
                  h.household_head_name,
                  h.phone_number AS household_phone_number,
                  h.household_head_id_card,
                  h.address AS household_address,
                  r.Home_address AS resident_address,
                  l.low_income_type AS enjoyPolicyType,
                  l.low_income_type AS policy_type,
                  COALESCE((SELECT p.enjoy_level FROM low_income_policy_records p WHERE p.low_income_person_id = l.id ORDER BY p.created_at DESC LIMIT 1), 'A档') AS enjoy_level,
                  COALESCE((SELECT p.subsidy_amount FROM low_income_policy_records p WHERE p.low_income_person_id = l.id ORDER BY p.created_at DESC LIMIT 1), 0) AS subsidy_amount,
                  COALESCE((SELECT p.subsidy_cycle FROM low_income_policy_records p WHERE p.low_income_person_id = l.id ORDER BY p.created_at DESC LIMIT 1), '月') AS subsidy_cycle,
                  COALESCE((SELECT p.start_date FROM low_income_policy_records p WHERE p.low_income_person_id = l.id ORDER BY p.created_at DESC LIMIT 1), l.apply_date) AS start_date,
                  COALESCE((SELECT p.end_date FROM low_income_policy_records p WHERE p.low_income_person_id = l.id ORDER BY p.created_at DESC LIMIT 1), l.approval_date) AS end_date,
                  COALESCE((SELECT p.account_name FROM low_income_policy_records p WHERE p.low_income_person_id = l.id ORDER BY p.created_at DESC LIMIT 1), r.name) AS account_name,
                  COALESCE((SELECT p.bank_name FROM low_income_policy_records p WHERE p.low_income_person_id = l.id ORDER BY p.created_at DESC LIMIT 1), r.bank_name) AS bank_name,
                  COALESCE((SELECT p.bank_account FROM low_income_policy_records p WHERE p.low_income_person_id = l.id ORDER BY p.created_at DESC LIMIT 1), r.bank_card) AS bank_account,
                  (SELECT COUNT(*) FROM residents WHERE household_id = r.household_id AND status = 'active') AS totalHouseholdMembers,
                  (SELECT COUNT(*) FROM residents rr 
                   JOIN low_income_persons ll ON rr.id = ll.resident_id 
                   WHERE rr.household_id = r.household_id AND ll.status = 'active') AS lowIncomeHouseholdMembers,
                  (SELECT SUM(COALESCE(pp.subsidy_amount, 0)) 
                   FROM residents rr 
                   JOIN low_income_persons ll ON rr.id = ll.resident_id 
                   LEFT JOIN (SELECT low_income_person_id, MAX(created_at) AS max_created 
                              FROM low_income_policy_records 
                              GROUP BY low_income_person_id) AS latest ON ll.id = latest.low_income_person_id 
                   LEFT JOIN low_income_policy_records pp ON ll.id = pp.low_income_person_id AND pp.created_at = latest.max_created 
                   WHERE rr.household_id = r.household_id AND ll.status = 'active') AS monthlyHouseholdAmount,
                  l.status,
                  YEAR(CURDATE()) - YEAR(r.date_of_birth) AS age
                FROM low_income_persons l
                LEFT JOIN residents r ON l.resident_id = r.id
                LEFT JOIN households h ON r.household_id = h.household_number
                WHERE l.id = ?`;
    
    db.get(sql, [id], (err, row) => {
      if (err) {
        console.error('查询单个低收入人员数据失败:', err.message);
        res.json({ code: 20000, data: null });
        return;
      }
      res.json({ code: 20000, data: row });
    });
  },
  
  // 添加低收入人员
  addLowIncomePerson: (req, res) => {
    const { 
      resident_id, low_income_type, approval_date, status, 
      policy_type, start_date, end_date, apply_date 
    } = req.body;
    
    // 处理字段映射，确保前端传递的字段能正确映射到数据库
    const mappedParams = {
      resident_id: resident_id,
      low_income_type: low_income_type || policy_type,
      apply_date: apply_date || start_date || new Date().toISOString().split('T')[0],
      approval_date: approval_date || end_date || new Date().toISOString().split('T')[0],
      status: status || 'active'
    };
    
    const sql = `INSERT INTO low_income_persons
                 (resident_id, low_income_type, apply_date, approval_date, status,
                  created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      mappedParams.resident_id,
      mappedParams.low_income_type,
      mappedParams.apply_date,
      mappedParams.approval_date,
      mappedParams.status,
      getLocalTime(),
      getLocalTime()
    ];
    
    db.run(sql, params, function(err) {
      if (err) {
        console.error('添加低收入人员失败:', err.message);
        console.error('请求体:', req.body);
        console.error('SQL:', sql);
        console.error('参数:', params);
        res.status(500).json({ code: 500, message: '添加低收入人员失败' });
        return;
      }
      res.json({ 
        code: 20000, 
        message: '添加低收入人员成功', 
        data: { id: this.lastID } 
      });
    });
  },

  // 添加低收入人员及政策记录（事务）
  addLowIncomePersonWithPolicy: async (req, res) => {
    let connection;
    try {
      const { 
        resident_id, low_income_type, approval_date, status, 
        policy_type, start_date, end_date, apply_date,
        subsidy_amount, subsidy_cycle, enjoy_level, bank_account,
        account_name, bank_name, account_relationship, remark, has_subsidy
      } = req.body;

      // 开启事务
      connection = await db.beginTransaction();

      // 1. 获取最大ID并生成新ID
      const [maxIdResult] = await connection.execute('SELECT MAX(id) as maxId FROM low_income_persons');
      const newId = (maxIdResult[0].maxId || 0) + 1;
      console.log('生成新ID:', newId);

      // 2. 插入低收入人员（手动指定ID）
      const personSql = `INSERT INTO low_income_persons
                   (id, resident_id, low_income_type, apply_date, approval_date, status,
                    created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`;

      const personParams = [
        newId,
        resident_id,
        low_income_type || policy_type,
        apply_date || start_date || new Date().toISOString().split('T')[0],
        approval_date || end_date || new Date().toISOString().split('T')[0],
        status || 'active'
      ];

      await db.runInTransaction(connection, personSql, personParams);
      const lowIncomePersonId = newId;

      // 3. 获取政策记录表最大ID并生成新ID
      const [maxPolicyIdResult] = await connection.execute('SELECT MAX(id) as maxId FROM low_income_policy_records');
      const newPolicyId = (maxPolicyIdResult[0].maxId || 0) + 1;
      console.log('生成政策记录新ID:', newPolicyId);

      // 4. 插入政策记录（手动指定ID）
      const policySql = `INSERT INTO low_income_policy_records
                   (id, low_income_person_id, policy_type, start_date, end_date,
                    subsidy_amount, subsidy_cycle, enjoy_level, bank_account,
                    account_name, bank_name, account_relationship, status, remark, has_subsidy, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;

      const policyParams = [
        newPolicyId,
        lowIncomePersonId,
        policy_type || low_income_type || '最低生活保证金',
        start_date || null,
        end_date || null,
        subsidy_amount || null,
        subsidy_cycle || null,
        enjoy_level || null,
        bank_account || null,
        account_name || null,
        bank_name || null,
        account_relationship || null,
        status || 'active',
        remark || null,
        has_subsidy || false
      ];

      await db.runInTransaction(connection, policySql, policyParams);

      // 提交事务
      await db.commit(connection);

      res.json({ 
        code: 20000, 
        message: '添加低收入人员及政策记录成功', 
        data: { id: lowIncomePersonId } 
      });
    } catch (error) {
      console.error('添加低收入人员及政策记录失败:', error.message);
      // 回滚事务
      if (connection) {
        await db.rollback(connection);
      }
      res.status(500).json({ 
        code: 500, 
        message: '添加低收入人员及政策记录失败: ' + error.message 
      });
    }
  },
  
  // 更新低收入人员
  updateLowIncomePerson: (req, res) => {
    const { id } = req.params;
    const { 
      low_income_type, approval_date, status, 
      policy_type, start_date, end_date, apply_date 
    } = req.body;
    
    // 处理字段映射，确保前端传递的字段能正确映射到数据库
    const mappedParams = {
      low_income_type: low_income_type || policy_type,
      apply_date: apply_date || start_date,
      approval_date: approval_date || end_date,
      status: status
    };
    
    // 构建动态SQL，只更新有值的字段
    let sql = `UPDATE low_income_persons SET updated_at = ?`;
    const params = [getLocalTime()];
    
    if (mappedParams.low_income_type !== undefined) {
      sql += `, low_income_type = ?`;
      params.push(mappedParams.low_income_type);
    }
    
    if (mappedParams.apply_date !== undefined) {
      sql += `, apply_date = ?`;
      params.push(mappedParams.apply_date);
    }
    
    if (mappedParams.approval_date !== undefined) {
      sql += `, approval_date = ?`;
      params.push(mappedParams.approval_date);
    }
    
    if (mappedParams.status !== undefined) {
      sql += `, status = ?`;
      params.push(mappedParams.status);
    }
    
    sql += ` WHERE id = ?`;
    params.push(id);

    db.run(sql, params, function(err) {
      if (err) {
        console.error('更新低收入人员失败:', err.message);
        console.error('请求体:', req.body);
        console.error('SQL:', sql);
        console.error('参数:', params);
        res.status(500).json({ code: 500, message: '更新低收入人员失败' });
        return;
      }
      res.json({ code: 20000, message: '更新低收入人员成功' });
    });
  },
  
  // 删除低收入人员
  deleteLowIncomePerson: (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM low_income_persons WHERE id = ?`;
    
    db.run(sql, [id], function(err) {
      if (err) {
        console.error('删除低收入人员失败:', err.message);
        res.status(500).json({ code: 500, message: '删除低收入人员失败' });
        return;
      }
      res.json({ code: 20000, message: '删除低收入人员成功' });
    });
  },
  
  // 残疾人相关API
  
  // 获取所有残疾人
  getDisabledPersons: (req, res) => {
    console.log('【specialPeopleController】收到 /disabled-persons 请求，查询参数:', req.query);
    
    // 构建SQL查询
    let sql = `SELECT
                  d.*,
                  r.name,
                  r.id_card AS idCard,
                  r.gender,
                  YEAR(CURDATE()) - YEAR(r.date_of_birth) AS age,
                  h.address AS household_address,
                  r.Home_address AS resident_address
                FROM disabled_persons d
                LEFT JOIN residents r ON d.resident_id = r.id
                LEFT JOIN households h ON r.household_id = h.household_number
                WHERE 1=1`;
    
    // 添加查询条件
    const params = [];
    
    // 居民姓名查询
    if (req.query.name) {
      sql += ` AND r.name LIKE ?`;
      params.push(`%${req.query.name}%`);
    }
    
    // 身份证号查询
    if (req.query.idCard) {
      sql += ` AND r.id_card LIKE ?`;
      params.push(`%${req.query.idCard}%`);
    }
    
    // 残疾类型查询
    if (req.query.disabilityType) {
      sql += ` AND d.disability_type = ?`;
      params.push(req.query.disabilityType);
    }
    
    // 残疾等级查询
    if (req.query.disabilityLevel) {
      sql += ` AND d.disability_level = ?`;
      params.push(req.query.disabilityLevel);
    }
    
    // 添加排序
    sql += ` ORDER BY d.created_at DESC`;
    
    console.log('执行SQL:', sql);
    console.log('SQL参数:', params);
    
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('查询残疾人数据失败:', err.message);
        res.json({ code: 20000, data: [] });
        return;
      }
      console.log('查询到残疾人数据:', rows.length, '条');
      
      // 转换字段名为驼峰命名
      const formattedRows = rows.map(row => ({
        id: row.id,
        residentId: row.resident_id,
        disabilityType: row.disability_type,
        disabilityLevel: row.disability_level,
        certificateNumber: row.certificate_number,
        issueDate: row.issue_date,
        certificateStatus: row.certificate_status,
        guardianName: row.guardian_name,
        guardianPhone: row.guardian_phone,
        guardianRelationship: row.guardian_relationship,
        createdAt: row.created_at,
        name: row.name,
        idCard: row.id_card || row.idCard,
        gender: row.gender,
        age: row.age,
        address: row.household_address || row.resident_address || row.address
      }));
      
      res.json({ code: 20000, data: formattedRows });
    });
  },
  
  // 获取单个残疾人
  getDisabledPerson: (req, res) => {
    const { id } = req.params;
    const sql = `SELECT
                  d.*,
                  r.name,
                  r.id_card AS idCard,
                  r.gender,
                  r.date_of_birth,
                  r.phone_number AS phoneNumber,
                  r.ethnicity,
                  r.household_id,
                  h.household_head_name,
                  h.phone_number AS household_phone_number,
                  h.household_head_id_card,
                  h.address AS household_address,
                  r.Home_address AS resident_address,
                  YEAR(CURDATE()) - YEAR(r.date_of_birth) AS age
                FROM disabled_persons d
                LEFT JOIN residents r ON d.resident_id = r.id
                LEFT JOIN households h ON r.household_id = h.household_number
                WHERE d.id = ?`;
    
    db.get(sql, [id], (err, row) => {
      if (err) {
        console.error('查询单个残疾人数据失败:', err.message);
        res.json({ code: 20000, data: null });
        return;
      }
      
      // 转换字段名为驼峰命名
      const formattedData = row ? {
        id: row.id,
        residentId: row.resident_id,
        disabilityType: row.disability_type,
        disabilityLevel: row.disability_level,
        certificateNumber: row.certificate_number,
        issueDate: row.issue_date,
        certificateStatus: row.certificate_status,
        guardianName: row.guardian_name,
        guardianPhone: row.guardian_phone,
        guardianRelationship: row.guardian_relationship,
        createdAt: row.created_at,
        name: row.name,
        idCard: row.idCard || row.id_card,
        gender: row.gender,
        dateOfBirth: row.date_of_birth,
        age: row.age,
        phoneNumber: row.phoneNumber || row.phone_number,
        householdHeadName: row.household_head_name,
        householdHeadIdCard: row.household_head_id_card,
        address: row.household_address || row.resident_address || row.address
      } : null;
      
      res.json({ code: 20000, data: formattedData });
    });
  },
  
  // 添加残疾人
  addDisabledPerson: (req, res) => {
    const {
      resident_id, disability_type, disability_level,
      certificate_number, issue_date, validity_period,
      guardian_name, guardian_phone, certificate_status, guardian_relationship
    } = req.body;

    const sql = `INSERT INTO disabled_persons
                 (resident_id, disability_type, disability_level,
                  certificate_number, issue_date, validity_period,
                  guardian_name, guardian_phone, certificate_status, guardian_relationship,
                  created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [resident_id, disability_type, disability_level,
                  certificate_number, issue_date, validity_period,
                  guardian_name, guardian_phone, certificate_status || '在持', guardian_relationship || '',
                  getLocalTime(), getLocalTime()];

    console.log('执行添加SQL:', sql);
    console.log('SQL参数:', JSON.stringify(params, null, 2));

    db.run(sql, params, function(err) {
      if (err) {
        console.error('添加残疾人失败:', err.message);
        console.error('错误详情:', err);
        res.status(500).json({ code: 500, message: '添加残疾人失败: ' + err.message });
        return;
      }
      res.json({
        code: 20000,
        message: '添加残疾人成功',
        data: { id: this.lastID }
      });
    });
  },
  
  // 更新残疾人
  updateDisabledPerson: (req, res) => {
    const { id } = req.params;
    console.log('收到更新残疾人请求，ID:', id);
    console.log('请求体完整内容:', JSON.stringify(req.body, null, 2));

    const {
      disability_type, disability_level,
      certificate_number, issue_date, validity_period,
      guardian_name, guardian_phone, certificate_status, guardian_relationship
    } = req.body;

    console.log('解构后的字段值:');
    console.log('  disability_type:', disability_type);
    console.log('  disability_level:', disability_level);
    console.log('  certificate_number:', certificate_number);
    console.log('  issue_date:', issue_date);
    console.log('  validity_period:', validity_period);
    console.log('  guardian_name:', guardian_name);
    console.log('  guardian_phone:', guardian_phone);
    console.log('  guardian_relationship:', guardian_relationship);
    console.log('  certificate_status:', certificate_status);

    // 使用COALESCE处理空值，使用空字符串替代NULL或undefined
    const sql = `UPDATE disabled_persons
                 SET disability_type = COALESCE(?, disability_type),
                     disability_level = COALESCE(?, disability_level),
                     certificate_number = COALESCE(?, certificate_number),
                     issue_date = COALESCE(?, issue_date),
                     validity_period = COALESCE(?, validity_period),
                     guardian_name = ?,
                     guardian_phone = ?,
                     guardian_relationship = ?,
                     certificate_status = COALESCE(?, certificate_status),
                     updated_at = ?
                 WHERE id = ?`;

    const updateParams = [disability_type, disability_level,
                  certificate_number, issue_date, validity_period,
                  guardian_name || '',  // 确保传递空字符串而不是undefined
                  guardian_phone || '',  // 确保传递空字符串而不是undefined
                  guardian_relationship || '', // 与残疾人关系
                  certificate_status,
                  getLocalTime(), id];

    console.log('执行SQL:', sql);
    console.log('SQL参数:', JSON.stringify(updateParams, null, 2));

    db.run(sql, updateParams, function(err) {
      if (err) {
        console.error('更新残疾人失败:', err.message);
        console.error('错误详情:', err);
        res.status(500).json({
          code: 500,
          message: '更新残疾人失败',
          error: err.message
        });
        return;
      }
      console.log('更新残疾人成功，影响行数:', this.changes);
      res.json({ code: 20000, message: '更新残疾人成功' });
    });
  },
  
  // 删除残疾人
  deleteDisabledPerson: (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM disabled_persons WHERE id = ?`;
    
    db.run(sql, [id], function(err) {
      if (err) {
        console.error('删除残疾人失败:', err.message);
        res.status(500).json({ code: 500, message: '删除残疾人失败' });
        return;
      }
      res.json({ code: 20000, message: '删除残疾人成功' });
    });
  },
  
  // 低收入政策享受记录相关API
  
  // 获取政策记录
  getPolicyRecords: (req, res) => {
    const { low_income_person_id } = req.query;
    
    try {
      let sql = `SELECT 
                    id, 
                    policy_type, 
                    start_date, 
                    end_date, 
                    subsidy_amount, 
                    subsidy_cycle, 
                    enjoy_level, 
                    bank_account, 
                    account_name, 
                    bank_name, 
                    account_relationship, 
                    status, 
                    remark, 
                    created_at 
                  FROM low_income_policy_records 
                  WHERE 1=1`;
      
      const params = [];
      
      if (low_income_person_id) {
        sql += ` AND low_income_person_id = ?`;
        params.push(low_income_person_id);
      }
      
      sql += ` ORDER BY created_at DESC`;
      
      db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('查询政策记录失败:', err.message);
          res.json({ code: 20000, data: [] });
          return;
        }
        res.json({ code: 20000, data: rows });
      });
    } catch (error) {
      console.error('处理政策记录请求时出错:', error.message);
      res.json({ code: 20000, data: [] });
    }
  },
  
  // 添加政策记录
  addPolicyRecord: (req, res) => {
    const {
      low_income_person_id, policy_type, start_date, end_date,
      subsidy_amount, subsidy_cycle, enjoy_level, bank_account,
      account_name, bank_name, account_relationship, status, remark,
      has_subsidy
    } = req.body;

    const sql = `INSERT INTO low_income_policy_records
                 (low_income_person_id, policy_type, start_date, end_date,
                  subsidy_amount, subsidy_cycle, enjoy_level, bank_account,
                  account_name, bank_name, account_relationship, status, remark, has_subsidy, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [low_income_person_id, policy_type, start_date, end_date,
                  subsidy_amount, subsidy_cycle, enjoy_level, bank_account,
                  account_name, bank_name, account_relationship, status, remark, has_subsidy, getLocalTime(), getLocalTime()];
    
    db.run(sql, params, function(err) {
      if (err) {
        console.error('添加政策记录失败:', err.message);
        res.status(500).json({ code: 500, message: '添加政策记录失败' });
        return;
      }
      res.json({ 
        code: 20000, 
        message: '添加政策记录成功', 
        data: { id: this.lastID } 
      });
    });
  },
  
  // 更新政策记录
  updatePolicyRecord: (req, res) => {
    const { id } = req.params;
    const {
      policy_type, start_date, end_date,
      subsidy_amount, subsidy_cycle, enjoy_level, bank_account,
      account_name, bank_name, account_relationship, status, remark,
      has_subsidy
    } = req.body;

    const sql = `UPDATE low_income_policy_records SET
                 policy_type = ?,
                 start_date = ?,
                 end_date = ?,
                 subsidy_amount = ?,
                 subsidy_cycle = ?,
                 enjoy_level = ?,
                 bank_account = ?,
                 account_name = ?,
                 bank_name = ?,
                 account_relationship = ?,
                 status = ?,
                 remark = ?,
                 has_subsidy = ?,
                 updated_at = ?
               WHERE id = ?`;

    const params = [policy_type, start_date, end_date,
                  subsidy_amount, subsidy_cycle, enjoy_level, bank_account,
                  account_name, bank_name, account_relationship, status, remark, has_subsidy, getLocalTime(), id];
    
    db.run(sql, params, function(err) {
      if (err) {
        console.error('更新政策记录失败:', err.message);
        res.status(500).json({ code: 500, message: '更新政策记录失败' });
        return;
      }
      res.json({ code: 20000, message: '更新政策记录成功' });
    });
  },
  
  // 删除政策记录
  deletePolicyRecord: (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM low_income_policy_records WHERE id = ?`;
    
    db.run(sql, [id], function(err) {
      if (err) {
        console.error('删除政策记录失败:', err.message);
        res.status(500).json({ code: 500, message: '删除政策记录失败' });
        return;
      }
      res.json({ code: 20000, message: '删除政策记录成功' });
    });
  },
  
  // 计算单个成员的历史享受政策月数
  getTotalMonths: (req, res) => {
    const { id } = req.params;

    try {
      // 计算总月数的SQL查询，按自然月统计，使用公式：((年份差)*12 + 月份差 + 1)
      // 只使用每个成员的每条不同的开始日期的最新记录
      // 处理end_date为NULL或空字符串的情况，使用当前日期
      const sql = `SELECT
                    COALESCE(
                      SUM(
                        ((YEAR(CASE WHEN end_date IS NULL OR end_date = '' THEN CURDATE() ELSE end_date END) - YEAR(start_date)) * 12) +
                        (MONTH(CASE WHEN end_date IS NULL OR end_date = '' THEN CURDATE() ELSE end_date END) - MONTH(start_date)) + 1
                      ), 0
                    ) AS total_months
                  FROM (
                    SELECT * FROM low_income_policy_records
                    WHERE id IN (
                      SELECT id FROM (
                        SELECT id, start_date, created_at,
                               ROW_NUMBER() OVER (PARTITION BY low_income_person_id, start_date ORDER BY created_at DESC) as rn
                        FROM low_income_policy_records
                        WHERE low_income_person_id = ? AND start_date IS NOT NULL AND start_date != ''
                      ) ranked
                      WHERE rn = 1
                    )
                  ) AS latest_records`;

      db.get(sql, [id], (err, row) => {
        if (err) {
          console.error('计算历史享受月数失败:', err.message);
          res.status(500).json({ code: 500, message: '计算历史享受月数失败' });
          return;
        }
        res.json({ code: 20000, data: { totalMonths: row.total_months || 0 } });
      });
    } catch (error) {
      console.error('处理历史享受月数请求时出错:', error.message);
      res.status(500).json({ code: 500, message: '计算历史享受月数失败' });
    }
  },
  
  // 计算该户所有成员享受总金额和总月数
  getHouseholdTotalSubsidy: (req, res) => {
    const { id } = req.params;

    try {
      // 首先获取该成员的household_id
      const getHouseholdIdSql = `SELECT r.household_id
                                  FROM residents r
                                  JOIN low_income_persons l ON r.id = l.resident_id
                                  WHERE l.id = ?`;

      db.get(getHouseholdIdSql, [id], (err, householdRow) => {
        if (err) {
          console.error('获取户ID失败:', err.message);
          res.status(500).json({ code: 500, message: '计算户总金额失败' });
          return;
        }

        if (!householdRow || !householdRow.household_id) {
          res.json({ code: 20000, data: { totalSubsidy: 0, totalMonths: 0 } });
          return;
        }

        const householdId = householdRow.household_id;

        // 计算该户所有成员的总享受金额和总月数（包括所有政策记录）
        // 对每条记录：月数 = ((年份差)*12 + 月份差 + 1)，补贴金额 = subsidy_amount * 月数
        // 总金额 = SUM(所有记录的补贴金额)，总月数 = SUM(所有记录的月数)
        // 处理end_date为NULL或空字符串的情况，使用当前日期
        // 只使用每个成员的每条不同的开始日期的最新记录
        const getTotalSubsidySql = `SELECT
                                      COALESCE(SUM(COALESCE(p.subsidy_amount, 0) *
                                        (((YEAR(CASE WHEN p.end_date IS NULL OR p.end_date = '' THEN CURDATE() ELSE p.end_date END) - YEAR(p.start_date)) * 12) +
                                        (MONTH(CASE WHEN p.end_date IS NULL OR p.end_date = '' THEN CURDATE() ELSE p.end_date END) - MONTH(p.start_date)) + 1)
                                      ), 0) AS total_subsidy,
                                      COALESCE(SUM(
                                        (((YEAR(CASE WHEN p.end_date IS NULL OR p.end_date = '' THEN CURDATE() ELSE p.end_date END) - YEAR(p.start_date)) * 12) +
                                        (MONTH(CASE WHEN p.end_date IS NULL OR p.end_date = '' THEN CURDATE() ELSE p.end_date END) - MONTH(p.start_date)) + 1)
                                      ), 0) AS total_months
                                    FROM low_income_policy_records p
                                    JOIN (
                                      SELECT id FROM (
                                        SELECT id, start_date, created_at,
                                               ROW_NUMBER() OVER (PARTITION BY low_income_person_id, start_date ORDER BY created_at DESC) as rn
                                        FROM low_income_policy_records
                                      ) ranked
                                      WHERE rn = 1
                                    ) latest ON p.id = latest.id
                                    JOIN low_income_persons l ON p.low_income_person_id = l.id
                                    JOIN residents r ON l.resident_id = r.id
                                    WHERE r.household_id = ? AND l.status = 'active' AND p.start_date IS NOT NULL AND p.start_date != ''`;

        db.get(getTotalSubsidySql, [householdId], (subsidyErr, subsidyRow) => {
          if (subsidyErr) {
            console.error('计算户总金额失败:', subsidyErr.message);
            res.status(500).json({ code: 500, message: '计算户总金额失败' });
            return;
          }

          res.json({
            code: 20000,
            data: {
              totalSubsidy: subsidyRow.total_subsidy || 0,
              totalMonths: subsidyRow.total_months || 0
            }
          });
        });
      });
    } catch (error) {
      console.error('处理户总金额请求时出错:', error.message);
      res.status(500).json({ code: 500, message: '计算户总金额失败' });
    }
  }
};

module.exports = specialPeopleController;