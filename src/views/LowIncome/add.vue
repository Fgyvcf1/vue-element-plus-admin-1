<template>
  <div class="app-container">
    <el-card>
      <el-form
        ref="lowIncomeFormRef"
        :model="formData"
        label-width="100px"
        size="small"
        class="demo-form"
      >
        <!-- 居民基本信息（只读，自动填充） -->
        <el-card class="section-card" style="margin-bottom: 10px; padding: 5px">
          <template #header>
            <div class="section-header">
              <span>居民基本信息</span>
            </div>
          </template>
          <el-row :gutter="10">
            <el-col :span="6">
              <el-form-item label="居民姓名">
                <el-autocomplete
                  v-model="formData.name"
                  placeholder="请输入居民姓名"
                  size="small"
                  :fetch-suggestions="fetchResidentSuggestions"
                  @select="handleResidentSelect"
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="身份证号">
                <el-input v-model="formData.idCard" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="性别">
                <el-input v-model="formData.gender" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="出生日期">
                <el-input v-model="formData.dateOfBirth" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="年龄">
                <el-input v-model="formData.age" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="联系电话">
                <el-input v-model="formData.phoneNumber" disabled />
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <!-- 低收入人员信息 -->
        <el-card class="section-card" style="margin-bottom: 10px; padding: 5px">
          <template #header>
            <div class="section-header">
              <span>低收入人员信息</span>
            </div>
          </template>
          <el-row :gutter="10">
            <!-- 第一行 -->
            <el-col :span="6">
              <el-form-item label="政策类型" prop="policyType">
                <el-select
                  v-model="formData.policyType"
                  placeholder="请选择政策类型"
                  size="small"
                  @change="handlePolicyTypeChange"
                >
                  <el-option
                    v-for="item in policyTypeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="享受档次" prop="enjoyLevel">
                <el-select
                  v-model="formData.enjoyLevel"
                  placeholder="请选择享受档次"
                  size="small"
                  :disabled="formData.policyType !== '最低生活保证金'"
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
            <el-col :span="6">
              <el-form-item label="审批日期" prop="approvalDate">
                <el-date-picker
                  v-model="formData.approvalDate"
                  type="date"
                  placeholder="选择审批日期"
                  value-format="YYYY-MM-DD"
                  format="YYYY-MM-DD"
                  size="small"
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="状态" prop="status">
                <el-select v-model="formData.status" placeholder="请选择状态" size="small">
                  <el-option label="在享" value="active" />
                  <el-option label="暂停" value="suspended" />
                  <el-option label="取消" value="cancelled" />
                </el-select>
              </el-form-item>
            </el-col>

            <!-- 第二行 -->
            <el-col :span="6">
              <el-form-item label="是否有补贴" prop="hasSubsidy">
                <el-select
                  v-model="formData.hasSubsidy"
                  placeholder="请选择是否有补贴"
                  size="small"
                >
                  <el-option label="是" value="true" />
                  <el-option label="否" value="false" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="开始日期" prop="startDate">
                <el-date-picker
                  v-model="formData.startDate"
                  type="date"
                  placeholder="选择开始日期"
                  value-format="YYYY-MM-DD"
                  format="YYYY-MM-DD"
                  size="small"
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="结束日期" prop="endDate">
                <el-date-picker
                  v-model="formData.endDate"
                  type="date"
                  placeholder="选择结束日期"
                  value-format="YYYY-MM-DD"
                  format="YYYY-MM-DD"
                  size="small"
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="补贴金额" prop="subsidyAmount">
                <el-input
                  v-model="formData.subsidyAmount"
                  placeholder="请输入补贴金额"
                  size="small"
                  type="number"
                />
              </el-form-item>
            </el-col>

            <!-- 第三行 -->
            <el-col :span="6">
              <el-form-item label="补贴周期" prop="subsidyCycle">
                <el-select
                  v-model="formData.subsidyCycle"
                  placeholder="请选择补贴周期"
                  size="small"
                >
                  <el-option
                    v-for="item in subsidyCycleOptions"
                    :key="item"
                    :label="item"
                    :value="item"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="账户名称" prop="accountName">
                <el-input
                  v-model="formData.accountName"
                  placeholder="请输入账户名称"
                  size="small"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="账户关系" prop="accountRelationship">
                <el-input
                  v-model="formData.accountRelationship"
                  placeholder="自动填充"
                  size="small"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="银行名称" prop="bankName">
                <el-input v-model="formData.bankName" placeholder="自动填充" size="small" />
              </el-form-item>
            </el-col>

            <!-- 第四行 -->
            <el-col :span="6">
              <el-form-item label="银行账户" prop="bankAccount">
                <el-input v-model="formData.bankAccount" placeholder="自动填充" size="small" />
              </el-form-item>
            </el-col>
            <el-col :span="18">
              <el-form-item label="备注" prop="remark">
                <el-input
                  v-model="formData.remark"
                  placeholder="请输入备注"
                  size="small"
                  type="textarea"
                  :rows="2"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <div class="form-actions">
          <el-button type="primary" size="small" :loading="loading" @click="handleSave"
            >保存</el-button
          >
          <el-button size="small" @click="handleCancel">取消</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ElMessage,
  ElInput,
  ElButton,
  ElSelect,
  ElOption,
  ElForm,
  ElFormItem,
  ElRow,
  ElCol,
  ElCard,
  ElDatePicker,
  ElAutocomplete,
  ElRadio,
  ElRadioGroup,
  ElInputNumber
} from 'element-plus'
import type { FormInstance } from 'element-plus'
import { getResidents, getResident } from '@/api/resident'
import {
  addLowIncomePersonWithPolicy,
  updateLowIncomePerson,
  addPolicyRecord,
  getLowIncomePerson
} from '@/api/lowIncome'
import { getDictionaryByCategory } from '@/api/dictionary'

