const db = require('./db')

console.log('测试档案管理API的返回格式...')

// 模拟getArchives API的返回格式
function testGetArchivesAPI() {
  console.log('\n测试getArchives API:')
  console.log('-'.repeat(50))

  const sql = `
    SELECT 
      a.*,
      (SELECT GROUP_CONCAT(name, '、') FROM mediation_applicants WHERE archive_id = a.archive_id) as applicant_names,
      (SELECT COUNT(*) FROM mediation_applicants WHERE archive_id = a.archive_id) as applicant_count,
      (SELECT GROUP_CONCAT(name, '、') FROM mediation_respondents WHERE archive_id = a.archive_id) as respondent_names,
      (SELECT COUNT(*) FROM mediation_respondents WHERE archive_id = a.archive_id) as respondent_count
    FROM mediation_archives a
    WHERE 1=1
    ORDER BY a.created_at DESC
    LIMIT 10 OFFSET 0
  `

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('查询档案列表失败:', err.message)
      console.error('SQL:', sql)
      db.close()
      return
    }

    console.log('查询结果:', rows)

    // 格式化申请人/被申请人显示
    const formattedRows = rows.map((row) => {
      const formatPeople = (names, count) => {
        if (!names || count === 0) return '-'
        if (count === 1) return names
        const firstPerson = names.split('、')[0]
        return `${firstPerson}等${count}人`
      }

      return {
        ...row,
        applicant_display: formatPeople(row.applicant_names, row.applicant_count),
        respondent_display: formatPeople(row.respondent_names, row.respondent_count)
      }
    })

    console.log('格式化后:', formattedRows)

    // 模拟返回格式
    const response = {
      code: 20000,
      data: {
        items: formattedRows,
        total: 100 // 模拟总数
      }
    }

    console.log('API返回格式:', JSON.stringify(response, null, 2))

    // 检查是否有申请人相关的问题
    console.log('\n检查申请人数据:')
    rows.forEach((row, index) => {
      console.log(`记录 ${index + 1}:`)
      console.log(`  archive_id: ${row.archive_id}`)
      console.log(`  applicant_names: ${row.applicant_names}`)
      console.log(`  applicant_count: ${row.applicant_count}`)
      console.log(`  respondent_names: ${row.respondent_names}`)
      console.log(`  respondent_count: ${row.respondent_count}`)
    })

    db.close()
  })
}

// 执行测试
testGetArchivesAPI()
