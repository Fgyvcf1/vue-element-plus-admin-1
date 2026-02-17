// Excel导入API - 高效的批量导入逻辑
const express = require('express')
const router = express.Router()
const db = require('./db')
const { generateUniqueHouseholdId } = require('./utils/householdIdGenerator')

// 辅助函数：将 Excel 日期数字转换为 YYYY-MM-DD 格式
const excelDateToJSDate = (excelDate) => {
  if (typeof excelDate === 'number' && excelDate > 0) {
    // Excel日期是从1900-01-01开始计算天数，但JavaScript的Date对象是从1970-01-01开始
    // 25569 是 1970-01-01 到 1900-01-01 的天数差
    const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000))
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  return excelDate // 如果不是数字日期，则直接返回
}

// 使用 MySQL/MariaDB 的 db.pool.execute 进行数据库操作

// 检查户编号是否存在的辅助函数
const checkHouseholdNumberExists = async (householdNumber) => {
  const [rows] = await db.pool.execute(
    'SELECT household_number FROM households WHERE household_number = ?',
    [householdNumber]
  )
  return rows.length > 0
}

// 批量插入数据的辅助函数 - 兼容 MySQL/MariaDB
const bulkInsert = async (table, columns, valuesList) => {
  if (valuesList.length === 0) return []

  // 使用 MySQL2 的 pool.execute
  const insertedIds = []
  for (const values of valuesList) {
    const placeholders = values.map(() => '?').join(',')
    const sql = `INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`
    try {
      const [result] = await db.pool.execute(sql, values)
      insertedIds.push(result.insertId)
    } catch (err) {
      console.error('批量插入失败:', err.message)
      console.error('SQL:', sql)
      console.error('参数:', values)
      throw err
    }
  }

  return insertedIds
}

