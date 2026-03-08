const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const routes = require('./routes')

const app = express()
const port = 3001

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use('/uploads', express.static('uploads'))
app.use('/', routes)

const server = app.listen(port, () => {
  console.log(`后端服务运行在 http://localhost:${port}`)
})

server.on('error', (error) => {
  console.error('服务器启动失败:', error.message)
})

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error.message)
  console.error(error.stack)
})
