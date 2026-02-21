<template>
  <div class="app-container todo-page">
    <el-card class="stats-card" shadow="never">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-label">总提醒数</div>
          <div class="stat-value">{{ stats.total }}</div>
        </div>
        <div class="stat-item unread">
          <div class="stat-label">未读</div>
          <div class="stat-value">{{ stats.unread }}</div>
        </div>
        <div class="stat-item read">
          <div class="stat-label">已读</div>
          <div class="stat-value">{{ stats.read }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">任务提醒</div>
          <div class="stat-value">{{ stats.byType.task || 0 }}</div>
        </div>
      </div>
    </el-card>

    <el-card shadow="never">
      <el-form :inline="true" :model="queryParams" class="query-form">
        <el-form-item label="视图">
          <el-radio-group v-model="quickTab" @change="handleQuery">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="unread">未读</el-radio-button>
            <el-radio-button label="task">任务</el-radio-button>
            <el-radio-button label="birth">生日</el-radio-button>
            <el-radio-button label="event">事件</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="标题/内容"
            clearable
            style="width: 220px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select
            v-model="queryParams.type"
            clearable
            placeholder="全部类型"
            style="width: 140px"
          >
            <el-option label="任务" value="task" />
            <el-option label="生日提醒" value="birth" />
            <el-option label="事件提醒" value="event" />
            <el-option label="系统" value="system" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.is_read"
            clearable
            placeholder="全部状态"
            style="width: 140px"
          >
            <el-option label="未读" :value="0" />
            <el-option label="已读" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="openCreateDialog">新增</el-button>
          <el-button :disabled="!selectedIds.length" @click="handleBatchRead">批量已读</el-button>
          <el-button :disabled="!selectedIds.length" @click="handleBatchUnread">批量未读</el-button>
          <el-button :disabled="!selectedIds.length" type="danger" @click="handleBatchDelete"
            >批量删除</el-button
          >
          <el-button :disabled="stats.unread === 0" type="warning" plain @click="handleMarkAllRead"
            >全部已读</el-button
          >
        </el-form-item>
      </el-form>

      <el-table
        v-loading="loading"
        :data="list"
        :row-class-name="getRowClassName"
        @selection-change="handleSelectionChange"
        @row-click="openDetailDialog"
        @row-dblclick="openDetailDialog"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="title" label="标题" min-width="240" show-overflow-tooltip>
          <template #default="scope">
            <span
              :class="['title-cell', { unread: Number(scope.row.is_read) === 0 }]"
              @click="openDetailDialog(scope.row)"
            >
              {{ scope.row.title || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="内容" min-width="260" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="120" align="center">
          <template #default="scope">
            <el-tag :type="getTypeTagType(scope.row.type)">
              {{ typeLabelMap[scope.row.type] || scope.row.type || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="进度" width="130" align="center">
          <template #default="scope">
            <el-progress
              v-if="scope.row.type === 'task'"
              :percentage="Number(scope.row.progress || 0)"
              :stroke-width="8"
              :show-text="false"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="is_read" label="状态" width="90" align="center">
          <template #default="scope">
            <el-tag :type="Number(scope.row.is_read) === 1 ? 'success' : 'danger'">
              {{ Number(scope.row.is_read) === 1 ? '已读' : '未读' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170" />
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="待办详情" width="760px" destroy-on-close>
      <div class="dialog-top-actions">
        <el-button v-if="detailReadonly" type="primary" size="small" @click="enableDetailEdit"
          >编辑</el-button
        >
        <template v-else>
          <el-button type="primary" size="small" :loading="saveLoading" @click="handleSaveDetail"
            >保存</el-button
          >
          <el-button size="small" @click="cancelEditDetail">取消</el-button>
        </template>
        <el-button type="danger" size="small" @click="handleDeleteCurrent">删除</el-button>
      </div>
      <el-form :model="editForm" label-width="90px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="标题">
              <el-input v-model="editForm.title" :disabled="detailReadonly" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类型">
              <el-select v-model="editForm.type" :disabled="detailReadonly" style="width: 100%">
                <el-option label="任务" value="task" />
                <el-option label="生日提醒" value="birth" />
                <el-option label="事件提醒" value="event" />
                <el-option label="系统" value="system" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="editForm.status" :disabled="detailReadonly" style="width: 100%">
                <el-option label="待处理" value="pending" />
                <el-option label="处理中" value="processing" />
                <el-option label="已完成" value="done" />
                <el-option label="已读" value="read" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="阅读状态">
              <el-radio-group v-model="editForm.is_read" :disabled="detailReadonly">
                <el-radio :value="0">未读</el-radio>
                <el-radio :value="1">已读</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="进度">
              <el-input-number
                v-model="editForm.progress"
                :disabled="detailReadonly || editForm.type !== 'task'"
                :min="0"
                :max="100"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="内容">
              <el-input
                v-model="editForm.content"
                type="textarea"
                :rows="4"
                :disabled="detailReadonly"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-dialog>

    <el-dialog v-model="createVisible" title="新建待办提醒" width="560px" destroy-on-close>
      <el-form :model="createForm" label-width="90px">
        <el-form-item label="标题" required>
          <el-input v-model="createForm.title" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input
            v-model="createForm.content"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="createForm.type" style="width: 100%">
            <el-option label="任务" value="task" />
            <el-option label="系统" value="system" />
            <el-option label="事件提醒" value="event" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="createForm.type === 'task'" label="进度">
          <el-input-number v-model="createForm.progress" :min="0" :max="100" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="createLoading" @click="handleCreate">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ElCard,
  ElRadioGroup,
  ElRadioButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption,
  ElButton,
  ElTable,
  ElTableColumn,
  ElPagination,
  ElDialog,
  ElRow,
  ElCol,
  ElTag,
  ElProgress,
  ElInputNumber,
  ElRadio
} from 'element-plus'
import {
  batchDeleteTodoReminders,
  batchMarkTodoRemindersRead,
  createTodoReminder,
  deleteTodoReminder,
  getTodoReminderStats,
  getTodoReminders,
  markAllTodoRemindersRead,
  updateTodoReminder
} from '@/api/todoReminder'
import { useUserStore } from '@/store/modules/user'

const loading = ref(false)
const createLoading = ref(false)
const saveLoading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const selectedIds = ref<number[]>([])

const detailVisible = ref(false)
const createVisible = ref(false)
const detailReadonly = ref(true)
const userStore = useUserStore()
const canAdd = computed(() => userStore.hasPermission('todo:add'))
const canEdit = computed(() => userStore.hasPermission('todo:edit'))

const quickTab = ref<'all' | 'unread' | 'task' | 'birth' | 'event'>('all')

const stats = reactive({
  total: 0,
  unread: 0,
  read: 0,
  byType: {} as Record<string, number>
})

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  type: '',
  is_read: '' as number | ''
})

const createForm = reactive({
  title: '',
  content: '',
  type: 'task',
  progress: 0
})

const editForm = reactive<any>({
  id: 0,
  title: '',
  content: '',
  type: 'task',
  status: 'pending',
  is_read: 0,
  progress: 0
})

const originalEditForm = ref<any>({})

const typeLabelMap: Record<string, string> = {
  task: '任务',
  birth: '生日提醒',
  event: '事件提醒',
  system: '系统'
}

const getTypeTagType = (
  type: string
): 'success' | 'warning' | 'info' | 'primary' | 'danger' => {
  if (type === 'task') return 'warning'
  if (type === 'birth') return 'success'
  if (type === 'event') return 'primary'
  if (type === 'system') return 'info'
  return 'info'
}

const getRowClassName = ({ row }: { row: any }) => {
  if (Number(row?.is_read) === 0) {
    return 'row-unread'
  }
  return ''
}

const refreshStats = async () => {
  const res = await getTodoReminderStats()
  stats.total = res.data?.total || 0
  stats.unread = res.data?.unread || 0
  stats.read = res.data?.read || 0
  stats.byType = res.data?.byType || {}
}

watch(
  () => createForm.type,
  (type) => {
    if (type !== 'task') {
      createForm.progress = 0
    }
  }
)

const buildQueryByQuickTab = () => {
  const payload: any = {
    page: queryParams.page,
    pageSize: queryParams.pageSize,
    keyword: queryParams.keyword
  }

  if (queryParams.type) {
    payload.type = queryParams.type
  }
  if (queryParams.is_read !== '') {
    payload.is_read = queryParams.is_read
  }

  if (quickTab.value === 'unread') {
    payload.is_read = 0
  }
  if (['task', 'birth', 'event'].includes(quickTab.value)) {
    payload.type = quickTab.value
  }

  return payload
}

const getList = async () => {
  loading.value = true
  try {
    const res = await getTodoReminders(buildQueryByQuickTab())
    list.value = res.data || []
    total.value = res.total || 0
  } finally {
    loading.value = false
  }
}

const reloadAll = async () => {
  await Promise.all([getList(), refreshStats()])
}

const handleQuery = async () => {
  queryParams.page = 1
  await reloadAll()
}

const handleReset = async () => {
  queryParams.page = 1
  queryParams.pageSize = 10
  queryParams.keyword = ''
  queryParams.type = ''
  queryParams.is_read = ''
  quickTab.value = 'all'
  await reloadAll()
}

const handleSelectionChange = (rows: any[]) => {
  selectedIds.value = rows
    .map((row) => Number(row.id))
    .filter((id) => Number.isInteger(id) && id > 0)
}

const openDetailDialog = (row: any) => {
  Object.assign(editForm, {
    id: Number(row.id || 0),
    title: row.title || '',
    content: row.content || '',
    type: row.type || 'task',
    status: row.status || 'pending',
    is_read: Number(row.is_read || 0),
    progress: Number(row.progress || 0)
  })
  originalEditForm.value = JSON.parse(JSON.stringify(editForm))
  detailReadonly.value = true
  detailVisible.value = true
}

const cancelEditDetail = () => {
  Object.assign(editForm, JSON.parse(JSON.stringify(originalEditForm.value)))
  detailReadonly.value = true
}

const warnNoPermission = () => {
  ElMessage.warning('当前账号没有权限')
}

const enableDetailEdit = () => {
  if (!canEdit.value) {
    warnNoPermission()
    return
  }
  detailReadonly.value = false
}

const handleSaveDetail = async () => {
  if (!canEdit.value) {
    warnNoPermission()
    return
  }
  if (!editForm.id) return
  if (!editForm.title?.trim() || !editForm.content?.trim()) {
    ElMessage.warning('标题和内容不能为空')
    return
  }

  saveLoading.value = true
  try {
    await updateTodoReminder(editForm.id, {
      title: editForm.title,
      content: editForm.content,
      type: editForm.type,
      status: editForm.status,
      is_read: Number(editForm.is_read || 0),
      progress: Number(editForm.progress || 0)
    })
    ElMessage.success('保存成功')
    detailReadonly.value = true
    originalEditForm.value = JSON.parse(JSON.stringify(editForm))
    await reloadAll()
  } finally {
    saveLoading.value = false
  }
}

const openCreateDialog = () => {
  if (!canAdd.value) {
    warnNoPermission()
    return
  }
  createForm.title = ''
  createForm.content = ''
  createForm.type = 'task'
  createForm.progress = 0
  createVisible.value = true
}

const handleCreate = async () => {
  if (!canAdd.value) {
    warnNoPermission()
    return
  }
  if (!createForm.title.trim() || !createForm.content.trim()) {
    ElMessage.warning('请填写标题和内容')
    return
  }
  createLoading.value = true
  try {
    await createTodoReminder({
      title: createForm.title,
      content: createForm.content,
      type: createForm.type,
      progress: createForm.progress,
      status: 'pending',
      is_read: 0
    })
    ElMessage.success('创建成功')
    createVisible.value = false
    await reloadAll()
  } finally {
    createLoading.value = false
  }
}

const toggleReadStatus = async (row: any, target: 0 | 1) => {
  const id = Number(row.id)
  if (!id) return
  await updateTodoReminder(id, { is_read: target, status: target === 1 ? 'read' : 'pending' })
  await reloadAll()
}

const handleBatchRead = async () => {
  if (!selectedIds.value.length) return
  await batchMarkTodoRemindersRead(selectedIds.value)
  ElMessage.success('已批量标记已读')
  selectedIds.value = []
  await reloadAll()
}

const handleBatchUnread = async () => {
  if (!selectedIds.value.length) return
  await Promise.all(
    selectedIds.value.map((id) => updateTodoReminder(id, { is_read: 0, status: 'pending' }))
  )
  ElMessage.success('已批量标记未读')
  selectedIds.value = []
  await reloadAll()
}

const handleMarkAllRead = async () => {
  await ElMessageBox.confirm('确认将全部提醒标记为已读吗？', '提示', { type: 'warning' })
  await markAllTodoRemindersRead()
  ElMessage.success('操作成功')
  await reloadAll()
}

const handleDeleteOne = async (row: any) => {
  const id = Number(row?.id)
  if (!id) return
  await ElMessageBox.confirm('确认删除该提醒吗？', '提示', { type: 'warning' })
  await deleteTodoReminder(id)
  ElMessage.success('删除成功')
  await reloadAll()
}

const handleDeleteCurrent = async () => {
  if (!editForm.id) return
  await handleDeleteOne({ id: editForm.id })
  detailVisible.value = false
}

const handleBatchDelete = async () => {
  if (!selectedIds.value.length) return
  await ElMessageBox.confirm(`确认删除选中的 ${selectedIds.value.length} 条提醒吗？`, '提示', {
    type: 'warning'
  })
  await batchDeleteTodoReminders(selectedIds.value)
  ElMessage.success('删除成功')
  selectedIds.value = []
  await reloadAll()
}

onMounted(async () => {
  await reloadAll()
})
</script>

<style scoped>
.todo-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: small;
}

.stats-card {
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.stat-item {
  border: 1px solid #eef2f7;
  border-radius: 8px;
  padding: 6px 12px;
  background: #fff;
  height: 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.stat-item.unread {
  border-color: #fde2e2;
  background: #fff8f8;
}

.stat-item.read {
  border-color: #d9f2e6;
  background: #f7fffa;
}

.stat-label {
  color: #909399;
  font-size: 11px;
}

.stat-value {
  margin-top: 2px;
  color: #303133;
  font-size: small;
  font-weight: 700;
}

.query-form {
  margin-bottom: 12px;
}

.query-form :deep(.el-form-item__label) {
  font-size: small;
}

.query-form :deep(.el-radio-button__inner) {
  font-size: small;
}

.query-form :deep(.el-input__inner) {
  font-size: small;
}

.query-form :deep(.el-button) {
  font-size: small;
}

:deep(.el-table) {
  font-size: small;
}

:deep(.el-table th) {
  font-size: small;
}

:deep(.el-tag) {
  font-size: small;
}

:deep(.el-pagination) {
  font-size: small;
}

.title-cell {
  cursor: pointer;
}

.title-cell.unread {
  font-weight: 700;
}

.row-unread {
  color: #1d4ed8;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.dialog-top-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

:deep(.el-dialog__title) {
  font-size: small;
}

:deep(.el-form-item__label) {
  font-size: small;
}

:deep(.el-input__inner) {
  font-size: small;
}

:deep(.el-select .el-input__inner) {
  font-size: small;
}

:deep(.el-button) {
  font-size: small;
}

@media (max-width: 960px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
