const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const caseFileService = require('../services/caseFileService')

/**
 * 生成调解案卷PDF
 * POST /api/case-files/:id/generate
 */
router.post('/:id/generate', async (req, res) => {
  const { id } = req.params

  try {
    const result = await caseFileService.generateCaseFilePDF(id)

    res.json({
      code: 20000,
      message: '调解案卷生成成功',
      data: result
    })
  } catch (error) {
    console.error('生成调解案卷失败:', error.message)
    res.status(500).json({
      code: 50000,
      message: '生成调解案卷失败: ' + error.message
    })
  }
})

/**
 * 获取调解案卷列表
 * GET /api/case-files
 */
router.get('/', async (req, res) => {
  const { page = 1, pageSize = 20, keyword = '' } = req.query

  try {
    const result = await caseFileService.getCaseFileList(
      parseInt(page),
      parseInt(pageSize),
      keyword
    )

    res.json({
      code: 20000,
      data: result
    })
  } catch (error) {
    console.error('获取调解案卷列表失败:', error.message)
    res.status(500).json({
      code: 50000,
      message: '获取调解案卷列表失败: ' + error.message
    })
  }
})

/**
 * 获取单个调解案卷信息
 * GET /api/case-files/:id
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params

  try {
    const result = await caseFileService.getCaseFileById(id)

    if (!result) {
      return res.status(404).json({
        code: 40400,
        message: '调解案卷不存在'
      })
    }

    res.json({
      code: 20000,
      data: result
    })
  } catch (error) {
    console.error('获取调解案卷信息失败:', error.message)
    res.status(500).json({
      code: 50000,
      message: '获取调解案卷信息失败: ' + error.message
    })
  }
})

/**
 * 在线查看调解案卷PDF
 * GET /api/case-files/:id/view
 */
router.get('/:id/view', async (req, res) => {
  const { id } = req.params

  try {
    const caseFile = await caseFileService.getCaseFileById(id)

    if (!caseFile) {
      return res.status(404).json({
        code: 40400,
        message: '调解案卷不存在'
      })
    }

    const filePath = caseFile.file_path

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        code: 40400,
        message: 'PDF文件不存在'
      })
    }

    // 设置响应头，让浏览器直接显示PDF
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      'inline; filename="' + encodeURIComponent(caseFile.file_name) + '"'
    )

    // 发送文件
    const fileStream = fs.createReadStream(filePath)
    fileStream.pipe(res)
  } catch (error) {
    console.error('查看调解案卷失败:', error.message)
    res.status(500).json({
      code: 50000,
      message: '查看调解案卷失败: ' + error.message
    })
  }
})

/**
 * 下载调解案卷PDF
 * GET /api/case-files/:id/download
 */
router.get('/:id/download', async (req, res) => {
  const { id } = req.params

  try {
    const caseFile = await caseFileService.getCaseFileById(id)

    if (!caseFile) {
      return res.status(404).json({
        code: 40400,
        message: '调解案卷不存在'
      })
    }

    const filePath = caseFile.file_path

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        code: 40400,
        message: 'PDF文件不存在'
      })
    }

    // 设置响应头，让浏览器下载PDF
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="' + encodeURIComponent(caseFile.file_name) + '"'
    )

    // 发送文件
    const fileStream = fs.createReadStream(filePath)
    fileStream.pipe(res)
  } catch (error) {
    console.error('下载调解案卷失败:', error.message)
    res.status(500).json({
      code: 50000,
      message: '下载调解案卷失败: ' + error.message
    })
  }
})

module.exports = router
