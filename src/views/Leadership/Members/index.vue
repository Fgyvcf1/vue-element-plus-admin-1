<template>
  <div class="app-container">
    <el-card v-loading="loading">
      <el-tabs v-model="filters.organizationType" type="border-card" @tab-change="handleOrgChange">
        <el-tab-pane
          v-for="tab in orgTypeTabs"
          :key="tab.name"
          :label="tab.label"
          :name="tab.name"
        />
      </el-tabs>

      <div class="filter-container">
        <el-input
          v-if="isCollectiveOrg"
          v-model="filters.termNumber"
          placeholder="输入1，2，3......"
          type="number"
          clearable
          size="small"
          style="width: 180px"
          @change="handleTermChange"
        />

        <div v-else class="term-tags">
          <el-tag
            v-for="term in termOptions"
            :key="getTermValue(term)"
            :type="isCurrentTerm(getTermValue(term)) ? 'primary' : 'info'"
            @click="handleTermTagClick(getTermValue(term))"
          >
            {{ formatTermLabel(getTermValue(term)) }}
          </el-tag>
          <el-tag :type="!filters.termNumber ? 'primary' : 'info'" @click="showAllMembers"
            >全部</el-tag
          >
        </div>

        <el-radio-group v-model="filters.status" size="small" @change="handleStatusChange">
          <el-radio-button value="current">现任</el-radio-button>
          <el-radio-button value="history">历届</el-radio-button>
        </el-radio-group>

        <el-input
          v-model="filters.keyword"
          placeholder="搜索姓名或职务"
          clearable
          size="small"
          style="width: 220px"
          @clear="handleQuery"
          @keyup.enter="handleQuery"
        >
          <template #append>
            <el-button @click="handleQuery">查询</el-button>
          </template>
        </el-input>

        <el-button type="primary" size="small" @click="handleAdd">新增成员</el-button>
        <el-button type="success" size="small" @click="handleExport">导出</el-button>
      </div>

      <el-table :data="members" size="small" border style="width: 100%" @row-click="handleEdit">
        <el-table-column type="index" width="50" align="center" label="序号" />
        <el-table-column prop="name" label="姓名" align="center" width="90" />
        <el-table-column prop="gender" label="性别" align="center" width="60" />
        <el-table-column prop="id_card" label="身份证号码" align="center" width="180" />
        <el-table-column prop="date_of_birth" label="出生日期" align="center" width="110" />
        <el-table-column
          prop="address"
          label="家庭住址"
          align="center"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column prop="phone_number" label="联系电话" align="center" width="120" />
        <el-table-column prop="position" label="职务" align="center" width="120" />
        <el-table-column prop="term_number" label="届数" align="center" width="90">
          <template #default="scope">{{
            formatTermLabel(scope && scope.row ? scope.row.term_number : '')
          }}</template>
        </el-table-column>
        <el-table-column prop="term_start_date" label="任期开始" align="center" width="110" />
        <el-table-column prop="term_end_date" label="任期结束" align="center" width="110">
          <template #default="scope">{{
            (scope && scope.row && scope.row.term_end_date) || '当前'
          }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" align="center" width="80">
          <template #default="scope">
            <el-tag
              :type="scope && scope.row && scope.row.status === 'current' ? 'success' : 'info'"
              size="small"
            >
              {{ scope && scope.row && scope.row.status === 'current' ? '现任' : '历届' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="remarks"
          label="备注"
          align="center"
          min-width="150"
          show-overflow-tooltip
        />
      </el-table>

      <div v-if="total > 0" class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </el-card>

    <MemberForm
      v-model:visible="dialogVisible"
      :form-data="formData"
      :org-type="filters.organizationType"
      @submitted="handleFormSubmit"
      @delete-member="handleDeleteFromForm"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  ElMessage,
  ElMessageBox,
  ElCard,
  ElTabs,
  ElTabPane,
  ElInput,
  ElTag,
  ElRadioGroup,
  ElRadioButton,
  ElButton,
  ElTable,
  ElTableColumn,
  ElPagination
} from 'element-plus'
import { deleteCommitteeMember } from '@/api/leadership'
import { useLeadershipStore } from '@/store/modules/leadership'
import { useUserStore } from '@/store/modules/user'
import MemberForm from './components/MemberForm.vue'

const leadershipStore = useLeadershipStore()
const userStore = useUserStore()
const members = computed(() => leadershipStore.getMembers)
const total = computed(() => leadershipStore.getTotal)
const loading = computed(() => leadershipStore.getLoading)
const termOptions = computed(() => leadershipStore.getTermOptions)

const dialogVisible = ref(false)
const formData = ref<Record<string, any>>({})
const queryParams = reactive({
  pageNum: 1,
  pageSize: 20
})
const filters = reactive({
  organizationType: 'branch_committee',
  status: 'current',
  termNumber: '',
  keyword: ''
})

const orgTypeTabs = [
  { label: '支部委员会', name: 'branch_committee' },
  { label: '村民委员会', name: 'village_committee' },
  { label: '集体经济组织理事会', name: 'economic_council' },
  { label: '集体经济组织监事会', name: 'economic_supervisor' },
  { label: '村务监督委员会', name: 'supervisory_committee' },
  { label: '村民小组长', name: 'group_leader' },
  { label: '村民代表', name: 'village_representative' },
  { label: '青年团妇组织', name: 'youth_women_org' }
]

const isCollectiveOrg = computed(() => {
  return [
    'branch_committee',
    'village_committee',
    'economic_council',
    'economic_supervisor',
    'supervisory_committee'
  ].includes(filters.organizationType)
})

const formatTermLabel = (termNumber: string | number | null | undefined) => {
  const value = termNumber == null ? '' : String(termNumber)
  if (!value) return '-'
  if (value.includes('第') || value.includes('届')) return value
  return `第${value}届`
}

const getTermValue = (term: any) => {
  if (term && typeof term === 'object' && 'term_number' in term) {
    return term.term_number
  }
  return term
}

const isCurrentTerm = (termValue: string | number | null | undefined) => {
  const current = filters.termNumber || ''
  const value = termValue == null ? '' : String(termValue)
  return String(current) === value
}

const getList = async () => {
  leadershipStore.setCurrentOrgType(filters.organizationType)
  leadershipStore.setFilters({ status: filters.status })
  leadershipStore.setCurrentTerm(filters.termNumber ? filters.termNumber : null)
  await leadershipStore.fetchMembers({
    keyword: filters.keyword,
    page: queryParams.pageNum,
    pageSize: queryParams.pageSize
  })
}

const handleOrgChange = async () => {
  queryParams.pageNum = 1
  filters.termNumber = ''
  filters.keyword = ''
  await leadershipStore.fetchTermNumbers(filters.organizationType)
  await getList()
}

const handleTermChange = () => {
  queryParams.pageNum = 1
  getList()
}

const handleTermTagClick = (termNumber: string | number | null) => {
  filters.termNumber = termNumber == null ? '' : String(termNumber)
  queryParams.pageNum = 1
  getList()
}

const showAllMembers = () => {
  filters.termNumber = ''
  queryParams.pageNum = 1
  getList()
}

const handleStatusChange = () => {
  queryParams.pageNum = 1
  getList()
}

const handleQuery = () => {
  queryParams.pageNum = 1
  getList()
}

const handleAdd = () => {
  if (!userStore.hasPermission('organization:add')) {
    ElMessage.warning('当前账号没有权限')
    return
  }
  formData.value = {
    id: undefined,
    residentId: undefined,
    name: '',
    gender: '',
    phoneNumber: '',
    idCard: '',
    termNumber: '',
    position: '',
    termStartDate: new Date().toISOString().slice(0, 10),
    termEndDate: '',
    status: 'current',
    remarks: ''
  }
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  if (!userStore.hasPermission('organization:edit')) {
    ElMessage.warning('当前账号没有权限')
    return
  }
  formData.value = {
    id: row.id,
    residentId: row.resident_id,
    name: row.name,
    gender: row.gender,
    phoneNumber: row.phone_number,
    idCard: row.id_card,
    termNumber: row.term_number,
    position: row.position,
    termStartDate: row.term_start_date,
    termEndDate: row.term_end_date,
    status: row.status,
    remarks: row.remarks
  }
  dialogVisible.value = true
}

const handleDeleteFromForm = (memberId: number) => {
  ElMessageBox.confirm('确定要删除该成员吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      await deleteCommitteeMember(memberId)
      ElMessage.success('删除成功')
      dialogVisible.value = false
      getList()
    })
    .catch(() => {})
}

