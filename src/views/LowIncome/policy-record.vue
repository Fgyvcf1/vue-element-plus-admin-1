<template>
  <div class="app-container">
    <el-card>
      <template #header>
        <div class="clearfix">
          <span>政策享受记录管理</span>
          <el-button type="primary" size="small" :icon="Plus" @click="handleAddRecord"
            >新增政策记录</el-button
          >
        </div>
      </template>

      <!-- 低收入人员基本信息 -->
      <el-card shadow="hover" class="info-card">
        <template #header>
          <div class="clearfix">
            <span>人员基本信息</span>
          </div>
        </template>
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="姓名">
              <el-input v-model="personInfo.name" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="身份证号">
              <el-input v-model="personInfo.idCard" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="低收入类型">
              <el-input v-model="personInfo.lowIncomeType" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="当前状态">
              <el-tag
                :type="
                  personInfo.status === 'active'
                    ? 'success'
                    : personInfo.status === 'suspended'
                      ? 'warning'
                      : 'danger'
                "
              >
                {{
                  personInfo.status === 'active'
                    ? '在享'
                    : personInfo.status === 'suspended'
                      ? '暂停'
                      : '取消'
                }}
              </el-tag>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 政策享受记录时间轴 -->
      <el-card shadow="hover" class="info-card">
        <template #header>
          <div class="clearfix">
            <span>政策享受历史</span>
          </div>
        </template>
        <el-timeline>
          <el-timeline-item
            v-for="(record, index) in policyRecords"
            :key="record.id || index"
            :timestamp="formatDate(record.startDate)"
            :type="record.status === 'active' ? 'success' : 'warning'"
          >
            <el-card shadow="hover" class="timeline-card">
              <div class="card-header">
                <h4>{{ record.policyType }}</h4>
                <div class="card-actions">
                  <el-button
                    size="small"
                    type="primary"
                    :icon="Edit"
                    @click="handleEditRecord(record)"
                  >
                    编辑
                  </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    :icon="Delete"
                    @click="handleDeleteRecord(record)"
                  >
                    删除
                  </el-button>
                </div>
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
                      <span class="label">补助金额：</span>
                      <span class="value">{{
                        record.subsidyAmount
                          ? record.subsidyAmount + '元/' + formatCycle(record.subsidyCycle)
                          : '无补助'
                      }}</span>
                    </div>
                  </el-col>
                  <el-col :span="12">
                    <div class="info-item">
                      <span class="label">发放账户：</span>
                      <span class="value">{{ record.subsidyAccount || '未填写' }}</span>
                    </div>
                  </el-col>
                  <el-col :span="12">
                    <div class="info-item">
                      <span class="label">与开户人关系：</span>
                      <span class="value">{{ record.accountHolderRelationship || '未填写' }}</span>
                    </div>
                  </el-col>
                  <el-col :span="12">
                    <div class="info-item">
                      <span class="label">状态：</span>
                      <el-tag
                        :type="record.status === 'active' ? 'success' : 'warning'"
                        size="small"
                      >
                        {{ record.status === 'active' ? '在享' : '已过期' }}
                      </el-tag>
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

        <!-- 无记录提示 -->
        <div v-if="policyRecords.length === 0" class="no-records">
          <div style="text-align: center; color: #909399; padding: 20px">
            <el-icon :size="24" style="margin-bottom: 10px; display: block"
              ><Info-Filled
            /></el-icon>
            <span>暂无政策享受记录</span>
          </div>
        </div>
      </el-card>

      <!-- 政策记录表单对话框 -->
      <el-dialog v-model="dialogVisible" :title="formTitle" width="60%">
        <el-form ref="recordFormRef" :model="formData" label-width="120px" size="small">
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item label="政策类型" prop="policyType">
                <el-input v-model="formData.policyType" placeholder="请输入政策类型" size="small" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="开始日期" prop="startDate">
                <el-date-picker
                  v-model="formData.startDate"
                  type="date"
                  placeholder="选择开始日期"
                  value-format="YYYY-MM-DD"
                  size="small"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="结束日期" prop="endDate">
                <el-date-picker
                  v-model="formData.endDate"
                  type="date"
                  placeholder="选择结束日期（可选，不填表示至今）"
                  value-format="YYYY-MM-DD"
                  size="small"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="补助金额" prop="subsidyAmount">
                <el-input
                  v-model.number="formData.subsidyAmount"
                  placeholder="请输入补助金额（可选，不填表示无补助）"
                  size="small"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="补助周期" prop="subsidyCycle">
                <el-select
                  v-model="formData.subsidyCycle"
                  placeholder="请选择补助周期"
                  size="small"
                  style="width: 100%"
                >
                  <el-option label="月度" value="monthly" />
                  <el-option label="季度" value="quarterly" />
                  <el-option label="年度" value="yearly" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="发放账户" prop="subsidyAccount">
                <el-input
                  v-model="formData.subsidyAccount"
                  placeholder="请输入发放账户"
                  size="small"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="与开户人关系" prop="accountHolderRelationship">
                <el-input
                  v-model="formData.accountHolderRelationship"
                  placeholder="请输入与开户人的关系"
                  size="small"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="状态" prop="status">
                <el-select
                  v-model="formData.status"
                  placeholder="请选择状态"
                  size="small"
                  style="width: 100%"
                >
                  <el-option label="在享" value="active" />
                  <el-option label="已过期" value="expired" />
                  <el-option label="已调整" value="adjusted" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="备注" prop="remark">
                <el-input
                  v-model="formData.remark"
                  placeholder="请输入备注"
                  type="textarea"
                  :rows="3"
                  size="small"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button size="small" @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" size="small" :loading="loading" @click="handleSaveRecord"
              >保存</el-button
            >
          </div>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
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
  ElDialog,
  ElDatePicker,
  ElInputNumber
} from 'element-plus'
import { Plus, Edit, Delete, InfoFilled } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'
import {
  getPolicyRecords,
  addPolicyRecord,
  updatePolicyRecord,
  deletePolicyRecord,
  getLowIncomePerson,
  type PolicyRecord
} from '@/api/lowIncome'

