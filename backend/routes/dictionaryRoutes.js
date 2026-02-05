const express = require('express');
const router = express.Router();
const db = require('../db'); // 使用新的MySQL数据库连接

// 管理员权限验证中间件
const requireAdmin = (req, res, next) => {
  // TODO: 根据实际的用户认证系统实现权限验证
  next();
};

// 获取所有字典分类
router.get('/categories', (req, res) => {
  db.all(
    `SELECT category, COUNT(*) as count 
     FROM dictionaries 
     GROUP BY category 
     ORDER BY category`,
    [],
    (err, rows) => {
      if (err) {
        console.error('查询字典分类失败:', err.message);
        return res.status(500).json({
          code: 50000,
          message: '查询字典分类失败',
          error: err.message
        });
      }

      res.json({
        code: 20000,
        data: rows.map(row => ({
          category: row.category,
          count: row.count
        }))
      });
    }
  );
});

// 根据ID获取字典项 - 必须放在 / 路由之前
router.get('/:id', (req, res) => {
  const { id } = req.params;

  // 排除特殊路由
  if (id === 'categories') {
    return res.status(404).json({
      code: 40400,
      message: '路由不存在'
    });
  }

  db.get('SELECT * FROM dictionaries WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('查询字典项失败:', err.message);
      return res.status(500).json({
        code: 50000,
        message: '查询字典项失败',
        error: err.message
      });
    }

    if (!row) {
      return res.status(404).json({
        code: 40400,
        message: '字典项不存在'
      });
    }

    res.json({
      code: 20000,
      data: row
    });
  });
});

// 获取字典项列表
router.get('/', (req, res) => {
  const { category, include_all } = req.query;

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (category) {
    whereClause += ' AND category = ?';
    params.push(category);
  }

  // 默认只返回 active 状态的字典项，include_all=1 时返回所有
  if (include_all !== '1') {
    whereClause += " AND status = 'active'";
  }

  db.all(
    `SELECT * FROM dictionaries ${whereClause} ORDER BY category, display_order, id`,
    params,
    (err, rows) => {
      if (err) {
        console.error('查询字典项失败:', err.message);
        return res.status(500).json({
          code: 50000,
          message: '查询字典项失败',
          error: err.message
        });
      }

      res.json({
        code: 20000,
        data: rows
      });
    }
  );
});

// 新增字典项
router.post('/', requireAdmin, (req, res) => {
  const { category, value, display_order = 0 } = req.body;

  if (!category || !value) {
    return res.status(400).json({
      code: 40000,
      message: '分类和字典值不能为空'
    });
  }

  // 检查同分类下是否已存在相同的值
  db.get(
    'SELECT id FROM dictionaries WHERE category = ? AND value = ?',
    [category, value],
    (err, row) => {
      if (err) {
        console.error('检查字典项失败:', err.message);
        return res.status(500).json({
          code: 50000,
          message: '检查字典项失败',
          error: err.message
        });
      }

      if (row) {
        return res.status(400).json({
          code: 40000,
          message: '该分类下已存在相同的字典值'
        });
      }

      // 插入新字典项
      db.run(
        `INSERT INTO dictionaries (category, value, display_order, status, created_at, updated_at) 
         VALUES (?, ?, ?, 'active', NOW(), NOW())`,
        [category, value, display_order],
        function(err) {
          if (err) {
            console.error('创建字典项失败:', err.message);
            return res.status(500).json({
              code: 50000,
              message: '创建字典项失败',
              error: err.message
            });
          }

          res.json({
            code: 20000,
            message: '字典项创建成功',
            data: { id: this.lastID }
          });
        }
      );
    }
  );
});

// 修改字典项
router.put('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { value, display_order } = req.body;

  // 先获取原字典项信息
  db.get('SELECT * FROM dictionaries WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('查询字典项失败:', err.message);
      return res.status(500).json({
        code: 50000,
        message: '查询字典项失败',
        error: err.message
      });
    }

    if (!row) {
      return res.status(404).json({
        code: 40400,
        message: '字典项不存在'
      });
    }

    // 如果修改了值，检查同分类下是否已存在相同的值
    if (value && value !== row.value) {
      db.get(
        'SELECT id FROM dictionaries WHERE category = ? AND value = ? AND id != ?',
        [row.category, value, id],
        (err, existing) => {
          if (err) {
            console.error('检查字典项失败:', err.message);
            return res.status(500).json({
              code: 50000,
              message: '检查字典项失败',
              error: err.message
            });
          }

          if (existing) {
            return res.status(400).json({
              code: 40000,
              message: '该分类下已存在相同的字典值'
            });
          }

          doUpdate();
        }
      );
    } else {
      doUpdate();
    }

    function doUpdate() {
      const updates = [];
      const params = [];

      if (value !== undefined) {
        updates.push('value = ?');
        params.push(value);
      }

      if (display_order !== undefined) {
        updates.push('display_order = ?');
        params.push(display_order);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          code: 40000,
          message: '没有需要更新的字段'
        });
      }

      updates.push('updated_at = NOW()');
      params.push(id);

      db.run(
        `UPDATE dictionaries SET ${updates.join(', ')} WHERE id = ?`,
        params,
        function(err) {
          if (err) {
            console.error('更新字典项失败:', err.message);
            return res.status(500).json({
              code: 50000,
              message: '更新字典项失败',
              error: err.message
            });
          }

          res.json({
            code: 20000,
            message: '字典项更新成功'
          });
        }
      );
    }
  });
});

// 切换字典项状态（启用/停用）
router.put('/:id/status', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['active', 'inactive'].includes(status)) {
    return res.status(400).json({
      code: 40000,
      message: '状态值必须是 active 或 inactive'
    });
  }

  db.run(
    'UPDATE dictionaries SET status = ?, updated_at = NOW() WHERE id = ?',
    [status, id],
    function(err) {
      if (err) {
        console.error('更新状态失败:', err.message);
        return res.status(500).json({
          code: 50000,
          message: '更新状态失败',
          error: err.message
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          code: 40400,
          message: '字典项不存在'
        });
      }

      res.json({
        code: 20000,
        message: status === 'active' ? '字典项已启用' : '字典项已停用'
      });
    }
  );
});

// 删除字典项
router.delete('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM dictionaries WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('删除字典项失败:', err.message);
      return res.status(500).json({
        code: 50000,
        message: '删除字典项失败',
        error: err.message
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        code: 40400,
        message: '字典项不存在'
      });
    }

    res.json({
      code: 20000,
      message: '字典项删除成功'
    });
  });
});

module.exports = router;
