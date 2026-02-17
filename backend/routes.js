const express = require('express')
const router = express.Router()

// 导入各个模块的路由
const residentRoutes = require('./routes/residentRoutes')
const lowIncomeRoutes = require('./routes/lowIncomeRoutes')
const disabledPersonRoutes = require('./routes/disabledPersonRoutes')
const archiveRoutes = require('./routes/archiveRoutes')
const permissionRoutes = require('./routes/permissionRoutes')
const profileRoutes = require('./routes/profileRoutes')
const leadershipRoutes = require('./routes/leadershipRoutes')
const notificationRoutes = require('./routes/notification')
const eventRoutes = require('./routes/event')
const dictionaryRoutes = require('./routes/dictionaryRoutes')

// 将各个模块的路由注册到主路由
router.use('', residentRoutes)           // 居民管理相关路由
router.use('', lowIncomeRoutes)          // 低收入管理相关路由
router.use('', disabledPersonRoutes)     // 残疾人管理相关路由
router.use('', archiveRoutes)            // 调解档案相关路由
router.use('/permission', permissionRoutes) // 权限管理相关路由
router.use('', profileRoutes) // 个人资料相关路由
router.use('', leadershipRoutes)         // 领导班子相关路由
// 待办提醒（兼容旧路径）
router.use('/todo-reminders', notificationRoutes)
router.use('/notifications', notificationRoutes)
router.use('/notification', notificationRoutes)
router.use('', eventRoutes)              // 事件相关路由
router.use('/dictionary', dictionaryRoutes) // 字典相关路由

// 默认路由
router.get('/', (req, res) => {
  res.json({ message: 'Backend API is running...' })
})

module.exports = router
