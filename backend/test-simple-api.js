const express = require('express');
const router = express.Router();
const db = require('./db');

// 简单测试API
router.get('/test', (req, res) => {
  console.log('收到测试请求...');
  res.json({ code: 20000, message: '测试API正常工作！' });
});

// 测试数据库连接
router.get('/test-db', (req, res) => {
  console.log('测试数据库连接...');
  
  db.all('SELECT COUNT(*) AS count FROM households', [], (err, rows) => {
    if (err) {
      console.error('数据库查询失败:', err.message);
      res.status(500).json({ code: 500, message: '数据库查询失败', error: err.message });
      return;
    }
    
    console.log('数据库查询成功，households表记录数:', rows[0].count);
    res.json({ code: 20000, message: '数据库连接正常', data: { count: rows[0].count } });
  });
});

module.exports = router;
