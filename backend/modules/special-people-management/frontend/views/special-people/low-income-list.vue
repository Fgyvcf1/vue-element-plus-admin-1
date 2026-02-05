<template>
  <div class="app-container">
    <el-card>
      <el-form ref="queryForm" :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="居民姓名">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入居民姓名"
            clearable
            size="small"
            style="width: 200px"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="身份证号">
          <el-input
            v-model="queryParams.idCard"
            placeholder="请输入身份证号"
            clearable
            size="small"
            style="width: 200px"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="低收入类型">
          <el-select
            v-model="queryParams.lowIncomeType"
            placeholder="请选择低收入类型"
            clearable
            size="small"
            style="width: 150px"
            @change="handleQuery"
          >
            <el-option
              v-for="item in lowIncomeTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择状态"
            clearable
            size="small"
            style="width: 150px"
            @change="handleQuery"
          >
            <el-option label="全部" value="" />
            <el-option label="在享" value="active" />
            <el-option label="暂停" value="suspended" />
            <el-option label="取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" icon="el-icon-search" @click="handleQuery">搜索</el-button>
          <el-button size="small" icon="el-icon-refresh" @click="resetQuery">重置</el-button>
          <el-button type="success" size="small" icon="el-icon-plus" @click="handleAdd">新增低收入人员</el-button>
          <el-button type="info" size="small" icon="el-icon-download" @click="handleExport">导出</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="lowIncomeList" size="small" style="width: 100%" fit :header-cell-style="{ textAlign: 'center', whiteSpace: 'normal', lineHeight: '1.4' }" @row-click="handleRowClick">
        <el-table-column type="index" width="30" align="center" />
        <el-table-column prop="name" label="居民姓名" align="center" width="80" />
        <el-table-column prop="idCard" label="身份证号" align="center" width="160" />
        <el-table-column prop="gender" label="性别" align="center" width="40" />
        <el-table-column prop="ethnicity" label="民族" align="center" width="50" />
        <el-table-column prop="age" label="年龄" align="center" width="40" />
        <el-table-column prop="householdHeadName" label="户主姓名" align="center" width="80" />
        <el-table-column prop="relationshipToHead" label="与户主关系" align="center" width="80" />
        <el-table-column prop="enjoyPolicyType" label="享受政策类型" align="center" width="100" />
        <el-table-column prop="enjoyLevel" label="享受档次" align="center" width="60" />
        <el-table-column prop="subsidyAmount" label="补贴金额" align="center" width="60" />
        <el-table-column prop="subsidyCycle" label="补贴周期" align="center" width="60" />
        <el-table-column prop="startDate" label="开始时间" align="center" width="80" />
        <el-table-column label="结束时间" align="center" width="80">
          <template slot-scope="scope">
            {{ scope.row.status === 'active' ? '持续享受' : scope.row.endDate }}
          </template>
        </el-table-column>
        <el-table-column prop="totalHouseholdMembers" label="全户人数" align="center" width="50" />
        <el-table-column prop="lowIncomeHouseholdMembers" label="享受人数" align="center" width="50" />
        <el-table-column prop="monthlyHouseholdAmount" label="户月金额" align="center" width="60" />

      </el-table>

      <!-- 成员详情和历史记录模态框 -->
      <el-dialog
        title="低收入人员详情"
        :visible.sync="dialogVisible"
        width="80%"
        :close-on-click-modal="true"
        @close="handleDialogClose"
      >
        <div style="margin-bottom: 16px; text-align: right;">
          <el-button v-if="!isEditing" type="primary" size="small" @click="handleEditDetail">编辑</el-button>
          <el-button v-else-if="isEditing" type="primary" size="small" @click="handleSave">保存</el-button>
          <el-button v-else size="small" @click="handleCancelEdit">取消</el-button>
        </div>
        <el-tabs v-model="activeTab" type="border-card">
          <!-- 成员基本信息 -->
          <el-tab-pane label="详细信息" name="info">
            <el-form v-loading="detailLoading" label-width="120px" size="small">
              <div style="margin-bottom: 10px; padding: 10px; background-color: #f0f9ff; border-radius: 4px;">
                <strong>说明：</strong>
                <span style="margin-left: 10px;">享受人数：该成员全部家庭成员享受政策的人数</span>
                <span style="margin-left: 20px;">户月金额：每名家庭成员享受月补助金额的总和</span>
              </div>
              <!-- 第一行：户主姓名、全户人数、享受人数 -->
              <div style="margin-bottom: 20px; padding: 15px; background-color: #f9fafc; border-radius: 4px;">
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="户主姓名">
                      <el-input v-model="memberDetail.householdHeadName" :disabled="!isEditing" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="全户人数">
                      <el-input v-model.number="memberDetail.totalHouseholdMembers" :disabled="!isEditing" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="享受人数">
                      <el-input v-model.number="memberDetail.lowIncomeHouseholdMembers" :disabled="!isEditing" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>
              <el-row :gutter="20">
                <el-col :span="8">
                  <el-form-item label="居民姓名">
                    <el-input v-model="memberDetail.name" :disabled="!isEditing" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="身份证号">
                    <el-input v-model="memberDetail.idCard" :disabled="!isEditing" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="性别">
                    <el-input v-model="memberDetail.gender" :disabled="!isEditing" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="年龄">
                    <el-input v-model="memberDetail.age" :disabled="!isEditing" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="民族">
                    <el-input v-model="memberDetail.ethnicity" :disabled="!isEditing" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="联系电话">
                    <el-input v-model="memberDetail.phoneNumber" :disabled="!isEditing" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="与户主关系">
                    <el-input v-model="memberDetail.relationshipToHead" :disabled="!isEditing" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="享受政策类型">
                    <el-select v-model="memberDetail.enjoyPolicyType" placeholder="请选择政策类型" :disabled="!isEditing" size="small" @change="handlePolicyTypeChange">
                      <el-option
                        v-for="item in lowIncomeTypeOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="享受档次">
                    <el-select v-model="memberDetail.enjoyLevel" placeholder="请选择享受档次" :disabled="!isEditing || memberDetail.enjoyPolicyType !== '最低生活保证金'" size="small">
                      <el-option
                        v-for="item in levelOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="补贴金额">
                    <el-input v-model.number="memberDetail.subsidyAmount" :disabled="!isEditing" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="补贴周期">
                    <el-select v-model="memberDetail.subsidyCycle" placeholder="请选择补贴周期" :disabled="!isEditing" size="small">
                      <el-option label="月度" value="monthly" />
                      <el-option label="季度" value="quarterly" />
                      <el-option label="年度" value="yearly" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="开始时间">
                    <el-date-picker v-model="memberDetail.startDate" type="date" placeholder="选择开始时间" :disabled="!isEditing" value-format="yyyy-MM-dd" size="small" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="结束时间">
                    <el-date-picker v-model="memberDetail.endDate" type="date" placeholder="选择结束时间" :disabled="!isEditing" value-format="yyyy-MM-dd" size="small" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="状态">
                    <el-select v-model="memberDetail.status" placeholder="请选择状态" :disabled="!isEditing" size="small">
                      <el-option label="在享" value="active" />
                      <el-option label="暂停" value="suspended" />
                      <el-option label="取消" value="cancelled" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="户月金额">
                    <el-input v-model.number="memberDetail.monthlyHouseholdAmount" :disabled="!isEditing" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="账户名称">
                    <el-input v-model="memberDetail.accountName" :disabled="!isEditing" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="银行名称">
                    <el-input v-model="memberDetail.bankName" :disabled="!isEditing" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="银行账户">
                    <el-input v-model="memberDetail.bankAccount" :disabled="!isEditing" />
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item label="备注">
                    <el-input v-model="memberDetail.remark" type="textarea" :rows="3" :disabled="!isEditing" />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </el-tab-pane>

          <!-- 历史修改记录 -->
          <el-tab-pane label="历史记录" name="history">
            <!-- 统计信息 -->
            <el-card class="stats-card" style="margin-bottom: 20px;">
              <h3>享受政策统计</h3>
              <el-row :gutter="20">
                <el-col :span="8">
                  <div class="stat-item">
                    <span class="stat-label">该成员历史享受月数：</span>
                    <span class="stat-value">{{ stats.memberTotalMonths || 0 }}个月</span>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="stat-item">
                    <span class="stat-label">该户所有成员总月数：</span>
                    <span class="stat-value">{{ stats.totalMonths || 0 }}个月</span>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="stat-item">
                    <span class="stat-label">该户所有成员享受总金额：</span>
                    <span class="stat-value">{{ stats.totalSubsidy || 0 }}元</span>
                  </div>
                </el-col>
              </el-row>
              <div style="margin-top: 10px; font-size: 12px; color: #909399;">
                <span>说明：该成员历史享受月数仅统计当前成员的月数；该户所有成员总月数统计全户所有成员的总月数；总金额按每条记录的补贴金额×月数计算后求和。</span>
              </div>
            </el-card>
            
            <!-- 历史记录 -->
            <el-timeline v-loading="historyLoading">
              <el-timeline-item
                v-for="(record, index) in policyHistory"
                :key="record.id || index"
                :timestamp="record.startDate"
                :type="record.status === 'active' ? 'success' : 'warning'"
                placement="top"
              >
                <el-card shadow="hover" class="timeline-card">
                  <div class="card-header">
                    <h4>{{ record.policyType }}</h4>
                    <el-tag :type="record.status === 'active' ? 'success' : 'warning'" size="small">
                      {{ record.status === 'active' ? '在享' : record.status === 'suspended' ? '暂停' : '取消' }}
                    </el-tag>
                  </div>
                  <div class="card-content">
                    <el-row :gutter="12">
                      <el-col :span="12">
                        <div class="info-item">
                          <span class="label">开始日期：</span>
                          <span class="value">{{ record.startDate }}</span>
                        </div>
                      </el-col>
                      <el-col :span="12">
                        <div class="info-item">
                          <span class="label">结束日期：</span>
                          <span class="value">{{ record.endDate || '至今' }}</span>
                        </div>
                      </el-col>
                      <el-col :span="12">
                        <div class="info-item">
                          <span class="label">补贴金额：</span>
                          <span class="value">{{ record.subsidyAmount ? record.subsidyAmount + '元/' + record.subsidyCycle : '无补贴' }}</span>
                        </div>
                      </el-col>
                      <el-col :span="12">
                        <div class="info-item">
                          <span class="label">享受档次：</span>
                          <span class="value">{{ getEnjoyLevelDisplay(record.policyType, record.enjoyLevel) }}</span>
                        </div>
                      </el-col>
                      <el-col :span="12">
                        <div class="info-item">
                          <span class="label">银行账户：</span>
                          <span class="value">{{ record.subsidyAccount || '未填写' }}</span>
                        </div>
                      </el-col>
                      <el-col :span="12">
                        <div class="info-item">
                          <span class="label">与开户人关系：</span>
                          <span class="value">{{ record.accountHolderRelationship || '未填写' }}</span>
                        </div>
                      </el-col>
                      <el-col :span="24">
                        <div class="info-item">
                          <span class="label">备注：</span>
                          <span class="value">{{ record.remark || '无' }}</span>
                        </div>
                      </el-col>
                    </el-row>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
            <div v-if="policyHistory.length === 0 && !historyLoading" class="no-records">
              <div style="text-align: center; color: #909399; padding: 20px;">
                <i class="el-icon-info" style="font-size: 24px; margin-bottom: 10px; display: block;" />
                <span>暂无历史记录</span>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
        <div slot="footer" class="dialog-footer">
          <el-button @click="dialogVisible = false">关闭</el-button>
        </div>
      </el-dialog>

      <pagination
        v-show="total>0"
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </el-card>
  </div>
