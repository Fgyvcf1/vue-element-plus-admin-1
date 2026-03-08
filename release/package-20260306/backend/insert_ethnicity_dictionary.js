const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./app.db')

// 56个民族列表
const ethnicities = [
  '汉族',
  '蒙古族',
  '回族',
  '藏族',
  '维吾尔族',
  '苗族',
  '彝族',
  '壮族',
  '布依族',
  '朝鲜族',
  '满族',
  '侗族',
  '瑶族',
  '白族',
  '土家族',
  '哈尼族',
  '哈萨克族',
  '傣族',
  '黎族',
  '傈僳族',
  '佤族',
  '畲族',
  '高山族',
  '拉祜族',
  '水族',
  '东乡族',
  '纳西族',
  '景颇族',
  '柯尔克孜族',
  '土族',
  '达斡尔族',
  '仫佬族',
  '羌族',
  '布朗族',
  '撒拉族',
  '毛南族',
  '仡佬族',
  '锡伯族',
  '阿昌族',
  '普米族',
  '塔吉克族',
  '怒族',
  '乌孜别克族',
  '俄罗斯族',
  '鄂温克族',
  '德昂族',
  '保安族',
  '裕固族',
  '京族',
  '塔塔尔族',
  '独龙族',
  '鄂伦春族',
  '赫哲族',
  '门巴族',
  '珞巴族',
  '基诺族'
]

console.log('开始向字典表中插入56个民族数据...')

// 清空现有的民族数据
db.run("DELETE FROM dictionaries WHERE category = '民族';", (err) => {
  if (err) {
    console.error('清空现有民族数据失败:', err.message)
    db.close()
    return
  }

  console.log('清空现有民族数据成功')

  // 插入新的民族数据
  const insertSql = `INSERT INTO dictionaries 
                   (category, value, display_order, status, created_at, updated_at) 
                   VALUES (?, ?, ?, 'active', datetime('now'), datetime('now'));`

  let count = 0

  ethnicities.forEach((ethnicity, index) => {
    db.run(insertSql, ['民族', ethnicity, index + 1], function (err) {
      if (err) {
        console.error(`插入民族 ${ethnicity} 失败:`, err.message)
      } else {
        count++
        console.log(`插入民族 ${ethnicity} 成功，ID: ${this.lastID}`)
      }

      // 所有数据插入完成后关闭数据库
      if (count === ethnicities.length) {
        console.log(`共插入 ${count} 个民族数据`)
        db.close()
      }
    })
  })
})
