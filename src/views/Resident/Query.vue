<template>
  <div class="resident-query-container">
    <!-- 搜索表单 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" label-width="70px" class="search-form" size="small">
        <div class="search-form-content">
          <div class="search-fields">
            <el-form-item label="居民姓名" class="compact-form-item">
              <el-autocomplete
                v-model="searchForm.name"
                placeholder="姓名"
                clearable
                :fetch-suggestions="fetchResidentNameSuggestions"
                value-key="value"
                :trigger-on-focus="false"
                :debounce="300"
                @select="handleSearch"
              />
            </el-form-item>
            <el-form-item label="身份证号" class="compact-form-item">
              <el-input
                v-model="searchForm.idCard"
                placeholder="身份证"
                clearable
                @keyup.enter="handleSearch"
              />
            </el-form-item>
            <el-form-item label="户主姓名" class="compact-form-item">
              <el-autocomplete
                v-model="searchForm.householderName"
                placeholder="户主"
                clearable
                :fetch-suggestions="fetchHouseholdHeadNameSuggestions"
                value-key="value"
                :trigger-on-focus="false"
                :debounce="300"
                @select="handleSearch"
              />
            </el-form-item>
            <el-form-item label="性别" class="compact-form-item">
              <el-select v-model="searchForm.gender" placeholder="性别" clearable>
                <el-option label="男" value="男" />
                <el-option label="女" value="女" />
              </el-select>
            </el-form-item>
            <el-form-item label="村组" class="compact-form-item">
              <el-select v-model="searchForm.villageGroup" placeholder="村组" clearable>
                <el-option
                  v-for="item in villageGroupOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="出生年份" class="compact-form-item">
              <el-date-picker
                v-model="searchForm.birthYear"
                type="year"
                placeholder="年份"
                value-format="YYYY"
              />
            </el-form-item>
            <el-form-item label="联系电话" class="compact-form-item">
              <el-input v-model="searchForm.phoneNumber" placeholder="电话" clearable />
            </el-form-item>
            <el-form-item label="状态" class="compact-form-item">
              <el-select v-model="searchForm.status" placeholder="状态" clearable>
                <el-option label="正常" value="active" />
                <el-option label="迁出" value="migrated_out" />
                <el-option label="死亡" value="deceased" />
              </el-select>
            </el-form-item>
            <el-form-item label-width="0" class="compact-form-item action-form-item">
              <el-button type="primary" plain @click="handlePopulationDeathReport">
                人口增减上报
              </el-button>
            </el-form-item>
          </div>
          <div class="search-buttons">
            <el-button type="primary" @click="handleSearch" size="small">
              <Icon icon="ep:search" class="mr-1" />
              查询
            </el-button>
            <el-button @click="handleReset" size="small">
              <Icon icon="ep:refresh-right" class="mr-1" />
              重置
            </el-button>
            <el-button type="success" @click="handleExport" size="small">
              <Icon icon="ep:download" class="mr-1" />
              导出
            </el-button>
            <el-button
              v-hasPermi="'resident:add'"
              type="warning"
              @click="handleImport"
              size="small"
            >
              <Icon icon="ep:upload" class="mr-1" />
              导入
            </el-button>
          </div>
        </div>
      </el-form>
    </el-card>

    <!-- 统计信息 -->
    <el-card class="stat-card" shadow="never" v-if="statInfo.total > 0">
      <div class="stat-info">
        <span class="stat-item">
          <span class="stat-label">查询结果：</span>
          <span class="stat-value">{{ statInfo.households }}</span>
          <span class="stat-unit">户</span>
          <span class="stat-value">{{ statInfo.total }}</span>
          <span class="stat-unit">人</span>
        </span>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="tableData"
        :row-style="getRowStyle"
        size="small"
        class="custom-row-height-table"
        @row-click="handleRowClick"
        @row-contextmenu="(row, column, event) => openContextMenu(row, event)"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="居民姓名" align="center" width="90" />
        <el-table-column prop="idCard" label="身份证号" align="center" width="180" />
        <el-table-column prop="gender" label="性别" align="center" width="60" />
        <el-table-column label="户主姓名" align="center" width="90">
          <template #default="{ row }">
            {{ row.household_head_name || row.householderName || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="relationship_to_head"
          label="与户主关系"
          align="center"
          width="100"
        />
        <el-table-column prop="dateOfBirth" label="出生日期" align="center" width="120" />
        <el-table-column prop="age" label="年龄" align="center" width="60" />
        <el-table-column prop="phoneNumber" label="联系电话" align="center" width="120" />
        <el-table-column prop="villageGroup" label="村组" align="center" width="90" />
        <el-table-column
          prop="address"
          label="家庭地址"
          align="center"
          width="200"
          show-overflow-tooltip
        />
        <el-table-column prop="bankCard" label="银行帐号" align="center" width="180" />
        <el-table-column label="股权数量" align="center" width="100">
          <template #default="{ row }">
            {{ Number(row.equity_shares || row.equityShares || 0) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" align="center" width="80">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ formatStatus(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空数据提示 -->
      <el-empty v-if="!loading && tableData.length === 0" description="暂无数据" />

      <!-- 右键菜单 -->
      <div
        v-if="contextMenuVisible && canShowContextMenu"
        class="context-menu"
        :style="{ left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px' }"
        @click.stop
      >
        <ul class="menu-list">
          <li v-hasPermi="'special:add'" class="menu-item" @click="handleAddDisabled">
            添加为残疾人
          </li>
          <li v-hasPermi="'special:add'" class="menu-item" @click="handleAddLowIncome">
            添加为低收入人群
          </li>
        </ul>
      </div>

      <!-- 分页 -->
      <div v-if="pagination.total > 0" class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 居民详情对话框 -->
    <ResidentDetailDialog
      v-model="detailDialogVisible"
      :resident-id="selectedResidentId"
      :household-id="selectedHouseholdId"
    />

    <!-- 导入对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="导入居民数据"
      width="900px"
      destroy-on-close
      :close-on-click-modal="false"
      append-to-body
    >
      <ImportMapping @close="importDialogVisible = false" @import-success="handleImportSuccess" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ElMessage,
  ElMessageBox,
  ElInput,
  ElButton,
  ElSelect,
  ElOption,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElRow,
  ElCol,
  ElCard,
  ElTable,
  ElTableColumn,
  ElTag,
  ElPagination,
  ElEmpty,
  ElAutocomplete,
  ElDialog
} from 'element-plus'
import { Icon } from '@/components/Icon'
import ResidentDetailDialog from './components/ResidentDetailDialog.vue'
import ImportMapping from './components/ImportMapping.vue'
import { getResidentList, getSearchSuggestions } from '@/api/resident'
import type { ResidentItem } from '@/api/resident/types'
import request from '@/axios'
import { useUserStoreWithOut } from '@/store/modules/user'

const router = useRouter()
const userStore = useUserStoreWithOut()
const canShowContextMenu = computed(() => userStore.hasPermission('special:add'))

// 搜索表单
const searchForm = reactive({
  name: '',
  idCard: '',
  householderName: '',
  gender: '',
  villageGroup: '',
  birthYear: '',
  phoneNumber: '',
  status: 'active' // 默认状态为正常
})

// 是否已经执行过首次查询
const hasSearched = ref(false)

// 监听搜索表单变化，自动查询（首次查询后生效）
watch(
  searchForm,
  () => {
    if (hasSearched.value) {
      // 防抖处理，避免频繁请求
      if (searchTimer) {
        clearTimeout(searchTimer)
      }
      searchTimer = setTimeout(() => {
        // 电话查询条件：至少输入4位数才触发查询
        if (searchForm.phoneNumber && searchForm.phoneNumber.length < 4) {
          return // 电话号码少于4位，不触发查询
        }
        fetchList()
      }, 300)
    }
  },
  { deep: true }
)

// 搜索定时器
let searchTimer: ReturnType<typeof setTimeout> | null = null

// 村组选项（从字典表获取）
const villageGroupOptions = ref<{ label: string; value: string }[]>([])

// 获取村组字典数据
const fetchVillageGroups = async () => {
  try {
    // 从字典表获取村组数据，category为"村组"
    const res = await request.get({
      url: '/dictionaries',
      params: { category: '村组' }
    })
    if (res.data && Array.isArray(res.data)) {
      villageGroupOptions.value = res.data.map((item: any) => ({
        label: item.label || item.value,
        value: item.value || item.label
      }))
    }
  } catch (error) {
    console.error('获取村组列表失败:', error)
    // 使用默认数据
    villageGroupOptions.value = [
      { label: '一组', value: '一组' },
      { label: '二组', value: '二组' },
      { label: '三组', value: '三组' },
      { label: '四组', value: '四组' },
      { label: '五组', value: '五组' }
    ]
  }
}

// 统计信息
const statInfo = reactive({
  households: 0,
  total: 0
})

// 表格数据
const loading = ref(false)
const tableData = ref<ResidentItem[]>([])

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 详情对话框
const detailDialogVisible = ref(false)
const selectedResidentId = ref('')
const selectedHouseholdId = ref('')

// 导入对话框
const importDialogVisible = ref(false)

// 右键菜单相关
const contextMenuVisible = ref(false)
const contextMenuPosition = reactive({ x: 0, y: 0 })
const selectedRow = ref<any>({})

// 打开右键菜单
const openContextMenu = (row: any, event: MouseEvent) => {
  if (!canShowContextMenu.value) {
    return
  }
  event.preventDefault()
  event.stopPropagation()
  selectedRow.value = row
  contextMenuPosition.x = event.clientX
  contextMenuPosition.y = event.clientY
  contextMenuVisible.value = true
}

// 关闭右键菜单
const closeContextMenu = () => {
  contextMenuVisible.value = false
}

// 添加为残疾人
const handleAddDisabled = () => {
  closeContextMenu()
  router.push({
    name: 'DisabledAdd',
    query: { residentId: selectedRow.value.id }
  })
}

// 添加为低收入人群
const handleAddLowIncome = () => {
  closeContextMenu()
  router.push({
    name: 'LowIncomeAdd',
    query: { residentId: selectedRow.value.id }
  })
}

// 人口增减上报
const handlePopulationDeathReport = () => {
  router.push('/resident/population-death-report')
}

// 获取列表数据
const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: pagination.page,
      pageSize: pagination.limit,
      ...searchForm
    }
    const res = await getResidentList(params)
    console.log('获取居民列表响应:', res)
    // 适配后端返回的数据结构
    // res 已经是 response.data，包含 {code, data, total, totalHouseholds, totalPersons}
    tableData.value = res.data || []
    pagination.total = res.total || 0
    statInfo.households = res.totalHouseholds || 0
    statInfo.total = res.totalPersons || res.total || 0
  } catch (error) {
    console.error('获取居民列表失败:', error)
    ElMessage.error('获取居民列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  // 电话查询条件：至少输入4位数才触发查询
  if (searchForm.phoneNumber && searchForm.phoneNumber.length < 4) {
    ElMessage.warning('联系电话至少需要输入4位数')
    return
  }
  pagination.page = 1
  hasSearched.value = true // 标记已执行过首次查询
  fetchList()
}

// 重置
const handleReset = () => {
  Object.keys(searchForm).forEach((key) => {
    searchForm[key as keyof typeof searchForm] = ''
  })
  // 状态默认为空，查询所有状态
  searchForm.status = ''
  pagination.page = 1
  hasSearched.value = false // 重置搜索标志
  tableData.value = [] // 清空数据
  pagination.total = 0
  statInfo.households = 0
  statInfo.total = 0
}

// 导出
const handleExport = async () => {
  try {
    const allParams = {
      pageNum: 1,
      pageSize: 999999,
      ...searchForm
    }
    const res = await getResidentList(allParams)
    const allData = res.data || []

    if (!allData.length) {
      ElMessage.warning('暂无数据可导出')
      return
    }

    const ExcelJS = (await import('exceljs')).default
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('居民信息')

    worksheet.columns = [
      { header: '序号', key: 'index', width: 8 },
      { header: '居民姓名', key: 'name', width: 12 },
      { header: '身份证号', key: 'idCard', width: 24, style: { numFmt: '@' } },
      { header: '性别', key: 'gender', width: 8 },
      { header: '户主姓名', key: 'householderName', width: 12 },
      { header: '与户主关系', key: 'relationship_to_head', width: 14 },
      { header: '出生日期', key: 'dateOfBirth', width: 12 },
      { header: '年龄', key: 'age', width: 6 },
      { header: '联系电话', key: 'phoneNumber', width: 16, style: { numFmt: '@' } },
      { header: '村组', key: 'villageGroup', width: 10 },
      { header: '家庭地址', key: 'address', width: 30 },
      { header: '银行帐号', key: 'bankCard', width: 18, style: { numFmt: '@' } },
      { header: '股权数量', key: 'equityShares', width: 10 },
      { header: '状态', key: 'status', width: 10 }
    ]

    allData.forEach((item: any, idx: number) => {
      worksheet.addRow({
        index: idx + 1,
        name: item.name || '',
        idCard: String(item.idCard || ''),
        gender: item.gender || '',
        householderName: item.householderName || item.household_head_name || '-',
        relationship_to_head: item.relation || item.relationship_to_head || '',
        dateOfBirth: item.birthDate || item.dateOfBirth || '',
        age: item.age || '',
        phoneNumber: String(item.phone || item.phoneNumber || ''),
        villageGroup: item.villageGroup || '',
        address: item.address || '',
        bankCard: String(item.bankCard || ''),
        equityShares: item.equity_shares || item.equityShares || 0,
        status: item.status ? formatStatus(item.status) : ''
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `居民信息导出_${new Date().toISOString().slice(0, 10)}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  }
}

// 查看详情
const handleViewDetail = (row: any) => {
  selectedResidentId.value = row.id
  selectedHouseholdId.value = row.householdId || row.household_id || ''
  detailDialogVisible.value = true
}

// 行点击
const handleRowClick = (row: any) => {
  selectedResidentId.value = row.id
  selectedHouseholdId.value = row.householdId || row.household_id || ''
  detailDialogVisible.value = true
}

// 获取行样式 - 非正常状态显示绿色字体
const getRowStyle = ({ row }: { row: any }) => {
  const style: any = { height: '26px' }
  // 非正常状态（active 为正常，其他状态如 migrated_out, deceased 等为非正常）
  if (row.status && row.status !== 'active') {
    style.color = '#67C23A' // Element Plus 绿色
  }
  return style
}

// 点击页面其他地方关闭右键菜单
const handleDocumentClick = () => {
  closeContextMenu()
}

// 导入
const handleImport = () => {
  importDialogVisible.value = true
}

// 导入成功
const handleImportSuccess = () => {
  // importDialogVisible.value = false // 暂时不关闭，让用户看到成功界面
  ElMessage.success('导入成功')
  // 刷新列表
  fetchList()
}

// 获取居民姓名搜索建议
const fetchResidentNameSuggestions = (queryString: string, callback: (data: any[]) => void) => {
  if (!queryString || queryString.trim().length < 1) {
    callback([])
    return
  }
  getSearchSuggestions({ keyword: queryString, type: 'residentNames' })
    .then((res) => {
      callback(res.residentNames || [])
    })
    .catch(() => {
      callback([])
    })
}

// 获取户主姓名搜索建议
const fetchHouseholdHeadNameSuggestions = (
  queryString: string,
  callback: (data: any[]) => void
) => {
  if (!queryString || queryString.trim().length < 1) {
    callback([])
    return
  }
  getSearchSuggestions({ keyword: queryString, type: 'householdHeadNames' })
    .then((res) => {
      callback(res.householdHeadNames || [])
    })
    .catch(() => {
      callback([])
    })
}

// 分页变化
const handleSizeChange = (val: number) => {
  pagination.limit = val
  fetchList()
}

const handlePageChange = (val: number) => {
  pagination.page = val
  fetchList()
}

// 获取状态标签类型
const getStatusType = (status: string): 'success' | 'warning' | 'info' | 'primary' | 'danger' => {
  const typeMap: Record<string, 'success' | 'warning' | 'info' | 'primary' | 'danger'> = {
    active: 'success',
    migrated_out: 'warning',
    deceased: 'info',
    正常: 'success',
    迁出: 'warning',
    死亡: 'info'
  }
  return typeMap[status] || 'info'
}

// 格式化状态显示
const formatStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    active: '正常',
    migrated_out: '迁出',
    deceased: '死亡'
  }
  return statusMap[status] || status
}

// 初始化 - 默认不查询数据，保护隐私
onMounted(() => {
  // 只加载村组字典数据，不加载居民列表
  fetchVillageGroups()
  // 清空表格数据
  tableData.value = []
  pagination.total = 0
  statInfo.households = 0
  statInfo.total = 0
  // 添加全局点击事件监听，关闭右键菜单
  document.addEventListener('click', handleDocumentClick)
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<style scoped lang="scss">
.resident-query-container {
  padding: 20px;
  overflow: visible;
  transform: none;

  .search-card {
    margin-bottom: 20px;

    .search-form {
      .search-form-content {
        display: flex;
        align-items: flex-start;
        gap: 16px;

        .search-fields {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 16px;
          flex: 1;

          .compact-form-item {
            margin-bottom: 0;
            width: calc(25% - 12px);
            min-width: 180px;

            :deep(.el-form-item__label) {
              font-size: 12px;
              padding-right: 4px;
            }

            :deep(.el-input__inner),
            :deep(.el-select .el-input__inner) {
              font-size: 12px;
            }

            :deep(.el-autocomplete),
            :deep(.el-input),
            :deep(.el-select),
            :deep(.el-date-editor) {
              width: 100%;
            }

            &.action-form-item {
              width: auto;
              min-width: auto;

              :deep(.el-form-item__content) {
                margin-left: 0 !important;
              }
            }
          }
        }

        .search-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding-top: 0;
          min-width: fit-content;

          .el-button {
            margin-left: 0;
          }
        }
      }
    }
  }

  .stat-card {
    margin-bottom: 20px;

    .stat-info {
      .stat-item {
        font-size: 14px;

        .stat-label {
          color: #606266;
        }

        .stat-value {
          color: #409eff;
          font-weight: bold;
          font-size: 18px;
          margin: 0 4px;
        }

        .stat-unit {
          color: #909399;
          margin-right: 16px;
        }
      }
    }
  }

  .table-card {
    .pagination-container {
      margin-top: 20px;
      text-align: right;
    }

    /* 自定义行高样式 */
    .custom-row-height-table {
      .el-table__row {
        height: 26px !important;
      }

      .el-table__cell {
        padding: 4px 0 !important;
        line-height: 26px !important;
      }
    }

    /* 表格滚动条样式 - 始终显示 */
    .el-table__body-wrapper {
      overflow-x: auto !important;

      &::-webkit-scrollbar {
        height: 10px;
      }

      &::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 5px;
      }

      &::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 5px;
      }

      &::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }
    }
  }

  /* 右键菜单样式 */
  .context-menu {
    position: fixed;
    z-index: 10000;
    min-width: 160px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    border: 1px solid #ebeef5;
    overflow: hidden;
    animation: contextMenuFadeIn 0.2s ease-out;

    .menu-list {
      margin: 0;
      padding: 6px 0;
      list-style: none;

      .menu-item {
        padding: 10px 16px;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
        font-size: 14px;
        color: #606266;
        display: flex;
        align-items: center;
        gap: 8px;

        &:hover {
          background-color: #f5f7fa;
          color: #409eff;
        }

        &:active {
          background-color: #ecf5ff;
        }

        /* 添加图标 */
        &:first-child::before {
          content: '♿';
          font-size: 16px;
        }

        &:last-child::before {
          content: '💰';
          font-size: 16px;
        }
      }
    }
  }

  @keyframes contextMenuFadeIn {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  /* 隐藏 el-autocomplete 的红 X 图标 */
  :deep(.el-autocomplete .el-input__validate-icon) {
    display: none !important;
  }

  /* 确保 el-card 不会裁剪对话框 */
  :deep(.el-card) {
    overflow: visible;
  }

  :deep(.el-card__body) {
    overflow: visible;
  }
}
</style>
