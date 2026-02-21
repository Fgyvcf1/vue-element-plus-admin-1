<template>
  <div class="app-container">
    <el-card>
      <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="居民姓名">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入居民姓名"
            clearable
            size="small"
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="身份证号">
          <el-input
            v-model="queryParams.idCard"
            placeholder="请输入身份证号"
            clearable
            size="small"
            style="width: 200px"
            @keyup.enter="handleQuery"
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
          <el-button type="primary" size="small" :icon="Search" @click="handleQuery"
            >搜索</el-button
          >
          <el-button size="small" :icon="Refresh" @click="resetQuery">重置</el-button>
          <el-button
            v-hasPermi="'special:add'"
            type="success"
            size="small"
            :icon="Plus"
            @click="handleAdd"
            >新增低收入人员</el-button
          >
          <el-button type="info" size="small" :icon="Download" @click="handleExport"
            >导出</el-button
          >
        </el-form-item>
      </el-form>

      <el-table
        v-loading="loading"
        :data="lowIncomeList"
        size="small"
        style="width: 100%"
        :fit="false"
        :header-cell-style="{ textAlign: 'center', whiteSpace: 'nowrap', lineHeight: '1.4' }"
        :cell-style="{ whiteSpace: 'nowrap' }"
        @row-click="handleRowClick"
      >
        <el-table-column type="index" width="30" align="center" />
        <el-table-column prop="name" label="居民姓名" align="center" width="80" />
        <el-table-column prop="idCard" label="身份证号" align="center" width="160" />
        <el-table-column prop="gender" label="性别" align="center" width="40" />
        <el-table-column prop="ethnicity" label="民族" align="center" width="50" />
        <el-table-column prop="age" label="年龄" align="center" width="40" />
        <el-table-column prop="phoneNumber" label="联系电话" align="center" width="120" />
        <el-table-column prop="householdHeadName" label="户主姓名" align="center" width="80" />
        <el-table-column prop="relationshipToHead" label="与户主关系" align="center" width="80" />
        <el-table-column prop="enjoyPolicyType" label="享受政策类型" align="center" width="130" />
        <el-table-column prop="enjoyLevel" label="享受档次" align="center" width="90" />
        <el-table-column prop="subsidyAmount" label="补贴金额" align="center" width="80" />
        <el-table-column prop="subsidyCycle" label="补贴周期" align="center" width="80" />
        <el-table-column prop="startDate" label="开始时间" align="center" width="80" />
        <el-table-column label="结束时间" align="center" width="80">
          <template #default="scope">
            {{ scope.row.status === 'active' ? '持续享受' : scope.row.endDate }}
          </template>
        </el-table-column>
        <el-table-column prop="totalHouseholdMembers" label="全户人数" align="center" width="80" />
        <el-table-column
          prop="lowIncomeHouseholdMembers"
          label="享受人数"
          align="center"
          width="80"
        />
        <el-table-column prop="monthlyHouseholdAmount" label="户月金额" align="center" width="80" />
      </el-table>

      <!-- 成员详情和历史记录模态框 -->
      <el-dialog
        v-model="dialogVisible"
        title="低收入人员详情"
        width="80%"
        :close-on-click-modal="true"
        @close="handleDialogClose"
      >
        <div style="margin-bottom: 16px; text-align: right">
          <el-button
            v-if="!isEditing"
            v-hasPermi="'special:edit'"
            type="primary"
            size="small"
            @click="handleEditDetail"
            >编辑</el-button
          >
          <template v-else>
            <el-button
              v-hasPermi="'special:edit'"
              type="primary"
              size="small"
              @click="handleSave"
              >保存</el-button
            >
            <el-button size="small" @click="handleCancelEdit">取消</el-button>
          </template>
        </div>
        <el-tabs v-model="activeTab" type="border-card">
          <!-- 成员基本信息 -->
          <el-tab-pane label="详细信息" name="info">
            <el-form v-loading="detailLoading" label-width="120px" size="small">
              <div
                style="
                  margin-bottom: 10px;
                  padding: 10px;
                  background-color: #f0f9ff;
                  border-radius: 4px;
                "
              >
                <strong>说明：</strong>
                <span style="margin-left: 10px">享受人数：该成员全部家庭成员享受政策的人数</span>
                <span style="margin-left: 20px">户月金额：每名家庭成员享受月补助金额的总和</span>
              </div>
              <!-- 第一行：户主姓名、全户人数、享受人数 -->
              <div
                style="
                  margin-bottom: 20px;
                  padding: 15px;
                  background-color: #f9fafc;
                  border-radius: 4px;
                "
              >
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="户主姓名">
                      <el-input v-model="memberDetail.householdHeadName" :disabled="!isEditing" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="全户人数">
                      <el-input
                        v-model.number="memberDetail.totalHouseholdMembers"
                        :disabled="!isEditing"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="享受人数">
                      <el-input
                        v-model.number="memberDetail.lowIncomeHouseholdMembers"
                        :disabled="!isEditing"
                      />
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
                    <el-select
                      v-model="memberDetail.gender"
                      placeholder="请选择性别"
                      :disabled="!isEditing"
                      size="small"
                      style="width: 100%"
                    >
                      <el-option
                        v-for="item in genderOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="年龄">
                    <el-input v-model="memberDetail.age" :disabled="!isEditing" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="民族">
                    <el-select
                      v-model="memberDetail.ethnicity"
                      placeholder="请选择民族"
                      :disabled="!isEditing"
                      size="small"
                      style="width: 100%"
                      filterable
                    >
                      <el-option
                        v-for="item in ethnicityOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="联系电话">
                    <el-input v-model="memberDetail.phoneNumber" :disabled="!isEditing" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="与户主关系">
                    <el-select
                      v-model="memberDetail.relationshipToHead"
                      placeholder="请选择与户主关系"
                      :disabled="!isEditing"
                      size="small"
                      style="width: 100%"
                      filterable
                      allow-create
                    >
                      <el-option
                        v-for="item in relationshipOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="享受政策类型">
                    <el-select
                      v-model="memberDetail.enjoyPolicyType"
                      placeholder="请选择政策类型"
                      :disabled="!isEditing"
                      size="small"
                      @change="handlePolicyTypeChange"
                    >
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
                    <el-select
                      v-model="memberDetail.enjoyLevel"
                      placeholder="请选择享受档次"
                      :disabled="!isEditing || memberDetail.enjoyPolicyType !== '最低生活保证金'"
                      size="small"
                      @change="handleEnjoyLevelChange"
                    >
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
                    <el-select
                      v-model="memberDetail.subsidyCycle"
                      placeholder="请选择补贴周期"
                      :disabled="!isEditing"
                      size="small"
                    >
                      <el-option label="月度" value="monthly" />
                      <el-option label="季度" value="quarterly" />
                      <el-option label="年度" value="yearly" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="开始时间">
                    <el-date-picker
                      v-model="memberDetail.startDate"
                      type="date"
                      placeholder="选择开始时间"
                      :disabled="!isEditing"
                      value-format="YYYY-MM-DD"
                      size="small"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="结束时间">
                    <el-date-picker
                      v-model="memberDetail.endDate"
                      type="date"
                      placeholder="选择结束时间"
                      :disabled="!isEditing"
                      value-format="YYYY-MM-DD"
                      size="small"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="状态">
                    <el-select
                      v-model="memberDetail.status"
                      placeholder="请选择状态"
                      :disabled="!isEditing"
                      size="small"
                    >
                      <el-option label="在享" value="active" />
                      <el-option label="暂停" value="suspended" />
                      <el-option label="取消" value="cancelled" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="户月金额">
                    <el-input
                      v-model.number="memberDetail.monthlyHouseholdAmount"
                      :disabled="!isEditing"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="账户名称">
                    <el-input v-model="memberDetail.accountName" :disabled="!isEditing" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="银行名称">
                    <el-select
                      v-model="memberDetail.bankName"
                      placeholder="请选择银行"
                      :disabled="!isEditing"
                      size="small"
                      style="width: 100%"
                      filterable
                      allow-create
                    >
                      <el-option
                        v-for="item in bankOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="银行账户">
                    <el-input v-model="memberDetail.bankAccount" :disabled="!isEditing" />
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item label="备注">
                    <el-input
                      v-model="memberDetail.remark"
                      type="textarea"
                      :rows="3"
                      :disabled="!isEditing"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </el-tab-pane>

          <!-- 历史修改记录 -->
          <el-tab-pane label="历史记录" name="history">
            <!-- 统计信息 -->
            <el-card class="stats-card" style="margin-bottom: 20px">
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
              <div style="margin-top: 10px; font-size: 12px; color: #909399">
                <span
                  >说明：该成员历史享受月数仅统计当前成员的月数；该户所有成员总月数统计全户所有成员的总月数；总金额按每条记录的补贴金额×月数计算后求和。</span
                >
              </div>
            </el-card>

            <!-- 历史记录 -->
            <el-timeline v-loading="historyLoading">
              <el-timeline-item
                v-for="(record, index) in policyHistory"
                :key="record.id || index"
                :timestamp="record.startDate || ''"
                :type="record.status === 'active' ? 'success' : 'warning'"
                placement="top"
              >
                <el-card shadow="hover" class="timeline-card">
                  <div class="card-header">
                    <h4>{{ record.policyType }}</h4>
                    <el-tag :type="record.status === 'active' ? 'success' : 'warning'" size="small">
                      {{
                        record.status === 'active'
                          ? '在享'
                          : record.status === 'suspended'
                            ? '暂停'
                            : '取消'
                      }}
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
                          <span class="value">{{
                            record.subsidyAmount
                              ? record.subsidyAmount + '元/' + record.subsidyCycle
                              : '无补贴'
                          }}</span>
                        </div>
                      </el-col>
                      <el-col :span="12">
                        <div class="info-item">
                          <span class="label">享受档次：</span>
                          <span class="value">{{
                            getEnjoyLevelDisplay(record.policyType, record.enjoyLevel as string | undefined)
                          }}</span>
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
                          <span class="value">{{
                            record.accountHolderRelationship || '未填写'
                          }}</span>
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
              <div style="text-align: center; color: #909399; padding: 20px">
                <el-icon :size="24" style="margin-bottom: 10px; display: block"
                  ><Info-Filled
                /></el-icon>
                <span>暂无历史记录</span>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="dialogVisible = false">关闭</el-button>
          </div>
        </template>
      </el-dialog>

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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ElMessage,
  ElMessageBox,
  ElInput,
  ElButton,
  ElSelect,
  ElOption,
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
  ElDialog,
  ElTabs,
  ElTabPane,
  ElTimeline,
  ElTimelineItem,
  ElIcon,
  ElDatePicker,
  ElAutocomplete
} from 'element-plus'
import { Search, Refresh, Plus, Download, InfoFilled } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'
import {
  getLowIncomePersons,
  getLowIncomePerson,
  getPolicyRecords,
  addPolicyRecord,
  updatePolicyRecord,
  updateLowIncomePerson,
  getTotalMonths,
  getHouseholdTotalSubsidy,
  type LowIncomePerson,
  type PolicyRecord
} from '@/api/lowIncome'
import { getDictionaryByCategory } from '@/api/dictionary'
import ExcelJS from 'exceljs'
import { useUserStoreWithOut } from '@/store/modules/user'

