const express = require('express');
const router = express.Router();
const db = require('./db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 导入各模块路由
const residentRoutes = require('./routes/residentRoutes');
const specialPeopleRoutes = require('./routes/specialPeopleRoutes');
const notificationRoutes = require('./routes/notification');
const eventRoutes = require('./routes/event');
const leadershipRoutes = require('./routes/leadershipRoutes');
const importRoutes = require('./import-route');
const archiveRoutes = require('./routes/archiveRoutes');
const configRoutes = require('./modules/config-management/backend/routes/configRoutes');
const dictionaryRoutes = require('./routes/dictionaryRoutes');
const caseFileRoutes = require('./routes/caseFileRoutes');
const lowIncomeRoutes = require('./routes/lowIncomeRoutes');
const disabledPersonRoutes = require('./routes/disabledPersonRoutes');

// 配置multer存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/mediation-images';
    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-${randomStr}${ext}`);
  }
});

// 创建multer实例
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    // 只允许图片文件
    const allowedTypes = /jpeg|jpg|png|gif|bmp|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件!'));
    }
  }
});

// 获取当前本地时间（北京时间）的辅助函数
function getLocalTime() {
  const now = new Date();
  // 使用toISOString()获取UTC时间，然后手动调整时区
  const timezoneOffset = now.getTimezoneOffset() * 60000; // 转换为毫秒
  const localDate = new Date(now.getTime() - timezoneOffset);
  return localDate.toISOString().slice(0, 19).replace('T', ' ');
}

// 临时API：检查数据库更新状态
router.get('/check-database-update', (req, res) => {
  console.log('检查数据库更新状态...');

  // 检查表结构
  db.get("PRAGMA table_info(reminder_rules)", (err, columns) => {
    if (err) {
      console.error('查询表结构失败:', err.message);
      res.status(500).json({ code: 500, message: '查询表结构失败' });
      return;
    }

    // 检查reminder_days字段是否存在
    const hasReminderDaysField = columns.some(col => col.name === 'reminder_days');

    if (hasReminderDaysField) {
      // 查询reminder_rules表数据
      db.all("SELECT * FROM reminder_rules", (err, rows) => {
        if (err) {
          console.error('查询数据失败:', err.message);
          res.status(500).json({ code: 500, message: '查询数据失败' });
          return;
        }

        const ageRules = rows.filter(r => r.rule_type === 'age');
        const rulesWithReminderDays = rows.filter(r => r.reminder_days > 0);

        res.json({
          code: 20000,
          success: true,
          message: '数据库更新成功！reminder_days字段已添加',
          data: {
            reminder_days_field_exists: true,
            total_rules: rows.length,
            age_rules_count: ageRules.length,
            rules_with_reminder_days: rulesWithReminderDays.length,
            reminder_rules: rows
          }
        });
      });
    } else {
      res.json({
        code: 50000,
        success: false,
        message: '数据库未更新，reminder_days字段不存在',
        data: {
          reminder_days_field_exists: false
        }
      });
    }
  });
});

// 临时API：添加reminder_days字段到reminder_rules表
router.get('/update-reminder-days-field', (req, res) => {
  console.log('开始添加reminder_days字段...');

  // 检查表结构
  db.get("PRAGMA table_info(reminder_rules)", (err, columns) => {
    if (err) {
      console.error('查询表结构失败:', err.message);
      res.status(500).json({ code: 500, message: '查询表结构失败' });
      return;
    }

    // 检查是否已存在reminder_days字段
    const hasReminderDaysField = columns.some(col => col.name === 'reminder_days');

    if (hasReminderDaysField) {
      console.log('reminder_days 字段已存在，无需添加');
      res.json({ code: 20000, message: 'reminder_days 字段已存在，无需添加' });
      return;
    }

    // 添加reminder_days字段
    const sql = 'ALTER TABLE reminder_rules ADD COLUMN reminder_days INTEGER DEFAULT 0';

    db.run(sql, (err) => {
      if (err) {
        console.error('添加字段失败:', err.message);
        res.status(500).json({ code: 500, message: '添加字段失败: ' + err.message });
        return;
      }

      console.log('成功添加 reminder_days 字段到 reminder_rules 表');

      // 更新现有记录的reminder_days值为30天
      db.run("UPDATE reminder_rules SET reminder_days = 30 WHERE reminder_days = 0 AND rule_type = 'age'", (err) => {
        if (err) {
          console.error('更新数据失败:', err.message);
        } else {
          console.log('已将现有年龄提醒规则的提前提醒天数设置为30天');
        }

        res.json({
          code: 20000,
          message: '成功添加reminder_days字段并更新现有数据'
        });
      });
    });
  });
});

// 测试接口：手动触发生日提醒（必须在其他模块路由之前）
router.get('/test-birthday-reminder', (req, res) => {
  console.log('手动触发生日提醒...');

  const cron = require('./cron');
  cron.executeBirthdayReminder();

  res.json({
    code: 20000,
    message: '生日提醒任务已手动触发',
    data: {
      tip: '通知会出现在首页小铃铛和通知中心页面'
    }
  });
});

// 使用各模块路由，先使用通知路由，再使用机构管理路由，然后使用特殊人群路由，接着使用导入路由，最后使用居民路由，避免路由冲突
router.use('/notifications', notificationRoutes);
router.use('/notification', notificationRoutes); // 兼容单数形式
router.use('/event', eventRoutes);
router.use('/', disabledPersonRoutes); // 残疾人路由优先加载
router.use('/', leadershipRoutes);
router.use('/', specialPeopleRoutes);
router.use('/', importRoutes);
router.use('/', residentRoutes);
router.use('/', archiveRoutes);
router.use('/config', configRoutes);
router.use('/dictionary', dictionaryRoutes);
router.use('/case-files', caseFileRoutes);
router.use('/', lowIncomeRoutes);

module.exports = router;