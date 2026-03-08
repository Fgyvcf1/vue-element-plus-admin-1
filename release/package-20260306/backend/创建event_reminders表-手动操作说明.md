# 创建 event_reminders 表操作说明

由于执行环境限制，需要手动创建数据库表。请按以下步骤操作：

## 方法一：使用数据库管理工具

如果您有 SQLite 数据库管理工具（如 DB Browser for SQLite）：

1. 打开 `backend/app.db` 文件
2. 执行以下 SQL 语句：

```sql
CREATE TABLE IF NOT EXISTS event_reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  event_date TEXT NOT NULL,
  event_time TEXT,
  location TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

3. 插入示例数据（可选）：

```sql
INSERT INTO event_reminders (event_type, title, event_date, event_time, location, description) VALUES
  ('meeting', '村委会例会', '2026-01-20', '14:00', '村委会会议室', '每月例行会议'),
  ('inspection', '安全生产检查', '2026-01-25', '09:00', '全村', '季度安全生产大检查'),
  ('training', '消防知识培训', '2026-01-30', '15:00', '村委会广场', '组织村民参加消防知识培训');
```

## 方法二：命令行方式

在 Windows 命令行中执行：

```bash
cd d:\vue-element-admin-master\backend
sqlite3 app.db
```

然后在 SQLite 命令行中执行：

```sql
CREATE TABLE IF NOT EXISTS event_reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  event_date TEXT NOT NULL,
  event_time TEXT,
  location TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO event_reminders (event_type, title, event_date, event_time, location, description) VALUES
  ('meeting', '村委会例会', '2026-01-20', '14:00', '村委会会议室', '每月例行会议'),
  ('inspection', '安全生产检查', '2026-01-25', '09:00', '全村', '季度安全生产大检查'),
  ('training', '消防知识培训', '2026-01-30', '15:00', '村委会广场', '组织村民参加消防知识培训');
```

退出 SQLite 命令行：`.quit`

## 方法三：创建 JS 文件后执行

1. 创建文件 `create-table.js`，内容如下：

```javascript
const sqlite3 = require('sqlite3').verbose()

const db = new sqlite3.Database('app.db')

const sql = `CREATE TABLE IF NOT EXISTS event_reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  event_date TEXT NOT NULL,
  event_time TEXT,
  location TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
)`

db.run(sql, (err) => {
  if (err) {
    console.error('创建表失败:', err.message)
    process.exit(1)
  }
  console.log('event_reminders 表创建成功')

  // 插入示例数据
  const insertSql = `INSERT INTO event_reminders (event_type, title, event_date, event_time, location, description) VALUES
    ('meeting', '村委会例会', '2026-01-20', '14:00', '村委会会议室', '每月例行会议'),
    ('inspection', '安全生产检查', '2026-01-25', '09:00', '全村', '季度安全生产大检查'),
    ('training', '消防知识培训', '2026-01-30', '15:00', '村委会广场', '组织村民参加消防知识培训')`

  db.run(insertSql, function (err) {
    if (err) {
      console.error('插入示例数据失败:', err.message)
    } else {
      console.log('已插入 3 条示例数据')
    }

    // 查询验证
    db.all('SELECT * FROM event_reminders', (err, rows) => {
      if (err) {
        console.error('查询失败:', err.message)
      } else {
        console.log(`\n当前共有 ${rows.length} 条事件提醒：`)
        rows.forEach((r) => {
          console.log(`  [${r.id}] ${r.event_type}: ${r.title} - ${r.event_date}`)
        })
      }
      db.close()
    })
  })
})
```

2. 在命令行中执行：

```bash
cd d:\vue-element-admin-master\backend
node create-table.js
```

## 验证表是否创建成功

执行以下 SQL 查询：

```sql
SELECT * FROM event_reminders;
```

或者执行：

```sql
SELECT name FROM sqlite_master WHERE type='table' AND name='event_reminders';
```

## 重启后端服务

创建表后，需要重启后端服务：

1. 停止当前运行的后端服务（Ctrl+C 或关闭命令窗口）
2. 重新启动后端：

```bash
cd d:\vue-element-admin-master\backend
node app.js
```

或者使用批处理文件：

```bash
重启后端服务.bat
```

## 测试功能

1. 打开浏览器访问前端页面
2. 进入「通知管理」→「事件提醒」
3. 应该能看到示例数据（3条事件提醒）
4. 点击「新增事件提醒」可以创建新的事件

## 故障排除

### 问题1：表创建失败

**原因**：数据库文件被占用或权限不足

**解决方法**：

- 停止后端服务后再创建表
- 确保有数据库文件的读写权限

### 问题2：API 返回 404

**原因**：后端服务未重启

**解决方法**：重启后端服务

### 问题3：无法访问事件提醒页面

**原因**：前端路由未更新

**解决方法**：

- 确认路由配置已更新（已添加事件提醒路由）
- 刷新浏览器页面（Ctrl+F5 强制刷新）
