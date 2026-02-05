const fs = require('fs');
const path = require('path');

// 捕获错误日志
const errorLog = [];
const originalConsoleError = console.error;
console.error = function(...args) {
  errorLog.push(args.join(' '));
  originalConsoleError.apply(console, args);
};

try {
  console.log('开始加载 app.js...');
  require('./app.js');
  console.log('app.js 加载成功');
} catch (error) {
  console.error('加载 app.js 失败:', error.message);
  console.error('错误堆栈:', error.stack);
  
  // 将错误写入文件
  const logPath = path.join(__dirname, 'startup-error.log');
  fs.writeFileSync(logPath, errorLog.join('\n'), 'utf-8');
  console.log('错误日志已保存到:', logPath);
}
