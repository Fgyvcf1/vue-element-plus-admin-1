/**
 * 残疾人管理模块 - API路由
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * 获取残疾人列表
 * GET /disabled-persons
 */
router.get('/disabled-persons', async (req, res) => {
  console.log('【disabledPersonRoutes】收到 /disabled-persons 请求');
  try {
    const {
      pageNum = 1,
      pageSize = 10,
      name,
      idCard,
      disabilityType,
      disabilityLevel
    } = req.query;

    const offset = (parseInt(pageNum) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    // 构建基础查询
    let whereClause = 'WHERE 1=1';
    const params = [];

    // 添加查询条件
    if (name) {
      whereClause += ` AND r.name LIKE ?`;
      params.push(`%${name}%`);
    }
    if (idCard) {
      whereClause += ` AND r.id_card LIKE ?`;
      params.push(`%${idCard}%`);
    }
    if (disabilityType) {
      whereClause += ` AND d.disability_type = ?`;
      params.push(disabilityType);
    }
    if (disabilityLevel) {
      whereClause += ` AND d.disability_level = ?`;
      params.push(disabilityLevel);
    }

    // 查询总数
    const countSql = `
      SELECT COUNT(*) as total 
      FROM disabled_persons d
      LEFT JOIN residents r ON d.resident_id = r.id
      ${whereClause}
    `;
    const [countResult] = await db.pool.execute(countSql, params);
    const total = countResult[0].total;

    // 查询数据
    const dataSql = `
      SELECT 
        d.id,
        d.resident_id as residentId,
        d.disability_type as disabilityType,
        d.disability_level as disabilityLevel,
        d.certificate_number as certificateNumber,
        d.issue_date as issueDate,
        d.certificate_status as certificateStatus,
        d.guardian_name as guardianName,
        d.guardian_phone as guardianPhone,
        d.guardian_relationship as guardianRelationship,
        d.created_at as createdAt,
        r.name,
        r.id_card as idCard,
        r.gender,
        r.date_of_birth,
        r.phone_number as phoneNumber,
        TIMESTAMPDIFF(YEAR, r.date_of_birth, CURDATE()) as age,
        h.household_head_name as householdHeadName,
        h.household_head_id_card as householdHeadIdCard,
        h.address
      FROM disabled_persons d
      LEFT JOIN residents r ON d.resident_id = r.id
      LEFT JOIN households h ON r.household_id = h.household_number
      ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    // 添加分页参数
    const queryParams = [...params, limit, offset];
    
    const [rows] = await db.pool.execute(dataSql, queryParams);
    console.log('【disabledPersonRoutes】查询到', rows.length, '条记录');
    
    if (rows.length === 0) {
      return res.json({
        code: 20000,
        data: [],
        total: 0,
        pageNum: parseInt(pageNum),
        pageSize: parseInt(pageSize)
      });
    }
    
    console.log('【disabledPersonRoutes】第一条记录原始字段:', Object.keys(rows[0]));

    // 转换字段名为驼峰命名（数据库返回的字段名可能已经是驼峰命名）
    const formattedRows = rows.map(row => ({
      id: row.id,
      residentId: row.residentId || row.resident_id,
      disabilityType: row.disabilityType || row.disability_type,
      disabilityLevel: row.disabilityLevel || row.disability_level,
      certificateNumber: row.certificateNumber || row.certificate_number,
      issueDate: row.issueDate || row.issue_date,
      certificateStatus: row.certificateStatus || row.certificate_status,
      guardianName: row.guardianName || row.guardian_name,
      guardianPhone: row.guardianPhone || row.guardian_phone,
      guardianRelationship: row.guardianRelationship || row.guardian_relationship,
      createdAt: row.createdAt || row.created_at,
      name: row.name,
      idCard: row.idCard || row.id_card,
      gender: row.gender,
      age: row.age,
      phoneNumber: row.phoneNumber || row.phone_number,
      householdHeadName: row.householdHeadName || row.household_head_name,
      householdHeadIdCard: row.householdHeadIdCard || row.household_head_id_card,
      address: row.address
    }));

    console.log('【disabledPersonRoutes】转换后第一条记录字段:', Object.keys(formattedRows[0]));
    console.log('【disabledPersonRoutes】返回数据示例:', JSON.stringify(formattedRows[0], null, 2).substring(0, 500));

    res.json({
      code: 20000,
      data: formattedRows,
      total,
      pageNum: parseInt(pageNum),
      pageSize: parseInt(pageSize)
    });
  } catch (error) {
    console.error('获取残疾人列表失败:', error);
    res.status(500).json({ code: 500, message: '获取列表失败: ' + error.message });
  }
});

/**
 * 获取单个残疾人详情
 * GET /disabled-persons/:id
 */
router.get('/disabled-persons/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.pool.execute(
      `SELECT 
        d.id,
        d.resident_id as residentId,
        d.disability_type as disabilityType,
        d.disability_level as disabilityLevel,
        d.certificate_number as certificateNumber,
        d.issue_date as issueDate,
        d.certificate_status as certificateStatus,
        d.guardian_name as guardianName,
        d.guardian_phone as guardianPhone,
        d.guardian_relationship as guardianRelationship,
        d.created_at as createdAt,
        r.name,
        r.id_card as idCard,
        r.gender,
        r.date_of_birth as dateOfBirth,
        r.phone_number as phoneNumber,
        TIMESTAMPDIFF(YEAR, r.date_of_birth, CURDATE()) as age,
        h.household_head_name as householdHeadName,
        h.household_head_id_card as householdHeadIdCard,
        h.address
      FROM disabled_persons d
      LEFT JOIN residents r ON d.resident_id = r.id
      LEFT JOIN households h ON r.household_id = h.household_number
      WHERE d.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: '记录不存在' });
    }

    const row = rows[0];
    // 转换字段名为驼峰命名（数据库返回的字段名可能已经是驼峰命名）
    const formattedData = {
      id: row.id,
      residentId: row.residentId || row.resident_id,
      disabilityType: row.disabilityType || row.disability_type,
      disabilityLevel: row.disabilityLevel || row.disability_level,
      certificateNumber: row.certificateNumber || row.certificate_number,
      issueDate: row.issueDate || row.issue_date,
      certificateStatus: row.certificateStatus || row.certificate_status,
      guardianName: row.guardianName || row.guardian_name,
      guardianPhone: row.guardianPhone || row.guardian_phone,
      guardianRelationship: row.guardianRelationship || row.guardian_relationship,
      createdAt: row.createdAt || row.created_at,
      name: row.name,
      idCard: row.idCard || row.id_card,
      gender: row.gender,
      dateOfBirth: row.dateOfBirth || row.date_of_birth,
      age: row.age,
      phoneNumber: row.phoneNumber || row.phone_number,
      householdHeadName: row.householdHeadName || row.household_head_name,
      householdHeadIdCard: row.householdHeadIdCard || row.household_head_id_card,
      address: row.address
    };

    res.json({
      code: 20000,
      data: formattedData
    });
  } catch (error) {
    console.error('获取残疾人详情失败:', error);
    res.status(500).json({ code: 500, message: '获取详情失败: ' + error.message });
  }
});