const handleFormSubmit = () => {
  dialogVisible.value = false
  getList()
}

const handleExport = async () => {
  if (!members.value.length) {
    ElMessage.warning('暂无数据可导出')
    return
  }
  const ExcelJS = (await import('exceljs')).default
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('机构管理')
  worksheet.columns = [
    { header: '序号', key: 'index', width: 8 },
    { header: '姓名', key: 'name', width: 12 },
    { header: '性别', key: 'gender', width: 8 },
    { header: '身份证号码', key: 'idCard', width: 24 },
    { header: '出生日期', key: 'birthday', width: 14 },
    { header: '家庭住址', key: 'address', width: 30 },
    { header: '联系电话', key: 'phone', width: 16 },
    { header: '职务', key: 'position', width: 14 },
    { header: '届数', key: 'term', width: 10 },
    { header: '任期开始', key: 'start', width: 14 },
    { header: '任期结束', key: 'end', width: 14 },
    { header: '状态', key: 'status', width: 10 },
    { header: '备注', key: 'remarks', width: 26 }
  ]
  members.value.forEach((item: any, idx: number) => {
    worksheet.addRow({
      index: idx + 1,
      name: item.name || '',
      gender: item.gender || '',
      idCard: item.id_card || '',
      birthday: item.date_of_birth || '',
      address: item.address || '',
      phone: item.phone_number || '',
      position: item.position || '',
      term: item.term_number ? `第${item.term_number}届` : '',
      start: item.term_start_date || '',
      end: item.term_end_date || '当前',
      status: item.status === 'current' ? '现任' : '历届',
      remarks: item.remarks || ''
    })
  })
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `机构管理_${new Date().toISOString().slice(0, 10)}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

onMounted(async () => {
  await leadershipStore.fetchTermNumbers(filters.organizationType)
  await getList()
})
</script>

<style scoped>
.filter-container {
  margin: 12px 0 16px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.term-tags {
  display: flex;
  gap: 8px;
  align-items: center;
}

.term-tags .el-tag {
  cursor: pointer;
}
</style>