router.post('/import-residents', async (req, res) => {
  // 减少日志输出，只保留关键信息
  console.log('========================================')
  console.log('收到居民数据导入请求')
  console.log('请求体:', JSON.stringify(req.body, null, 2).substring(0, 500))
  console.log('总行数:', req.body.data?.length)

  const { headers, data, mapping } = req.body

  if (!headers || !data || !mapping) {
    console.error('缺少必要的导入数据')
    console.error('headers:', headers)
    console.error('data:', data)
    console.error('mapping:', mapping)
    return res.status(400).json({ code: 400, message: '缺少必要的导入数据' })
  }

  // 打印第一条数据用于调试
  console.log('导入数据示例 - 第一行:', JSON.stringify(data[0]))
  console.log('映射关系:', JSON.stringify(mapping.slice(0, 5)))
  console.log('总行数:', data.length)
  console.log('前几行数据:', JSON.stringify(data.slice(0, 3)))

  try {
    let successCount = 0
    // 快速解析和验证数据
    const parseErrors = []
    const headOfHouseholdRows = [] // 户主数据（与户主关系 = "本人"）
    const familyMemberRows = [] // 家庭成员数据（与户主关系 ≠ "本人"）
    const currentDate = new Date().toISOString().split('T')[0]

    const householdIdMap = new Map() // 户主姓名 -> household_id
    const householdMapByName = new Map() // 按姓名分组的户主信息

    // 预先加载所有户主信息，按姓名和地址建立索引
    console.log('预先加载户主信息...')
    const [allHouseholdHeads] = await db.pool.execute(
      'SELECT household_number, household_head_name, address FROM households'
    )

    for (const household of allHouseholdHeads) {
      if (household.household_head_name) {
        if (!householdMapByName.has(household.household_head_name)) {
          householdMapByName.set(household.household_head_name, [])
        }
        householdMapByName.get(household.household_head_name).push({
          household_number: household.household_number,
          address: household.address || ''
        })
        console.log(
          '添加户主信息:',
          household.household_head_name,
          '地址:',
          household.address,
          '->',
          household.household_number
        )
      }
    }
    console.log('户主姓名分组数量:', householdMapByName.size)

    // 第一阶段：快速解析数据
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex]
      const rowData = {
        rowIndex: rowIndex + 2,
        householdData: {},
        residentData: {},
        isHeadOfHousehold: false
      }

      // 映射字段
      for (let mapIndex = 0; mapIndex < mapping.length; mapIndex++) {
        const mapItem = mapping[mapIndex]
        if (mapItem.dbField) {
          const value = row[mapIndex]
          if (value !== undefined && value !== null && value !== '') {
            // 判断是否是户主字段
            if (mapItem.dbField === 'household_head_name') {
              rowData.householdData['household_head_name'] = value
            } else if (mapItem.dbField === 'householdType' || mapItem.dbField === 'housingType') {
              // 户口类型和住房类型字段
              rowData.householdData[mapItem.dbField] = value
            } else if (mapItem.dbField.startsWith('household_')) {
              // 其他户主字段
              const fieldName = mapItem.dbField.substring(11) // 去掉 'household_' 前缀
              rowData.householdData[fieldName] = value
            } else {
              // 居民字段
              let processedValue = value
              if (mapItem.dbField === 'date_of_birth') {
                processedValue = excelDateToJSDate(value)
              }
              rowData.residentData[mapItem.dbField] = processedValue
              // 检查是否是户主
              if (mapItem.dbField === 'relationship_to_head' && value === '本人') {
                rowData.isHeadOfHousehold = true
              }
            }
          }
        }
      }

      // 验证必要字段
      if (!rowData.residentData.name || !rowData.residentData.id_card) {
        console.log(`第${rowIndex + 2}行数据:`, JSON.stringify(rowData.residentData))
        console.log(`第${rowIndex + 2}行原始数据:`, JSON.stringify(row))
        parseErrors.push(`第${rowIndex + 2}行: 缺少姓名或身份证号`)
        continue
      }

      // 分组
      if (rowData.isHeadOfHousehold) {
        headOfHouseholdRows.push(rowData)
      } else {
        familyMemberRows.push(rowData)
      }
    }

    // 只输出关键统计信息
    console.log(
      '数据解析完成 - 户主:',
      headOfHouseholdRows.length,
      '人, 家庭成员:',
      familyMemberRows.length,
      '人, 错误:',
      parseErrors.length,
      '个'
    )

    if (parseErrors.length > 0) {
      return res.status(400).json({
        code: 400,
        message: `导入失败，共发现${parseErrors.length}条数据格式错误`,
        data: {
          successCount: 0,
          errorCount: parseErrors.length,
          errors: parseErrors.slice(0, 20)
        }
      })
    }

    // 开始事务 - MySQL/MariaDB 语法
    await db.pool.execute('START TRANSACTION')

    // 预检查所有身份证号，避免重复处理
    const allIdCards = [...headOfHouseholdRows, ...familyMemberRows].map(
      (row) => row.residentData.id_card
    )
    const [existingResidents] = await db.pool.execute(
      `SELECT id, id_card, household_id FROM residents WHERE id_card IN (${allIdCards.map(() => '?').join(',')})`,
      allIdCards
    )
    const existingIdCardMap = new Map(existingResidents.map((r) => [r.id_card, r]))

    console.log('预检查完成，已存在的居民:', existingIdCardMap.size, '人')

    // 处理需要新建的户主数据
    const newHeads = headOfHouseholdRows.filter(
      (row) => !existingIdCardMap.has(row.residentData.id_card)
    )
    console.log('需要新建的户主:', newHeads.length, '人')

    // 批量处理现有居民
    const existingHeads = headOfHouseholdRows.filter((row) =>
      existingIdCardMap.has(row.residentData.id_card)
    )
    for (const rowData of existingHeads) {
      const householdHeadName =
        rowData.householdData.household_head_name || rowData.residentData.name
      const existingResident = existingIdCardMap.get(rowData.residentData.id_card)

      // 查询对应的户编号
      const [householdRows] = await db.pool.execute(
        'SELECT household_number FROM households WHERE id = ? OR household_number = ?',
        [existingResident.household_id, existingResident.household_id]
      )

      let householdNumber
      if (householdRows.length > 0) {
        // households 表中有记录
        householdNumber = householdRows[0].household_number
      } else {
        // households 表中没有记录，需要创建
        console.log(`户主 ${householdHeadName} 的 households 记录不存在，需要创建`)

        const { householdData, residentData } = rowData
        const villageGroup = householdData.village_group || residentData.village_group || ''
        const idCard = residentData.id_card || ''

        // 生成户编号
        householdNumber = await generateUniqueHouseholdId(
          villageGroup,
          idCard,
          checkHouseholdNumberExists
        )

        // 插入家庭数据
        const householdColumns = [
          'household_number',
          'household_head_name',
          'household_head_id_card',
          'village_group',
          'address',
          'phone_number',
          'ethnicity',
          'gender',
          'status',
          'registered_date',
          'household_type',
          'housing_type'
        ]
        const householdValues = [
          householdNumber,
          householdHeadName,
          residentData.id_card || '',
          villageGroup,
          householdData.address || residentData.address || residentData.Home_address || '',
          householdData.phone_number || residentData.phone_number || '',
          householdData.ethnicity || residentData.ethnicity || '汉族',
          householdData.gender || residentData.gender || '',
          'active',
          currentDate,
          householdData.householdType || '农村居民户口',
          householdData.housingType || '自有住房'
        ]

        console.log('即将插入 households 表 (现有居民):', householdValues)
        await db.pool.execute(
          `INSERT INTO households (${householdColumns.join(',')}) VALUES (${householdValues.map(() => '?').join(',')})`,
          householdValues
        )
        console.log(`创建 households 记录成功: ${householdNumber}`)

        // 更新 residents 表的 household_id
        await db.pool.execute('UPDATE residents SET household_id = ? WHERE id = ?', [
          householdNumber,
          existingResident.id
        ])
        console.log(`更新 residents 表 household_id: ${existingResident.id} -> ${householdNumber}`)

        // 同时更新 householdMapByName，以便家庭成员查找时使用
        if (!householdMapByName.has(householdHeadName)) {
          householdMapByName.set(householdHeadName, [])
        }
        householdMapByName.get(householdHeadName).push({
          household_number: householdNumber,
          address: (rowData.householdData && rowData.householdData.address) || ''
        })
        console.log(`更新 householdMapByName: ${householdHeadName} -> ${householdNumber}`)
      }

      householdIdMap.set(householdHeadName, householdNumber)
      successCount++
    }

    // 批量插入新的户主和家庭
    if (newHeads.length > 0) {
      console.log('开始批量插入新的户主和家庭...')

      // 处理每个新户主
      for (const rowData of newHeads) {
        const { householdData, residentData } = rowData
        const householdHeadName = householdData.household_head_name || residentData.name
        const villageGroup = householdData.village_group || residentData.village_group || ''
        const idCard = residentData.id_card || ''

        // 生成户主ID
        const householdNumber = await generateUniqueHouseholdId(
          villageGroup,
          idCard,
          checkHouseholdNumberExists
        )

        // 插入家庭数据
        const householdColumns = [
          'household_number',
          'household_head_name',
          'household_head_id_card',
          'village_group',
          'address',
          'phone_number',
          'ethnicity',
          'gender',
          'status',
          'registered_date',
          'household_type',
          'housing_type'
        ]
        const householdValues = [
          householdNumber,
          householdHeadName,
          idCard,
          villageGroup,
          householdData.address || residentData.address || residentData.Home_address || '',
          householdData.phone_number || residentData.phone_number || '',
          householdData.ethnicity || residentData.ethnicity || '汉族',
          householdData.gender || residentData.gender || '',
          'active',
          currentDate,
          householdData.householdType || '农村居民户口',
          householdData.housingType || '自有住房'
        ]

        console.log('即将插入 households 表 (新户主):', householdValues)
        const [result] = await db.pool.execute(
          `INSERT INTO households (${householdColumns.join(',')}) VALUES (${householdValues.map(() => '?').join(',')})`,
          householdValues
        )
        const householdId = result.insertId

        // 添加到家庭ID映射
        householdIdMap.set(householdHeadName, householdNumber)

        // 同时更新 householdMapByName，以便家庭成员查找时使用
        if (!householdMapByName.has(householdHeadName)) {
          householdMapByName.set(householdHeadName, [])
        }
        householdMapByName.get(householdHeadName).push({
          household_number: householdNumber,
          address: (householdData && householdData.address) || ''
        })
        console.log(`更新 householdMapByName: ${householdHeadName} -> ${householdNumber}`)
      }

      // 准备户主的居民数据
      const residentColumns = [
        'household_id',
        'name',
        'gender',
        'date_of_birth',
        'id_card',
        'relationship_to_head',
        'ethnicity',
        'marital_status',
        'political_status',
        'military_service',
        'bank_card',
        'bank_name',
        'village_group',
        'education_level',
        'phone_number',
        'registered_date',
        'status',
        'Home_address',
        'equity_shares'
      ]
      const residentValues = newHeads.map((rowData) => {
        const { householdData, residentData } = rowData
        const householdHeadName = householdData.household_head_name || residentData.name
        const householdId = householdIdMap.get(householdHeadName)
        return [
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
          currentDate,
          'active',
          residentData.Home_address || residentData.address || '', // 优先使用 Home_address
          residentData.equity_shares || 0
        ]
      })

      // 批量插入户主的居民数据
      await bulkInsert('residents', residentColumns, residentValues)

      successCount += newHeads.length
      console.log('批量插入户主完成，成功:', newHeads.length, '人')
    }

    // 处理家庭成员数据
    console.log('开始处理家庭成员数据...')

    // 分离现有居民和新居民
    const existingFamilyMembers = familyMemberRows.filter((row) =>
      existingIdCardMap.has(row.residentData.id_card)
    )
    const newFamilyMembers = familyMemberRows.filter(
      (row) => !existingIdCardMap.has(row.residentData.id_card)
    )

    // 查找户主的辅助函数
    const findHouseholdByHeadNameAndAddress = (headName, memberAddress) => {
      if (!householdMapByName.has(headName)) {
        console.log('找不到户主姓名:', headName)
        return null
      }

      const households = householdMapByName.get(headName)
      if (households.length === 1) {
        // 只有一个同名户主，直接返回
        console.log('找到唯一户主:', headName, '->', households[0].household_number)
        return households[0].household_number
      }

      // 多个同名户主，尝试按地址匹配
      console.log('找到多个同名户主，尝试按地址匹配:', headName, '地址数量:', households.length)

      if (memberAddress) {
        // 清理地址格式，去除空格和特殊字符，统一格式
        const cleanMemberAddress = memberAddress.replace(/\s+/g, '').replace(/[\s\t\n\r]/g, '')

        for (const household of households) {
          if (household.address) {
            const cleanHouseholdAddress = household.address
              .replace(/\s+/g, '')
              .replace(/[\s\t\n\r]/g, '')

            // 检查地址是否相似（包含关系）
            if (
              cleanMemberAddress.includes(cleanHouseholdAddress) ||
              cleanHouseholdAddress.includes(cleanHouseholdAddress)
            ) {
              console.log(
                '按地址匹配成功:',
                headName,
                '地址:',
                cleanMemberAddress,
                '->',
                household.household_number
              )
              return household.household_number
            }
          }
        }
        console.log('地址匹配失败，使用第一个户主:', headName, '->', households[0].household_number)
      }

      // 没有地址或地址不匹配，返回第一个
      return households[0].household_number
    }

    // 批量更新现有家庭成员
    for (const rowData of existingFamilyMembers) {
      const { householdData, residentData } = rowData
      const householdHeadName = householdData.household_head_name
      const memberAddress =
        householdData.address || residentData.address || residentData.Home_address || ''

      if (!householdHeadName) continue

      const householdId = findHouseholdByHeadNameAndAddress(householdHeadName, memberAddress)
      if (!householdId) {
        console.log('找不到户主对应的户编号:', householdHeadName)
        continue
      }

      const existingResident = existingIdCardMap.get(residentData.id_card)

      await db.pool.execute(
        `UPDATE residents SET
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
         education_level = ?,
         Home_address = ?,
         equity_shares = ?
         WHERE id = ?`,
        [
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
          residentData.Home_address || residentData.address || '', // 优先使用 Home_address
          residentData.equity_shares || 0,
          existingResident.id
        ]
      )

      successCount++
      console.log('更新现有家庭成员成功:', residentData.name)
    }

    // 批量插入新的家庭成员
    if (newFamilyMembers.length > 0) {
      console.log('开始批量插入新的家庭成员...')

      // 过滤掉缺少户主信息或找不到户主的记录
      const validNewMembers = newFamilyMembers.filter((rowData) => {
        const householdHeadName =
          rowData.householdData.household_head_name || rowData.residentData.name
        const memberAddress =
          rowData.householdData.address ||
          rowData.residentData.address ||
          rowData.residentData.Home_address ||
          ''
        const householdId = findHouseholdByHeadNameAndAddress(householdHeadName, memberAddress)

        if (!householdId) {
          console.log(
            '无效家庭成员（找不到户主）:',
            rowData.residentData.name,
            '户主:',
            householdHeadName
          )
          return false
        }

        // 保存找到的户编号到rowData中，供后续使用
        rowData.foundHouseholdId = householdId
        return true
      })

      console.log('有效新家庭成员:', validNewMembers.length, '人')

      if (validNewMembers.length > 0) {
        // 准备家庭成员数据
        const residentColumns = [
          'household_id',
          'name',
          'gender',
          'date_of_birth',
          'id_card',
          'relationship_to_head',
          'ethnicity',
          'marital_status',
          'political_status',
          'military_service',
          'bank_card',
          'bank_name',
          'village_group',
          'education_level',
          'phone_number',
          'registered_date',
          'status',
          'Home_address',
          'equity_shares'
        ]
        const residentValues = validNewMembers.map((rowData) => {
          const { householdData, residentData } = rowData
          const householdHeadName = householdData.household_head_name
          const householdId = rowData.foundHouseholdId
          console.log(
            '插入新家庭成员:',
            residentData.name,
            '到户主:',
            householdHeadName,
            '户编号:',
            householdId
          )
          return [
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
            currentDate,
            'active',
            residentData.Home_address || residentData.address || '', // 优先使用 Home_address
            residentData.equity_shares || 0
          ]
        })

        // 批量插入家庭成员数据
        await bulkInsert('residents', residentColumns, residentValues)
        successCount += validNewMembers.length
        console.log('批量插入家庭成员完成，成功:', validNewMembers.length, '人')
      }
    }

    // 提交事务 - MySQL/MariaDB 语法
    await db.pool.execute('COMMIT')

    console.log('导入完成，总成功:', successCount, '人')

    res.json({
      code: 20000,
      message: `导入成功，共处理${data.length}条数据，成功${successCount}条`,
      data: {
        successCount,
        errorCount: 0,
        headOfHouseholdCount: headOfHouseholdRows.length,
        familyMemberCount: familyMemberRows.length
      }
    })
  } catch (error) {
    // 回滚事务 - MySQL/MariaDB 语法
    await db.pool.execute('ROLLBACK').catch((err) => console.error('回滚事务失败:', err.message))

    console.error('导入失败:', error.message)
    console.error('错误堆栈:', error.stack)
    console.error('错误对象:', error)

    // 如果有部分成功，即使有错误也返回成功状态码，并提示部分成功
    if (successCount > 0) {
      res.json({
        code: 20000,
        message: `导入部分成功，共处理${data.length}条数据，成功${successCount}条，但存在错误：${error.message}`,
        data: {
          successCount,
          errorCount: 1,
          errors: [error.message]
        }
      })
    } else if (error.message && error.message.includes('400')) {
      // 检查是否是400错误
      res.status(400).json({
        code: 400,
        message: error.message,
        data: {
          successCount: 0,
          errorCount: 1,
          errors: [error.message]
        }
      })
    } else {
      res.status(500).json({
        code: 500,
        message: `导入失败: ${error.message}`,
        data: {
          successCount: 0,
          errorCount: 1,
          errors: [error.message]
        }
      })
    }
  }
})

module.exports = router