const route = useRoute()
const recordFormRef = ref<FormInstance>()

const loading = ref(false)
const dialogVisible = ref(false)
const formTitle = ref('新增政策记录')
const lowIncomePersonId = ref<number | null>(null)

const personInfo = reactive({
  name: '',
  idCard: '',
  lowIncomeType: '',
  status: 'active'
})

const policyRecords = ref<Partial<PolicyRecord>[]>([])

const formData = reactive({
  id: null as number | null,
  lowIncomePersonId: null as number | null,
  policyType: '',
  startDate: '',
  endDate: '',
  subsidyAmount: null as number | null,
  subsidyCycle: 'monthly',
  subsidyAccount: '',
  accountHolderRelationship: '',
  status: 'active',
  remark: ''
})

// 加载人员信息
const loadPersonInfo = async () => {
  if (!lowIncomePersonId.value) return

  try {
    loading.value = true
    const response = await getLowIncomePerson(lowIncomePersonId.value)
    const data = response.data
    if (data) {
      personInfo.name = data.name || ''
      personInfo.idCard = data.idCard || ''
      personInfo.lowIncomeType = data.low_income_type || ''
      personInfo.status = data.status || 'active'
    }
  } catch (error) {
    console.error('获取人员信息失败:', error)
    ElMessage.error('获取人员信息失败')
  } finally {
    loading.value = false
  }
}

// 加载政策记录
const loadPolicyRecords = async () => {
  if (!lowIncomePersonId.value) return

  try {
    loading.value = true
    const response = await getPolicyRecords({ low_income_person_id: lowIncomePersonId.value })
    const records = Array.isArray(response.data) ? response.data : []
    if (records.length) {
      policyRecords.value = records.map((item: any) => ({
        id: item.id,
        lowIncomePersonId: item.low_income_person_id,
        policyType: item.policy_type,
        startDate: item.start_date,
        endDate: item.end_date || '',
        subsidyAmount: item.subsidy_amount,
        subsidyCycle: item.subsidy_cycle,
        subsidyAccount: item.bank_account,
        accountHolderRelationship: item.account_relationship,
        status: item.status,
        remark: item.remark
      }))
    }
  } catch (error) {
    console.error('获取政策记录失败:', error)
    ElMessage.error('获取政策记录失败')
  } finally {
    loading.value = false
  }
}

