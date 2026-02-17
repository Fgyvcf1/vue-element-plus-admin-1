const db = require('./db')

async function checkMediationTables() {
  try {
    console.log('=== 检查调解相关表 ===\n')

    // 检查 mediation_archives 表
    console.log('1. 检查 mediation_archives 表...')
    try {
      const [archivesRows] = await db.pool.execute(
        'SELECT COUNT(*) as count FROM mediation_archives'
      )
      console.log('   ✓ mediation_archives 表存在，记录数:', archivesRows[0].count)
    } catch (err) {
      console.log('   ✗ mediation_archives 表不存在或查询失败:', err.message)
    }

    // 检查 archive_sequences 表
    console.log('\n2. 检查 archive_sequences 表...')
    try {
      const [seqRows] = await db.pool.execute('SELECT COUNT(*) as count FROM archive_sequences')
      console.log('   ✓ archive_sequences 表存在，记录数:', seqRows[0].count)
    } catch (err) {
      console.log('   ✗ archive_sequences 表不存在或查询失败:', err.message)
    }

    // 检查 mediation_applications 表
    console.log('\n3. 检查 mediation_applications 表...')
    try {
      const [appRows] = await db.pool.execute(
        'SELECT COUNT(*) as count FROM mediation_applications'
      )
      console.log('   ✓ mediation_applications 表存在，记录数:', appRows[0].count)
    } catch (err) {
      console.log('   ✗ mediation_applications 表不存在或查询失败:', err.message)
    }

    // 检查 mediation_applicants 表
    console.log('\n4. 检查 mediation_applicants 表...')
    try {
      const [applicantRows] = await db.pool.execute(
        'SELECT COUNT(*) as count FROM mediation_applicants'
      )
      console.log('   ✓ mediation_applicants 表存在，记录数:', applicantRows[0].count)
    } catch (err) {
      console.log('   ✗ mediation_applicants 表不存在或查询失败:', err.message)
    }

    // 检查 mediation_respondents 表
    console.log('\n5. 检查 mediation_respondents 表...')
    try {
      const [respRows] = await db.pool.execute(
        'SELECT COUNT(*) as count FROM mediation_respondents'
      )
      console.log('   ✓ mediation_respondents 表存在，记录数:', respRows[0].count)
    } catch (err) {
      console.log('   ✗ mediation_respondents 表不存在或查询失败:', err.message)
    }

    // 检查 mediation_records 表
    console.log('\n6. 检查 mediation_records 表...')
    try {
      const [recRows] = await db.pool.execute('SELECT COUNT(*) as count FROM mediation_records')
      console.log('   ✓ mediation_records 表存在，记录数:', recRows[0].count)
    } catch (err) {
      console.log('   ✗ mediation_records 表不存在或查询失败:', err.message)
    }

    // 检查 mediation_agreements 表
    console.log('\n7. 检查 mediation_agreements 表...')
    try {
      const [agrRows] = await db.pool.execute('SELECT COUNT(*) as count FROM mediation_agreements')
      console.log('   ✓ mediation_agreements 表存在，记录数:', agrRows[0].count)
    } catch (err) {
      console.log('   ✗ mediation_agreements 表不存在或查询失败:', err.message)
    }

    // 检查 archive_attachments 表
    console.log('\n8. 检查 archive_attachments 表...')
    try {
      const [attRows] = await db.pool.execute('SELECT COUNT(*) as count FROM archive_attachments')
      console.log('   ✓ archive_attachments 表存在，记录数:', attRows[0].count)
    } catch (err) {
      console.log('   ✗ archive_attachments 表不存在或查询失败:', err.message)
    }

    console.log('\n=== 检查完成 ===')
  } catch (err) {
    console.error('检查过程出错:', err.message)
  } finally {
    process.exit(0)
  }
}

checkMediationTables()
