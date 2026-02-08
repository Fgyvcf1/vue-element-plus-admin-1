console.log('启动后端服务...\n');

const { execSync } = require('child_process');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./routes');

const port = 3001;

/**
 * 杀死占用指定端口的进程
 */
function killPort(port) {
  try {
    // 获取占用端口的PID
    const output = execSync(`netstat -ano | findstr LISTENING | findstr :${port}`).toString();

    // 解析PID
    const lines = output.trim().split('\n');
    const pids = [];

    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 5) {
        const pid = parts[4];
        if (pid && !pids.includes(pid)) {
          pids.push(pid);
        }
      }
    });

    if (pids.length === 0) {
      console.log(`端口 ${port} 未被占用\n`);
      return;
    }

    // 终止占用端口的进程
    pids.forEach(pid => {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        console.log(`已终止占用端口 ${port} 的进程 ${pid}`);
      } catch (error) {
        console.error(`终止进程 ${pid} 失败:`, error.message);
      }
    });

    console.log(`✓ 端口 ${port} 已释放\n`);
  } catch (error) {
    console.log(`端口 ${port} 未被占用\n`);
  }
}

// 启动前先杀死占用端口的进程
console.log(`检查端口 ${port} 是否被占用...`);
killPort(port);

const app = express();

// CORS配置
const corsOptions = {
  origin: ['http://localhost:4000', 'http://127.0.0.1:4000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务
app.use('/uploads', express.static('uploads'));
app.use('/archives', express.static('archives'));

// API路由
app.use('/api', routes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err.message);
  console.error('错误堆栈:', err.stack);
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    error: err.message
  });
});

// 启动服务器
const server = app.listen(port, () => {
  console.log(`后端服务运行在 http://localhost:${port}`);
  console.log(`CORS配置: 允许来自 localhost:4000 和 localhost:5173 的请求`);
  console.log('居民查询API: http://localhost:3001/api/residents');
});

// 监听服务器错误
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`端口 ${port} 已被占用！`);
  } else {
    console.error('服务器启动失败:', error.message);
  }
  process.exit(1);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

module.exports = app;
