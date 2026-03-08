const { execSync } = require('child_process')

console.log('测试端口清理功能...\n')

const port = 3001

/**
 * 杀死占用指定端口的进程
 */
function killPort(port) {
  try {
    // 获取占用端口的PID
    const output = execSync(`netstat -ano | findstr LISTENING | findstr :${port}`).toString()

    // 解析PID
    const lines = output.trim().split('\n')
    const pids = []

    lines.forEach((line) => {
      const parts = line.trim().split(/\s+/)
      if (parts.length >= 5) {
        const pid = parts[4]
        if (pid && !pids.includes(pid)) {
          pids.push(pid)
        }
      }
    })

    if (pids.length === 0) {
      console.log(`端口 ${port} 未被占用\n`)
      return true
    }

    console.log(`发现 ${pids.length} 个进程占用端口 ${port}:`, pids.join(', '))

    // 终止占用端口的进程
    pids.forEach((pid) => {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' })
        console.log(`✓ 已终止进程 ${pid}`)
      } catch (error) {
        console.error(`✗ 终止进程 ${pid} 失败:`, error.message)
      }
    })

    console.log(`\n✓ 端口 ${port} 已释放\n`)
    return true
  } catch (error) {
    console.log(`端口 ${port} 未被占用\n`)
    return true
  }
}

// 执行清理
console.log(`清理端口 ${port}...`)
const success = killPort(port)

if (success) {
  console.log('✓ 端口清理完成')

  // 验证端口是否已释放
  try {
    const output = execSync(`netstat -ano | findstr LISTENING | findstr :${port}`).toString()
    if (output.trim()) {
      console.log(`✗ 警告: 端口 ${port} 仍被占用`)
    } else {
      console.log(`✓ 端口 ${port} 已确认释放`)
    }
  } catch (error) {
    console.log(`✓ 端口 ${port} 已确认释放`)
  }
} else {
  console.log('✗ 端口清理失败')
}
