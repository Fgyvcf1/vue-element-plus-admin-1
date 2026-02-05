const express = require('express');
const router = express.Router();
const db = require('../db');

// 列表
router.get('/', (req, res) => {
  db.all('SELECT * FROM event ORDER BY start_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ code: 50000, message: err.message });
    res.json({ code: 20000, data: rows });
  });
});

// 新增
router.post('/', (req, res) => {
  const { title, start_at, lead_hours = 2 } = req.body;
  const sql = 'INSERT INTO event (title, start_at, lead_hours) VALUES (?, ?, ?)';
  db.run(sql, [title, start_at, lead_hours], function (err) {
    if (err) return res.status(500).json({ code: 50000, message: err.message });
    res.json({ code: 20000, data: { id: this.lastID, title, start_at, lead_hours } });
  });
});

// 更新
router.put('/:id', (req, res) => {
  const { title, start_at, lead_hours } = req.body;
  const sql = 'UPDATE event SET title = ?, start_at = ?, lead_hours = ? WHERE id = ?';
  db.run(sql, [title, start_at, lead_hours, req.params.id], function (err) {
    if (err) return res.status(500).json({ code: 50000, message: err.message });
    res.json({ code: 20000, data: { affected: this.changes } });
  });
});

// 删除
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM event WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ code: 50000, message: err.message });
    res.json({ code: 20000, data: { affected: this.changes } });
  });
});

module.exports = router;