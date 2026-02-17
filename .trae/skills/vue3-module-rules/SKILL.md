---
name: 'vue3-module-rules'
description: 'Vue3模块化开发规范。用于修改前端代码时遵守模块边界原则，防止乱改其他模块代码。'
---

# Vue3 模块化开发 Skill

## 角色定义

你是 Vue3 模块化开发专家，严格遵守以下规则，确保代码修改安全、模块独立。

---

## 铁律 1：模块边界原则（最重要）

### 1.1 模块内允许的操作

- ✅ 修改 `src/views/{当前模块}/` 下的任何文件
- ✅ 在当前模块内新建文件、组件
- ✅ 修改本模块的 API 接口 (`src/api/{当前模块}/`)

### 1.2 禁止的操作（除非用户明确授权）

- ❌ 修改其他模块的代码（`src/views/{其他模块}/`）
- ❌ 修改 `src/router/modules/` 下的路由配置文件（除非用户明确要求）
- ❌ 修改全局配置文件
- ❌ 在模块 A 中直接引入模块 B 的内部组件/逻辑

### 1.3 跨模块通信规范

如需调用其他模块功能，必须通过 API 层：

```typescript
// 正确方式：通过 API 层调用
import { getOtherModuleData } from '@/api/otherModule'
const data = await getOtherModuleData(params)
```

---

## 铁律 2：UI 组件导入规范

### 2.1 必须手动导入 Element Plus 组件

在 Vue3 + Element Plus 项目中，新创建的组件必须手动导入所需组件：

```typescript
import { ElButton, ElTable, ElForm, ElInput } from 'element-plus'
```

### 2.2 确保组件已注册

如果页面出现白屏，检查：

1. 是否缺少组件导入
2. 是否有组件名称拼写错误
3. 浏览器控制台是否有 `Failed to resolve component` 警告

---

## 铁律 3：API 响应处理规范

### 3.1 处理不同响应格式

后端 API 可能返回不同格式，需要兼容处理：

```typescript
// 方式 1: res.data.items
const data = res.data?.items || res.data?.data || []

// 方式 2: res.data
const list = res.data || []
```

### 3.2 处理数字 ID 和字符串 ID

档案类模块可能使用字符串 ID（如 "大车调解-001"），需要根据后端 API 正确传递参数。

---

## 铁律 4：修改后端代码规范

### 4.1 修改后必须重启服务

修改 `backend/routes/*.js` 后必须重启后端服务：

```bash
# 停止当前运行的后端
# 然后重新启动
cd backend && node app.js
```

### 4.2 测试 API

修改后使用 curl 或 node 测试 API 是否正常：

```bash
curl http://localhost:3001/api/xxx
```

---

## 铁律 5：路由配置规范

### 5.1 菜单图标配置

- 图标必须在子菜单的 `meta` 中配置，不是在父菜单
- 图标格式：`vi-ep:图标名`（需要确认图标在图标库中存在）
- 使用 `alwaysShow: true` 确保父菜单显示

### 5.2 路由路径规范

- 一级菜单路径：如 `/mediation`
- 子菜单路径：如 `archive-list`（完整路径为 `/mediation/archive-list`）
- 详情页路径：如 `archive-detail/:id`

---

## 修改代码前的检查清单

1. ✅ 确认修改的是当前模块的代码
2. ✅ 检查是否需要导入 Element Plus 组件
3. ✅ 检查 API 响应格式是否正确
4. ✅ 如果修改后端，确认重启后端服务
5. ✅ 修改后测试页面是否正常显示

---

## 常见问题排查

| 问题       | 可能原因         | 解决方案                     |
| ---------- | ---------------- | ---------------------------- |
| 页面白屏   | 缺少组件导入     | 添加 Element Plus 组件导入   |
| 500 错误   | 后端 API 错误    | 检查后端日志，重启后端       |
| 菜单不跳转 | 路由配置错误     | 检查路由路径和 redirect 配置 |
| 图标不显示 | 图标不在图标库   | 使用图标库中存在的图标       |
| 数据不显示 | API 响应格式不对 | 检查并兼容不同响应格式       |
