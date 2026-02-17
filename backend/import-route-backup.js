// Excel导入API - 高效的批量导入逻辑
const express = require('express')
const router = express.Router()
const db = require('./db')

// 将db的回调函数转换为Promise
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err)
      resolve(this)
    })
  })
}

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err)
      resolve(row)
    })
  })
}

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err)
      resolve(rows)
    })
  })
}

// 生成户主ID的辅助函数
const generateHouseholdId = async (villageGroup, idCard) => {
  // 1. 生成基础户主ID：村组名字首个字母大写 + 身份证后6位
  // 提取村组名称的前两个字的首字母大写
  let groupCode = ''
  if (villageGroup && villageGroup.length > 0) {
    // 简单的中文首字母提取函数
    const getChineseFirstLetter = (char) => {
      const unicode = char.charCodeAt(0)
      // 常用汉字拼音首字母映射表（简化版）
      const pinyinMap = {
        大: 'D',
        车: 'C',
        组: 'Z',
        村: 'C',
        庄: 'Z',
        乡: 'X',
        镇: 'Z',
        街: 'J',
        道: 'D',
        区: 'Q',
        县: 'X',
        市: 'S',
        省: 'S',
        国: 'G',
        家: 'J',
        李: 'L',
        张: 'Z',
        王: 'W',
        刘: 'L',
        陈: 'C',
        杨: 'Y',
        赵: 'Z',
        黄: 'H',
        周: 'Z',
        吴: 'W',
        徐: 'X',
        孙: 'S',
        胡: 'H',
        朱: 'Z',
        高: 'G',
        林: 'L',
        何: 'H',
        郭: 'G',
        马: 'M',
        罗: 'L',
        梁: 'L',
        宋: 'S',
        郑: 'Z',
        谢: 'X',
        韩: 'H',
        唐: 'T',
        冯: 'F',
        于: 'Y',
        董: 'D',
        萧: 'X',
        程: 'C',
        曹: 'C',
        袁: 'Y',
        邓: 'D',
        许: 'X',
        傅: 'F',
        沈: 'S',
        曾: 'Z',
        彭: 'P',
        吕: 'L',
        苏: 'S',
        卢: 'L',
        蒋: 'J',
        蔡: 'C',
        贾: 'J',
        丁: 'D',
        魏: 'W',
        薛: 'X',
        叶: 'Y',
        阎: 'Y',
        余: 'Y',
        潘: 'P',
        杜: 'D',
        戴: 'D',
        夏: 'X',
        钟: 'Z',
        汪: 'W',
        田: 'T',
        任: 'R',
        姜: 'J',
        范: 'F',
        方: 'F',
        石: 'S',
        姚: 'Y',
        谭: 'T',
        廖: 'L',
        邹: 'Z',
        熊: 'X',
        金: 'J',
        陆: 'L',
        郝: 'H',
        孔: 'K',
        白: 'B',
        崔: 'C',
        康: 'K',
        毛: 'M',
        邱: 'Q',
        秦: 'Q',
        江: 'J',
        史: 'S',
        顾: 'G',
        侯: 'H',
        邵: 'S',
        孟: 'M',
        龙: 'L',
        万: 'W',
        段: 'D',
        漕: 'C',
        钱: 'Q',
        汤: 'T',
        尹: 'Y',
        黎: 'L',
        易: 'Y',
        常: 'C',
        武: 'W',
        乔: 'Q',
        贺: 'H',
        赖: 'L',
        龚: 'G',
        文: 'W'
      }

      // 先检查是否在映射表中
      if (pinyinMap[char]) {
        return pinyinMap[char]
      }

      // 如果不在映射表中，返回空字符串或默认值
      return ''
    }

    // 提取前两个字的首字母
    const chars = villageGroup.split('')
    let initials = ''
    for (let i = 0; i < chars.length && initials.length < 2; i++) {
      const initial = getChineseFirstLetter(chars[i])
      if (initial) {
        initials += initial
      }
    }

    groupCode = initials || 'UNKNOWN'
  } else {
    groupCode = 'UNKNOWN'
  }

  // 提取身份证后6位
  const idCardSuffix = idCard.substring(idCard.length - 6)

  let baseHouseholdId = `${groupCode}${idCardSuffix}`

  // 2. 检查是否已存在，如果存在则自动加1
  const checkSql = `SELECT household_number FROM households WHERE household_number LIKE ?`
  const rows = await dbAll(checkSql, [`${baseHouseholdId}%`])

  if (rows.length === 0) {
    // 不存在相同的，直接返回基础ID
    return baseHouseholdId
  }

  // 存在相同的，找到最大的后缀数字并加1
  let maxSuffix = 0

  rows.forEach((row) => {
    const existingId = row.household_number
    if (existingId === baseHouseholdId) {
      // 完全相同，后缀为0
      maxSuffix = Math.max(maxSuffix, 0)
    } else if (existingId.startsWith(baseHouseholdId)) {
      // 以基础ID开头，提取后缀数字
      const suffix = existingId.substring(baseHouseholdId.length)
      const suffixNum = parseInt(suffix)
      if (!isNaN(suffixNum)) {
        maxSuffix = Math.max(maxSuffix, suffixNum)
      }
    }
  })

  // 生成新的户主ID
  const newHouseholdId =
    maxSuffix === 0 ? `${baseHouseholdId}1` : `${baseHouseholdId}${maxSuffix + 1}`
  return newHouseholdId
}

