# 年龄提醒功能测试指南

## 问题描述

- 出生日期：1966-01-10
- 当前日期：2026-01-09
- 提醒规则：60岁提前1天
- 预期结果：应该触发提醒
- 实际结果：没有看到提醒

## 已发现并修复的问题

### 问题1: notifications表字段不匹配

**位置**: `backend/routes.js` 第1860行 **问题**: 代码使用了`is_read`、`updated_at`字段，但表中没有这些字段 **修复**: 已将INSERT语句改为使用正确的字段：

- `is_read` → `status = 'unread'`
- 移除了`updated_at`字段（表中不存在）

### 其他可能的问题

#### 1. 居民状态不是active

**检查方法**:

```sql
SELECT name, date_of_birth, status FROM residents WHERE date_of_birth = '1966-01-10';
```

**解决方案**: 确保status字段值为'active'

#### 2. 通知已在7天内创建过

**说明**: 代码有去重逻辑，7天内相同的通知不会重复创建 **解决方案**:

```sql
-- 删除旧的通知记录
DELETE FROM notifications WHERE title LIKE '%居民名%' AND created_at >= date('now', '-7 days');
```

#### 3. 提醒规则配置错误

**检查方法**:

```sql
SELECT * FROM reminder_rules WHERE rule_type = 'age' AND rule_value = '60';
```

**确保**:

- status = 'active'
- reminder_days = 1
- rule_type = 'age'

## 测试步骤

### 方案1: 使用诊断脚本（推荐）

1. 运行诊断脚本:

```bash
cd backend
node diagnose-age-reminder.bat
```

2. 根据输出结果确认：
   - ✅ notifications表结构正确
   - ✅ 1966-01-10出生的居民存在且状态为active
   - ✅ 60岁提前1天规则存在且启用
   - ✅ 没有重复的通知记录

### 方案2: 手动测试

#### 步骤1: 重启后端服务

```bash
# 如果后端正在运行，先停止
# 然后重新启动
cd backend
node server.js
```

#### 步骤2: 手动触发年龄提醒检查

在浏览器中访问：

```
http://localhost:3000/api/check-age-reminders
```

或者在浏览器控制台运行（如果有对应的前端函数）：

```javascript
fetch('/api/check-age-reminders')
  .then((res) => res.json())
  .then((data) => console.log(data))
```

#### 步骤3: 检查结果

1. 查看API响应：

```json
{
  "code": 20000,
  "message": "检查年龄提醒完成，已自动创建 X 条通知",
  "data": [...]
}
```

2. 查看数据库：

```sql
SELECT * FROM notifications WHERE title LIKE '%1966%' OR content LIKE '%居民名%' ORDER BY created_at DESC;
```

3. 检查前端：
   - 通知列表是否显示新通知
   - 铃铛图标是否有新通知标记

### 方案3: 创建测试脚本

如果上述方法都无效，可以创建一个独立的测试脚本：

```javascript
// backend/manual-test-age-reminder.js
const db = require('./db')
const today = new Date('2026-01-09')

console.log('手动创建年龄提醒通知...')

// 插入测试通知
const insertSql = `INSERT INTO notifications (title, content, type, priority, status, created_at)
                  VALUES (?, ?, 'reminder', 2, 'unread', datetime('now'))`

const title = '测试: 某某居民 60岁提醒'
const content = '某某居民将在1天后年满60岁，请注意相关事项'

db.run(insertSql, [title, content], function (err) {
  if (err) {
    console.error('创建通知失败:', err.message)
  } else {
    console.log(`✅ 成功创建通知 (ID: ${this.lastID})`)
  }
  db.close()
})
```

运行：

```bash
cd backend
node manual-test-age-reminder.js
```

## 验证清单

- [ ] 代码已修复（routes.js第1860行）
- [ ] 后端服务已重启
- [ ] 1966-01-10居民状态为active
- [ ] 60岁规则存在且reminder_days=1
- [ ] 没有重复的7天内通知
- [ ] API已调用（check-age-reminders）
- [ ] notifications表有新记录
- [ ] 前端通知列表显示新通知
- [ ] 铃铛图标有新通知标记

## 常见错误及解决

### 错误1: "no such table: notifications"

**原因**: 表不存在 **解决**: 运行 `node create-notification-tables.js`

### 错误2: "table notifications has no column named is_read"

**原因**: 字段名错误 **解决**: 代码已修复，使用`status`字段

### 错误3: "没有活跃的年龄提醒规则"

**原因**: 规则未启用 **解决**:

```sql
UPDATE reminder_rules SET status = 'active' WHERE rule_type = 'age' AND rule_value = '60';
```

### 错误4: 提醒规则配置错误

**原因**: reminder_days未设置或为0 **解决**:

```sql
UPDATE reminder_rules SET reminder_days = 1 WHERE rule_type = 'age' AND rule_value = '60';
```

## 下一步操作

1. **立即执行**: 运行 `backend/diagnose-age-reminder.bat`
2. **查看结果**: 根据诊断输出确认问题
3. **重启服务**: 确保代码修改生效
4. **触发检查**: 访问 `/api/check-age-reminders`
5. **验证结果**: 检查数据库和前端显示

## 预期结果

如果一切正常，执行检查后应该：

1. 控制台输出：

```
开始检查年龄提醒...
发现 1 条年龄提醒，开始自动创建通知...
成功创建通知: 居民名 60岁提醒 (ID: 123)
```

2. API响应：

```json
{
  "code": 20000,
  "message": "检查年龄提醒完成，已自动创建 1 条通知",
  "data": [...]
}
```

3. 数据库记录：

```sql
SELECT id, title, content, type, status, created_at FROM notifications ORDER BY id DESC LIMIT 1;
```

4. 前端显示：
   - 通知列表中有新记录
   - 铃铛图标有红色新通知标记