const router = useRouter()
const userStore = useUserStoreWithOut()
const queryFormRef = ref<FormInstance>()

// 加载状态
const loading = ref(false)
const detailLoading = ref(false)
const historyLoading = ref(false)

// 数据列表
const lowIncomeList = ref<LowIncomePerson[]>([])
const total = ref(0)

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  name: '',
  idCard: '',
  lowIncomeType: '',
  status: 'active'
})

// 模态框相关
const dialogVisible = ref(false)
const activeTab = ref('info')
const memberDetail = reactive<Record<string, any>>({})
const originalMemberDetail = reactive<Partial<LowIncomePerson>>({})
const policyHistory = ref<Partial<PolicyRecord>[]>([])
const isEditing = ref(false)

// 统计数据
const stats = reactive({
  memberTotalMonths: 0,
  totalMonths: 0,
  totalSubsidy: 0
})

// 字典数据
const levelOptions = ref<{ label: string; value: string; amount?: number }[]>([])
const lowIncomeTypeOptions = ref<{ label: string; value: string }[]>([])
const genderOptions = ref<{ label: string; value: string }[]>([])
const ethnicityOptions = ref<{ label: string; value: string }[]>([])
const relationshipOptions = ref<{ label: string; value: string }[]>([])
const bankOptions = ref<{ label: string; value: string }[]>([])

