<template>
  <div class="app-container">
    <el-card v-loading="loading">
      <!-- 机构类型Tab切换 -->
      <el-tabs v-model="filters.organizationType" type="border-card" @tab-click="handleOrgChange">
        <el-tab-pane
          v-for="tab in orgTypeTabs"
          :key="tab.name"
          :label="tab.label"
          :name="tab.name"
        />
      </el-tabs>

      <!-- 查询条件 -->
      <div class="filter-container">
        <!-- 届次筛选 -->
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

        <!-- 全部名单/届次筛选标签 -->
        <div v-else class="term-tags">
          <el-tag
            v-for="term in termOptions"
            :key="term.term_number"
            :type="filters.termNumber === term.term_number ? 'primary' : 'info'"
            @click="handleTermTagClick(term.term_number)"
          >
            <span v-if="term.term_number && term.term_number.toString().includes('第')">
              {{ term.term_number }}
            </span>
            <span v-else-if="term.term_number && term.term_number.toString().includes('届')">
              {{ term.term_number }}
            </span>
            <span v-else-if="term.term_number">
              第{{ term.term_number }}届
            </span>
          </el-tag>
          <el-tag :type="!filters.termNumber ? 'primary' : 'info'" @click="showAllMembers">
            全部
          </el-tag>
        </div>

        <!-- 状态筛选 -->
        <el-radio-group v-model="filters.status" size="small" @change="handleStatusChange">
          <el-radio-button label="current">现任</el-radio-button>
          <el-radio-button label="history">历届</el-radio-button>
        </el-radio-group>

        <!-- 搜索框 -->
        <el-input
          v-model="filters.keyword"
          placeholder="搜索姓名或职务"
          size="small"
          clearable
          style="width: 200px; margin-left: 10px"
          @clear="handleQuery"
          @keyup.enter.native="handleQuery"
        >
          <el-button slot="append" icon="el-icon-search" @click="handleQuery" />
        </el-input>

        <!-- 操作按钮 -->
        <el-button type="primary" size="small" icon="el-icon-plus" @click="handleAdd">
          新增成员
        </el-button>
        <el-button type="success" size="small" icon="el-icon-download" @click="handleExport">
          导出
        </el-button>
      </div>

      <!-- 数据表格 -->
      <el-table :data="members" size="small" border @row-click="handleEdit">
        <el-table-column type="index" width="50" align="center" label="序号" />
        <el-table-column prop="name" label="姓名" align="center" width="100" />
        <el-table-column prop="gender" label="性别" align="center" width="60" />
        <el-table-column prop="id_card" label="身份证号码" align="center" width="180" />
        <el-table-column prop="date_of_birth" label="出生日期" align="center" width="120" />
        <el-table-column prop="age" label="年龄" align="center" width="60">
          <template slot-scope="scope">
            {{ scope.row.age || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="address" label="家庭住址" align="center" min-width="150" show-overflow-tooltip />
        <el-table-column prop="phone_number" label="联系电话" align="center" width="120" />
        <el-table-column prop="position" label="职务" align="center" width="120" />
        <el-table-column prop="term_number" label="届数" align="center" width="80">
          <template slot-scope="scope">
            <span v-if="scope.row.term_number && scope.row.term_number.toString().includes('第')">
              {{ scope.row.term_number }}
            </span>
            <span v-else-if="scope.row.term_number && scope.row.term_number.toString().includes('届')">
              {{ scope.row.term_number }}
            </span>
            <span v-else-if="scope.row.term_number">
              第{{ scope.row.term_number }}届
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="term_start_date" label="任期开始" align="center" width="110" />
        <el-table-column prop="term_end_date" label="任期结束" align="center" width="110">
          <template slot-scope="scope">
            {{ scope.row.term_end_date || '当前' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" align="center" width="80">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === 'current' ? 'success' : 'info'" size="small">
              {{ scope.row.status === 'current' ? '现任' : '历届' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remarks" label="备注" align="center" min-width="150" show-overflow-tooltip />
      </el-table>

      <!-- 分页 -->
      <pagination
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </el-card>

    <!-- 新增/编辑对话框 -->
    <MemberForm
      ref="memberForm"
      :visible.sync="dialogVisible"
      :form-data="formData"
      :org-type="filters.organizationType"
      :term-options="termOptions"
      @submit="handleFormSubmit"
      @view-history="handleViewHistoryFromForm"
      @delete-member="handleDeleteFromForm"
    />

    <!-- 历史任职对话框 -->
    <HistoryTimeline
      ref="historyTimeline"
      :visible.sync="historyVisible"
      :resident-id="currentResidentId"
    />
  </div>
</template>

<script>
import Pagination from '@/components/Pagination'
import MemberForm from './components/MemberForm'
import HistoryTimeline from './components/HistoryTimeline'
import { getCommitteeMembers, deleteCommitteeMember } from '@/api/leadership'
import { mapState, mapActions } from 'vuex'
import { export_json_to_excel } from '@/vendor/Export2Excel'

export default {
  name: 'CommitteeMembers',
  components: {
    Pagination,
    MemberForm,
    HistoryTimeline
  },
  data() {
    return {
      loading: false,
      dialogVisible: false,
      historyVisible: false,
      currentResidentId: null,
      formData: {},
      queryParams: {
        pageNum: 1,
        pageSize: 20
      },
      filters: {
        organizationType: 'branch_committee',
        status: 'current',
        termNumber: null,
        keyword: ''
      },
      orgTypeTabs: [
        { label: '支部委员会', name: 'branch_committee' },
        { label: '村民委员会', name: 'village_committee' },
        { label: '集体经济组织理事会', name: 'economic_council' },
        { label: '集体经济组织监事会', name: 'economic_supervisor' },
        { label: '村务监督委员会', name: 'supervisory_committee' },
        { label: '村民小组长', name: 'group_leader' },
        { label: '村民代表', name: 'village_representative' },
        { label: '青年团妇组织', name: 'youth_women_org' }
      ]
    }
  },
  computed: {
    ...mapState('leadership', ['members', 'total', 'termOptions']),
    isCollectiveOrg() {
      return ['branch_committee', 'village_committee', 'economic_council', 'economic_supervisor', 'supervisory_committee'].includes(this.filters.organizationType)
    }
  },
  created() {
    this.loadTermNumbers()
    this.getList()
  },
  methods: {
    ...mapActions('leadership', ['fetchMembers', 'fetchTermNumbers']),
    async getList() {
      this.loading = true
      try {
        const params = {
          organization_type: this.filters.organizationType,
          term_number: this.filters.termNumber,
          status: this.filters.status,
          keyword: this.filters.keyword,
          page: this.queryParams.pageNum,
          pageSize: this.queryParams.pageSize
        }
        console.log('查询参数:', params)
        console.log('当前机构类型:', this.filters.organizationType)
        const response = await getCommitteeMembers(params)
        console.log('查询返回数据:', response.data.length, '条')
        this.$store.commit('leadership/SET_MEMBERS', response.data)
        this.$store.commit('leadership/SET_TOTAL', response.total)
      } finally {
        this.loading = false
      }
    },
    async loadTermNumbers() {
      await this.fetchTermNumbers(this.filters.organizationType)
    },
    async handleOrgChange() {
      console.log('切换机构类型:', this.filters.organizationType)
      this.filters.termNumber = null
      this.filters.keyword = ''
      this.queryParams.pageNum = 1
      await this.loadTermNumbers()
      console.log('届数加载完成，准备刷新列表')
      this.getList()
    },
    handleTermChange() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    handleTermTagClick(termNumber) {
      this.filters.termNumber = termNumber
      this.queryParams.pageNum = 1
      this.getList()
    },
    showAllMembers() {
      this.filters.termNumber = null
      this.queryParams.pageNum = 1
      this.getList()
    },
    handleStatusChange() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    handleAdd() {
      this.formData = {
        id: null,
        residentId: null,
        name: '',
        gender: '',
        phoneNumber: '',
        idCard: '',
        termNumber: null,
        position: '',
        termStartDate: new Date().toISOString().split('T')[0],
        termEndDate: '',
        status: 'current',
        remarks: ''
      }
      this.dialogVisible = true
    },
    handleEdit(row) {
      console.log('handleEdit 被调用，row 数据:', row)
      console.log('row.resident_id:', row.resident_id, '类型:', typeof row.resident_id)
      console.log('row.residentId:', row.residentId, '类型:', typeof row.residentId)

      this.formData = {
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
      console.log('设置后的 formData:', this.formData)
      this.dialogVisible = true
    },
    handleHistory(row) {
      this.currentResidentId = row.resident_id
      this.historyVisible = true
    },
    handleDelete(row) {
      this.$confirm('确定要删除该成员吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async() => {
        await deleteCommitteeMember(row.id)
        this.$message.success('删除成功')
        this.getList()
      }).catch(() => {})
    },
    handleFormSubmit() {
      this.dialogVisible = false
      this.getList()
    },
    handleViewHistoryFromForm(residentId) {
      this.currentResidentId = residentId
      this.historyVisible = true
    },
    handleDeleteFromForm(memberId) {
      this.$confirm('确定要删除该成员吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async() => {
        await deleteCommitteeMember(memberId)
        this.$message.success('删除成功')
        this.dialogVisible = false
        this.getList()
      }).catch(() => {})
    },
    handleExport() {
      if (this.members.length === 0) {
        this.$message.warning('暂无数据可导出')
        return
      }

      // 获取当前机构类型的中文名称
      const orgName = this.orgTypeTabs.find(tab => tab.name === this.filters.organizationType)?.label || '机构管理'

      // 准备Excel数据
      const headers = ['序号', '姓名', '性别', '身份证号码', '出生日期', '年龄', '家庭住址', '联系电话', '职务', '届数', '任期开始', '任期结束', '状态', '备注']
      const textColumns = [3, 7] // 身份证号(索引3)、联系电话(索引7)设置为文本格式

      const data = this.members.map((member, index) => [
        index + 1,
        member.name || '',
        member.gender || '',
        member.id_card || '',
        member.date_of_birth || '',
        member.age || '',
        member.address || '',
        member.phone_number || '',
        member.position || '',
        member.term_number || '',
        member.term_start_date || '',
        member.term_end_date || '当前',
        member.status === 'current' ? '现任' : '历届',
        member.remarks || ''
      ])

      export_json_to_excel({
        header: headers,
        data: data,
        filename: `${orgName}_${new Date().toISOString().slice(0, 10)}`,
        textColumns: textColumns,
        autoWidth: true,
        bookType: 'xlsx'
      })

      this.$message.success('导出成功')
    }
  }
}
</script>

<style scoped>
.filter-container {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.term-tags {
  display: flex;
  gap: 8px;
  align-items: center;
}

.term-tags .el-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.term-tags .el-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 表格行可点击样式 */
.el-table tbody tr {
  cursor: pointer;
}

.el-table tbody tr:hover > td {
  background-color: #f5f7fa;
}
</style>