// 格式化日期
const formatDate = (date?: string | null) => {
  return date || ''
}

// 格式化补助周期
const formatCycle = (cycle?: string | null) => {
  const cycleMap: Record<string, string> = {
    monthly: '月',
    quarterly: '季度',
    yearly: '年'
  }
  return cycleMap[cycle || ''] || cycle || ''
}

// 新增政策记录
const handleAddRecord = () => {
  formTitle.value = '新增政策记录'
  formData.id = null
  formData.lowIncomePersonId = lowIncomePersonId.value
  formData.policyType = ''
  formData.startDate = ''
  formData.endDate = ''
  formData.subsidyAmount = null
  formData.subsidyCycle = 'monthly'
  formData.subsidyAccount = ''
  formData.accountHolderRelationship = ''
  formData.status = 'active'
  formData.remark = ''
  dialogVisible.value = true
}

// 编辑政策记录
const handleEditRecord = (record: Partial<PolicyRecord>) => {
  formTitle.value = '编辑政策记录'
  formData.id = record.id || null
  const resolvedId = record.low_income_person_id ?? lowIncomePersonId.value
  formData.lowIncomePersonId =
    resolvedId === null || resolvedId === undefined ? null : Number(resolvedId)
  formData.policyType = record.policyType || ''
  formData.startDate = record.startDate || ''
  formData.endDate = record.endDate || ''
  formData.subsidyAmount =
    record.subsidyAmount === null || record.subsidyAmount === undefined || record.subsidyAmount === ''
      ? null
      : Number(record.subsidyAmount)
  formData.subsidyCycle = record.subsidyCycle || 'monthly'
  formData.subsidyAccount = record.subsidyAccount || ''
  formData.accountHolderRelationship = record.accountHolderRelationship || ''
  formData.status = record.status || 'active'
  formData.remark = record.remark || ''
  dialogVisible.value = true
}

// 删除政策记录
const handleDeleteRecord = (record: Partial<PolicyRecord>) => {
  ElMessageBox.confirm(`确定要删除政策记录【${record.policyType}】吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        if (record.id) {
          await deletePolicyRecord(record.id)
          ElMessage.success('删除成功')
          loadPolicyRecords()
        }
      } catch (error) {
        console.error('删除政策记录失败:', error)
        ElMessage.error('删除政策记录失败')
      }
    })
    .catch(() => {
      // 取消删除
    })
}

// 保存政策记录
const handleSaveRecord = async () => {
  if (!lowIncomePersonId.value) {
    ElMessage.warning('人员ID不存在')
    return
  }

  loading.value = true
  try {
    const saveData = {
      low_income_person_id: lowIncomePersonId.value,
      policy_type: formData.policyType,
      has_subsidy: !!formData.subsidyAmount,
      start_date: formData.startDate,
      end_date: formData.endDate,
      subsidy_amount: formData.subsidyAmount,
      subsidy_cycle: formData.subsidyCycle,
      account_name: personInfo.name,
      account_relationship: formData.accountHolderRelationship,
      bank_name: '默认银行',
      bank_account: formData.subsidyAccount,
      status: formData.status,
      remark: formData.remark
    }

    if (formData.id) {
      // 更新现有记录
      await updatePolicyRecord(formData.id, saveData)
      ElMessage.success('更新政策记录成功')
    } else {
      // 添加新记录
      await addPolicyRecord(saveData)
      ElMessage.success('新增政策记录成功')
    }

    // 刷新政策记录列表
    loadPolicyRecords()
    dialogVisible.value = false
  } catch (error) {
    console.error('保存政策记录失败:', error)
    ElMessage.error('保存政策记录失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 从路由参数获取低收入人员ID
  const id = route.params.id
  if (id) {
    lowIncomePersonId.value = Number(id)
    loadPersonInfo()
    loadPolicyRecords()
  }
})
</script>

<style scoped>
.info-card {
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

.card-actions {
  display: flex;
  gap: 8px;
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
  gap: 10px;
}

.clearfix {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
