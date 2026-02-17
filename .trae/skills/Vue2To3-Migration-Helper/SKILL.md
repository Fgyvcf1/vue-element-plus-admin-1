---
name: Vue2To3-Migration-Helper
description: Vue2(vue-element-admin)迁移到Vue3(vue-element-plus-admin)专用技能，强制pnpm依赖管理，自动修复语法差异，支持模块聚焦编辑。Invoke when user needs to migrate Vue2 code to Vue3, upgrade Element UI to Element Plus, convert Vue2 syntax to Vue3 composition API, or edit specific module with module-focused approach.
version: 2.1
---

# Vue2 到 Vue3 迁移助手（vue-element-admin → vue-element-plus-admin）

## 项目背景（必须牢记）

- **原项目**：D:\vue-element-admin-master（Vue 2 + Element UI + Vuex + Vue Router 3）
- **新项目**：D:\vue-element-plus-admin（Vue 3 + Element Plus + Pinia + Vue Router 4）
- **包管理器**：⚠️ **强制使用 pnpm** ⚠️ （绝对禁止 npm install / yarn install）

## 核心规则（优先级最高）

### 1. 依赖管理（铁律）

- ✅ **必须使用**：`pnpm install`、`pnpm add`、`pnpm remove`
- ❌ **严禁使用**：`npm install`、`npm i`、`yarn add`、`yarn install`
- 安装 Element Plus 图标：`pnpm add @element-plus/icons-vue`
- 如果检测到 node_modules 是用 npm/yarn 安装的，建议删除后重新 `pnpm install`

### 2. Element UI → Element Plus 关键变更

| Element UI (Vue2) | Element Plus (Vue3) | 说明 |
| --- | --- | --- |
| `el-submenu` | `el-sub-menu` | 组件名变更 |
| `el-button type="primary"` | 相同 | 但图标用法完全不同 |
| 图标类名 `el-icon-xxx` | `<el-icon><Home /></el-icon>` | 必须使用 SVG 图标组件 |
| `slot="title"` | `<template #title>` | 插槽语法变更 |
| `v-loading.body` | `v-loading` | 修饰符移除 |
| `el-pagination` | 相同 | 事件名变更：`current-change` → `current-change` |

**图标迁移示例**：

```
<!-- Vue2 错误写法 -->
<i class="el-icon-menu"></i>

<!-- Vue3 正确写法 -->
<el-icon><Menu /></el-icon>
```

### 3. Vue2 → Vue3 语法自动修复规则

#### 3.1 选项式 API → 组合式 API

```
<!-- Vue2 -->
<script>
export default {
  data() {
    return { count: 0 }
  },
  methods: {
    increment() {
      this.count++
    }
  }
}
</script>

<!-- Vue3 -->
<script setup>
import { ref } from 'vue'
const count = ref(0)
const increment = () => {
  count.value++
}
</script>
```

#### 3.2 Vuex → Pinia

```
// Vue2 Vuex
this.$store.dispatch('user/login')
this.$store.state.user.token

// Vue3 Pinia
import { useUserStore } from '@/store/modules/user'
const userStore = useUserStore()
userStore.login()
userStore.token
```

#### 3.3 Vue Router 3 → Vue Router 4

```
// Vue2
this.$router.push('/dashboard')
this.$route.query.id

// Vue3
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
const route = useRoute()
router.push('/dashboard')
route.query.id
```

#### 3.4 生命周期钩子

| Vue2            | Vue3 (Options)  | Vue3 (Composition) |
| --------------- | --------------- | ------------------ |
| `beforeCreate`  | `beforeCreate`  | `setup()`          |
| `created`       | `created`       | `setup()`          |
| `beforeMount`   | `beforeMount`   | `onBeforeMount`    |
| `mounted`       | `mounted`       | `onMounted`        |
| `beforeUpdate`  | `beforeUpdate`  | `onBeforeUpdate`   |
| `updated`       | `updated`       | `onUpdated`        |
| `beforeDestroy` | `beforeUnmount` | `onBeforeUnmount`  |
| `destroyed`     | `unmounted`     | `onUnmounted`      |

#### 3.5 v-model 变更

```
<!-- Vue2 -->
<ChildComponent v-model="value" />
<!-- 等价于 -->
<ChildComponent :value="value" @input="value = $event" />

<!-- Vue3 -->
<ChildComponent v-model="value" />
<!-- 等价于 -->
<ChildComponent :modelValue="value" @update:modelValue="value = $event" />
```

#### 3.6 过滤器移除

```
<!-- Vue2 -->
{{ message | capitalize }}

<!-- Vue3 -->
{{ capitalize(message) }}
```

#### 3.7 $listeners 移除

