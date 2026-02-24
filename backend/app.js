const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const routes = require('./routes')
const permissionRoutes = require('./routes/permissionRoutes')
const db = require('./db')
const { initDatabase } = require('./init-db') // 引入数据库初始化函数
const fs = require('fs') // 引入fs模块
const path = require('path') // 引入path模块
require('./cron') // 引入定时任务脚本

// 配置错误日志文件
const errorLogPath = path.join(__dirname, 'runtime-error.log')
const errorLogStream = fs.createWriteStream(errorLogPath, { flags: 'a' })

// 重写 console.error，将错误同时输出到控制台和文件
const originalConsoleError = console.error
console.error = (...args) => {
  originalConsoleError(...args)
  const timestamp = new Date().toISOString()
  errorLogStream.write(`[${timestamp}] `)
  args.forEach((arg) => {
    if (typeof arg === 'object' && arg !== null) {
      errorLogStream.write(JSON.stringify(arg, null, 2) + '\n')
    } else {
      errorLogStream.write(arg + ' ')
    }
  })
  errorLogStream.write('\n')
}

const app = express()
const port = Number(process.env.PORT || 3002) // 使用3002端口

// CORS配置 - 允许Vue 3前端访问
const corsOptions = {
  origin: [
    'http://localhost:4000',
    'http://127.0.0.1:4000',
    `http://localhost:${port}`,
    `http://127.0.0.1:${port}`
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
  credentials: true
}
app.use(cors(corsOptions))
// 增加请求大小限制，处理Excel导入
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }))

// 静态文件服务（用于访问上传的图片和生成的PDF）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/archives', express.static(path.join(__dirname, 'archives')))

// 登录路由
app.post('/api/user/login', async (req, res) => {
  const { username, password } = req.body

  try {
    // 先查询用户（不验证密码）
    const [users] = await db.pool.execute(
      'SELECT u.*, r.role_code, r.role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.username = ?',
      [username]
    )

    if (users.length === 0) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      })
    }

    const user = users[0]

    // 验证密码（支持明文和哈希）
    const isPasswordValid = (user.password === password) || (user.password_hash === password)
    if (!isPasswordValid) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      })
    }

    // 获取用户权限
    let permissions = []
    if (user.role_code === 'superadmin' || user.role === 'superadmin') {
      const [permRows] = await db.pool.execute('SELECT permission_code FROM permissions')
      permissions = permRows.map(r => r.permission_code)
    } else if (user.role_id) {
      const [permRows] = await db.pool.execute(`
        SELECT p.permission_code
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = ?
      `, [user.role_id])
      permissions = permRows.map(r => r.permission_code)
    }

    res.json({
      code: 20000,
      data: {
        id: user.id,
        username: user.username,
        realName: user.real_name,
        token: 'mock-token-' + Date.now(),
        role: user.role_code || user.role || 'user',
        roleName: user.role_name,
        permissions: permissions
      },
      message: '登录成功'
    })
  } catch (err) {
    console.error('登录失败:', err.message)
    res.status(500).json({
      code: 500,
      message: '登录失败: ' + err.message
    })
  }
})

// 登出路由
app.get('/api/user/loginOut', (req, res) => {
  res.json({
    code: 20000,
    message: '登出成功'
  })
})

// API路由
app.use('/api', routes)
app.use('/api/permission', permissionRoutes)

const frontendDir = process.env.FRONTEND_DIR || path.join(__dirname, 'frontend')
const frontendIndex = path.join(frontendDir, 'index.html')
if (fs.existsSync(frontendDir) && fs.existsSync(frontendIndex)) {
  app.use(express.static(frontendDir))
  app.get(/.*/, (_req, res) => {
    res.sendFile(frontendIndex)
  })
}

// 启动服务器前先初始化数据库
async function startServer() {
  try {
    console.log('正在初始化数据库...')
    const dbInitialized = await initDatabase()
    if (!dbInitialized) {
      console.error('数据库初始化失败，服务无法启动')
      process.exit(1)
    }
    
    const server = app.listen(port, () => {
      console.log(`后端服务运行在 http://localhost:${port}`)
    })

    // 监听服务器错误
    server.on('error', (error) => {
      console.error('服务器启动失败:', error.message)
    })

    // 监听进程错误
    process.on('uncaughtException', (error) => {
      console.error('未捕获的异常:', error.message)
      console.error(error.stack)
    })

    // 监听进程终止
    process.on('SIGINT', () => {
      console.log('服务器正在关闭...')
      server.close(() => {
        console.log('服务器已关闭')
        process.exit(0)
      })
    })
  } catch (error) {
    console.error('启动服务器时发生错误:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

startServer()