/**
 * 新增残疾人
 * POST /disabled-persons
 */
router.post('/disabled-persons', async (req, res) => {
  try {
    const {
      resident_id,
      disability_type,
      disability_level,
      certificate_number,
      certificate_status,
      issue_date,
      guardian_name,
      guardian_phone,
      guardian_relationship
    } = req.body;

    console.log('【添加残疾人】接收到的数据:', {
      resident_id, disability_type, disability_level, certificate_number,
      certificate_status, issue_date, guardian_name, guardian_phone, guardian_relationship
    });

    // 验证必填字段
    if (!resident_id || !disability_type || !disability_level) {
      return res.status(400).json({
        code: 400,
        message: '请填写必填字段：居民ID、残疾类型、残疾等级'
      });
    }

    // 检查是否已存在
    const [existing] = await db.pool.execute(
      'SELECT id FROM disabled_persons WHERE resident_id = ?',
      [resident_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        code: 400,
        message: '该居民已添加为残疾人'
      });
    }

    // 直接存储中文等级
    const [result] = await db.pool.execute(
      `INSERT INTO disabled_persons (
        resident_id,
        disability_type,
        disability_level,
        certificate_number,
        certificate_status,
        issue_date,
        guardian_name,
        guardian_phone,
        guardian_relationship,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        resident_id,
        disability_type,
        disability_level,
        certificate_number || null,
        certificate_status || '在持',
        issue_date || null,
        guardian_name || null,
        guardian_phone || null,
        guardian_relationship || null
      ]
    );

    console.log('【添加残疾人】插入成功，ID:', result.insertId);

    res.json({
      code: 20000,
      message: '添加成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('添加残疾人失败:', error);
    res.status(500).json({ code: 500, message: '添加失败: ' + error.message });
  }
});

/**
 * 更新残疾人信息
 * PUT /disabled-persons/:id
 */
router.put('/disabled-persons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      disability_type,
      disability_level,
      certificate_number,
      certificate_status,
      issue_date,
      guardian_name,
      guardian_phone,
      guardian_relationship
    } = req.body;

    console.log('【更新残疾人】接收到的数据:', { 
      id, disability_type, disability_level, certificate_number,
      certificate_status, issue_date, guardian_name, guardian_phone, guardian_relationship
    });

    // 直接存储中文等级
    const [result] = await db.pool.execute(
      `UPDATE disabled_persons SET
        disability_type = ?,
        disability_level = ?,
        certificate_number = ?,
        certificate_status = ?,
        issue_date = ?,
        guardian_name = ?,
        guardian_phone = ?,
        guardian_relationship = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [
        disability_type,
        disability_level,
        certificate_number || null,
        certificate_status || '在持',
        issue_date || null,
        guardian_name || null,
        guardian_phone || null,
        guardian_relationship || null,
        id
      ]
    );

    console.log('【更新残疾人】更新结果:', { affectedRows: result.affectedRows });

    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 404, message: '记录不存在' });
    }

    res.json({
      code: 20000,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新残疾人失败:', error);
    res.status(500).json({ code: 500, message: '更新失败: ' + error.message });
  }
});

/**
 * 删除残疾人信息
 * DELETE /disabled-persons/:id
 */
router.delete('/disabled-persons/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.pool.execute(
      'DELETE FROM disabled_persons WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 404, message: '记录不存在' });
    }

    res.json({
      code: 20000,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除残疾人失败:', error);
    res.status(500).json({ code: 500, message: '删除失败: ' + error.message });
  }
});

module.exports = router;