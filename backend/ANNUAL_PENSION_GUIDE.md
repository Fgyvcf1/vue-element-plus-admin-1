# 年度养老待遇认证提醒功能使用指南

## 功能说明

这是一个持续性年度提醒功能，用于通知61岁以上居民每年生日后1天进行城乡居民养老待遇资格认证。

**特点：**
- 适用对象：61岁以上居民
- 提醒频率：每年一次（生日后1天）
- 自动检查：每天自动检测符合条件的居民
- 避免重复：7天内不重复发送相同通知

---

## 快速开始

### 1. 添加规则到数据库

运行以下命令：
```bash
cd backend
node add-annual-pension-reminder.js
```

或者使用批处理脚本：
```bash
backend/setup-annual-pension-reminder.bat
```

**规则详情：**
- 规则类型：`annual_pension`
- 规则名称：`61岁以上年度养老待遇认证提醒`
- 适用对象：61岁以上居民
- 提醒时机：每年生日后1天
- 描述：`61岁以上居民，每年生日后1天提醒进行城乡居民养老待遇资格认证`

---

### 2. 重启后端服务

```bash
# 停止现有服务
Ctrl+C

# 启动服务
node server.js
```

---

### 3. 触发检查

**手动触发（测试）：**
```
http://localhost:3000/api/check-annual-pension-reminders
```

**自动触发（生产环境）：**
在 `server.js` 中添加定时任务，每天自动检查：
```javascript
const cron = require('node-cron');

// 每天早上8点检查
cron.schedule('0 8 * * *', () => {
  console.log('执行年度养老提醒检查...');
  // 自动调用检查API
});
```

---

### 4. 验证结果

- 查看前端通知列表
- 检查铃铛图标是否有新通知
- 查询数据库：
  ```sql
  SELECT * FROM notifications
  WHERE type = 'reminder'
  ORDER BY created_at DESC
  LIMIT 10;
  ```

---

## 测试功能

### 运行测试脚本

```bash
backend/test-annual-pension-reminder.bat
```

测试脚本会：
1. 查找年度养老提醒规则
2. 查找61岁以上的居民
3. 计算距离生日的天数
4. 判断是否符合提醒条件

### 手动测试数据

如果没有符合条件的居民，可以添加测试数据：

**方法1：修改现有居民日期**
```sql
-- 找一个居民，将其出生日期改为1年前（即生日后1天）
UPDATE residents
SET date_of_birth = '1960-01-09'
WHERE id = 某个居民ID;
```

**方法2：使用测试居民**
运行测试脚本时，它会显示符合条件的居民。

---

## API接口

### 检查年度养老提醒

**接口：** `GET /api/check-annual-pension-reminders`

**功能：** 检查所有61岁以上居民，如果今天距离生日刚好1天，则创建提醒通知

**响应示例：**
```json
{
  "code": 20000,
  "message": "检查年度养老提醒完成，已自动创建 2 条通知",
  "data": [
    {
      "resident_id": 123,
      "resident_name": "张三",
      "age": 65,
      "rule_id": 10,
      "rule_name": "61岁以上年度养老待遇认证提醒",
      "reminder_content": "张三居民（65岁）的生日已过1天，请及时进行城乡居民养老待遇资格认证",
      "reminder_type": "annual_pension",
      "days_since_birthday": 1,
      "year": 2026
    }
  ]
}
```

---

## 提醒逻辑详解

### 触发条件

同时满足以下条件：
1. ✅ 居民年龄 ≥ 61岁
2. ✅ 规则状态为 `active`
3. ✅ 今天距离生日刚好 = 1天
4. ✅ 7天内没有发送过相同通知

### 计算方式

```javascript
// 1. 获取居民生日
const birthDate = new Date(resident.date_of_birth);

// 2. 计算今年生日
const thisYearBirthday = new Date(
  currentYear,
  birthDate.getMonth(),
  birthDate.getDate()
);

// 3. 计算距离生日的天数
const daysSinceBirthday = Math.floor(
  (today - thisYearBirthday) / (1000 * 60 * 60 * 24)
);

// 4. 判断是否需要提醒
if (daysSinceBirthday === 1) {
  // 触发提醒
}
```

### 示例

| 居民 | 出生日期 | 当前年龄 | 今天 | 今年生日 | 距离生日 | 是否提醒 |
|------|----------|----------|------|----------|----------|----------|
| 张三 | 1960-01-08 | 66岁 | 2026-01-09 | 2026-01-08 | 1天 | ✅ |
| 李四 | 1965-05-20 | 60岁 | 2026-01-09 | 2026-05-20 | 未到 | ❌ |
| 王五 | 1955-12-25 | 70岁 | 2026-01-09 | 2025-12-25 | 15天 | ❌ |