// 批量插入数据的辅助函数
const bulkInsert = async (table, columns, valuesList) => {
  if (valuesList.length === 0) return []

  // 对于SQLite，需要逐个插入以获取正确的ID
  const insertedIds = []
  for (const values of valuesList) {
    const placeholders = values.map(() => '?').join(',')
    const sql = `INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`
    const result = await dbRun(sql, values)
    insertedIds.push(result.lastID)
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

  try {
    // 快速解析和验证数据
    const parseErrors = []
    const headOfHouseholdRows = [] // 户主数据（与户主关系 = "本人"）
    const familyMemberRows = [] // 家庭成员数据（与户主关系 ≠ "本人"）
    const currentDate = new Date().toISOString().split('T')[0]

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
              rowData.residentData[mapItem.dbField] = value
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

    // 开始事务
    await dbRun('BEGIN TRANSACTION')

    let successCount = 0
    const householdIdMap = new Map() // 户主姓名 -> household_id

    // 预检查所有身份证号，避免重复处理
    const allIdCards = [...headOfHouseholdRows, ...familyMemberRows].map(
      (row) => row.residentData.id_card
    )
    const existingResidents = await dbAll(
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
      householdIdMap.set(householdHeadName, existingResident.household_id)
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
        const householdNumber = await generateHouseholdId(villageGroup, idCard)

        // 插入家庭数据
        const householdColumns = [
          'household_number',
          'household_head_name',
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
          villageGroup,
          householdData.address || '',
          householdData.phone_number || residentData.phone_number || '',
          householdData.ethnicity || residentData.ethnicity || '汉族',
          householdData.gender || residentData.gender || '',
          'active',
          currentDate,
          householdData.householdType || '',
          householdData.housingType || ''
        ]

        const result = await dbRun(
          `INSERT INTO households (${householdColumns.join(',')}) VALUES (${householdValues.map(() => '?').join(',')})`,
          householdValues
        )
        const householdId = result.lastID

        // 添加到家庭ID映射
        householdIdMap.set(householdHeadName, householdId)
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
          residentData.address || '',
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

    // 批量更新现有家庭成员
    for (const rowData of existingFamilyMembers) {
      const { householdData, residentData } = rowData
      const householdHeadName = householdData.household_head_name

      if (!householdHeadName) continue

      const householdId = householdIdMap.get(householdHeadName)
      if (!householdId) continue

      const existingResident = existingIdCardMap.get(residentData.id_card)

      await dbRun(
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
          residentData.address || '',
          residentData.equity_shares || 0,
          existingResident.id
        ]
      )

      successCount++
    }

    // 批量插入新的家庭成员
    if (newFamilyMembers.length > 0) {
      console.log('开始批量插入新的家庭成员...')

      // 过滤掉缺少户主信息或找不到户主的记录
      const validNewMembers = newFamilyMembers.filter((rowData) => {
        const householdHeadName = rowData.householdData.household_head_name
        return householdHeadName && householdIdMap.has(householdHeadName)
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
          const householdId = householdIdMap.get(householdHeadName)
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
            residentData.address || '',
            residentData.equity_shares || 0
          ]
        })

        // 批量插入家庭成员数据
        await bulkInsert('residents', residentColumns, residentValues)
        successCount += validNewMembers.length
        console.log('批量插入家庭成员完成，成功:', validNewMembers.length, '人')
      }
    }

    // 提交事务
    await dbRun('COMMIT')

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
    // 回滚事务
    await dbRun('ROLLBACK').catch((err) => console.error('回滚事务失败:', err.message))

    console.error('导入失败:', error.message)
    console.error('错误堆栈:', error.stack)
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
})

module.exports = router
