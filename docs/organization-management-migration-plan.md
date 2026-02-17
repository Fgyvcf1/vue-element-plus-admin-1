# 机构管理模块迁移执行清单（Vue2 -> Vue3 + SQLite -> MariaDB）

## 1. 迁移目标

- 模块范围：`机构管理（leadership / committee_members）`
- 前端：Vue2 Options API / Vuex / Router3 -> Vue3 Composition API / Pinia / Router4
- 后端：SQLite 方言 -> MariaDB 方言
- 约束：保持模块化，接口契约尽量稳定，分阶段可回滚

## 2. 源码映射（原项目 -> 现项目）

### 2.1 路由层

- `D:\vue-element-admin-master\src\router\leadership.js`
  -> `src/router/modules/organization.ts`（待创建并接入）

### 2.2 API 层

- `D:\vue-element-admin-master\src\api\leadership.js`
  -> `src/api/leadership/index.ts`（已创建）

### 2.3 状态管理

- `D:\vue-element-admin-master\src\store\modules\leadership.js`
  -> `src/store/modules/leadership.ts`（已创建，Pinia）

### 2.4 页面与组件

- `D:\vue-element-admin-master\src\views\leadership\members\index.vue`
  -> `src/views/Leadership/Members/index.vue`（待迁移）
- `D:\vue-element-admin-master\src\views\leadership\members\components\MemberForm.vue`
  -> `src/views/Leadership/Members/components/MemberForm.vue`（待迁移）
- `D:\vue-element-admin-master\src\views\leadership\members\components\HistoryTimeline.vue`
  -> `src/views/Leadership/Members/components/HistoryTimeline.vue`（待迁移）

### 2.5 后端路由

- `backend/routes/leadershipRoutes.js`（当前使用中）
  - 已完成第一轮 MariaDB 兼容修复（统计 SQL）

### 2.6 数据库

- SQLite 建表脚本：`backend/create-committee-tables.js`
- MariaDB 建表脚本：`backend/sql/organization-management-schema.sql`（已创建）

## 3. 分阶段执行（可直接排期）

### 阶段A：数据库与后端稳定（P0）

1. 执行 `backend/sql/organization-management-schema.sql`
2. 校验表结构、索引、外键
3. 核对 `committee_members` CRUD + 统计接口
4. 回归接口契约（分页、错误码、字段命名）

验收标准：
- `GET /committee-members` 可分页
- `GET /committee-members/statistics` 不再依赖 SQLite 函数
- 新增/编辑/删除与历史查询正常

### 阶段B：前端基础骨架（P0）

1. 统一 API 层（`src/api/leadership/index.ts`）
2. Pinia store 平移（`src/store/modules/leadership.ts`）
3. 新建 Router4 模块（`src/router/modules/organization.ts`，先可隐藏）

验收标准：
- API 能单测调用成功
- Store 可在页面中拿到成员列表和届数

### 阶段C：页面迁移（P1）

1. `index.vue`：先保持功能完整，再做 Composition API 优化
2. `MemberForm.vue`：Autocomplete + 新增编辑 + 校验
3. `HistoryTimeline.vue`：历史与统计分离，避免重复计算
4. 导出逻辑迁移（ExcelJS）

验收标准：
- 与 Vue2 模块功能对等
- 关键流程（查询、编辑、历史、导出）通过

### 阶段D：代码清理与强化（P2）

1. 去除 Vue2 兼容写法（`slot-scope`、`.sync` 等）
2. snake_case/camelCase 映射收敛到 API 层
3. 补充接口和页面回归用例

## 4. 风险与处理

1. SQLite 方言残留（`julianday`、`CURRENT_TIMESTAMP` 依赖）  
处理：统一替换为 MariaDB 语法，避免运行时兼容转换。

2. 字段命名不一致（`id_card` vs `idCard`）  
处理：API 层做一次性映射，页面只用驼峰命名。

3. 统计口径偏差（日期空值、结束日期为空）  
处理：SQL 中统一 `NULL/''` 归一化后再计算。

4. 大页面一次性重写风险高  
处理：先“平移可运行”，再二次重构 Composition API。

## 5. 当前完成状态（本轮）

- [x] 机构管理迁移执行文档
- [x] MariaDB 建表 SQL 脚本
- [x] leadership API（Vue3）
- [x] leadership Pinia store（Vue3）
- [x] 后端统计 SQL 从 SQLite 方言迁移到 MariaDB
- [ ] 机构管理页面 Vue3 组件迁移（待执行）
- [ ] Router4 模块接入菜单（待执行）

## 6. 权限/阻塞标记

- 若数据库账号无 DDL 权限：先执行后端与前端迁移，SQL 由 DBA 执行。
- 若历史数据质量不一致：先做只读展示，后做数据修复脚本。

