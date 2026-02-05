const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./routes');
require('./cron');  // 引入定时任务脚本

const app = express();
const port = 3002;  // 新端口，避免与原服务冲突

// CORS配置 - 允许Vue 3前端访问
const corsOptions = {
  origin: ['http://localhost:4000', 'http://127.0.0.1:4000'],
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