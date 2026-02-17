/**
 * 户编号生成工具
 * 统一生成规则：村组首字母(2位) + 身份证后6位
 */

// 常用汉字拼音首字母映射表
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

/**
 * 获取汉字首字母
 * @param {string} char - 汉字字符
 * @returns {string} - 首字母
 */
const getChineseFirstLetter = (char) => {
  if (!char) return ''

  // 先检查映射表
  if (pinyinMap[char]) {
    return pinyinMap[char]
  }

  // 如果是英文字母，直接返回大写
  if (/[a-zA-Z]/.test(char)) {
    return char.toUpperCase()
  }

  // 默认返回空字符串
  return ''
}

/**
 * 生成基础户编号
 * @param {string} villageGroup - 村组名称
 * @param {string} idCard - 身份证号
 * @returns {string} - 基础户编号（村组首字母2位 + 身份证后6位）
 */
const generateBaseHouseholdId = (villageGroup, idCard) => {
  if (!villageGroup || !idCard || idCard.length < 6) {
    return ''
  }

  // 提取村组前两个字的首字母
  const chars = villageGroup.split('')
  let initials = ''
  for (let i = 0; i < chars.length && initials.length < 2; i++) {
    const initial = getChineseFirstLetter(chars[i])
    if (initial) {
      initials += initial
    }
  }

  // 如果提取不到首字母，使用默认值
  if (!initials) {
    initials = 'XX'
  } else if (initials.length === 1) {
    initials += 'X'
  }

  // 提取身份证后6位
  const idCardSuffix = idCard.substring(idCard.length - 6)

  return `${initials}${idCardSuffix}`
}

/**
 * 生成唯一户编号
 * @param {string} villageGroup - 村组名称
 * @param {string} idCard - 身份证号
 * @param {Function} checkExists - 检查户编号是否存在的异步函数
 * @returns {Promise<string>} - 唯一的户编号
 */
const generateUniqueHouseholdId = async (villageGroup, idCard, checkExists) => {
  const baseId = generateBaseHouseholdId(villageGroup, idCard)

  if (!baseId) {
    // 如果信息不完整，使用时间戳生成
    return `HH${Date.now()}`
  }

  // 检查基础ID是否存在
  const exists = await checkExists(baseId)
  if (!exists) {
    return baseId
  }

  // 存在相同的，尝试后缀1-99
  for (let i = 1; i <= 99; i++) {
    const tryNumber = `${baseId}${i}`
    const tryExists = await checkExists(tryNumber)
    if (!tryExists) {
      return tryNumber
    }
  }

  // 如果1-99都存在，使用HH+时间戳
  return `HH${Date.now()}`
}

module.exports = {
  generateBaseHouseholdId,
  generateUniqueHouseholdId,
  getChineseFirstLetter
}