// 加载字典数据
const loadDictionaries = async () => {
  try {
    // 加载档次选项
    const levelRes = await getDictionaryByCategory('档次')
    // 增加金额映射
    const levelMapping: Record<string, number> = {
      'A档': 500,
      'B档': 300,
      'C档': 100
    }
    levelOptions.value = (levelRes.data.data || []).map((item: any) => ({
      label: item.value,
      value: item.value,
      amount: levelMapping[item.value] || 0
    }))

    // 加载低收入类型选项（享受政策）
    const lowIncomeTypeRes = await getDictionaryByCategory('享受政策')
    lowIncomeTypeOptions.value = (lowIncomeTypeRes.data.data || []).map((item: any) => ({
      label: item.value,
      value: item.value
    }))

    // 加载性别选项
    const genderRes = await getDictionaryByCategory('性别')
    genderOptions.value = (genderRes.data.data || []).map((item: any) => ({
      label: item.value,
      value: item.value
    }))

    // 加载民族选项
    const ethnicityRes = await getDictionaryByCategory('民族')
    ethnicityOptions.value = (ethnicityRes.data.data || []).map((item: any) => ({
      label: item.value,
      value: item.value
    }))

    // 加载与户主关系选项
    const relationshipRes = await getDictionaryByCategory('与户主关系')
    relationshipOptions.value = (relationshipRes.data.data || []).map((item: any) => ({
      label: item.value,
      value: item.value
    }))

    // 加载银行名称选项
    const bankRes = await getDictionaryByCategory('银行名称')
    bankOptions.value = (bankRes.data.data || []).map((item: any) => ({
      label: item.value,
      value: item.value
    }))
  } catch (error) {
    console.error('加载字典数据失败:', error)
  }
}

