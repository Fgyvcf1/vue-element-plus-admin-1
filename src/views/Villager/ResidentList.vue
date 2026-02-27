<script setup lang="tsx">
import {
  ref,
  reactive,
  computed,
  onMounted,
  onActivated,
  onBeforeUnmount,
  nextTick,
  h,
  unref
} from 'vue'
import { useRouter } from 'vue-router'
import { debounce } from 'lodash-es'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Table } from '@/components/Table'
import { Search } from '@/components/Search'
import { Dialog } from '@/components/Dialog'
import { useTable } from '@/hooks/web/useTable'
import { useCrudSchemas, CrudSchema } from '@/hooks/web/useCrudSchemas'
import { BaseButton } from '@/components/Button'
import { getResidents, getSearchSuggestions } from '@/api/resident'
import { useI18n } from '@/hooks/web/useI18n'
import { export_json_to_excel } from '@/utils/export2excel'
import type { ResidentItem } from '@/api/resident/types'
import ResidentDetailDialog from '@/views/Resident/components/ResidentDetailDialog.vue'

const { t } = useI18n()
const router = useRouter()

// 字典数据
const villageGroups = ref<{ label: string; value: string }[]>([])
const birthYears = ref<{ label: string; value: string }[]>([])

// 查询参数
const searchParams = ref({
  name: '',
  idCard: '',
  householdHeadName: '',
  isHouseholdHead: false,
  gender: '',
  villageGroup: '',
  birthYear: '',
  phoneNumber: '',
  status: 'active'
})

// 统计数据
const totalHouseholds = ref(0)
const totalPersons = ref(0)
const showResult = ref(false)

// 右键菜单
const contextMenuVisible = ref(false)
const contextMenuPosition = reactive({ x: 0, y: 0 })
const selectedRow = ref<ResidentItem | null>(null)

// 模态框
const dialogVisible = ref(false)
const selectedResident = ref<ResidentItem | null>(null)

// 表格配置
const { tableRegister, tableState, tableMethods } = useTable({
  fetchDataApi: async () => {
    const { pageSize, currentPage } = tableState
    const params = {
      pageNum: unref(currentPage),
      pageSize: unref(pageSize),
      ...unref(searchParams)
    }
    // 如果不是户主，删除该参数
    if (!params.isHouseholdHead) {
      delete (params as any).isHouseholdHead
    }

    const res = await getResidents(params)

    // 处理响应数据
    let residents: ResidentItem[] = []
    let total = 0

    if (res && res.data) {
      if (Array.isArray(res.data)) {
        residents = res.data.map((item: any) => {
          const newItem: ResidentItem = { ...item };
          newItem.householdHeadName = item.household_head_name || item.householdHeadName;
          newItem.relationshipToHead = item.relationship_to_head || item.relationshipToHead;
          newItem.phoneNumber = item.phone_number || item.phoneNumber;
          newItem.equityShares = item.equity_shares !== undefined ? item.equity_shares : (item.equityShares || 0);

          // 确保旧字段也更新，以便兼容旧代码或其它地方可能直接访问这些字段
          newItem.relationship_to_head = newItem.relationshipToHead;
          newItem.phone_number = newItem.phoneNumber;
          newItem.equity_shares = newItem.equityShares;
          return newItem;
        });
      }

      total = Number(res.total || 0)
      totalHouseholds.value = Number(res.totalHouseholds || 0)
      totalPersons.value = Number(res.totalPersons || total)
    }

    showResult.value = true

    return {
      list: residents,
      total: total
    }
  }
})

const { total, loading, dataList, pageSize, currentPage } = tableState
const { getList } = tableMethods

// 刷新列表方法
const refreshList = () => {
  getList()
}

