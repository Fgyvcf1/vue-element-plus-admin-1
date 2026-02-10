const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./routes');
const fs = require('fs'); // 引入fs模块
const path = require('path'); // 引入path模块
require('./cron');  // 引入定时任务脚本

// 配置错误日志文件
const errorLogPath = path.join(__dirname, 'runtime-error.log');
const errorLogStream = fs.createWriteStream(errorLogPath, { flags: 'a' });

// 重写 console.error，将错误同时输出到控制台和文件
const originalConsoleError = console.error;
console.error = (...args) => {
  originalConsoleError(...args);
  const timestamp = new Date().toISOString();
  errorLogStream.write(`[${timestamp}] `);
  args.forEach(arg => {
    if (typeof arg === 'object' && arg !== null) {
      errorLogStream.write(JSON.stringify(arg, null, 2) + '\n');
    } else {
      errorLogStream.write(arg + ' ');
    }
  });
  errorLogStream.write('\n');
};

const app = express();
const port = 3001;  // 端口改回3001

// CORS配置 - 允许Vue 3前端访问
const corsOptions = {
  origin: ['http://localhost:4000', 'http://127.0.0.1:4000', 'http://localhost:3001', 'http://127.0.0.1:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));
// 增加请求大小限制，处理Excel导入
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务（用于访问上传的图片和生成的PDF）
app.use('/uploads', express.static('uploads'));
app.use('/archives', express.static('archives'));

// 登录路由
app.post('/api/user/login', (req, res) => {
  const { username, password } = req.body;
  // 简单验证，实际应该查询数据库
  if (username === 'admin' && password === 'admin') {
    res.json({
      code: 20000,
      data: {
        username: 'admin',
        token: 'mock-token-' + Date.now(),
        role: 'admin'
      },
      message: '登录成功'
    });
  } else {
    res.status(401).json({
      code: 401,
      message: '用户名或密码错误'
    });
  }
});

// 登出路由
app.get('/api/user/loginOut', (req, res) => {
  res.json({
    code: 20000,
    message: '登出成功'
  });
});

// API路由
app.use('/api', routes);

// 启动服务器
try {
  const server = app.listen(port, () => {
    console.log(`后端服务运行在 http://localhost:${port}`);
  });
  
  // 监听服务器错误
  server.on('error', (error) => {
    console.error('服务器启动失败:', error.message);
  });
  
  // 监听进程错误
  process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error.message);
    console.error(error.stack);
  });
  
  // 监听进程终止
  process.on('SIGINT', () => {
    console.log('服务器正在关闭...');
    server.close(() => {
      console.log('服务器已关闭');
      process.exit(0);
    });
  });
  
} catch (error) {
  console.error('启动服务器时发生错误:', error.message);
  console.error(error.stack);
}