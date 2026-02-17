<template>
  <div class="app-container">
    <el-card>
      <el-form :inline="true" :model="queryParams" class="query-form">
        <el-form-item label="档案编号">
          <el-input
            v-model="queryParams.keyword"
            placeholder="请输入档案编号"
            clearable
            size="small"
            style="width: 180px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="纠纷类型">
          <el-select
            v-model="queryParams.disputeType"
            placeholder="请选择纠纷类型"
            clearable
            size="small"
            style="width: 160px"
            @change="handleQuery"
          >
            <el-option label="婚姻家庭纠纷" value="婚姻家庭纠纷" />
            <el-option label="邻里纠纷" value="邻里纠纷" />
            <el-option label="合同纠纷" value="合同纠纷" />
            <el-option label="损害赔偿纠纷" value="损害赔偿纠纷" />
            <el-option label="劳动争议" value="劳动争议" />
            <el-option label="其他纠纷" value="其他纠纷" />
          </el-select>
        </el-form-item>
        <el-form-item label="档案状态">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择状态"
            clearable
            size="small"
            style="width: 140px"
            @change="handleQuery"
          >
            <el-option label="草稿" value="draft" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="queryParams.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            size="small"
            style="width: 240px"
            @change="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" :icon="Search" @click="handleQuery"
            >搜索</el-button
          >
          <el-button size="small" :icon="RefreshRight" @click="resetQuery">重置</el-button>
          <el-button v-hasPermi="'mediation:add'" type="primary" size="small" :icon="Plus" @click="handleCreate"
            >新建档案</el-button
          >
          <el-button v-hasPermi="'mediation:export'" type="success" size="small" :icon="Download" @click="handleExport"
            >导出Excel</el-button
          >
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="archiveList" size="small" style="width: 100%">
        <el-table-column type="index" width="50" align="center" label="序号" />
        <el-table-column prop="archive_id" label="档案编号" align="center" width="150" />
        <el-table-column prop="prefix" label="所属分组" align="center" width="120" />
        <el-table-column label="申请人" align="center" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ formatParticipants(row.applicant_display || row.applicants || row.applicant_names) }}
          </template>
        </el-table-column>
        <el-table-column label="被申请人" align="center" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{
              formatParticipants(row.respondent_display || row.respondents || row.respondent_names)
            }}
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row?.status)">
              {{ getStatusText(row?.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="'mediation:view'" link type="primary" size="small" :icon="View" @click="handleView(row)"
              >查看</el-button
            >
            <el-button v-hasPermi="'mediation:edit'" link type="warning" size="small" :icon="Edit" @click="handleEdit(row)"
              >编辑</el-button
            >
            <el-button v-hasPermi="'mediation:delete'" link type="danger" size="small" :icon="Delete" @click="handleDelete(row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
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

    <!-- 新建档案对话框 -->
    <el-dialog v-model="createDialogVisible" title="新建档案" width="500px">
      <el-form :model="createForm" label-width="120px">
        <el-form-item label="档案编号前缀" required>
          <el-select v-model="createForm.prefix" placeholder="请选择前缀" style="width: 100%">
            <el-option
              v-for="item in prefixList"
              :key="item.prefix"
              :label="`${item.prefix} (当前序号: ${item.sequence_number || item.current_number})`"
              :value="item.prefix"
            />
          </el-select>
        </el-form-item>
        <el-alert title="说明" type="info" :closable="false" style="margin-top: 10px">
          档案编号将自动生成，格式为"前缀-序号"，创建后不可修改。
        </el-alert>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="createLoading" @click="handleSubmitCreate"
          >创建</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, RefreshRight, Download, View, Edit, Delete, Plus } from '@element-plus/icons-vue'
import { getArchives, getArchivePrefixes, createArchive, deleteArchive } from '@/api/archive'

const router = useRouter()
const loading = ref(false)
const createLoading = ref(false)
const archiveList = ref<any[]>([])
const total = ref(0)
const prefixList = ref<any[]>([])

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  disputeType: '',
  status: '',
  dateRange: [] as string[]
})

const createDialogVisible = ref(false)
const createForm = reactive({
  prefix: ''
})

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    draft: 'info',
    in_progress: 'warning',
    completed: 'success'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    draft: '草稿',
    in_progress: '进行中',
    completed: '已完成'
  }
  return map[status] || status
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  const splitter = dateStr.includes('T') ? 'T' : ' '
  const datePart = dateStr.split(splitter)[0]
  return datePart || dateStr.substring(0, 10)
}

const formatParticipants = (participants?: any[] | string) => {
  if (!participants) return '-'
  if (typeof participants === 'string') return participants || '-'
  if (!Array.isArray(participants) || participants.length === 0) return '-'
  const names = participants.map((p) => p.name).filter(Boolean)
  if (names.length === 0) return '-'
  if (names.length === 1) return names[0]
  return `${names[0]}等${names.length}人`
}

const getList = async () => {
  loading.value = true
  try {
    const params: any = {
      page: queryParams.page,
      pageSize: queryParams.pageSize,
      status: queryParams.status,
      keyword: queryParams.keyword,
      disputeType: queryParams.disputeType
    }
    // 添加日期范围
    if (queryParams.dateRange && queryParams.dateRange.length === 2) {
      params.startDate = queryParams.dateRange[0]
      params.endDate = queryParams.dateRange[1]
    }

    const res = await getArchives(params)
    const data = res.data || {}
    archiveList.value = data.items || data.data || []
    total.value = data.total || 0
  } catch (error) {
    console.error('获取档案列表失败:', error)
    ElMessage.error('获取档案列表失败')
  } finally {
    loading.value = false
  }
}

const getPrefixList = async () => {
  try {
    const res = await getArchivePrefixes()
    prefixList.value = res.data || []
  } catch (error) {
    console.error('获取前缀列表失败:', error)
  }
}

const handleQuery = () => {
  queryParams.page = 1
  getList()
}

const resetQuery = () => {
  queryParams.keyword = ''
  queryParams.disputeType = ''
  queryParams.status = ''
  queryParams.dateRange = []
  queryParams.page = 1
  getList()
}

const handleCreate = () => {
  createForm.prefix = ''
  createDialogVisible.value = true
}

const handleSubmitCreate = async () => {
  if (!createForm.prefix) {
    ElMessage.warning('请选择村组')
    return
  }
  createLoading.value = true
  try {
    const res = await createArchive({ prefix: createForm.prefix })
    ElMessage.success('创建成功')
    createDialogVisible.value = false
    getList()
    // 跳转到详情页
    const newId = res.data?.id || res.data?.archive_id
    if (newId) {
      router.push(`/mediation/archive-detail/${newId}`)
    }
  } catch (error) {
    console.error('创建档案失败:', error)
    ElMessage.error('创建档案失败')
  } finally {
    createLoading.value = false
  }
}

const handleView = (row: any) => {
  router.push(`/mediation/archive-detail/${row.archive_id}`)
}

const handleEdit = (row: any) => {
  router.push(`/mediation/archive-detail/${row.archive_id}?mode=edit`)
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确认删除该档案吗？', '提示', { type: 'warning' })
    await deleteArchive(row.archive_id)
    ElMessage.success('删除成功')
    getList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const handleExport = () => {
  ElMessage.info('导出功能开发中')
}

onMounted(() => {
  getList()
  getPrefixList()
})
</script>

<style scoped>
.query-form {
  margin-bottom: 16px;
}
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
