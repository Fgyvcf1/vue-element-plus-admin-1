const db = require('../db')
const PDFService = require('./pdfService')

class ArchiveService {
  constructor() {
    this.pdfService = PDFService
  }

  /**
   * 生成档案编号
   * 使用事务和行锁确保原子性
   */
  async generateArchiveId(prefix) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION')

        // 获取当前序号并加锁
        db.get(
          'SELECT current_number FROM archive_sequences WHERE prefix = ?',
          [prefix],
          (err, row) => {
            if (err) {
              db.run('ROLLBACK')
              return reject(err)
            }

            const newNumber = (row ? row.current_number : 0) + 1
            const paddedNumber = String(newNumber).padStart(3, '0')
            const archiveId = `${prefix}-${paddedNumber}`

            if (row) {
              // 更新现有记录
              db.run(
                'UPDATE archive_sequences SET current_number = ?, updated_at = CURRENT_TIMESTAMP WHERE prefix = ?',
                [newNumber, prefix],
                (err) => {
                  if (err) {
                    db.run('ROLLBACK')
                    return reject(err)
                  }
                  db.run('COMMIT')
                  resolve(archiveId)
                }
              )
            } else {
              // 插入新记录
              db.run(
                'INSERT INTO archive_sequences (prefix, current_number) VALUES (?, ?)',
                [prefix, newNumber],
                (err) => {
                  if (err) {
                    db.run('ROLLBACK')
                    return reject(err)
                  }
                  db.run('COMMIT')
                  resolve(archiveId)
                }
              )
            }
          }
        )
      })
    })
  }

  /**
   * 创建档案
   */
  async createArchive(prefix) {
    try {
      // 生成档案编号
      const archiveId = await this.generateArchiveId(prefix)

      return new Promise((resolve, reject) => {
        const sql = `
          INSERT INTO mediation_archives (archive_id, prefix, sequence_number, status)
          VALUES (?, ?, ?, 'draft')
        `

        const sequenceNumber = parseInt(archiveId.split('-')[1])

        db.run(sql, [archiveId, prefix, sequenceNumber], function (err) {
          if (err) {
            return reject(err)
          }

          resolve({
            id: this.lastID,
            archive_id: archiveId,
            prefix: prefix,
            sequence_number: sequenceNumber,
            status: 'draft'
          })
        })
      })
    } catch (error) {
      throw error
    }
  }

  /**
   * 获取档案列表
   */
  async getArchives(page = 1, pageSize = 20, filters = {}) {
    const offset = (page - 1) * pageSize
    const { status, keyword, startDate, endDate } = filters

    let whereClauses = ['1=1']
    let params = []

    if (status) {
      whereClauses.push('a.status = ?')
      params.push(status)
    }

    if (keyword) {
      whereClauses.push(`(
        a.archive_id LIKE ? OR 
        app.dispute_type LIKE ? OR 
        (SELECT GROUP_CONCAT(name) FROM mediation_applicants WHERE archive_id = a.archive_id) LIKE ? OR
        (SELECT GROUP_CONCAT(name) FROM mediation_respondents WHERE archive_id = a.archive_id) LIKE ?
      )`)
      const likeKeyword = `%${keyword}%`
      params.push(likeKeyword, likeKeyword, likeKeyword, likeKeyword)
    }

    if (startDate) {
      whereClauses.push('DATE(a.created_at) >= ?')
      params.push(startDate)
    }

    if (endDate) {
      whereClauses.push('DATE(a.created_at) <= ?')
      params.push(endDate)
    }

    const whereSql = whereClauses.join(' AND ')

    // 查询总数
    const countSql = `
      SELECT COUNT(DISTINCT a.id) as total
      FROM mediation_archives a
      LEFT JOIN mediation_applications app ON a.archive_id = app.archive_id
      WHERE ${whereSql}
    `

    // 查询列表
    const listSql = `
      SELECT 
        a.id,
        a.archive_id,
        a.prefix,
        a.sequence_number,
        a.status,
        a.created_at,
        a.updated_at,
        app.dispute_type,
        (SELECT GROUP_CONCAT(name) FROM mediation_applicants WHERE archive_id = a.archive_id) as applicants,
        (SELECT GROUP_CONCAT(name) FROM mediation_respondents WHERE archive_id = a.archive_id) as respondents
      FROM mediation_archives a
      LEFT JOIN mediation_applications app ON a.archive_id = app.archive_id
      WHERE ${whereSql}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `

    return new Promise((resolve, reject) => {
      db.get(countSql, params, (err, countRow) => {
        if (err) {
          return reject(err)
        }

        const listParams = [...params, pageSize, offset]
        db.all(listSql, listParams, (err, rows) => {
          if (err) {
            return reject(err)
          }

          resolve({
            total: countRow.total,
            items: rows,
            page,
            pageSize
          })
        })
      })
    })
  }

  /**
   * 获取档案详情（包含所有关联数据）
   */
  async getArchiveDetail(archiveId) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM mediation_archives WHERE archive_id = ?',
        [archiveId],
        (err, archive) => {
          if (err) {
            return reject(err)
          }

          if (!archive) {
            return resolve(null)
          }

          // 查询申请书
          db.get(
            'SELECT * FROM mediation_applications WHERE archive_id = ?',
            [archiveId],
            (err, application) => {
              if (err) {
                return reject(err)
              }

              // 查询申请人
              db.all(
                'SELECT * FROM mediation_applicants WHERE archive_id = ? ORDER BY id',
                [archiveId],
                (err, applicants) => {
                  if (err) {
                    return reject(err)
                  }

                  // 查询被申请人
                  db.all(
                    'SELECT * FROM mediation_respondents WHERE archive_id = ? ORDER BY id',
                    [archiveId],
                    (err, respondents) => {
                      if (err) {
                        return reject(err)
                      }

                      // 查询调解记录（使用 db.all 获取所有记录）
                      db.all(
                        'SELECT * FROM mediation_records WHERE archive_id = ? ORDER BY mediation_date DESC',
                        [archiveId],
                        (err, records) => {
                          if (err) {
                            return reject(err)
                          }

                          // 查询调解协议
                          db.get(
                            'SELECT * FROM mediation_agreements WHERE archive_id = ?',
                            [archiveId],
                            (err, agreement) => {
                              if (err) {
                                return reject(err)
                              }

                              // 查询附件
                              db.all(
                                'SELECT * FROM archive_attachments WHERE archive_id = ? ORDER BY created_at',
                                [archiveId],
                                (err, attachments) => {
                                  if (err) {
                                    return reject(err)
                                  }

                                  resolve({
                                    archive,
                                    application: application || null,
                                    applicants: applicants || [],
                                    respondents: respondents || [],
                                    record: records && records.length > 0 ? records[0] : null,
                                    records: records || [],
                                    agreement: agreement || null,
                                    attachments: attachments || []
                                  })
                                }
                              )
                            }
                          )
                        }
                      )
                    }
                  )
                }
              )
            }
          )
        }
      )
    })
  }

  /**
   * 保存申请书
   */
  async saveApplication(archiveId, applicationData) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION')

        // 删除旧的申请书数据
        db.run('DELETE FROM mediation_applications WHERE archive_id = ?', [archiveId], (err) => {
          if (err) {
            db.run('ROLLBACK')
            return reject(err)
          }

          // 插入新的申请书
          const sql = `
            INSERT INTO mediation_applications 
            (archive_id, dispute_type, dispute_description, request_content, occurrence_date, occurrence_location, apply_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `

          const params = [
            archiveId,
            applicationData.dispute_type,
            applicationData.dispute_description,
            applicationData.request_content,
            applicationData.occurrence_date,
            applicationData.occurrence_location,
            applicationData.apply_date
          ]

          db.run(sql, params, function (err) {
            if (err) {
              db.run('ROLLBACK')
              return reject(err)
            }

            db.run('COMMIT')
            resolve({ id: this.lastID })
          })
        })
      })
    })
  }

  /**
   * 保存申请人列表
   */
  async saveApplicants(archiveId, applicants) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION')

        // 删除旧的申请人
        db.run('DELETE FROM mediation_applicants WHERE archive_id = ?', [archiveId], (err) => {
          if (err) {
            db.run('ROLLBACK')
            return reject(err)
          }

          if (applicants.length === 0) {
            db.run('COMMIT')
            return resolve([])
          }

          const stmt = db.prepare(`
            INSERT INTO mediation_applicants 
            (archive_id, is_resident, resident_id, name, id_card, phone, address, relationship)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `)

          const insertedIds = []
          let completed = 0

          applicants.forEach((applicant, index) => {
            const params = [
              archiveId,
              applicant.isResident ? 1 : 0,
              applicant.isResident ? applicant.residentId : null,
              applicant.name,
              applicant.idCard || '',
              applicant.phone || '',
              applicant.address || '',
              applicant.relationship || ''
            ]

            stmt.run(params, function (err) {
              if (err) {
                stmt.finalize()
                db.run('ROLLBACK')
                return reject(err)
              }

              insertedIds.push(this.lastID)
              completed++

              if (completed === applicants.length) {
                stmt.finalize((err) => {
                  if (err) {
                    db.run('ROLLBACK')
                    return reject(err)
                  }

                  db.run('COMMIT')
                  resolve(insertedIds)
                })
              }
            })
          })
        })
      })
    })
  }

  /**
   * 保存被申请人列表
   */
  async saveRespondents(archiveId, respondents) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION')

        // 删除旧的被申请人
        db.run('DELETE FROM mediation_respondents WHERE archive_id = ?', [archiveId], (err) => {
          if (err) {
            db.run('ROLLBACK')
            return reject(err)
          }

          if (respondents.length === 0) {
            db.run('COMMIT')
            return resolve([])
          }

          const stmt = db.prepare(`
            INSERT INTO mediation_respondents 
            (archive_id, is_resident, resident_id, name, id_card, phone, address, relationship)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `)

          const insertedIds = []
          let completed = 0

          respondents.forEach((respondent, index) => {
            const params = [
              archiveId,
              respondent.isResident ? 1 : 0,
              respondent.isResident ? respondent.residentId : null,
              respondent.name,
              respondent.idCard || '',
              respondent.phone || '',
              respondent.address || '',
              respondent.relationship || ''
            ]

            stmt.run(params, function (err) {
              if (err) {
                stmt.finalize()
                db.run('ROLLBACK')
                return reject(err)
              }

              insertedIds.push(this.lastID)
              completed++

              if (completed === respondents.length) {
                stmt.finalize((err) => {
                  if (err) {
                    db.run('ROLLBACK')
                    return reject(err)
                  }

                  db.run('COMMIT')
                  resolve(insertedIds)
                })
              }
            })
          })
        })
      })
    })
  }

  /**
   * 更新档案状态
   */
  async updateArchiveStatus(archiveId, status) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE mediation_archives 
        SET status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE archive_id = ?
      `

      db.run(sql, [status, archiveId], function (err) {
        if (err) {
          return reject(err)
        }

        if (this.changes === 0) {
          return reject(new Error('档案不存在'))
        }

        resolve({ changes: this.changes })
      })
    })
  }

  /**
   * 删除档案（级联删除所有关联数据）
   */
  async deleteArchive(archiveId) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION')

        // 删除档案会自动级联删除所有关联数据（外键约束）
        db.run('DELETE FROM mediation_archives WHERE archive_id = ?', [archiveId], (err) => {
          if (err) {
            db.run('ROLLBACK')
            return reject(err)
          }

          db.run('COMMIT')
          resolve({ success: true })
        })
      })
    })
  }
}

module.exports = new ArchiveService()
