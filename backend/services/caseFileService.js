const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const db = require('../db');

class CaseFileService {
  constructor() {
    this.templatesDir = path.join(__dirname, '../templates');
    this.caseFilesDir = path.join(__dirname, '../archives/case-files');
    this.baseUrl = 'http://localhost:3001/archives/case-files';
    
    // 确保目录存在
    if (!fs.existsSync(this.caseFilesDir)) {
      fs.mkdirSync(this.caseFilesDir, { recursive: true });
    }
  }

  /**
   * 加载HTML模板
   */
  loadTemplate(templateName, data) {
    const templatePath = path.join(this.templatesDir, templateName);
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`模板文件不存在: ${templateName}`);
    }
    
    let template = fs.readFileSync(templatePath, 'utf8');
    
    // 简单的模板变量替换
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(regex, value || '');
    }
    
    // 处理条件语句 {{#if key}}...{{/if}}
    template = template.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, key, content) => {
      return data[key] ? content : '';
    });
    
    return template;
  }

  /**
   * 生成调解案卷PDF
   */
  async generateCaseFilePDF(archiveId) {
    let browser = null;
    
    try {
      // 获取档案详情
      const archiveDetail = await this.getArchiveDetail(archiveId);
      
      if (!archiveDetail) {
        throw new Error('档案不存在');
      }
      
      if (!archiveDetail.application) {
        throw new Error('请先填写申请书');
      }
      
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      
      // 准备模板数据
      const templateData = {
        archive_id: archiveId,
        generate_date: this.formatDate(new Date()),
        // 申请人信息
        applicant_names: this.formatApplicantNames(archiveDetail.applicants),
        respondent_names: this.formatApplicantNames(archiveDetail.respondents),
        // 申请书部分
        apply_date: this.formatDate(archiveDetail.application.apply_date),
        dispute_type: archiveDetail.application.dispute_type || '',
        dispute_description: archiveDetail.application.dispute_description || '',
        request_content: archiveDetail.application.request_content || '',
        occurrence_date: this.formatDate(archiveDetail.application.occurrence_date),
        occurrence_location: archiveDetail.application.occurrence_location || '',
        applicants_list: this.formatApplicants(archiveDetail.applicants || []),
        respondents_list: this.formatRespondents(archiveDetail.respondents || []),
        // 调解记录部分
        has_records: archiveDetail.records && archiveDetail.records.length > 0,
        records_list: this.formatRecords(archiveDetail.records || []),
        // 协议书部分
        has_agreement: !!archiveDetail.agreement,
        agreement_date: archiveDetail.agreement ? this.formatDate(archiveDetail.agreement.agreement_date) : '',
        agreement_content: archiveDetail.agreement ? archiveDetail.agreement.agreement_content : '',
        performance_period: archiveDetail.agreement ? archiveDetail.agreement.performance_period : '',
        breach_liability: archiveDetail.agreement ? archiveDetail.agreement.breach_liability : ''
      };
      
      // 加载HTML模板
      const html = this.loadTemplate('case-file-template.html', templateData);
      
      await page.setContent(html, { 
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      
      // 生成PDF
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const fileName = `${archiveId}_调解案卷_${dateStr}.pdf`;
      const pdfPath = path.join(this.caseFilesDir, fileName);
      
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '60px',
          right: '20px',
          bottom: '60px',
          left: '20px'
        },
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-size: 10px; width: 100%; text-align: center; padding: 10px 20px; border-bottom: 1px solid #ccc;">
            <span>档案编号：${archiveId}</span>
          </div>
        `,
        footerTemplate: `
          <div style="font-size: 10px; width: 100%; text-align: center; padding: 10px 20px; border-top: 1px solid #ccc;">
            <span class="pageNumber"></span> / <span class="totalPages"></span>
          </div>
        `
      });
      
      await browser.close();
      
      // 保存到数据库
      const fileUrl = `${this.baseUrl}/${encodeURIComponent(fileName)}`;
      await this.saveToDatabase(archiveId, fileName, pdfPath, fileUrl);
      
      return {
        file_path: pdfPath,
        file_url: fileUrl,
        file_name: fileName
      };
      
    } catch (error) {
      if (browser) {
        await browser.close();
      }
      throw error;
    }
  }

  /**
   * 获取档案详情
   */
  async getArchiveDetail(archiveId) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM mediation_archives WHERE archive_id = ?',
        [archiveId],
        (err, archive) => {
          if (err) {
            return reject(err);
          }
          
          if (!archive) {
            return resolve(null);
          }
          
          // 查询申请书
          db.get(
            'SELECT * FROM mediation_applications WHERE archive_id = ?',
            [archiveId],
            (err, application) => {
              if (err) {
                return reject(err);
              }
              
              // 查询申请人
              db.all(
                'SELECT * FROM mediation_applicants WHERE archive_id = ? ORDER BY id',
                [archiveId],
                (err, applicants) => {
                  if (err) {
                    return reject(err);
                  }
                  
                  // 查询被申请人
                  db.all(
                    'SELECT * FROM mediation_respondents WHERE archive_id = ? ORDER BY id',
                    [archiveId],
                    (err, respondents) => {
                      if (err) {
                        return reject(err);
                      }
                      
                      // 查询调解记录
                      db.all(
                        'SELECT * FROM mediation_records WHERE archive_id = ? ORDER BY mediation_date DESC',
                        [archiveId],
                        (err, records) => {
                          if (err) {
                            return reject(err);
                          }
                          
                          // 查询调解协议
                          db.get(
                            'SELECT * FROM mediation_agreements WHERE archive_id = ?',
                            [archiveId],
                            (err, agreement) => {
                              if (err) {
                                return reject(err);
                              }
                              
                              resolve({
                                archive,
                                application: application || null,
                                applicants: applicants || [],
                                respondents: respondents || [],
                                records: records || [],
                                agreement: agreement || null
                              });
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  }

  /**
   * 获取案卷列表
   */
  async getCaseFileList(page = 1, pageSize = 20, keyword = '') {
    const offset = (page - 1) * pageSize;
    
    let whereClause = "WHERE type = 'case_file'";
    let params = [];
    
    if (keyword) {
      whereClause += " AND (archive_id LIKE ? OR file_name LIKE ?)";
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    // 查询总数
    const countSql = `SELECT COUNT(*) as total FROM archive_files ${whereClause}`;
    
    // 查询列表
    const listSql = `
      SELECT 
        id,
        archive_id,
        file_name,
        file_url,
        created_at
      FROM archive_files
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    return new Promise((resolve, reject) => {
      db.get(countSql, params, (err, countRow) => {
        if (err) {
          return reject(err);
        }
        
        const listParams = [...params, pageSize, offset];
        db.all(listSql, listParams, (err, rows) => {
          if (err) {
            return reject(err);
          }
          
          resolve({
            total: countRow.total,
            items: rows,
            page,
            pageSize
          });
        });
      });
    });
  }

  /**
   * 获取单个案卷信息
   */
  async getCaseFileById(archiveId) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM archive_files 
         WHERE archive_id = ? AND type = 'case_file'
         ORDER BY created_at DESC LIMIT 1`,
        [archiveId],
        (err, row) => {
          if (err) {
            return reject(err);
          }
          resolve(row || null);
        }
      );
    });
  }

  /**
   * 将PDF文件信息保存到数据库
   */
  async saveToDatabase(archiveId, fileName, filePath, fileUrl) {
    try {
      // 删除旧的案卷文件记录
      await new Promise((resolve, reject) => {
        db.run(
          'DELETE FROM archive_files WHERE archive_id = ? AND type = ?',
          [archiveId, 'case_file'],
          (err) => {
            if (err) {
              return reject(err);
            }
            resolve();
          }
        );
      });
      
      // 获取最大ID
      const [maxIdResult] = await db.pool.execute('SELECT MAX(id) as maxId FROM archive_files');
      const newId = (maxIdResult[0].maxId || 0) + 1;
      
      const sql = `
        INSERT INTO archive_files (id, archive_id, file_name, file_path, file_url, type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `;
      
      await db.pool.execute(sql, [newId, archiveId, fileName, filePath, fileUrl, 'case_file']);
      return { id: newId };
    } catch (err) {
      console.error('保存案卷PDF文件信息到数据库失败:', err);
      throw err;
    }
  }

  /**
   * 日期格式化
   */
  formatDate(dateStr) {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}年${month}月${day}日`;
  }

  /**
   * 格式化申请人姓名列表
   */
  formatApplicantNames(applicants) {
    if (!applicants || applicants.length === 0) return '无';
    return applicants.map(a => a.name || a.resident_name || '').filter(n => n).join('、');
  }

  /**
   * 格式化申请人列表
   */
  formatApplicants(applicants) {
    if (!applicants || applicants.length === 0) return '<p>无</p>';
    
    let html = '<ul style="margin: 0; padding-left: 20px;">';
    applicants.forEach(applicant => {
      html += `<li>
        <strong>姓名：</strong>${applicant.name || applicant.resident_name || ''}
        ${applicant.id_card || applicant.resident_id_card ? `<br><strong>身份证号：</strong>${applicant.id_card || applicant.resident_id_card}` : ''}
        ${applicant.phone || applicant.resident_phone ? `<br><strong>联系电话：</strong>${applicant.phone || applicant.resident_phone}` : ''}
        ${applicant.address || applicant.resident_address ? `<br><strong>住址：</strong>${applicant.address || applicant.resident_address}` : ''}
      </li>`;
    });
    html += '</ul>';
    
    return html;
  }

  /**
   * 格式化被申请人列表
   */
  formatRespondents(respondents) {
    if (!respondents || respondents.length === 0) return '<p>无</p>';
    
    let html = '<ul style="margin: 0; padding-left: 20px;">';
    respondents.forEach(respondent => {
      html += `<li>
        <strong>姓名：</strong>${respondent.name || respondent.resident_name || ''}
        ${respondent.id_card || respondent.resident_id_card ? `<br><strong>身份证号：</strong>${respondent.id_card || respondent.resident_id_card}` : ''}
        ${respondent.phone || respondent.resident_phone ? `<br><strong>联系电话：</strong>${respondent.phone || respondent.resident_phone}` : ''}
        ${respondent.address || respondent.resident_address ? `<br><strong>住址：</strong>${respondent.address || respondent.resident_address}` : ''}
      </li>`;
    });
    html += '</ul>';
    
    return html;
  }

  /**
   * 格式化调解记录列表
   */
  formatRecords(records) {
    if (!records || records.length === 0) {
      return '<div class="placeholder-page"><h3>暂无调解记录</h3><p>本案尚未进行调解</p></div>';
    }
    
    let html = '';
    records.forEach((record, index) => {
      html += `
        <div class="record-item">
          <h4>调解记录 #${index + 1}</h4>
          <div class="info-row">
            <span class="info-label">调解日期：</span>
            <span class="info-content">${this.formatDate(record.mediation_date)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">调解地点：</span>
            <span class="info-content">${record.mediation_location || ''}</span>
          </div>
          <div class="info-row">
            <span class="info-label">调解员：</span>
            <span class="info-content">${record.mediators || ''}</span>
          </div>
          <div class="info-row">
            <span class="info-label">是否达成协议：</span>
            <span class="info-content">${record.agreement === 'yes' ? '是' : '否'}</span>
          </div>
          <div class="section">
            <div class="section-title">调解过程</div>
            <div class="description">${record.process_record || ''}</div>
          </div>
          <div class="section">
            <div class="section-title">调解结果</div>
            <div class="description">${record.mediation_result || ''}</div>
          </div>
        </div>
      `;
    });
    
    return html;
  }
}

module.exports = new CaseFileService();
