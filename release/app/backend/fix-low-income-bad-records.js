const db = require('./db')

async function main() {
  const connection = await db.pool.getConnection()
  try {
    await connection.beginTransaction()

    // 1) 给 low_income_persons 的 NULL id 补值
    const [[personMaxRow]] = await connection.execute(
      'SELECT COALESCE(MAX(id), 0) AS maxId FROM low_income_persons'
    )
    let personMaxId = Number(personMaxRow.maxId || 0)
    const [nullPersons] = await connection.execute(
      'SELECT resident_id, created_at FROM low_income_persons WHERE id IS NULL ORDER BY created_at ASC'
    )
    for (const row of nullPersons) {
      personMaxId += 1
      await connection.execute(
        'UPDATE low_income_persons SET id = ? WHERE id IS NULL AND resident_id = ? AND created_at = ? LIMIT 1',
        [personMaxId, row.resident_id, row.created_at]
      )
    }

    // 2) 给 low_income_policy_records 的 NULL id 补值
    const [[policyMaxRow]] = await connection.execute(
      'SELECT COALESCE(MAX(id), 0) AS maxId FROM low_income_policy_records'
    )
    let policyMaxId = Number(policyMaxRow.maxId || 0)
    const [nullPolicies] = await connection.execute(
      'SELECT low_income_person_id, created_at FROM low_income_policy_records WHERE id IS NULL ORDER BY created_at ASC'
    )
    for (const row of nullPolicies) {
      policyMaxId += 1
      await connection.execute(
        'UPDATE low_income_policy_records SET id = ? WHERE id IS NULL AND low_income_person_id = ? AND created_at = ? LIMIT 1',
        [policyMaxId, row.low_income_person_id, row.created_at]
      )
    }

    // 3) low_income_person_id=0 按 created_at 映射到同批次 low_income_persons
    await connection.execute(
      `
        UPDATE low_income_policy_records p
        JOIN (
          SELECT created_at, MIN(id) AS mapped_id
          FROM low_income_persons
          GROUP BY created_at
          HAVING COUNT(*) = 1
        ) m ON p.created_at = m.created_at
        SET p.low_income_person_id = m.mapped_id
        WHERE p.low_income_person_id = 0
      `
    )

    // 4) 空状态默认 active，避免查询被过滤掉
    await connection.execute(
      "UPDATE low_income_persons SET status = 'active' WHERE status IS NULL OR status = ''"
    )
    await connection.execute(
      "UPDATE low_income_policy_records SET status = 'active' WHERE status IS NULL OR status = ''"
    )

    await connection.commit()

    const [[p1]] = await db.pool.execute(
      'SELECT COUNT(*) AS c FROM low_income_persons WHERE id IS NULL'
    )
    const [[p2]] = await db.pool.execute(
      'SELECT COUNT(*) AS c FROM low_income_policy_records WHERE id IS NULL'
    )
    const [[p3]] = await db.pool.execute(
      'SELECT COUNT(*) AS c FROM low_income_policy_records WHERE low_income_person_id = 0'
    )
    console.log('数据修复完成:', {
      persons_id_null: Number(p1.c),
      policy_id_null: Number(p2.c),
      policy_person_id_zero: Number(p3.c)
    })
  } catch (error) {
    await connection.rollback()
    console.error('数据修复失败:', error.message)
    process.exitCode = 1
  } finally {
    connection.release()
    await db.pool.end()
  }
}

main()
