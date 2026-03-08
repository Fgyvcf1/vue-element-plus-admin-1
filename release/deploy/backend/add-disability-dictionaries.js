/**
 * 添加残疾类别和残疾等级字典数据
 */
const db = require('./db')

async function addDisabilityDictionaries() {
  console.log('开始添加残疾字典数据...')

  try {
    // 残疾类别数据
    const disabilityTypes = [
      { category: '残疾类别', value: '视力残疾', display_order: 1 },
      { category: '残疾类别', value: '听力残疾', display_order: 2 },
      { category: '残疾类别', value: '言语残疾', display_order: 3 },
      { category: '残疾类别', value: '肢体残疾', display_order: 4 },
      { category: '残疾类别', value: '智力残疾', display_order: 5 },
      { category: '残疾类别', value: '精神残疾', display_order: 6 },
      { category: '残疾类别', value: '多重残疾', display_order: 7 }
    ]

    // 残疾等级数据
    const disabilityLevels = [
      { category: '残疾等级', value: '一级', display_order: 1 },
      { category: '残疾等级', value: '二级', display_order: 2 },
      { category: '残疾等级', value: '三级', display_order: 3 },
      { category: '残疾等级', value: '四级', display_order: 4 }
    ]

    const allData = [...disabilityTypes, ...disabilityLevels]

    // 先检查是否已存在
    const [existingRows] = await db.pool.execute(
      'SELECT category, value FROM dictionaries WHERE category IN (?, ?)',
      ['残疾类别', '残疾等级']
    )

    console.log('现有字典数据:', existingRows)

    // 插入数据
    for (const item of allData) {
      // 检查是否已存在
      const exists = existingRows.some(
        (row) => row.category === item.category && row.value === item.value
      )

      if (!exists) {
        await db.pool.execute(
          'INSERT INTO dictionaries (category, value, display_order, status, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
          [item.category, item.value, item.display_order, 'active']
        )
        console.log(`已添加: ${item.category} - ${item.value}`)
      } else {
        console.log(`已存在，跳过: ${item.category} - ${item.value}`)
      }
    }

    // 验证结果
    const [result] = await db.pool.execute(
      'SELECT * FROM dictionaries WHERE category IN (?, ?) ORDER BY category, display_order',
      ['残疾类别', '残疾等级']
    )

    console.log('\n添加后的字典数据:')
    result.forEach((row) => {
      console.log(`  ${row.category}: ${row.value}`)
    })

    console.log('\n完成!')
    process.exit(0)
  } catch (err) {
    console.error('错误:', err)
    process.exit(1)
  }
}

addDisabilityDictionaries()