// 获取居民姓名搜索建议
const fetchResidentNameSuggestions = debounce(async (queryString: string, callback: Function) => {
  if (!queryString || queryString.trim().length < 1) {
    callback([])
    return
  }

  try {
    const res = await getSearchSuggestions({ keyword: queryString, type: 'residentNames' })
    if (res && res.code === 20000) {
      callback(res.residentNames || [])
    } else {
      callback([])
    }
  } catch (error) {
    console.error('获取居民姓名搜索建议失败:', error)
    callback([])
  }
}, 300)

// 获取户主姓名搜索建议
const fetchHouseholdHeadNameSuggestions = debounce(async (queryString: string, callback: Function) => {
  if (!queryString || queryString.trim().length < 1) {
    callback([])
    return
  }

  try {
    const res = await getSearchSuggestions({ keyword: queryString, type: 'householdHeadNames' })
    if (res && res.code === 20000) {
      callback(res.householdHeadNames || [])
    } else {
      callback([])
    }
  } catch (error) {
    console.error('获取户主姓名搜索建议失败:', error)
    callback([])
  }
}, 300)

// CRUD Schema
const crudSchemas = reactive<CrudSchema[]>([
  {
    field: 'index',
    label: '序号',
    form: { hidden: true },
    search: { hidden: true },
    detail: { hidden: true },
    table: { type: 'index' }
  },
  {
    field: 'name',
    label: '居民姓名',
    search: {
      component: 'Autocomplete',
      componentProps: {
        placeholder: '请输入居民姓名',
        clearable: true,
        'value-key': 'value',
        'fetch-suggestions': fetchResidentNameSuggestions
      }
    }
  },
  {
    field: 'idCard',
    label: '身份证号',
    search: {
      component: 'Input',
      componentProps: {
        placeholder: '请输入身份证号',
        clearable: true
      }
    }
  },
  {
    field: 'gender',
    label: '性别',
    search: {
      component: 'Select',
      componentProps: {
        placeholder: '请选择性别',
        clearable: true,
        options: [
          { label: '男', value: '男' },
          { label: '女', value: '女' }
        ]
      }
    }
  },
  {
    field: 'householdHeadName',
    label: '户主姓名',
    search: {
      component: 'Autocomplete',
      componentProps: {
        placeholder: '请输入户主姓名',
        clearable: true,
        'value-key': 'value',
        'fetch-suggestions': fetchHouseholdHeadNameSuggestions
      }
    }
  },
  {
    field: 'isHouseholdHead',
    label: '户主',
    search: {
      component: 'Switch',
      componentProps: {
        activeText: '是',
        inactiveText: '否'
      }
    },
    table: { hidden: true },
    form: { hidden: true },
    detail: { hidden: true }
  },
  {
    field: 'relationship_to_head',
    label: '与户主关系'
  },
  {
    field: 'dateOfBirth',
    label: '出生日期'
  },
  {
    field: 'age',
    label: '年龄'
  },
  {
    field: 'villageGroup',
    label: '村组',
    search: {
      component: 'Select',
      componentProps: {
        placeholder: '请选择或输入村组',
        clearable: true,
        filterable: true,
        'allow-create': true,
        options: villageGroups.value
      }
    }
  },
  {
    field: 'address',
    label: '家庭地址'
  },
  {
    field: 'phoneNumber',
    label: '联系电话',
    search: {
      component: 'Input',
      componentProps: {
        placeholder: '请输入联系电话',
        clearable: true
      }
    }
  },
  {
    field: 'bankCard',
    label: '银行帐号'
  },
  {
    field: 'equity_shares',
    label: '股权数量',
    table: {
      slots: {
        default: (data: any) => {
          const row = data.row as ResidentItem
          return h('span', {}, Number(row.equity_shares || row.equityShares || 0))
        }
      }
    }
  },
  {
    field: 'status',
    label: '状态',
    search: {
      component: 'Select',
      componentProps: {
        placeholder: '请选择状态',
        clearable: true,
        options: [
          { label: '正常', value: 'active' },
          { label: '迁出', value: 'migrated_out' },
          { label: '死亡', value: 'deceased' }
        ]
      }
    },
    table: {
      slots: {
        default: (data: any) => {
          const row = data.row as ResidentItem
          const statusMap: Record<string, string> = {
            active: '正常',
            migrated_out: '迁出',
            deceased: '死亡'
          }
          const statusKey = row.status ?? ''
          return h('span', {}, statusMap[statusKey] || statusKey)
        }
      }
    }
  },
  {
    field: 'action',
    label: '操作',
    form: { hidden: true },
    detail: { hidden: true },
    search: { hidden: true },
    table: {
      width: 200,
      slots: {
        default: (data: any) => {
          const row = data.row as ResidentItem
          return (
            <div>
              <BaseButton type="primary" size="small" onClick={() => handleRowClick(row)}>
                查看
              </BaseButton>
              <BaseButton type="danger" size="small" onClick={() => handleDelete(row)}>
                删除
              </BaseButton>
            </div>
          )
        }
      }
    }
  }
])

