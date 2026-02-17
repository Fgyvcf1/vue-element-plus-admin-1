const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')
const db = require('../db')

class PDFService {
  constructor() {
    this.templatesDir = path.join(__dirname, '../templates')
    this.archivesDir = path.join(__dirname, '../archives')
    this.baseUrl = 'http://localhost:3001/archives'

    // 确保目录存在
    if (!fs.existsSync(this.archivesDir)) {
      fs.mkdirSync(this.archivesDir, { recursive: true })
    }
  }

  /**
   * 加载HTML模板
   */
  loadTemplate(templateName, data) {
    const templatePath = path.join(this.templatesDir, templateName)

    if (!fs.existsSync(templatePath)) {
      throw new Error(`模板文件不存在: ${templateName}`)
    }

    let template = fs.readFileSync(templatePath, 'utf8')

    // 简单的模板变量替换
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g')
      template = template.replace(regex, value || '')
    }

    return template
  }

  /**
   * 生成调解申请书PDF
   */
  async generateApplicationPDF(applicationData) {
    let browser = null

    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })

      const page = await browser.newPage()

      // 准备模板数据
      const templateData = {
        archive_id: applicationData.archive_id,
        apply_date: this.formatDate(applicationData.apply_date),
        dispute_type: applicationData.dispute_type || '',
        dispute_description: applicationData.dispute_description || '',
        request_content: applicationData.request_content || '',
        occurrence_date: this.formatDate(applicationData.occurrence_date),
        occurrence_location: applicationData.occurrence_location || '',
        // 申请人信息（格式化为列表）
        applicants_list: this.formatApplicants(applicationData.applicants || []),
        // 被申请人信息（格式化为列表）
        respondents_list: this.formatRespondents(applicationData.respondents || [])
      }

      // 加载HTML模板
      const html = this.loadTemplate('application-template.html', templateData)

      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000
      })

      // 生成PDF
      const fileName = `${applicationData.archive_id}_申请书.pdf`
      const pdfPath = path.join(this.archivesDir, fileName)
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      })

      await browser.close()

      // 保存到数据库
      const fileUrl = `${this.baseUrl}/${encodeURIComponent(fileName)}`
      await this.saveToDatabase(
        applicationData.archive_id,
        fileName,
        pdfPath,
        fileUrl,
        'application'
      )

      return {
        file_path: pdfPath,
        file_url: fileUrl,
        file_name: fileName
      }
    } catch (error) {
      if (browser) {
        await browser.close()
      }
      throw error
    }
  }

  /**
   * 生成调解记录PDF
   */
  async generateRecordPDF(recordData, images = []) {
    let browser = null

    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })

      const page = await browser.newPage()

      // 准备模板数据
      const templateData = {
        archive_id: recordData.archive_id,
        mediation_date: this.formatDate(recordData.mediation_date),
        mediation_location: recordData.mediation_location || '',
        mediators: recordData.mediators || '',
        process_record: recordData.process_record || '',
        mediation_result: recordData.mediation_result || '',
        agreement: recordData.agreement === 'yes' ? '是' : '否',
        images_count: images.length,
        images_list: this.formatImages(images)
      }

      // 加载HTML模板
      const html = this.loadTemplate('record-template.html', templateData)

      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000
      })

      // 生成PDF
      const fileName = `${recordData.archive_id}_调解记录.pdf`
      const pdfPath = path.join(this.archivesDir, fileName)
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      })

      await browser.close()

      // 保存到数据库
      const fileUrl = `${this.baseUrl}/${encodeURIComponent(fileName)}`
      await this.saveToDatabase(recordData.archive_id, fileName, pdfPath, fileUrl, 'record')

      return {
        file_path: pdfPath,
        file_url: fileUrl,
        file_name: fileName
      }
    } catch (error) {
      if (browser) {
        await browser.close()
      }
      throw error
    }
  }

  /**
   * 生成调解协议书PDF
   */
  async generateAgreementPDF(agreementData) {
    let browser = null

    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })

      const page = await browser.newPage()

      // 准备模板数据
      const templateData = {
        archive_id: agreementData.archive_id,
        agreement_date: this.formatDate(agreementData.agreement_date),
        agreement_content: agreementData.agreement_content || '',
        performance_period: agreementData.performance_period || '',
        breach_liability: agreementData.breach_liability || '',
        party_a_sign: agreementData.party_a_sign || '',
        party_b_sign: agreementData.party_b_sign || '',
        mediator_sign: agreementData.mediator_sign || ''
      }

      // 加载HTML模板
      const html = this.loadTemplate('agreement-template.html', templateData)

      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000
      })

      // 生成PDF
      const fileName = `${agreementData.archive_id}_协议书.pdf`
      const pdfPath = path.join(this.archivesDir, fileName)
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      })

      await browser.close()

      // 保存到数据库
      const fileUrl = `${this.baseUrl}/${encodeURIComponent(fileName)}`
      await this.saveToDatabase(agreementData.archive_id, fileName, pdfPath, fileUrl, 'agreement')

      return {
        file_path: pdfPath,
        file_url: fileUrl,
        file_name: fileName
      }
    } catch (error) {
      if (browser) {
        await browser.close()
      }
      throw error
    }
  }

  /**
   * 将PDF文件信息保存到数据库
   */
  async saveToDatabase(archiveId, fileName, filePath, fileUrl, type) {
    try {
      // 获取最大ID
      const [maxIdResult] = await db.pool.execute('SELECT MAX(id) as maxId FROM archive_files')
      const newId = (maxIdResult[0].maxId || 0) + 1

      const sql = `
        INSERT INTO archive_files (id, archive_id, file_name, file_path, file_url, type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `

      await db.pool.execute(sql, [newId, archiveId, fileName, filePath, fileUrl, type])
      return { id: newId }
    } catch (err) {
      console.error('保存PDF文件信息到数据库失败:', err)
      throw err
    }
  }

  /**
   * 日期格式化
   */
  formatDate(dateStr) {
    if (!dateStr) return ''

    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return dateStr

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}年${month}月${day}日`
  }

  /**
   * 格式化申请人列表
   */
  formatApplicants(applicants) {
    if (!applicants || applicants.length === 0) return '<p>无</p>'

    let html = '<ul style="margin: 0; padding-left: 20px;">'
    applicants.forEach((applicant) => {
      html += `<li>
        <strong>姓名：</strong>${applicant.name || ''}
        ${applicant.id_card ? `<br><strong>身份证号：</strong>${applicant.id_card}` : ''}
        ${applicant.phone ? `<br><strong>联系电话：</strong>${applicant.phone}` : ''}
        ${applicant.address ? `<br><strong>住址：</strong>${applicant.address}` : ''}
        ${applicant.relationship ? `<br><strong>与案件关系：</strong>${applicant.relationship}` : ''}
      </li>`
    })
    html += '</ul>'

    return html
  }

  /**
   * 格式化被申请人列表
   */
  formatRespondents(respondents) {
    if (!respondents || respondents.length === 0) return '<p>无</p>'

    let html = '<ul style="margin: 0; padding-left: 20px;">'
    respondents.forEach((respondent) => {
      html += `<li>
        <strong>姓名：</strong>${respondent.name || ''}
        ${respondent.id_card ? `<br><strong>身份证号：</strong>${respondent.id_card}` : ''}
        ${respondent.phone ? `<br><strong>联系电话：</strong>${respondent.phone}` : ''}
        ${respondent.address ? `<br><strong>住址：</strong>${respondent.address}` : ''}
        ${respondent.relationship ? `<br><strong>与案件关系：</strong>${respondent.relationship}` : ''}
      </li>`
    })
    html += '</ul>'

    return html
  }

  /**
   * 格式化图片列表
   */
  formatImages(images) {
    if (!images || images.length === 0) return '<p>无</p>'

    let html =
      '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">'
    images.forEach((image) => {
      html += `<div style="text-align: center; border: 1px solid #ddd; padding: 10px;">
        <img src="${image.file_path}" style="max-width: 100%; max-height: 150px;" alt="${image.description || ''}" />
        <p style="margin: 5px 0 0; font-size: 12px;">${image.description || '未命名图片'}</p>
      </div>`
    })
    html += '</div>'

    return html
  }

  /**
   * 删除PDF文件
   */
  deletePDF(pdfPath) {
    try {
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath)
        return true
      }
      return false
    } catch (error) {
      console.error('删除PDF失败:', error)
      return false
    }
  }
}

module.exports = new PDFService()
