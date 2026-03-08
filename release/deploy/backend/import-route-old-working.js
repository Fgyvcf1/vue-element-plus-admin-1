// Excel导入API - 清晰的两阶段导入逻辑
router.post('/import-residents', (req, res) => {
  console.log('========================================')
  console.log('收到居民数据导入请求...')
  console.log('========================================')

  const { headers, data, mapping } = req.body

  if (!headers || !data || !mapping) {
    console.error('缺少必要的导入数据')
    return res.status(400).json({ code: 400, message: '缺少必要的导入数据' })
  }

  console.log(`Excel总行数: ${data.length}`)
  console.log(`映射配置数: ${mapping.length}`)

  // ==================== 阶段1：数据解析和分组 ====================
  console.log('\n[阶段1] 开始解析和验证数据...')

  const parseErrors = []
  const headOfHouseholdRows = [] // 户主数据（与户主关系 = "本人"）
  const familyMemberRows = [] // 家庭成员数据（与户主关系 ≠ "本人"）

  data.forEach((row, rowIndex) => {
    console.log(`\n  处理第 ${rowIndex + 2} 行数据...`)

    const rowData = {
      rowIndex: rowIndex + 2,
      householdData: {},
      residentData: {},
      isHeadOfHousehold: false
    }

    // 映射字段
    mapping.forEach((mapItem, mapIndex) => {
      if (mapItem.dbField) {
        const value = row[mapIndex]
        if (value !== undefined && value !== null && value !== '') {
          // 判断是否是户主字段
          if (mapItem.dbField === 'household_head_name') {
            rowData.householdData['household_head_name'] = value
          } else if (mapItem.dbField.startsWith('household_')) {
            // 其他户主字段（如 household_village_group, household_phone_number 等）
            const fieldName = mapItem.dbField.substring(11) // 去掉 'household_' 前缀
            rowData.householdData[fieldName] = value
          } else {
            // 居民字段
            rowData.residentData[mapItem.dbField] = value
            // 检查是否是户主
            if (mapItem.dbField === 'relationship_to_head' && value === '本人') {
              rowData.isHeadOfHousehold = true
            }
          }
        }
      }
    })

    console.log(`    户主数据:`, rowData.householdData)
    console.log(`    居民数据:`, rowData.residentData)
    console.log(`    是否户主:`, rowData.isHeadOfHousehold)

    // 验证必要字段
    if (!rowData.residentData.name || !rowData.residentData.id_card) {
      const errorMsg = `第${rowIndex + 2}行: 缺少姓名或身份证号`
      console.error(`    ❌ ${errorMsg}`)
      parseErrors.push(errorMsg)
      return
    }

    // 分组
    if (rowData.isHeadOfHousehold) {
      headOfHouseholdRows.push(rowData)
      console.log(`    ✅ 添加到户主组`)
    } else {
      familyMemberRows.push(rowData)
      console.log(`    ✅ 添加到家庭成员组`)
    }
  })

  console.log('\n[阶段1完成]')
  console.log(`  户主数量: ${headOfHouseholdRows.length}`)
  console.log(`  家庭成员数量: ${familyMemberRows.length}`)
  console.log(`  解析错误: ${parseErrors.length}`)

  if (parseErrors.length > 0) {
    console.error('\n解析错误详情:', parseErrors)
  }

  // ==================== 阶段2：处理户主数据 ====================
  console.log('\n[阶段2] 开始处理户主数据...')

  let successCount = 0
  let errorCount = parseErrors.length
  let errors = [...parseErrors]
  const householdIdMap = new Map() // 户主姓名 -> household_id

  // 开始事务
  db.run('BEGIN TRANSACTION', function (err) {
    if (err) {
      console.error('开始事务失败:', err.message)
      return res.status(500).json({ code: 500, message: '导入失败: 开始事务失败' })
    }

    console.log('✓ 事务已开启')

    // 处理户主数据
    const processHeadOfHouseholds = (index) => {
      if (index >= headOfHouseholdRows.length) {
        console.log('\n[阶段2完成] 所有户主处理完成')
        console.log('户主ID映射表:', Object.fromEntries(householdIdMap))
        processFamilyMembers(0) // 开始处理家庭成员
        return
      }

      const rowData = headOfHouseholdRows[index]
      const { householdData, residentData, rowIndex } = rowData

      console.log(`\n  处理户主 ${index + 1}/${headOfHouseholdRows.length}: ${residentData.name}`)

      // 获取户主姓名（优先使用 household_head_name，否则使用 residentData.name）
      const householdHeadName = householdData.household_head_name || residentData.name

      // 检查该居民是否已存在
      const checkResidentSql = `SELECT id, household_id FROM residents WHERE id_card = ?`
      db.get(checkResidentSql, [residentData.id_card], (checkErr, existingResident) => {
        if (checkErr) {
          errorCount++
          errors.push(`第${rowIndex}行: 检查居民失败 - ${checkErr.message}`)
          console.error(`    ❌ 检查居民失败: ${checkErr.message}`)
          processHeadOfHouseholds(index + 1)
          return
        }

        if (existingResident) {
          console.log(
            `    → 居民已存在，ID: ${existingResident.id}，家庭ID: ${existingResident.household_id}`
          )
          householdIdMap.set(householdHeadName, existingResident.household_id)
          successCount++
          processHeadOfHouseholds(index + 1)
          return
        }

        // 创建家庭信息
        const insertHouseholdSql = `INSERT INTO households
          (household_head_name, village_group, address, phone_number, ethnicity, gender, status, registered_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`

        const householdParams = [
          householdHeadName,
          householdData.village_group || residentData.village_group || '',
          householdData.address || '',
          householdData.phone_number || residentData.phone_number || '',
          householdData.ethnicity || residentData.ethnicity || '汉族',
          householdData.gender || residentData.gender || '',
          'active',
          new Date().toISOString().split('T')[0]
        ]

        db.run(insertHouseholdSql, householdParams, function (insertErr) {
          if (insertErr) {
            errorCount++
            errors.push(`第${rowIndex}行: 创建家庭失败 - ${insertErr.message}`)
            console.error(`    ❌ 创建家庭失败: ${insertErr.message}`)
            processHeadOfHouseholds(index + 1)
            return
          }

          const householdId = this.lastID
          console.log(`    ✓ 创建家庭成功，ID: ${householdId}`)
          householdIdMap.set(householdHeadName, householdId)

          // 创建户主的居民信息
          const insertResidentSql = `INSERT INTO residents
            (household_id, name, gender, date_of_birth, id_card, relationship_to_head, ethnicity,
             marital_status, political_status, military_service, bank_card, bank_name, village_group,
             education_level, phone_number, registered_date, status, Home_address)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

          const residentParams = [
            householdId,
            residentData.name || '',
            residentData.gender || '',
            residentData.date_of_birth || '',
            residentData.id_card || '',
            '本人',
            residentData.ethnicity || '汉族',
            residentData.marital_status || '未婚',
            residentData.political_status || '群众',
            residentData.military_service || '未服兵役',
            residentData.bank_card || '',
            residentData.bank_name || '',
            residentData.village_group || '',
            residentData.education_level || '小学',
            residentData.phone_number || '',
            new Date().toISOString().split('T')[0],
            'active',
            residentData.address || ''
          ]

          db.run(insertResidentSql, residentParams, (residentErr) => {
            if (residentErr) {
              errorCount++
              errors.push(`第${rowIndex}行: 创建户主居民信息失败 - ${residentErr.message}`)
              console.error(`    ❌ 创建户主居民信息失败: ${residentErr.message}`)
            } else {
              successCount++
              console.log(`    ✓ 创建户主居民信息成功`)
            }
            processHeadOfHouseholds(index + 1)
          })
        })
      })
    }

    // ==================== 阶段3：处理家庭成员数据 ====================
    console.log('\n[阶段3] 开始处理家庭成员数据...')

    const processFamilyMembers = (index) => {
      if (index >= familyMemberRows.length) {
        console.log('\n[阶段3完成] 所有家庭成员处理完成')
        finalizeImport()
        return
      }

      const rowData = familyMemberRows[index]
      const { householdData, residentData, rowIndex } = rowData

      console.log(`\n  处理家庭成员 ${index + 1}/${familyMemberRows.length}: ${residentData.name}`)

      // 获取户主姓名
      const householdHeadName = householdData.household_head_name

      if (!householdHeadName) {
        errorCount++
        errors.push(`第${rowIndex}行: 缺少户主姓名，无法关联家庭`)
        console.error(`    ❌ 缺少户主姓名`)
        processFamilyMembers(index + 1)
        return
      }

      // 查找户主ID
      const householdId = householdIdMap.get(householdHeadName)

      if (!householdId) {
        errorCount++
        errors.push(`第${rowIndex}行: 找不到户主"${householdHeadName}"对应的家庭信息`)
        console.error(`    ❌ 找不到户主"${householdHeadName}"`)
        processFamilyMembers(index + 1)
        return
      }

      console.log(`    → 关联到家庭ID: ${householdId}，户主: ${householdHeadName}`)

      // 检查该居民是否已存在
      const checkResidentSql = `SELECT id FROM residents WHERE id_card = ?`
      db.get(checkResidentSql, [residentData.id_card], (checkErr, existingResident) => {
        if (checkErr) {
          errorCount++
          errors.push(`第${rowIndex}行: 检查居民失败 - ${checkErr.message}`)
          console.error(`    ❌ 检查居民失败: ${checkErr.message}`)
          processFamilyMembers(index + 1)
          return
        }

        if (existingResident) {
          // 更新现有居民
          const updateSql = `UPDATE residents SET
            household_id = ?,
            name = ?,
            gender = ?,
            date_of_birth = ?,
            village_group = ?,
            bank_card = ?,
            bank_name = ?,
            phone_number = ?,
            ethnicity = ?,
            relationship_to_head = ?,
            marital_status = ?,
            political_status = ?,
            military_service = ?,
            education_level = ?
            WHERE id = ?`

          const params = [
            householdId,
            residentData.name || '',
            residentData.gender || '',
            residentData.date_of_birth || '',
            residentData.village_group || '',
            residentData.bank_card || '',
            residentData.bank_name || '',
            residentData.phone_number || '',
            residentData.ethnicity || '汉族',
            residentData.relationship_to_head || '其他',
            residentData.marital_status || '未婚',
            residentData.political_status || '群众',
            residentData.military_service || '未服兵役',
            residentData.education_level || '小学',
            existingResident.id
          ]

          db.run(updateSql, params, (updateErr) => {
            if (updateErr) {
              errorCount++
              errors.push(`第${rowIndex}行: 更新家庭成员失败 - ${updateErr.message}`)
              console.error(`    ❌ 更新家庭成员失败: ${updateErr.message}`)
            } else {
              successCount++
              console.log(`    ✓ 更新家庭成员成功`)
            }
            processFamilyMembers(index + 1)
          })
        } else {
          // 创建新的家庭成员
          const insertResidentSql = `INSERT INTO residents
            (household_id, name, gender, date_of_birth, id_card, relationship_to_head, ethnicity,
             marital_status, political_status, military_service, bank_card, bank_name, village_group,
             education_level, phone_number, registered_date, status, Home_address)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

          const residentParams = [
            householdId,
            residentData.name || '',
            residentData.gender || '',
            residentData.date_of_birth || '',
            residentData.id_card || '',
            residentData.relationship_to_head || '其他',
            residentData.ethnicity || '汉族',
            residentData.marital_status || '未婚',
            residentData.political_status || '群众',
            residentData.military_service || '未服兵役',
            residentData.bank_card || '',
            residentData.bank_name || '',
            residentData.village_group || '',
            residentData.education_level || '小学',
            residentData.phone_number || '',
            new Date().toISOString().split('T')[0],
            'active',
            residentData.address || ''
          ]

          db.run(insertResidentSql, residentParams, (insertErr) => {
            if (insertErr) {
              errorCount++
              errors.push(`第${rowIndex}行: 创建家庭成员失败 - ${insertErr.message}`)
              console.error(`    ❌ 创建家庭成员失败: ${insertErr.message}`)
            } else {
              successCount++
              console.log(`    ✓ 创建家庭成员成功`)
            }
            processFamilyMembers(index + 1)
          })
        }
      })
    }

    // ==================== 最终完成导入 ====================
    const finalizeImport = () => {
      console.log('\n========================================')
      console.log('导入完成')
      console.log('========================================')
      console.log(`总数据: ${data.length}`)
      console.log(`成功: ${successCount}`)
      console.log(`失败: ${errorCount}`)
      console.log('户主ID映射表:', Object.fromEntries(householdIdMap))

      if (errorCount > 0) {
        db.run('ROLLBACK', function (rollbackErr) {
          if (rollbackErr) {
            console.error('回滚事务失败:', rollbackErr.message)
          } else {
            console.log('✓ 事务已回滚')
          }

          res.status(500).json({
            code: 500,
            message: `导入失败，共处理${data.length}条数据，成功${successCount}条，失败${errorCount}条`,
            data: {
              successCount,
              errorCount,
              errors: errors.slice(0, 20)
            }
          })
        })
      } else {
        db.run('COMMIT', function (commitErr) {
          if (commitErr) {
            console.error('提交事务失败:', commitErr.message)
            return res.status(500).json({ code: 500, message: '导入失败: 提交事务失败' })
          }

          console.log('✓ 事务已提交')

          res.json({
            code: 20000,
            message: `导入成功，共处理${data.length}条数据，成功${successCount}条`,
            data: {
              successCount,
              errorCount,
              headOfHouseholdCount: headOfHouseholdRows.length,
              familyMemberCount: familyMemberRows.length
            }
          })
        })
      }
    }

    // 开始处理
    console.log('\n开始执行导入流程...')
    processHeadOfHouseholds(0)
  })
})

module.exports = router