---

## 定时任务设置（可选）

### 使用 node-cron

**安装：**
```bash
npm install node-cron
```

**配置：**
```javascript
// server.js
const cron = require('node-cron');

// 每天早上8点检查年度养老提醒
cron.schedule('0 8 * * *', () => {
  console.log('[' + new Date().toISOString() + '] 执行年度养老提醒检查...');
  // 这里会自动检查并创建通知
});

// 也可以设置为每天凌晨执行
cron.schedule('0 0 * * *', () => {
  console.log('[' + new Date().toISOString() + '] 执行年度养老提醒检查...');
});
```

### 使用 Linux crontab

```bash
# 编辑 crontab
crontab -e

# 添加以下行（每天早上8点执行）
0 8 * * * cd /path/to/backend && node check-annual-pension-reminders.js
```

---

## 数据库表结构

### reminder_rules 表

新增的年度养老提醒规则记录：

| 字段 | 值 | 说明 |
|------|-----|------|
| rule_type | `annual_pension` | 规则类型 |
| rule_name | `61岁以上年度养老待遇认证提醒` | 规则名称 |
| rule_value | `61` | 最低年龄 |
| description | `61岁以上居民，每年生日后1天提醒进行城乡居民养老待遇资格认证` | 描述 |
| status | `active` | 状态 |
| reminder_days | `1` | 生日后天数 |

### notifications 表

自动创建的通知记录：

| 字段 | 值 |
|------|-----|
| title | `张三 61岁以上年度养老待遇认证提醒` |
| content | `张三居民（65岁）的生日已过1天，请及时进行城乡居民养老待遇资格认证` |
| type | `reminder` |
| priority | `2` |
| status | `unread` |

---

## 故障排查

### 问题1：没有通知生成

**可能原因：**
1. 规则未添加到数据库
2. 规则状态不是 `active`
3. 没有符合条件的居民（61岁以上，且生日刚过1天）
4. 后端服务未重启

**解决方法：**
```bash
# 检查规则
SELECT * FROM reminder_rules WHERE rule_type = 'annual_pension';

# 检查居民
SELECT name, date_of_birth FROM residents WHERE status = 'active';

# 运行测试脚本
backend/test-annual-pension-reminder.bat

# 重启后端
node server.js
```

### 问题2：重复发送通知

**可能原因：**
1. 去重逻辑失效
2. 手动多次触发API

**解决方法：**
检查7天内去重逻辑是否正常工作：
```javascript
AND created_at >= date('now', '-7 days')
```

### 问题3：前端没有显示通知

**可能原因：**
1. 前端未刷新
2. 通知API返回错误
3. 铃铛组件未正确加载

**解决方法：**
1. 刷新页面（F5）
2. 检查浏览器控制台错误
3. 验证API响应：
   ```javascript
   fetch('/api/notifications')
     .then(res => res.json())
     .then(data => console.log(data));
   ```

---

## 维护建议

1. **定期检查规则**
   - 每年检查规则配置是否正确
   - 根据政策调整提醒内容

2. **监控提醒效果**
   - 查看通知发送记录
   - 统计居民认证完成率

3. **优化提醒时间**
   - 根据实际情况调整定时任务执行时间
   - 避免在休息时间发送通知

4. **备份重要数据**
   - 定期备份 reminder_rules 表
   - 备份 notifications 表

---

## 常见问题

### Q1: 为什么要生日后1天提醒？

A: 生日当天居民可能正在庆祝，生日后1天提醒更容易被注意到，且不影响生日心情。

### Q2: 61岁以下的不提醒吗？

A: 是的，根据养老待遇认证政策，61岁以上才需要每年认证。

### Q3: 如果居民62岁生日后1天，会提醒吗？

A: 会。规则是"61岁以上"，62岁、63岁等都符合条件，每年都会提醒。

### Q4: 通知会重复发送吗？

A: 不会。代码有7天去重机制，同一条内容7天内不会重复发送。

### Q5: 如何查看某个居民的所有提醒历史？

A: 查询 reminder_history 表：
```sql
SELECT * FROM reminder_history
WHERE resident_id = 居民ID
ORDER BY created_at DESC;
```

---

## 联系支持

如遇到问题，请提供：
1. 数据库中的规则记录
2. 测试脚本的输出结果
3. 后端控制台日志
4. 前端浏览器控制台错误

---

**文档版本：** 1.0
**最后更新：** 2026-01-09
**适用版本：** vue-element-admin 年龄提醒模块