// 获取享受档次的显示值
const getEnjoyLevelDisplay = (policyType?: string | null, enjoyLevel?: string | null) => {
  return enjoyLevel || '-'
}

// 获取列表数据
const getList = async () => {
  loading.value = true
  try {
    const response = await getLowIncomePersons(queryParams)
    // 注意：经过响应拦截器处理后，response 直接是后端返回的数据结构
    const data = response.data || []
    lowIncomeList.value = data.map((item: any) => ({
      id: item.id,
      name: item.name || '',
      idCard: item.idCard || item.id_card || '',
      gender: item.gender || '',
      ethnicity: item.ethnicity || '',
      age: item.age || '',
      phoneNumber: item.phoneNumber || item.phone_number || '',
      householdHeadName: item.householdHeadName || item.household_head_name || '',
      relationshipToHead: item.relationshipToHead || item.relationship_to_head || '',
      enjoyPolicyType: item.policyType || item.policy_type || '',
      enjoyLevel: getEnjoyLevelDisplay(
        item.policyType || item.policy_type,
        item.enjoyLevel || item.enjoy_level
      ),
      subsidyAmount: item.subsidyAmount || item.subsidy_amount || '',
      subsidyCycle: item.subsidyCycle || item.subsidy_cycle || '',
      startDate: item.startDate || item.start_date || '',
      endDate: item.endDate || item.end_date || '',
      totalHouseholdMembers: item.totalHouseholdMembers || 0,
      lowIncomeHouseholdMembers: item.lowIncomeHouseholdMembers || 0,
      monthlyHouseholdAmount: item.monthlyHouseholdAmount || 0,
      status: item.status
    }))
    total.value = response.total || 0
  } catch (error) {
    console.error('获取低收入人员数据失败:', error)
    ElMessage.error('获取低收入人员数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleQuery = () => {
  queryParams.pageNum = 1
  getList()
}

// 重置
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  queryParams.name = ''
  queryParams.idCard = ''
  queryParams.lowIncomeType = ''
  queryParams.status = ''
  lowIncomeList.value = []
  total.value = 0
}

// 新增
const handleAdd = () => {
  if (!userStore.hasPermission('special:add')) {
    ElMessage.warning('暂无新增权限')
    return
  }
  router.push('/special-people/low-income/add')
}

// 单击行弹出模态框
const handleRowClick = async (row: LowIncomePerson) => {
  try {
    dialogVisible.value = true
    activeTab.value = 'info'
    detailLoading.value = true
    historyLoading.value = true
    isEditing.value = false

    // 获取成员详细信息
    const response = await getLowIncomePerson(row.id!)
    // 注意：经过响应拦截器处理后，response 直接是后端返回的数据结构
    if (response.data) {
      const data = response.data
      Object.assign(memberDetail, {
        id: data.id,
        name: data.name || '',
        idCard: data.idCard || data.id_card || '',
        gender: data.gender || '',
        age: data.age || '',
        ethnicity: data.ethnicity || '',
        phoneNumber: data.phoneNumber || data.phone_number || '',
        householdHeadName: data.householdHeadName || data.household_head_name || '',
        relationshipToHead: data.relationshipToHead || data.relationship_to_head || '',
        enjoyPolicyType: data.policyType || data.policy_type || '',
        enjoyLevel: data.enjoyLevel || data.enjoy_level || '',
        _enjoyLevel: data.enjoyLevel || data.enjoy_level || '',
        subsidyAmount: data.subsidyAmount || data.subsidy_amount || '',
        subsidyCycle: data.subsidyCycle || data.subsidy_cycle || '',
        startDate: data.startDate || data.start_date || '',
        endDate: data.endDate || data.end_date || '',
        status: data.status || '',
        totalHouseholdMembers: data.totalHouseholdMembers || 0,
        lowIncomeHouseholdMembers: data.lowIncomeHouseholdMembers || 0,
        monthlyHouseholdAmount: data.monthlyHouseholdAmount || 0,
        accountName: data.accountName || data.account_name || '',
        bankName: data.bankName || data.bank_name || '',
        bankAccount: data.bankAccount || data.bank_account || '',
        remark: data.remark || ''
      })
    }

    // 获取历史记录
    const historyResponse = await getPolicyRecords({ low_income_person_id: row.id })
    // 注意：经过响应拦截器处理后，historyResponse 直接是后端返回的数据结构
    if (historyResponse.data) {
      policyHistory.value = historyResponse.data.map((item: any) => ({
        id: item.id,
        policyType: item.policyType || item.policy_type,
        startDate: item.startDate || item.start_date,
        endDate: item.endDate || item.end_date,
        subsidyAmount: item.subsidyAmount || item.subsidy_amount,
        subsidyCycle: item.subsidyCycle || item.subsidy_cycle,
        enjoyLevel: item.enjoyLevel || item.enjoy_level,
        subsidyAccount: item.bankAccount || item.bank_account,
        accountHolderRelationship: item.accountRelationship || item.account_relationship,
        status: item.status,
        remark: item.remark,
        account_name: item.accountName || item.account_name,
        bank_name: item.bankName || item.bank_name,
        bank_account: item.bankAccount || item.bank_account,
        created_at: item.createdAt || item.created_at
      }))

      // 如果有政策记录，使用最新的政策记录中的银行信息填充详情
      if (policyHistory.value.length > 0) {
        const sortedRecords = [...policyHistory.value].sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        )

        const latestValidRecord = sortedRecords.find(
          (record) => record.account_name && record.bank_name && record.bank_account
        )

        const recordToUse = latestValidRecord || sortedRecords[0]

        if (recordToUse.account_name) {
          memberDetail.accountName = recordToUse.account_name
        }
        if (recordToUse.bank_name) {
          memberDetail.bankName = recordToUse.bank_name
        }
        if (recordToUse.bank_account) {
          memberDetail.bankAccount = recordToUse.bank_account
        }
      }
    }

    // 保存原始数据
    Object.assign(originalMemberDetail, JSON.parse(JSON.stringify(memberDetail)))

    detailLoading.value = false
    historyLoading.value = false

    // 获取统计数据
    await getStatsData(row.id!)
  } catch (error) {
    console.error('获取成员详情失败:', error)
    ElMessage.error('获取成员详情失败')
    detailLoading.value = false
    historyLoading.value = false
  }
}

