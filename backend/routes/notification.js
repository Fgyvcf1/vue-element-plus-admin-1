const express = require('express');
const router = express.Router();
const db = require('../db'); // MySQL 连接模块

// 简单的管理员判断（你可以换成自己的 JWT 验证）
function isAdmin(req, res, next) {
  // TODO: 替换为真实的权限判断
  const isAdminFlag = req.headers['x-admin'] === '1';
  if (!isAdminFlag) return res.status(403).json({ msg: '无权限' });
  next();
}

// 1. 通知列表
router.get('/', async (req, res) => {
  const { page = 1, size = 20, type, is_read } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(size);
  let sql = 'SELECT * FROM notification';
  const params = [];

  if (type) {
    sql += ' WHERE type = ?';
    params.push(type);
  }
  if (is_read !== undefined) {
    sql += params.length ? ' AND is_read = ?' : ' WHERE is_read = ?';
    params.push(parseInt(is_read));
  }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(size), offset);

  try {
    const [rows] = await db.pool.execute(sql, params);
    res.json({ code: 20000, data: rows });
  } catch (err) {
    console.error('获取通知列表失败:', err.message);
    res.status(500).json({ code: 50000, message: err.message });
  }
});

// 2. 新增通知（手动发布任务通知/普通通知）
router.post('/', async (req, res) => {
  const { title, content, type = 'task', progress = 0 } = req.body;

  try {
    // 获取最大ID
    const [maxIdResult] = await db.pool.execute('SELECT MAX(id) as maxId FROM notification');
    const newId = (maxIdResult[0].maxId || 0) + 1;

    const sql = `
      INSERT INTO notification (id, title, content, type, progress, status, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending', 0, NOW())
    `;

    await db.pool.execute(sql, [newId, title, content, type, progress]);

    res.json({ code: 20000, data: { id: newId, title, content, type, progress } });
  } catch (err) {
    console.error('新增通知失败:', err);
    res.status(500).json({ code: 50000, message: err.message });
  }
});

// 3. 更新通知（修改任务进度/状态）
router.put('/:id', async (req, res) => {
  const { progress, status, is_read } = req.body;
  const fields = [];
  const params = [];

  if (progress !== undefined) {
    fields.push('progress = ?');
    params.push(progress);
  }
  if (status !== undefined) {
    fields.push('status = ?');
    params.push(status);
  }
  if (is_read !== undefined) {
    fields.push('is_read = ?');
    params.push(is_read);
  }
  if (!fields.length) return res.status(400).json({ code: 40000, message: '无可更新字段' });

  const sql = `UPDATE notification SET ${fields.join(', ')} WHERE id = ?`;
  params.push(req.params.id);

  try {
    const [result] = await db.pool.execute(sql, params);
    res.json({ code: 20000, data: { affected: result.affectedRows } });
  } catch (err) {
    console.error('更新通知失败:', err.message);
    res.status(500).json({ code: 50000, message: err.message });
  }
});

// 4. 删除通知
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await db.pool.execute('DELETE FROM notification WHERE id = ?', [req.params.id]);
    res.json({ code: 20000, data: { affected: result.affectedRows } });
  } catch (err) {
    console.error('删除通知失败:', err.message);
    res.status(500).json({ code: 50000, message: err.message });
  }
});

// 5. 批量标记已读
router.post('/mark-read', async (req, res) => {
  const { ids = [] } = req.body;
  if (!ids.length) return res.status(400).json({ code: 40000, message: 'ids 不能为空' });

  const placeholders = ids.map(() => '?').join(',');
  const sql = `UPDATE notification SET is_read = 1, status = 'read' WHERE id IN (${placeholders})`;

  try {
    const [result] = await db.pool.execute(sql, ids);
    res.json({ code: 20000, data: { affected: result.affectedRows } });
  } catch (err) {
    console.error('批量标记已读失败:', err.message);
    res.status(500).json({ code: 50000, message: err.message });
  }
});

module.exports = router;