const { allSchemas } = useCrudSchemas(crudSchemas)


// 设置搜索参数
const setSearchParams = (params: any) => {
  currentPage.value = 1
  searchParams.value = { ...searchParams.value, ...params }
  getList()
}

// 重置查询
const resetQuery = () => {
  searchParams.value = {
    name: '',
    idCard: '',
    householdHeadName: '',
    isHouseholdHead: false,
    gender: '',
    villageGroup: '',
    birthYear: '',
    phoneNumber: '',
    status: 'active'
  }
  currentPage.value = 1
  showResult.value = false
  totalHouseholds.value = 0
  totalPersons.value = 0
}

// 行点击事件
const handleRowClick = (row: ResidentItem) => {
  selectedResident.value = row
  dialogVisible.value = true
}

// 删除
const handleDelete = (row: ResidentItem) => {
  ElMessageBox.confirm(`确定要删除居民【${row.name}】吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 这里应该调用删除API
    ElMessage.success('删除成功')
    getList()
  })
}

// 右键菜单事件
const handleRowContextMenu = (row: ResidentItem, column: any, event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()

  selectedRow.value = row
  contextMenuPosition.x = event.clientX
  contextMenuPosition.y = event.clientY
  contextMenuVisible.value = true
}

// 关闭右键菜单
const closeContextMenu = (event?: MouseEvent) => {
  if (!event || !(event.target as Element)?.closest('.context-menu')) {
    contextMenuVisible.value = false
  }
}

// 添加为残疾人
const handleAddDisabled = () => {
  closeContextMenu()
  if (selectedRow.value) {
    router.push({
      name: 'DisabledAdd',
      query: { residentId: selectedRow.value.id }
    })
  }
}

// 添加为低收入人群
const handleAddLowIncome = () => {
  closeContextMenu()
  if (selectedRow.value) {
    router.push({
      name: 'LowIncomeAdd',
      query: { residentId: selectedRow.value.id }
    })
  }
}

// 导出功能
const handleExport = () => {
  if (dataList.value.length === 0) {
    ElMessage.warning('没有数据可导出')
    return
  }

  const headers = [
    '序号',
    '居民姓名',
    '身份证号',
    '性别',
    '户主姓名',
    '与户主关系',
    '出生日期',
    '年龄',
    '村组',
    '家庭地址',
    '联系电话',
    '银行帐号',
    '状态'
  ]
  const textColumns = [2, 11] // 身份证号、银行账号设置为文本格式

  const data = dataList.value.map((item, index) => [
    index + 1,
    item.name || '',
    item.idCard || '',
    item.gender || '',
    item.householdHeadName || item.household_head_name || '',
    item.relationship_to_head || item.relationshipToHead || '',
    item.dateOfBirth || '',
    item.age || '',
    item.villageGroup || '',
    item.address || '',
    item.phoneNumber || item.phone_number || '',
    item.bankCard || '',
    item.status === 'active'
      ? '正常'
      : item.status === 'migrated_out'
        ? '迁出'
        : item.status === 'deceased'
          ? '死亡'
          : item.status || ''
  ])

  export_json_to_excel({
    header: headers,
    data: data,
    filename: `居民信息_${new Date().toISOString().slice(0, 10)}`,
    textColumns: textColumns,
    autoWidth: true,
    bookType: 'xlsx'
  })

  ElMessage.success('导出成功')
}

// 加载村组字典
const loadVillageGroups = async () => {
  try {
    // 这里应该调用字典API
    // const res = await getDictionary('村组')
    // villageGroups.value = res.data.map((item: any) => ({
    //   label: item.value,
    //   value: item.value
    // }))

    // 使用默认值
    villageGroups.value = [
      { label: '一组', value: '一组' },
      { label: '二组', value: '二组' },
      { label: '三组', value: '三组' },
      { label: '四组', value: '四组' }
    ]
  } catch (error) {
    console.error('加载村组字典失败:', error)
    villageGroups.value = [
      { label: '一组', value: '一组' },
      { label: '二组', value: '二组' },
      { label: '三组', value: '三组' },
      { label: '四组', value: '四组' }
    ]
  }
}

// 生成出生年份选项
const generateBirthYears = () => {
  const currentYear = new Date().getFullYear()
  const startYear = currentYear - 100
  const years: { label: string; value: string }[] = []

  for (let year = startYear; year <= currentYear; year++) {
    years.push({
      label: year.toString(),
      value: year.toString()
    })
  }

  birthYears.value = years
}

// 生命周期钩子
onMounted(() => {
  loadVillageGroups()
  generateBirthYears()
  document.addEventListener('click', closeContextMenu)
})

onActivated(() => {
  if (showResult.value && dataList.value.length > 0) {
    getList()
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeContextMenu)
})
</script>

<template>
  <ContentWrap>
    <Search :schema="allSchemas.searchSchema" @reset="resetQuery" @search="setSearchParams" />

    <!-- 查询结果统计 -->
    <div v-if="showResult" class="result-summary">
      查询结果：{{ totalHouseholds }}户{{ totalPersons }}人
    </div>

    <!-- 操作按钮 -->
    <div class="mb-10px">
      <BaseButton type="primary" @click="getList">搜索</BaseButton>
      <BaseButton @click="resetQuery">重置</BaseButton>
      <BaseButton type="success" @click="handleExport">导出</BaseButton>
    </div>

    <!-- 表格 -->
    <Table
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :columns="allSchemas.tableColumns"
      :data="showResult ? dataList : []"
      :loading="loading"
      @register="tableRegister"
      :pagination="{ total }"
      @row-click="handleRowClick"
      @row-contextmenu="handleRowContextMenu"
    />

    <!-- 居民详情模态框 -->
    <ResidentDetailDialog
      v-model="dialogVisible"
      :resident-id="selectedResident?.id || null"
      :household-id="selectedResident?.householdId || selectedResident?.household_id || null"
      @refresh-list="refreshList"
    />

    <!-- 右键菜单 -->
    <div
      v-if="contextMenuVisible"
      class="context-menu"
      :style="{ left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px' }"
      @click.stop
    >
      <ul class="menu-list">
        <li class="menu-item" @click="handleAddDisabled">添加为残疾人</li>
        <li class="menu-item" @click="handleAddLowIncome">添加为低收入人群</li>
      </ul>
    </div>
  </ContentWrap>
</template>

<style scoped>
.result-summary {
  margin: 10px 0;
  font-weight: bold;
  color: #606266;
}

.context-menu {
  position: fixed;
  z-index: 10000;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  background-color: #fff;
  border-radius: 4px;
  overflow: hidden;
}

.menu-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.menu-item {
  padding: 10px 20px;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.menu-item:hover {
  background-color: #f5f7fa;
}

.resident-detail {
  padding: 20px;
}
</style>
