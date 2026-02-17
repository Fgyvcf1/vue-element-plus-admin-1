<template>
  <div class="app-container">
    <div class="header">
      <h2>调解案卷</h2>
    </div>

    <!-- 搜索筛选区 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="档案编号">
          <el-input v-model="filterForm.keyword" placeholder="请输入档案编号" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="RefreshRight" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 案卷列表表格 -->
    <el-card class="table-card">
      <el-table v-loading="loading" :data="tableData" border style="width: 100%">
        <el-table-column type="index" width="50" align="center" label="序号" />
        <el-table-column prop="archive_id" label="档案编号" width="180" />
        <el-table-column prop="file_name" label="文件名" min-width="300" show-overflow-tooltip />
        <el-table-column label="生成日期" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" :icon="View" @click="handleView(row)"
              >查看</el-button
            >
            <el-button type="success" size="small" :icon="Download" @click="handleDownload(row)"
              >下载</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- PDF查看对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="查看调解案卷"
      width="90%"
      :close-on-click-modal="false"
      custom-class="pdf-view-dialog"
    >
      <div class="pdf-container">
        <iframe
          v-if="currentPdfUrl"
          :src="currentPdfUrl"
          width="100%"
          height="800px"
          frameborder="0"
        ></iframe>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, RefreshRight, View, Download } from '@element-plus/icons-vue'
import { getCaseFileList, downloadCaseFile } from '@/api/archive'

const loading = ref(false)
const tableData = ref<any[]>([])
const filterForm = reactive({
  keyword: ''
})
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})
const viewDialogVisible = ref(false)
const currentPdfUrl = ref('')

const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  return dateStr.replace('T', ' ').substring(0, 19)
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: filterForm.keyword
    }
    const res = await getCaseFileList(params)
    if (res.data) {
      tableData.value = res.data.items || []
      pagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('获取案卷列表失败:', error)
    ElMessage.error('获取案卷列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  filterForm.keyword = ''
  pagination.page = 1
  loadData()
}

const handleView = (row: any) => {
  // 使用后端API直接查看PDF
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
  currentPdfUrl.value = `${baseUrl}/case-files/${row.archive_id}/view`
  viewDialogVisible.value = true
}

const handleDownload = async (row: any) => {
  try {
    const res = await downloadCaseFile(row.archive_id)
    // 创建下载链接
    const blob = new Blob([res], { type: 'application/pdf' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = row.file_name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    ElMessage.success('下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('下载失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.filter-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: center;
}

.pdf-container {
  width: 100%;
  height: 800px;
}

:deep(.pdf-view-dialog .el-dialog__body) {
  padding: 0;
}
</style>