```
<!-- Vue2 -->
<Child v-on="$listeners" />

<!-- Vue3 -->
<Child v-bind="$attrs" />
```

### 4. 文件路径映射

| Vue2 路径 | Vue3 路径 |
| --- | --- |
| `D:\vue-element-admin-master\src\views\login\index.vue` | `D:\vue-element-plus-admin\src\views\Login\Login.vue` |
| `D:\vue-element-admin-master\src\store\modules\user.js` | `D:\vue-element-plus-admin\src\store\modules\user.ts` |
| `D:\vue-element-admin-master\src\router\index.js` | `D:\vue-element-plus-admin\src\router\index.ts` |
| `D:\vue-element-admin-master\src\api\user.js` | `D:\vue-element-plus-admin\src\api\user\index.ts` |

### 5. 迁移步骤检查清单

#### 阶段1：环境准备

- [ ] 确认使用 pnpm 安装依赖
- [ ] 安装 Element Plus 和图标库
- [ ] 配置 vite.config.ts
- [ ] 设置 TypeScript 配置

#### 阶段2：核心语法迁移

- [ ] 将 `.js` 文件改为 `.ts`
- [ ] Vue 组件改为 `<script setup>` 语法
- [ ] Vuex Store 改为 Pinia Store
- [ ] 路由配置改为 Vue Router 4 语法
- [ ] 移除过滤器，改为计算属性或方法

#### 阶段3：Element UI 迁移

- [ ] `el-submenu` → `el-sub-menu`
- [ ] 图标类名改为 SVG 组件
- [ ] 插槽语法 `slot="xxx"` → `<template #xxx>`
- [ ] 检查组件属性变更

#### 阶段4：测试验证

- [ ] 运行 `pnpm dev` 检查编译错误
- [ ] 检查浏览器控制台警告
- [ ] 验证所有页面功能正常

### 6. 常见错误及修复

#### 错误1：找不到模块

```
Cannot find module '@/store/modules/user'
```

**修复**：检查路径大小写，Vue3 项目使用大写目录名

#### 错误2：Element Plus 组件未注册

```
[Vue warn]: Failed to resolve component: el-button
```

**修复**：确保在 main.ts 中正确导入 Element Plus

#### 错误3：图标不显示

```
[Vue warn]: Failed to resolve component: el-icon
```

**修复**：使用 `@element-plus/icons-vue` 中的图标组件

### 7. 自动修复命令

当检测到 Vue2 语法时，自动执行以下替换：

```
# 1. 替换 slot 语法
sed -i 's/slot="\([^"]*\)"/<template #\1>/g' *.vue

# 2. 替换 el-submenu
sed -i 's/el-submenu/el-sub-menu/g' *.vue

# 3. 替换生命周期
sed -i 's/beforeDestroy/beforeUnmount/g' *.vue
sed -i 's/destroyed/unmounted/g' *.vue

# 4. 替换 $store
sed -i 's/this\.\$store\.state\.\([a-zA-Z]*\)/use\1Store()/g' *.ts
```

---

## 模块聚焦编辑模式（Module-Focused Editing）

### 功能说明

当编辑特定模块时，系统会限制代码编辑范围，只修改当前模块相关的代码（API、路由、组件等），避免影响其他模块。每个模块应该是独立的，拥有单独的路由和 API。

### 启动提示

**必须输出**：`🔍 编辑【模块名称】模块`

例如：

- `🔍 编辑【居民管理】模块`
- `🔍 编辑【调解档案】模块`
- `🔍 编辑【残疾人管理】模块`

### 模块定义与文件范围

#### 居民管理模块

**启动提示**：`🔍 编辑【居民管理】模块`

**核心文件范围**：

```
前端 (Vue3):
- src/views/Resident/Query.vue
- src/views/Resident/Add.vue
- src/views/Resident/Edit.vue
- src/views/Resident/components/ResidentDetailDialog.vue
- src/views/Resident/components/ImportMapping.vue
- src/api/resident/index.ts
- src/api/resident/types.ts
- src/api/household/index.ts
- src/router/modules/resident.ts

后端 (Node.js):
- backend/routes/residentRoutes.js
- backend/routes/householdRoutes.js
- backend/controllers/residentController.js
- backend/controllers/householdController.js
- backend/services/residentService.js
- backend/services/householdService.js
```

#### 调解档案模块

**启动提示**：`🔍 编辑【调解档案】模块`

**核心文件范围**：

```
前端 (Vue3):
- src/views/Archive/ 目录下所有文件
- src/api/archive/index.ts
- src/router/modules/archive.ts

后端 (Node.js):
- backend/routes/archiveRoutes.js
- backend/controllers/archiveController.js
- backend/services/archiveService.js
- backend/services/pdfService.js
- backend/templates/ 中与档案相关的模板
```

