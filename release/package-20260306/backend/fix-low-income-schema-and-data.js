const db = require('./db')

async function hasPrimaryKey(tableName) {
  const [rows] = await db.pool.execute(
    `
      SELECT COUNT(*) AS c
      FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND CONSTRAINT_TYPE = 'PRIMARY KEY'
    `,
    [tableName]
  )
  return Number(rows[0].c) > 0
}

async function main() {
  const connection = await db.pool.getConnection()
  try {
    await connection.beginTransaction()

    // 1) 先修复数据：给 NULL id 补连续 id
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

    // 2) 修复 low_income_person_id = 0（按 created_at 一一匹配）
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

    // 3) 空状态归一化，避免前端筛选不到
    await connection.execute(
      "UPDATE low_income_policy_records SET status = 'active' WHERE status IS NULL OR status = ''"
    )
    await connection.execute(
      "UPDATE low_income_persons SET status = 'active' WHERE status IS NULL OR status = ''"
    )

    // 4) 补主键和自增
    if (!(await hasPrimaryKey('low_income_persons'))) {
      await connection.execute('ALTER TABLE low_income_persons MODIFY COLUMN id BIGINT NOT NULL')
      await connection.execute('ALTER TABLE low_income_persons ADD PRIMARY KEY (id)')
    }
    await connection.execute(
      'ALTER TABLE low_income_persons MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT'
    )

    if (!(await hasPrimaryKey('low_income_policy_records'))) {
      await connection.execute(
        'ALTER TABLE low_income_policy_records MODIFY COLUMN id BIGINT NOT NULL'
      )
      await connection.execute('ALTER TABLE low_income_policy_records ADD PRIMARY KEY (id)')
    }
    await connection.execute(
      'ALTER TABLE low_income_policy_records MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT'
    )

    await connection.commit()

    const [[summaryPersons]] = await db.pool.execute(
      'SELECT COUNT(*) AS c FROM low_income_persons WHERE id IS NULL'
    )
    const [[summaryPoliciesNullId]] = await db.pool.execute(
      'SELECT COUNT(*) AS c FROM low_income_policy_records WHERE id IS NULL'
    )
    const [[summaryPoliciesZeroFk]] = await db.pool.execute(
      'SELECT COUNT(*) AS c FROM low_income_policy_records WHERE low_income_person_id = 0'
    )

    console.log('修复完成')
    console.log({
      persons_id_null: Number(summaryPersons.c),
      policy_id_null: Number(summaryPoliciesNullId.c),
      policy_low_income_person_id_zero: Number(summaryPoliciesZeroFk.c)
    })
  } catch (error) {
    await connection.rollback()
    console.error('修复失败:', error.message)
    process.exitCode = 1
  } finally {
    connection.release()
    await db.pool.end()
  }
}

main()