</template>

<script>
import Pagination from '@/components/Pagination' // secondary package based on el-pagination
import { getLowIncomePersons, getLowIncomePerson, getPolicyRecords, addPolicyRecord, updatePolicyRecord, updateLowIncomePerson, getTotalMonths, getHouseholdTotalSubsidy } from '@/api/special-people'
import { getDictionaryByCategory } from '@/api/dictionary'
import ExcelJS from 'exceljs'

export default {
  name: 'LowIncomeList',
  components: {
    Pagination
  },
  data() {
    return {
      loading: false,
      total: 0,
      lowIncomeList: [],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        name: undefined,
        idCard: undefined,
        lowIncomeType: undefined,
        status: 'active'
      },
      // 模态框相关
      dialogVisible: false,
      activeTab: 'info',
      detailLoading: false,
      historyLoading: false,
      memberDetail: {},
      originalMemberDetail: {}, // 保存原始数据，用于比较修改
      policyHistory: [],
      isEditing: false, // 编辑状态管理
      // 统计数据
      stats: {
        memberTotalMonths: 0, // 成员个人历史享受月数
        totalMonths: 0,       // 该户所有成员总月数
        totalSubsidy: 0       // 该户所有成员享受总金额
      },
      // 字典数据
      levelOptions: [], // 档次选项
      lowIncomeTypeOptions: [] // 低收入类型选项
    }
  },
  created() {
    // 页面加载时不自动查询，只在手动点击查询按钮时才查询
    this.loadDictionaries()
  },
  methods: {
    // 加载字典数据
    async loadDictionaries() {
      try {
        // 加载档次选项
        const levelRes = await getDictionaryByCategory('档次')
        this.levelOptions = levelRes.data || []

        // 加载低收入类型选项（享受政策）
        const lowIncomeTypeRes = await getDictionaryByCategory('享受政策')
        this.lowIncomeTypeOptions = (lowIncomeTypeRes.data || []).map(item => ({
          label: item.value,
          value: item.value
        }))
      } catch (error) {
        console.error('加载字典数据失败:', error)
      }
    },

    // 获取享受档次的显示值
    getEnjoyLevelDisplay(policyType, enjoyLevel) {
      // 直接显示 low_income_policy_records 表中 enjoy_level 的值
      return enjoyLevel || '-'
    },

    getList() {
      this.loading = true
      getLowIncomePersons(this.queryParams).then(response => {
        // 将API返回的数据转换为组件需要的格式
        this.lowIncomeList = response.data.map(item => ({
          id: item.id,
          name: item.name || '',
          idCard: item.idCard || item.id_card || '',
          gender: item.gender || '',
          ethnicity: item.ethnicity || '',
          age: item.age || '',
          householdHeadName: item.household_head_name || '',
          relationshipToHead: item.relationship_to_head || '',
          enjoyPolicyType: item.enjoyPolicyType || '',
          enjoyLevel: this.getEnjoyLevelDisplay(item.enjoyPolicyType, item.enjoy_level),
          subsidyAmount: item.subsidy_amount || '',
          subsidyCycle: item.subsidy_cycle || '',
          startDate: item.start_date || '',
          endDate: item.end_date || '',
          totalHouseholdMembers: item.totalHouseholdMembers || 0,
          lowIncomeHouseholdMembers: item.lowIncomeHouseholdMembers || 0,
          monthlyHouseholdAmount: item.monthlyHouseholdAmount || 0,
          status: item.status
        }))
        this.total = response.data.length
        this.loading = false
      }).catch(error => {
        console.error('获取低收入人员数据失败:', error)
        this.loading = false
        this.$message.error('获取低收入人员数据失败')
      })
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.$refs.queryForm?.resetFields()
      this.queryParams = {
        pageNum: 1,
        pageSize: 10,
        name: undefined,
        idCard: undefined,
        lowIncomeType: undefined,
        status: undefined
      }
      // 重置后直接清空结果，而不是重新查询
      this.lowIncomeList = []
      this.total = 0
    },
    handleAdd() {
      this.$router.push('/special-people/low-income/add')
    },
    handleEdit(row) {
      this.$router.push(`/special-people/low-income/edit/${row.id}`)
    },
    handlePolicyRecord(row) {
      this.$router.push(`/special-people/policy-record/${row.id}`)
    },
    handleDelete(row) {
      this.$confirm(`确定要删除低收入人员【${row.name}】吗？`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 这里应该调用实际的删除API
        this.$message.success('删除成功')
        this.getList()
      }).catch(() => {
        // 取消删除
      })
    },
    // 单击行弹出模态框
    async handleRowClick(row) {
      try {
        this.dialogVisible = true
        this.activeTab = 'info'
        this.detailLoading = true
        this.historyLoading = true
        this.isEditing = false

        // 获取成员详细信息
        const response = await getLowIncomePerson(row.id)
        if (response && response.data) {
          const data = response.data
          this.memberDetail = {
            id: data.id,
            name: data.name || '',
            idCard: data.idCard || data.id_card || '', // 兼容id_card字段
            gender: data.gender || '',
            age: data.age || '',
            ethnicity: data.ethnicity || '',
            phoneNumber: data.phoneNumber || data.phone_number || '', // 兼容phone_number字段
            householdHeadName: data.householdHeadName || data.household_head_name || '', // 兼容household_head_name字段
            relationshipToHead: data.relationshipToHead || data.relationship_to_head || '', // 兼容relationship_to_head字段
            enjoyPolicyType: data.enjoyPolicyType || '',
            enjoyLevel: data.enjoyLevel || data.enjoy_level || '', // 兼容enjoy_level字段
            // 保存原始的enjoy_level值用于显示
            _enjoyLevel: data.enjoyLevel || data.enjoy_level || '',
            subsidyAmount: data.subsidyAmount || data.subsidy_amount || '', // 兼容subsidy_amount字段
            subsidyCycle: data.subsidyCycle || data.subsidy_cycle || '', // 兼容subsidy_cycle字段
            startDate: data.startDate || data.start_date || '', // 兼容start_date字段
            endDate: data.endDate || data.end_date || '', // 兼容end_date字段
            status: data.status || '',
            totalHouseholdMembers: data.totalHouseholdMembers || data.totalHouseholdMembers || 0,
            lowIncomeHouseholdMembers: data.lowIncomeHouseholdMembers || data.lowIncomeHouseholdMembers || 0,
            monthlyHouseholdAmount: data.monthlyHouseholdAmount || data.monthlyHouseholdAmount || 0,
            accountName: data.accountName || data.account_name || '', // 兼容account_name字段
            bankName: data.bankName || data.bank_name || '', // 兼容bank_name字段
            bankAccount: data.bankAccount || data.bank_account || '', // 兼容bank_account字段
            remark: data.remark || ''
          }
        }

        // 获取历史记录
        const historyResponse = await getPolicyRecords({ low_income_person_id: row.id })
        if (historyResponse && historyResponse.data) {
          this.policyHistory = historyResponse.data.map(item => ({
            id: item.id,
            policyType: item.policy_type,
            startDate: item.start_date,
            endDate: item.end_date,
            subsidyAmount: item.subsidy_amount,
            subsidyCycle: item.subsidy_cycle,
            enjoyLevel: item.enjoy_level,
            subsidyAccount: item.bank_account,
            accountHolderRelationship: item.account_relationship,
            status: item.status,
            remark: item.remark,
            account_name: item.account_name,
            bank_name: item.bank_name,
            bank_account: item.bank_account
          }))
          
          // 如果有政策记录，使用最新的政策记录中的银行信息填充详情
          // 优先使用有值的记录，如果最新记录的值为空，则查找最近一个有值的记录
          if (this.policyHistory.length > 0) {
            // 按创建时间排序，获取最新的政策记录
            const sortedRecords = [...this.policyHistory].sort((a, b) =>
              new Date(b.created_at) - new Date(a.created_at)
            )

            // 查找最近一个有值的记录
            const latestValidRecord = sortedRecords.find(record =>
              record.account_name != null &&
              record.account_name !== '' &&
              record.bank_name != null &&
              record.bank_name !== '' &&
              record.bank_account != null &&
              record.bank_account !== ''
            )

            // 如果找到有值的记录，使用它；否则使用最新记录
            const recordToUse = latestValidRecord || sortedRecords[0]

            // 使用选定记录的银行信息更新memberDetail，但只有值不为null时才覆盖
            if (recordToUse.account_name != null && recordToUse.account_name !== '') {
              this.memberDetail.accountName = recordToUse.account_name
            }
            if (recordToUse.bank_name != null && recordToUse.bank_name !== '') {
              this.memberDetail.bankName = recordToUse.bank_name
            }
            if (recordToUse.bank_account != null && recordToUse.bank_account !== '') {
              this.memberDetail.bankAccount = recordToUse.bank_account
            }
          }
        }
        
        // 保存原始数据，用于比较修改
        this.originalMemberDetail = JSON.parse(JSON.stringify(this.memberDetail))
        
        this.detailLoading = false
        this.historyLoading = false
        
        // 获取统计数据
        await this.getStatsData(row.id)
      } catch (error) {
        console.error('获取成员详情失败:', error)
        this.$message.error('获取成员详情失败')
        this.detailLoading = false
        this.historyLoading = false
      }
    },
    
    // 获取统计数据
    async getStatsData(id) {
      try {
        // 并行获取统计数据
        const [monthsResponse, subsidyResponse] = await Promise.all([
          getTotalMonths(id),
          getHouseholdTotalSubsidy(id)
        ])

        // 更新统计数据
        if (monthsResponse && monthsResponse.data) {
          this.stats.memberTotalMonths = monthsResponse.data.totalMonths || 0 // 成员个人历史享受月数
        }

        if (subsidyResponse && subsidyResponse.data) {
          this.stats.totalSubsidy = subsidyResponse.data.totalSubsidy || 0 // 户总金额
          this.stats.totalMonths = subsidyResponse.data.totalMonths || 0 // 户总月数
        }
      } catch (error) {
        console.error('获取统计数据失败:', error)
      }
    },
    
    // 政策类型变化处理
    handlePolicyTypeChange() {
      // 如果政策类型为最低生活保证金，显示档次选项，否则直接使用政策类型作为享受档次
      if (this.memberDetail.enjoyPolicyType === '最低生活保证金') {
        // 保持原有档次值，或设置默认值
        this.memberDetail.enjoyLevel = this.memberDetail.enjoyLevel || ''
      } else {
        // 对于非最低生活保证金政策，档次设为空或根据需要处理
        this.memberDetail.enjoyLevel = ''
      }
    },

    // 编辑详情
    handleEditDetail() {
      this.isEditing = true
    },

    // 保存修改
    async handleSave() {
      try {
        this.detailLoading = true

        // 准备保存数据，转换为API需要的格式
        const saveData = {
          id: this.memberDetail.id,
          name: this.memberDetail.name,
          idCard: this.memberDetail.idCard,
          gender: this.memberDetail.gender,
          age: this.memberDetail.age,
          ethnicity: this.memberDetail.ethnicity,
          phoneNumber: this.memberDetail.phoneNumber,
          household_head_name: this.memberDetail.householdHeadName,
          relationship_to_head: this.memberDetail.relationshipToHead,
          enjoyPolicyType: this.memberDetail.enjoyPolicyType,
          policy_type: this.memberDetail.enjoyPolicyType || '未指定', // 明确传递 policy_type 字段
          low_income_type: this.memberDetail.enjoyPolicyType || '未指定', // 添加默认值，确保不为空
          enjoy_level: this.memberDetail.enjoyLevel,
          subsidy_amount: this.memberDetail.subsidyAmount,
          subsidy_cycle: this.memberDetail.subsidyCycle,
          start_date: this.memberDetail.startDate,
          end_date: this.memberDetail.endDate,
          status: this.memberDetail.status,
          totalHouseholdMembers: this.memberDetail.totalHouseholdMembers,
          lowIncomeHouseholdMembers: this.memberDetail.lowIncomeHouseholdMembers,
          monthlyHouseholdAmount: this.memberDetail.monthlyHouseholdAmount,
          account_name: this.memberDetail.accountName,
          bank_name: this.memberDetail.bankName,
          bank_account: this.memberDetail.bankAccount,
          remark: this.memberDetail.remark
        }

        // 调用API保存修改
        await updateLowIncomePerson(this.memberDetail.id, saveData)

        // 检查是否需要更新或创建政策记录
        // 如果历史记录中存在记录，更新最新的记录；否则创建新记录
        if (this.policyHistory.length > 0) {
          // 获取最新的政策记录
          const latestRecord = this.policyHistory.reduce((latest, record) => {
            return new Date(record.created_at) > new Date(latest.created_at) ? record : latest
          }, this.policyHistory[0])

          // 更新现有记录
          const policyRecordData = {
            policy_type: this.memberDetail.enjoyPolicyType || '未指定',
            enjoy_level: this.memberDetail.enjoyLevel,
            has_subsidy: !!this.memberDetail.subsidyAmount,
            start_date: this.memberDetail.startDate,
            end_date: this.memberDetail.endDate,
            subsidy_amount: this.memberDetail.subsidyAmount,
            subsidy_cycle: this.memberDetail.subsidyCycle,
            account_name: this.memberDetail.accountName,
            account_relationship: '本人',
            bank_name: this.memberDetail.bankName,
            bank_account: this.memberDetail.bankAccount,
            status: this.memberDetail.status,
            remark: `修改记录：${new Date().toISOString().slice(0, 10)}`
          }

          // 调用更新政策记录的API
          await updatePolicyRecord(latestRecord.id, policyRecordData)
        } else {
          // 如果没有历史记录，创建新记录
          const policyRecordData = {
            low_income_person_id: this.memberDetail.id,
            policy_type: this.memberDetail.enjoyPolicyType || '未指定',
            enjoy_level: this.memberDetail.enjoyLevel,
            has_subsidy: !!this.memberDetail.subsidyAmount,
            start_date: this.memberDetail.startDate,
            end_date: this.memberDetail.endDate,
            subsidy_amount: this.memberDetail.subsidyAmount,
            subsidy_cycle: this.memberDetail.subsidyCycle,
            account_name: this.memberDetail.accountName,
            account_relationship: '本人',
            bank_name: this.memberDetail.bankName,
            bank_account: this.memberDetail.bankAccount,
            status: this.memberDetail.status,
            remark: `创建记录：${new Date().toISOString().slice(0, 10)}`
          }

          // 调用API添加政策记录
          await addPolicyRecord(policyRecordData)
        }

        // 更新成功后刷新数据
        this.$message.success('保存成功')
        this.isEditing = false

        // 刷新列表数据和历史记录
        this.getList()
        const historyResponse = await getPolicyRecords({ low_income_person_id: this.memberDetail.id })
        if (historyResponse && historyResponse.data) {
          this.policyHistory = historyResponse.data.map(item => ({
            id: item.id,
            policyType: item.policy_type,
            startDate: item.start_date,
            endDate: item.end_date,
            subsidyAmount: item.subsidy_amount,
            subsidyCycle: item.subsidy_cycle,
            enjoyLevel: item.enjoy_level,
            subsidyAccount: item.bank_account,
            accountHolderRelationship: item.account_relationship,
            status: item.status,
            remark: item.remark,
            account_name: item.account_name,
            bank_name: item.bank_name,
            bank_account: item.bank_account,
            created_at: item.created_at
          }))
        }

        // 更新原始数据
        this.originalMemberDetail = JSON.parse(JSON.stringify(this.memberDetail))
      } catch (error) {
        console.error('保存修改失败:', error)
        this.$message.error('保存修改失败')
      } finally {
        this.detailLoading = false
      }
    },

    // 取消编辑
    handleCancelEdit() {
      this.memberDetail = JSON.parse(JSON.stringify(this.originalMemberDetail))
      this.isEditing = false
    },

    // 关闭模态框
    handleDialogClose() {
      this.memberDetail = {}
      this.originalMemberDetail = {}
      this.policyHistory = []
      this.activeTab = 'info'
      this.isEditing = false
    },

    // 导出查询结果为Excel
    handleExport() {
      if (this.lowIncomeList.length === 0) {
        this.$message.warning('没有可导出的数据')
        return
      }

      // 创建工作簿
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('低收入人群查询结果')

      // 设置表头
      worksheet.columns = [
        { header: '序号', key: 'index', width: 8 },
        { header: '居民姓名', key: 'name', width: 15 },
        { header: '身份证号', key: 'idCard', width: 25 },
        { header: '性别', key: 'gender', width: 10 },
        { header: '民族', key: 'ethnicity', width: 10 },
        { header: '年龄', key: 'age', width: 8 },
        { header: '户主姓名', key: 'householdHeadName', width: 15 },
        { header: '与户主关系', key: 'relationshipToHead', width: 15 },
        { header: '享受政策类型', key: 'enjoyPolicyType', width: 20 },
        { header: '享受档次', key: 'enjoyLevel', width: 12 },
        { header: '补贴金额', key: 'subsidyAmount', width: 12 },
        { header: '补贴周期', key: 'subsidyCycle', width: 12 },
        { header: '开始时间', key: 'startDate', width: 15 },
        { header: '结束时间', key: 'endDate', width: 15 },
        { header: '全户人数', key: 'totalHouseholdMembers', width: 12 },
        { header: '享受人数', key: 'lowIncomeHouseholdMembers', width: 12 },
        { header: '户月金额', key: 'monthlyHouseholdAmount', width: 12 }
      ]

      // 填充数据
      this.lowIncomeList.forEach((row, index) => {
        const endDate = row.status === 'active' ? '持续享受' : row.endDate
        worksheet.addRow({
          index: index + 1,
          name: row.name,
          idCard: row.idCard,
          gender: row.gender,
          ethnicity: row.ethnicity,
          age: row.age,
          householdHeadName: row.householdHeadName,
          relationshipToHead: row.relationshipToHead,
          enjoyPolicyType: row.enjoyPolicyType,
          enjoyLevel: row.enjoyLevel,
          subsidyAmount: row.subsidyAmount,
          subsidyCycle: row.subsidyCycle,
          startDate: row.startDate,
          endDate: endDate,
          totalHouseholdMembers: row.totalHouseholdMembers,
          lowIncomeHouseholdMembers: row.lowIncomeHouseholdMembers,
          monthlyHouseholdAmount: row.monthlyHouseholdAmount
        })
      })

      // 生成Excel文件并下载
      workbook.xlsx.writeBuffer().then(buffer => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `低收入人群查询结果_${new Date().toISOString().slice(0, 10)}.xlsx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        this.$message.success('导出成功')
      })
    }
  }
}
</script>

<style scoped>
.demo-form-inline .el-form-item {
  margin-bottom: 16px;
}

.timeline-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
}

.card-content {
  padding: 0 16px 16px;
}

.info-item {
  margin-bottom: 8px;
}

.info-item .label {
  display: inline-block;
  width: 100px;
  font-weight: bold;
  color: #606266;
}

.info-item .value {
  color: #303133;
}

.no-records {
  padding: 40px 0;
  text-align: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
