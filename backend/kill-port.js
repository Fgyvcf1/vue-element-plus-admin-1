const { execSync } = require('child_process');

/**
 * 检查并终止占用指定端口的进程
 * @param {number} port - 要检查的端口号
 * @returns {boolean} - 端口是否被释放成功
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
      console.log(`端口 ${port} 未被占用`);
      return true;
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
    
    return true;
  } catch (error) {
    console.log(`端口 ${port} 未被占用`);
    return true;
  }
}

// 导出函数供其他脚本使用
module.exports = killPort;

// 如果直接运行脚本，则处理命令行参数
if (require.main === module) {
  const port = parseInt(process.argv[2], 10);
  if (isNaN(port)) {
    console.error('请提供有效的端口号');
    process.exit(1);
  }
  
  killPort(port);
}