#### 残疾人管理模块

**启动提示**：`🔍 编辑【残疾人管理】模块`

**核心文件范围**：

```
前端 (Vue3):
- src/views/SpecialPeople/Disabled/ 目录下所有文件
- src/api/specialPeople/index.ts
- src/router/modules/specialPeople.ts

后端 (Node.js):
- backend/routes/disabledRoutes.js
- backend/controllers/disabledController.js
- backend/services/disabledService.js
```

### 公共代码部分（可修改）

以下代码属于公共使用部分，可以在编辑任何模块时修改：

- `src/utils/` 目录下的公共工具函数
- `src/hooks/` 目录下的公共 hooks
- `src/components/` 目录下的公共组件（非模块专用）
- `src/store/modules/app.ts` 应用级状态
- `src/store/modules/user.ts` 用户状态
- `src/store/modules/permission.ts` 权限状态
- `backend/db.js` 数据库连接
- `backend/app.js` 主应用文件
- `backend/middleware/` 公共中间件
- `package.json` 依赖配置

### 模块独立原则

1. **独立路由**：每个模块应该有独立的路由文件，如 `src/router/modules/resident.ts`
2. **独立 API**：每个模块应该有独立的 API 文件，如 `src/api/resident/index.ts`
3. **独立视图**：每个模块的视图文件放在独立的目录，如 `src/views/Resident/`
4. **独立组件**：模块专用组件放在模块目录下的 `components/` 文件夹
5. **不跨模块引用**：避免在一个模块中直接引用另一个模块的内部文件

### 编辑流程

1. **启动模块编辑**：输出 `🔍 编辑【模块名称】模块`
2. **识别相关文件**：根据模块定义，列出所有相关文件
3. **限制搜索范围**：只在该模块的文件范围内搜索和修改
4. **验证独立性**：确保修改不会影响其他模块
5. **完成编辑**：输出 `✅ 【模块名称】模块编辑完成`

### 使用示例

**示例1：编辑居民管理模块**

用户说："帮我修改居民详情模态框的样式"

系统应该：

1. 输出：`🔍 编辑【居民管理】模块`
2. 识别相关文件：
   - `src/views/Resident/components/ResidentDetailDialog.vue`
   - 可能涉及的样式文件
3. 只在这些文件范围内进行修改
4. 输出：`✅ 【居民管理】模块编辑完成`

**示例2：添加居民管理的新功能**

用户说："给居民管理添加导出功能"

系统应该：

1. 输出：`🔍 编辑【居民管理】模块`
2. 识别需要修改的文件：
   - `src/views/Resident/Query.vue` - 添加导出按钮
   - `src/api/resident/index.ts` - 添加导出 API
   - `backend/routes/residentRoutes.js` - 添加后端路由
   - `backend/controllers/residentController.js` - 添加导出逻辑
3. 只在这些文件范围内进行修改
4. 输出：`✅ 【居民管理】模块编辑完成`

### 注意事项

1. **启动时必须输出模块提示**：让用户知道当前正在编辑哪个模块
2. **严格限制文件范围**：不要修改其他模块的文件
3. **公共代码可以修改**：但需要注意影响范围
4. **保持模块独立性**：确保修改不会破坏其他模块的功能
5. **完成时输出提示**：让用户知道模块编辑已完成

---

## 使用示例

### 迁移示例

用户说："帮我迁移登录页面"

你应该：

1. 读取 `D:\vue-element-admin-master\src\views\login\index.vue`
2. 转换为 Vue3 + Element Plus 语法
3. 保存到 `D:\vue-element-plus-admin\src\views\Login\Login.vue`
4. 使用 pnpm 安装任何需要的依赖
5. 验证语法正确性

### 模块编辑示例

用户说："编辑居民管理模块，修改居民详情对话框"

你应该：

1. 输出：`🔍 编辑【居民管理】模块`
2. 读取 `src/views/Resident/components/ResidentDetailDialog.vue`
3. 进行修改
4. 输出：`✅ 【居民管理】模块编辑完成`

---

## 注意事项

1. **永远不要使用 npm/yarn**，只使用 pnpm
2. **保持文件命名规范**，Vue3 项目使用大驼峰命名组件
3. **TypeScript 优先**，所有新文件使用 .ts 扩展名
4. **组合式 API 优先**，新组件使用 `<script setup>`
5. **Element Plus 图标**，必须使用 SVG 图标组件，不能使用类名
6. **模块独立原则**，每个模块应该有独立的路由和 API
7. **启动输出提示**，编辑模块时必须输出 `🔍 编辑【模块名称】模块`
