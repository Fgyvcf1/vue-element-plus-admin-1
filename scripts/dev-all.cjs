const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')

const rootDir = path.resolve(__dirname, '..')
const backendDir = path.join(rootDir, 'backend')
const isWin = process.platform === 'win32'

const backend = spawn('node', ['start-backend.js'], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: true
})

const pnpmCmd = isWin
  ? path.join(process.env.APPDATA || '', 'npm', 'pnpm.cmd')
  : 'pnpm'
const pnpmBin = isWin && fs.existsSync(pnpmCmd) ? pnpmCmd : 'pnpm'

const frontend = spawn(pnpmBin, [isWin ? 'dev:win' : 'dev'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true
})

let shuttingDown = false
const shutdown = (code = 0) => {
  if (shuttingDown) return
  shuttingDown = true
  backend.kill()
  frontend.kill()
  process.exit(code)
}

backend.on('error', (err) => {
  console.error('启动后端失败:', err.message)
  shutdown(1)
})
frontend.on('error', (err) => {
  console.error('启动前端失败:', err.message)
  shutdown(1)
})

backend.on('exit', (code) => shutdown(code ?? 0))
frontend.on('exit', (code) => shutdown(code ?? 0))

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