const router = useRouter()
const route = useRoute()
const lowIncomeFormRef = ref<FormInstance>()

const loading = ref(false)
const isEdit = ref(false)

// 字典选项
const policyTypeOptions = ref<{ label: string; value: string }[]>([])
const levelOptions = ref<{ label: string; value: string }[]>([])
const subsidyCycleOptions = ref<string[]>(['每月', '每季度', '每半年', '每年'])

// 表单数据
const formData = reactive({
  id: null as number | null,
  residentId: null as number | null,
  name: '',
  idCard: '',
  gender: '',
  dateOfBirth: '',
  age: '',
  phoneNumber: '',
  policyType: '',
  enjoyLevel: '',
  approvalDate: '',
  status: 'active',
  hasSubsidy: 'false',
  startDate: '',
  endDate: '',
  subsidyAmount: '',
  subsidyCycle: '',
  accountName: '',
  accountRelationship: '',
  bankName: '',
  bankAccount: '',
  remark: ''
})

// 居民完整信息
const residentInfo = reactive({
  relationship_to_head: '',
  bank_card: '',
  bank_name: '',
  household_id: ''
})

// 加载字典数据
const loadDictionaries = async () => {
  try {
    const loadByCategories = async (categories: string[]) => {
      for (const category of categories) {
        const res = await getDictionaryByCategory(category)
        const list = res.data || []
        if (Array.isArray(list) && list.length > 0) {
          return list
        }
      }
      return []
    }

    const policyList = await loadByCategories(['享受政策', '政策类型', '低收入类型'])
    policyTypeOptions.value = policyList.map((item: any) => ({
      label: item.label || item.value,
      value: item.value
    }))

    const levelList = await loadByCategories(['档次', '享受档次'])
    levelOptions.value = levelList.map((item: any) => ({
      label: item.label || item.value,
      value: item.value
    }))
  } catch (error) {
    console.error('加载字典数据失败:', error)
    ElMessage.error('加载字典数据失败')
  }
}

// 获取居民姓名建议
const fetchResidentSuggestions = async (queryString: string, cb: (data: any[]) => void) => {
  if (!queryString) {
    cb([])
    return
  }

  try {
    const response = await getResidents({ pageNum: 1, pageSize: 10, name: queryString })
    const suggestions = (response.data || []).map((item: any) => ({
      value: item.name,
      id: item.id,
      household_id: item.household_id
    }))
    cb(suggestions)
  } catch (error) {
    console.error('获取居民建议失败:', error)
    cb([])
  }
}

// 处理居民选择
const handleResidentSelect = async (item: any) => {
  if (item.id) {
    await loadResidentInfo(item.id)
  }
}

// 根据居民ID加载居民信息
const loadResidentInfo = async (residentId: number) => {
  try {
    loading.value = true
    const response = await getResident(residentId)
    if (response.data) {
      const resident = response.data

      // 保存居民完整信息
      residentInfo.relationship_to_head =
        resident.relationshipToHead || resident.relationship_to_head || ''
      residentInfo.bank_card = resident.bankCard || resident.bank_card || ''
      residentInfo.bank_name = resident.bankName || resident.bank_name || ''
      residentInfo.household_id = resident.householdId || resident.household_id || ''

      // 自动填充居民基本信息
      formData.residentId = resident.id
      formData.name = resident.name
      formData.idCard = resident.idCard || resident.id_card || ''
      formData.gender = resident.gender
      formData.dateOfBirth = resident.dateOfBirth || resident.date_of_birth || ''
      formData.age = String(resident.age || '')
      formData.phoneNumber = resident.phoneNumber || resident.phone_number || ''

      // 自动填充银行信息
      formData.bankName = resident.bankName || resident.bank_name || ''
      formData.bankAccount = resident.bankCard || resident.bank_card || ''
      formData.accountName = resident.name || ''
      formData.accountRelationship =
        resident.relationshipToHead || resident.relationship_to_head || ''
    }
  } catch (error) {
    console.error('获取居民信息失败:', error)
    ElMessage.error('获取居民信息失败')
  } finally {
    loading.value = false
  }
}