// 获取统计数据
const getStatsData = async (id: number) => {
  try {
    const [monthsResponse, subsidyResponse] = await Promise.all([
      getTotalMonths(id),
      getHouseholdTotalSubsidy(id)
    ])

    // 注意：经过响应拦截器处理后，response 直接是后端返回的数据结构
    if (monthsResponse.data) {
      stats.memberTotalMonths = Number(monthsResponse.data.totalMonths) || 0
    }

    if (subsidyResponse.data) {
      stats.totalSubsidy = Number(subsidyResponse.data.totalSubsidy) || 0
      stats.totalMonths = Number(subsidyResponse.data.totalMonths) || 0
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 政策类型变化处理
const handlePolicyTypeChange = (value: string) => {
  if (value === '最低生活保证金') {
    memberDetail.enjoyLevel = memberDetail.enjoyLevel || ''
  } else {
    memberDetail.enjoyLevel = ''
    memberDetail.subsidyAmount = 0 // 其他类型清空金额
  }
}

// 选择享受档次后自动填充补贴金额
const handleEnjoyLevelChange = (value: string) => {
  console.log('【handleEnjoyLevelChange】选择的档次:', value)
  console.log('【handleEnjoyLevelChange】当前levelOptions:', levelOptions.value)
  
  const selectedLevel = levelOptions.value.find((opt) => opt.value === value)
  console.log('【handleEnjoyLevelChange】找到的选项:', selectedLevel)
  
  if (selectedLevel && selectedLevel.amount !== undefined) {
    // 使用 Object.assign 确保响应式更新
    Object.assign(memberDetail, {
      ...memberDetail,
      enjoyLevel: value,
      subsidyAmount: selectedLevel.amount
    })
    console.log('【handleEnjoyLevelChange】已设置补贴金额:', selectedLevel.amount)
    ElMessage.success(`已自动填充补贴金额：${selectedLevel.amount}元`)
  } else {
    console.warn('【handleEnjoyLevelChange】未找到对应金额映射，value:', value)
  }
}

// 编辑详情
const handleEditDetail = () => {
  if (!userStore.hasPermission('special:edit')) {
    ElMessage.warning('暂无编辑权限')
    return
  }
  isEditing.value = true
}

// 保存修改
const handleSave = async () => {
  if (!userStore.hasPermission('special:edit')) {
    ElMessage.warning('暂无编辑权限')
    return
  }
  try {
    detailLoading.value = true

    const saveData = {
      id: memberDetail.id,
      name: memberDetail.name,
      idCard: memberDetail.idCard,
      gender: memberDetail.gender,
      age: memberDetail.age,
      ethnicity: memberDetail.ethnicity,
      phoneNumber: memberDetail.phoneNumber,
      household_head_name: memberDetail.householdHeadName,
      relationship_to_head: memberDetail.relationshipToHead,
      enjoyPolicyType: memberDetail.enjoyPolicyType,
      policy_type: memberDetail.enjoyPolicyType || '未指定',
      low_income_type: memberDetail.enjoyPolicyType || '未指定',
      enjoy_level: memberDetail.enjoyLevel,
      subsidy_amount: memberDetail.subsidyAmount,
      subsidy_cycle: memberDetail.subsidyCycle,
      start_date: memberDetail.startDate,
      end_date: memberDetail.endDate,
      status: memberDetail.status,
      totalHouseholdMembers: memberDetail.totalHouseholdMembers,
      lowIncomeHouseholdMembers: memberDetail.lowIncomeHouseholdMembers,
      monthlyHouseholdAmount: memberDetail.monthlyHouseholdAmount,
      account_name: memberDetail.accountName,
      bank_name: memberDetail.bankName,
      bank_account: memberDetail.bankAccount,
      remark: memberDetail.remark
    }

    await updateLowIncomePerson(memberDetail.id!, saveData)

    // 检查关键字段是否发生变化（开始日期、结束日期、补贴金额、政策类型、享受档次）
    const hasKeyChanges =
      originalMemberDetail.startDate !== memberDetail.startDate ||
      originalMemberDetail.endDate !== memberDetail.endDate ||
      originalMemberDetail.subsidyAmount !== memberDetail.subsidyAmount ||
      originalMemberDetail.enjoyPolicyType !== memberDetail.enjoyPolicyType ||
      originalMemberDetail.enjoyLevel !== memberDetail.enjoyLevel

    if (hasKeyChanges && policyHistory.value.length > 0) {
      // 关键字段发生变化，需要结束旧记录并创建新记录
      const latestRecord = policyHistory.value.reduce((latest, record) => {
        return new Date(record.created_at || 0) > new Date(latest.created_at || 0) ? record : latest
      }, policyHistory.value[0])

      // 计算旧记录的结束日期（新开始日期的前一天）
      const newStartDate = new Date(memberDetail.startDate!)
      const oldEndDate = new Date(newStartDate)
      oldEndDate.setDate(oldEndDate.getDate() - 1)

      // 更新旧记录的结束日期（只传递必要字段，避免 undefined）
      const updateData = {
        policy_type: latestRecord.policyType || latestRecord.policy_type || null,
        start_date: latestRecord.startDate || latestRecord.start_date || null,
        end_date: oldEndDate.toISOString().slice(0, 10),
        subsidy_amount: latestRecord.subsidyAmount || latestRecord.subsidy_amount || null,
        subsidy_cycle: latestRecord.subsidyCycle || latestRecord.subsidy_cycle || null,
        enjoy_level: latestRecord.enjoyLevel || latestRecord.enjoy_level || null,
        bank_account: latestRecord.bankAccount || latestRecord.bank_account || null,
        account_name: latestRecord.accountName || latestRecord.account_name || null,
        bank_name: latestRecord.bankName || latestRecord.bank_name || null,
        account_relationship:
          latestRecord.accountRelationship || latestRecord.account_relationship || null,
        has_subsidy: latestRecord.hasSubsidy ?? latestRecord.has_subsidy ?? null,
        status: latestRecord.status || null,
        remark:
          `${latestRecord.remark || ''}; 于${new Date().toISOString().slice(0, 10)}调整，新记录开始`.slice(
            0,
            255
          )
      }
      console.log('【handleSave】更新旧记录的数据:', updateData)
      await updatePolicyRecord(latestRecord.id!, updateData)

      // 创建新记录
      const policyRecordData = {
        low_income_person_id: memberDetail.id,
        policy_type: memberDetail.enjoyPolicyType || '未指定',
        enjoy_level: memberDetail.enjoyLevel,
        has_subsidy: !!memberDetail.subsidyAmount,
        start_date: memberDetail.startDate,
        end_date: memberDetail.endDate,
        subsidy_amount: memberDetail.subsidyAmount,
        subsidy_cycle: memberDetail.subsidyCycle,
        account_name: memberDetail.accountName,
        account_relationship: '本人',
        bank_name: memberDetail.bankName,
        bank_account: memberDetail.bankAccount,
        status: memberDetail.status,
        remark: `记录创建：${new Date().toISOString().slice(0, 10)}（调整后的新记录）`
      }
      await addPolicyRecord(policyRecordData)
    } else if (policyHistory.value.length > 0) {
      // 只有非关键字段变化，更新最新记录
      const latestRecord = policyHistory.value.reduce((latest, record) => {
        return new Date(record.created_at || 0) > new Date(latest.created_at || 0) ? record : latest
      }, policyHistory.value[0])

      await updatePolicyRecord(latestRecord.id!, {
        policy_type: memberDetail.enjoyPolicyType || '未指定',
        enjoy_level: memberDetail.enjoyLevel,
        has_subsidy: !!memberDetail.subsidyAmount,
        start_date: memberDetail.startDate,
        end_date: memberDetail.endDate,
        subsidy_amount: memberDetail.subsidyAmount,
        subsidy_cycle: memberDetail.subsidyCycle,
        account_name: memberDetail.accountName,
        account_relationship: '本人',
        bank_name: memberDetail.bankName,
        bank_account: memberDetail.bankAccount,
        status: memberDetail.status,
        remark:
          `${latestRecord.remark || ''}; 信息更新：${new Date().toISOString().slice(0, 10)}`.slice(
            0,
            255
          )
      })
    } else {
      // 没有历史记录，创建第一条记录
      const policyRecordData = {
        low_income_person_id: memberDetail.id,
        policy_type: memberDetail.enjoyPolicyType || '未指定',
        enjoy_level: memberDetail.enjoyLevel,
        has_subsidy: !!memberDetail.subsidyAmount,
        start_date: memberDetail.startDate,
        end_date: memberDetail.endDate,
        subsidy_amount: memberDetail.subsidyAmount,
        subsidy_cycle: memberDetail.subsidyCycle,
        account_name: memberDetail.accountName,
        account_relationship: '本人',
        bank_name: memberDetail.bankName,
        bank_account: memberDetail.bankAccount,
        status: memberDetail.status,
        remark: `记录创建：${new Date().toISOString().slice(0, 10)}`
      }
      await addPolicyRecord(policyRecordData)
    }

    ElMessage.success('保存成功')
    isEditing.value = false

    // 刷新列表数据
    getList()

    // 刷新历史记录
    const historyResponse = await getPolicyRecords({ low_income_person_id: memberDetail.id })
    // 注意：经过响应拦截器处理后，historyResponse 直接是后端返回的数据结构
    if (historyResponse.data) {
      policyHistory.value = historyResponse.data.map((item: any) => ({
        id: item.id,
        policyType: item.policyType || item.policy_type,
        startDate: item.startDate || item.start_date,
        endDate: item.endDate || item.end_date,
        subsidyAmount: item.subsidyAmount || item.subsidy_amount,
        subsidyCycle: item.subsidyCycle || item.subsidy_cycle,
        enjoyLevel: item.enjoyLevel || item.enjoy_level,
        subsidyAccount: item.bankAccount || item.bank_account,
        accountHolderRelationship: item.accountRelationship || item.account_relationship,
        status: item.status,
        remark: item.remark,
        account_name: item.accountName || item.account_name,
        bank_name: item.bankName || item.bank_name,
        bank_account: item.bankAccount || item.bank_account,
        created_at: item.createdAt || item.created_at
      }))
    }

    // 刷新统计数据
    await getStatsData(memberDetail.id!)

    Object.assign(originalMemberDetail, JSON.parse(JSON.stringify(memberDetail)))
  } catch (error) {
    console.error('保存修改失败:', error)
    ElMessage.error('保存修改失败')
  } finally {
    detailLoading.value = false
  }
}

// 取消编辑
const handleCancelEdit = () => {
  Object.assign(memberDetail, JSON.parse(JSON.stringify(originalMemberDetail)))
  isEditing.value = false
}

// 关闭模态框
const handleDialogClose = () => {
  Object.assign(memberDetail, {})
  Object.assign(originalMemberDetail, {})
  policyHistory.value = []
  activeTab.value = 'info'
  isEditing.value = false
}

// 导出
const handleExport = async () => {
  if (lowIncomeList.value.length === 0) {
    ElMessage.warning('没有可导出的数据')
    return
  }

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('低收入人群查询结果')

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

  lowIncomeList.value.forEach((row, index) => {
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

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `低收入人群查询结果_${new Date().toISOString().slice(0, 10)}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

onMounted(() => {
  loadDictionaries()
})
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

.stat-item {
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.stat-label {
  color: #606266;
  font-size: 14px;
}

.stat-value {
  color: #409eff;
  font-size: 18px;
  font-weight: bold;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

:deep(.el-table th.el-table__cell > .cell),
:deep(.el-table td.el-table__cell > .cell) {
  white-space: nowrap !important;
  word-break: keep-all;
}
</style>
