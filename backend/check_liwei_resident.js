const db = require('./db')

console.log('=== 测试日期计算逻辑 ===')

// 硬编码测试数据
const testCases = [
  {
    name: '李伟',
    birthDate: '1966-01-15',
    currentDate: '2026-01-14' // 今天
  },
  {
    name: '测试用例2',
    birthDate: '1966-01-15',
    currentDate: '2026-01-15' // 生日当天
  }
]

testCases.forEach((testCase) => {
  console.log(`\n=== 测试 ${testCase.name} ===`)
  console.log(`- 出生日期: ${testCase.birthDate}`)
  console.log(`- 当前日期: ${testCase.currentDate}`)

  const birthDate = new Date(testCase.birthDate)
  const currentDate = new Date(testCase.currentDate)

  const birthYear = birthDate.getFullYear()
  const birthMonth = birthDate.getMonth() // 0-11
  const birthDay = birthDate.getDate()

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() // 0-11
  const currentDay = currentDate.getDate()

  console.log(`- 出生日期详细信息: 年=${birthYear}, 月=${birthMonth + 1}, 日=${birthDay}`)
  console.log(`- 当前日期详细信息: 年=${currentYear}, 月=${currentMonth + 1}, 日=${currentDay}`)

  // 计算下一个生日
  const nextBirthday = new Date(currentYear, birthMonth, birthDay)
  console.log(`- 初始计算的下一个生日: ${nextBirthday.toISOString().split('T')[0]}`)

  // 检查是否已经过了今年的生日
  if (nextBirthday < currentDate) {
    nextBirthday.setFullYear(nextBirthday.getFullYear() + 1)
    console.log(`- 调整后的下一个生日: ${nextBirthday.toISOString().split('T')[0]}`)
  }

  // 计算距离生日的天数
  const timeDiff = nextBirthday - currentDate
  const daysUntilBirthday = Math.ceil(timeDiff / (1000 * 3600 * 24))

  console.log(`- 距离生日的天数: ${daysUntilBirthday}`)
  console.log(`- 最终计算的下一个生日: ${nextBirthday.toISOString().split('T')[0]}`)

  // 计算年龄
  let age = currentYear - birthYear
  if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
    age--
  }
  console.log(`- 当前年龄: ${age}`)
  console.log(`- 下一个生日时的年龄: ${age + 1}`)
})

// 同时检查原始的check-age-reminders逻辑
console.log('\n=== 模拟check-age-reminders逻辑 ===')
const rule = { id: 1, rule_type: 'age', rule_name: '60岁提醒', rule_value: '60', reminder_days: 1 }
const testResident = {
  id: 5,
  name: '李伟',
  date_of_birth: '1966-01-15'
}

const birthDate = new Date(testResident.date_of_birth)
const currentDate = new Date('2026-01-14')

const birthYear = birthDate.getFullYear()
const birthMonth = birthDate.getMonth()
const birthDay = birthDate.getDate()

const currentYear = currentDate.getFullYear()
const currentMonth = currentDate.getMonth()
const currentDay = currentDate.getDate()

// 计算年龄
let age = currentYear - birthYear
if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
  age--
}

console.log(`- 居民: ${testResident.name}`)
console.log(`- 当前年龄: ${age}`)
console.log(`- 目标年龄: ${rule.rule_value}`)
console.log(`- 提醒天数: ${rule.reminder_days}`)

// 计算下一个生日
const nextBirthday = new Date(currentYear, birthMonth, birthDay)
if (nextBirthday < currentDate) {
  nextBirthday.setFullYear(nextBirthday.getFullYear() + 1)
}

const timeDiff = nextBirthday - currentDate
const daysUntilBirthday = Math.ceil(timeDiff / (1000 * 3600 * 24))

console.log(`- 距离生日的天数: ${daysUntilBirthday}`)
console.log(
  `- 是否符合提醒条件: ${daysUntilBirthday === rule.reminder_days && age + 1 === parseInt(rule.rule_value)}`
)
