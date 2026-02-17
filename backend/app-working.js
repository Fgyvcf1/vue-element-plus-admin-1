const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const routes = require('./routes')

const app = express()
const port = 3001

// 中间件
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// 静态文件服务（用于访问上传的图片）
app.use('/uploads', express.static('uploads'))

// API路由
app.use('/', routes)

// 启动服务器
try {
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
}