// 政策类型变化处理
const handlePolicyTypeChange = () => {
  if (formData.policyType === '最低生活保证金') {
    formData.enjoyLevel = ''
  } else {
    formData.enjoyLevel = formData.policyType
  }
}

// 加载编辑数据
const loadEditData = async (id: number) => {
  try {
    loading.value = true
    const response = await getLowIncomePerson(id)
    if (response.data) {
      const data = response.data
      isEdit.value = true

      // 填充表单数据
      formData.id = data.id
      formData.residentId = data.residentId || data.resident_id || null
      formData.name = data.name || ''
      formData.idCard = data.idCard || data.id_card || ''
      formData.gender = data.gender || ''
      formData.dateOfBirth = data.dateOfBirth || ''
      formData.age = String(data.age || '')
      formData.phoneNumber = data.phoneNumber || data.phone_number || ''
      formData.policyType = data.enjoyPolicyType || data.low_income_type || ''
      formData.enjoyLevel = data.enjoyLevel || data.enjoy_level || ''
      formData.approvalDate = data.approval_date || ''
      formData.status = data.status || 'active'
      formData.hasSubsidy = data.has_subsidy ? 'true' : 'false'
      formData.startDate = data.start_date || ''
      formData.endDate = data.end_date || ''
      formData.subsidyAmount = String(data.subsidy_amount || '')
      formData.subsidyCycle = data.subsidy_cycle || ''
      formData.accountName = data.account_name || ''
      formData.accountRelationship = data.account_relationship || ''
      formData.bankName = data.bank_name || ''
      formData.bankAccount = data.bank_account || ''
      formData.remark = data.remark || ''
    }
  } catch (error) {
    console.error('获取编辑数据失败:', error)
    ElMessage.error('获取编辑数据失败')
  } finally {
    loading.value = false
  }
}

// 表单验证
const validateForm = async (): Promise<boolean> => {
  if (!formData.residentId) {
    ElMessage.warning('请选择居民')
    return false
  }
  if (!formData.policyType) {
    ElMessage.warning('请选择政策类型')
    return false
  }
  return true
}

// 保存数据
const handleSave = async () => {
  const isValid = await validateForm()
  if (!isValid) return

  loading.value = true

  try {
    const saveData = {
      resident_id: formData.residentId,
      low_income_type: formData.policyType || '最低生活保证金',
      apply_date: formData.startDate || formData.approvalDate || null,
      approval_date: formData.approvalDate || null,
      status: formData.status || 'active',
      policy_type: formData.policyType || null,
      has_subsidy: formData.hasSubsidy === 'true',
      start_date: formData.startDate || null,
      end_date: formData.endDate || null,
      subsidy_amount: formData.subsidyAmount ? Number(formData.subsidyAmount) : null,
      subsidy_cycle: formData.subsidyCycle || null,
      enjoy_level: formData.enjoyLevel || null,
      account_name: formData.accountName || null,
      account_relationship: formData.accountRelationship || null,
      bank_name: formData.bankName || null,
      bank_account: formData.bankAccount || null,
      remark: formData.remark || null
    }

    if (isEdit.value && formData.id) {
      // 更新操作
      await updateLowIncomePerson(formData.id, saveData)

      // 保存政策记录
      const policyRecordData = {
        low_income_person_id: formData.id,
        policy_type: formData.policyType || '最低生活保证金',
        start_date: formData.startDate || null,
        end_date: formData.endDate || null,
        subsidy_amount: formData.subsidyAmount ? Number(formData.subsidyAmount) : null,
        subsidy_cycle: formData.subsidyCycle || null,
        enjoy_level: formData.enjoyLevel || null,
        account_name: formData.accountName || null,
        bank_name: formData.bankName || null,
        bank_account: formData.bankAccount || null,
        account_relationship: formData.accountRelationship || null,
        status: formData.status || 'active',
        remark: formData.remark || null
      }

      await addPolicyRecord(policyRecordData)
      ElMessage.success('更新低收入人员信息成功')
    } else {
      // 新增操作
      await addLowIncomePersonWithPolicy(saveData)
      ElMessage.success('新增低收入人员及政策记录成功')
    }

    router.push('/special-people/low-income-list')
  } catch (error: any) {
    console.error('保存低收入人员信息失败:', error)
    ElMessage.error(error.response?.data?.message || error.message || '保存低收入人员信息失败')
  } finally {
    loading.value = false
  }
}

// 取消操作
const handleCancel = () => {
  router.push('/special-people/low-income-list')
}

onMounted(() => {
  loadDictionaries()

  // 从路由参数获取居民ID
  const residentId = route.query.residentId
  if (residentId) {
    formData.residentId = Number(residentId)
    loadResidentInfo(Number(residentId))
  }

  // 从路由参数获取编辑ID
  const editId = route.params.id
  if (editId) {
    loadEditData(Number(editId))
  }
})
</script>

<style scoped>
.section-card {
  margin-bottom: 10px;
  padding: 5px;
}

.section-header {
  font-weight: bold;
}

.form-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}
</style>
