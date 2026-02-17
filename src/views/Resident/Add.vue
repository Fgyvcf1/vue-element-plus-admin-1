<template>
  <div class="resident-add-container">
    <el-card style="padding: 10px">
      <!-- 表单提示信息和导入按钮 -->
      <div
        style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          padding: 12px 20px;
          background-color: #ecf5ff;
          border-radius: 4px;
          border-left: 4px solid #409eff;
          font-size: 14px;
          line-height: 1.5;
        "
      >
        <span>提示：同户新增时，输入户主姓名后系统会自动填充户主信息和家庭ID</span>
        <el-button v-hasPermi="'resident:add'" type="primary" size="small" @click="handleImport">
          导入
        </el-button>
      </div>

      <!-- 导入对话框 -->
      <el-dialog
        v-model="importDialogVisible"
        title="居民信息导入"
        width="800px"
        :close-on-click-modal="false"
      >
        <ImportMapping @close="importDialogVisible = false" @import-success="handleImportSuccess" />
      </el-dialog>

      <!-- 户主信息部分 -->
      <el-card class="section-card" style="margin-bottom: 10px; padding: 5px">
        <template #header>
          <div class="section-header">
            <span>户主信息</span>
          </div>
        </template>
        <el-form ref="householdFormRef" :model="householdForm" label-width="100px" size="small">
          <el-row :gutter="10">
            <el-col :span="6">
              <el-form-item label="户主姓名">
                <el-autocomplete
                  v-model="householdForm.householdHeadName"
                  placeholder="请输入户主姓名"
                  clearable
                  :fetch-suggestions="fetchHouseholdHeadSuggestions"
                  value-key="value"
                  @select="handleHouseholdHeadSelect"
                  @input="handleHouseholdHeadInput"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="户编号">
                <el-input
                  v-model="householdForm.household_number"
                  disabled
                  placeholder="自动生成"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="性别">
                <el-select
                  v-model="householdForm.gender"
                  placeholder="请选择性别"
                  size="small"
                  style="width: 100%"
                >
                  <el-option label="男" value="男" />
                  <el-option label="女" value="女" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="民族">
                <el-select
                  v-model="householdForm.ethnicity"
                  placeholder="请选择民族"
                  size="small"
                  style="width: 100%"
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
            <el-col :span="6">
              <el-form-item label="身份证号">
                <el-input
                  v-model="householdForm.householdHeadIdCard"
                  placeholder="请输入身份证号"
                  maxlength="18"
                  @input="handleHouseholdIdCardInput"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="联系电话">
                <el-input v-model="householdForm.phoneNumber" placeholder="请输入联系电话" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="户口类型">
                <el-select
                  v-model="householdForm.householdType"
                  placeholder="请选择户口类型"
                  size="small"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in householdTypeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="住房类型">
                <el-select
                  v-model="householdForm.housingType"
                  placeholder="请选择住房类型"
                  size="small"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in housingTypeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="村组">
                <el-select
                  v-model="householdForm.villageGroup"
                  placeholder="请选择村组"
                  size="small"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in villageGroupOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="18">
              <el-form-item label="家庭地址">
                <el-input v-model="householdForm.address" placeholder="请输入家庭地址" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-card>

      <!-- 居民信息部分 -->
      <el-card class="section-card" style="margin-bottom: 10px; padding: 5px">
        <template #header>
          <div class="section-header">
            <span>居民信息</span>
          </div>
        </template>
        <el-form
          ref="residentFormRef"
          :model="residentForm"
          label-width="100px"
          size="small"
          :rules="residentRules"
        >
          <el-row :gutter="10">
            <el-col :span="6">
              <el-form-item label="居民姓名" prop="name">
                <el-input v-model="residentForm.name" placeholder="请输入居民姓名" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="性别" prop="gender">
                <el-select
                  v-model="residentForm.gender"
                  placeholder="请选择性别"
                  size="small"
                  style="width: 100%"
                >
                  <el-option label="男" value="男" />
                  <el-option label="女" value="女" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="出生日期" prop="date_of_birth">
                <el-date-picker
                  v-model="residentForm.date_of_birth"
                  type="date"
                  placeholder="选择日期"
                  value-format="YYYY-MM-DD"
                  size="small"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="10">
            <el-col :span="6">
              <el-form-item label="身份证号" prop="id_card">
                <el-input
                  v-model="residentForm.id_card"
                  placeholder="请输入身份证号"
                  maxlength="18"
                  @input="handleIdCardInput"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="与户主关系" prop="relationship_to_head">
                <el-select
                  v-model="residentForm.relationship_to_head"
                  placeholder="请选择与户主关系"
                  size="small"
                  style="width: 100%"
                  @change="handleRelationshipChange"
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
            <el-col :span="6">
              <el-form-item label="民族" prop="ethnicity">
                <el-select
                  v-model="residentForm.ethnicity"
                  placeholder="请选择民族"
                  size="small"
                  style="width: 100%"
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
            <el-col :span="6">
              <el-form-item label="婚姻状况" prop="marital_status">
                <el-select
                  v-model="residentForm.marital_status"
                  placeholder="请选择婚姻状况"
                  size="small"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in maritalStatusOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="政治面貌" prop="political_status">
                <el-select
                  v-model="residentForm.political_status"
                  placeholder="请选择政治面貌"
                  size="small"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in politicalStatusOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="兵役状况" prop="military_service">
                <el-select
                  v-model="residentForm.military_service"
                  placeholder="请选择兵役状况"
                  size="small"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in militaryServiceOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="银行账号" prop="bank_card">
                <el-input v-model="residentForm.bank_card" placeholder="请输入银行账号" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="开户行" prop="bank_name">
                <el-input v-model="residentForm.bank_name" placeholder="请输入开户行" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="村组" prop="village_group">
                <el-select
                  v-model="residentForm.village_group"
                  placeholder="请选择村组"
                  size="small"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in villageGroupOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="文化程度" prop="education_level">
                <el-select
                  v-model="residentForm.education_level"
                  placeholder="请选择文化程度"
                  size="small"
                  style="width: 100%"
                >
                  <el-option
                    v-for="item in educationLevelOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="职业" prop="occupation">
                <el-input v-model="residentForm.occupation" placeholder="请输入职业" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="联系电话" prop="phone_number">
                <el-input v-model="residentForm.phone_number" placeholder="请输入联系电话" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="健康状况" prop="health_status">
                <el-input v-model="residentForm.health_status" placeholder="请输入健康状况" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="股权数量" prop="equity_shares">
                <el-input-number
                  v-model="residentForm.equity_shares"
                  placeholder="请输入股权数量"
                  :min="0"
                  :precision="2"
                  :step="0.1"
                  controls-position="right"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col v-show="false" :span="6">
              <el-form-item label="家庭ID" prop="household_id">
                <el-input v-model="residentForm.household_id" placeholder="自动填充" />
              </el-form-item>
            </el-col>
            <el-col v-show="false" :span="6">
              <el-form-item label="户主ID" prop="household_head_id">
                <el-input v-model="residentForm.household_head_id" placeholder="自动填充" />
              </el-form-item>
            </el-col>
            <el-col v-show="false" :span="6">
              <el-form-item label="登记日期" prop="registered_date">
                <el-date-picker
                  v-model="residentForm.registered_date"
                  type="date"
                  placeholder="选择日期"
                  value-format="YYYY-MM-DD"
                  size="small"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col v-show="false" :span="6">
              <el-form-item label="状态" prop="status">
                <el-select
                  v-model="residentForm.status"
                  placeholder="请选择状态"
                  size="small"
                  style="width: 100%"
                >
                  <el-option label="正常" value="active" />
                  <el-option label="迁出" value="migrated_out" />
                  <el-option label="死亡" value="deceased" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="18">
              <el-form-item label="家庭地址" prop="Home_address">
                <el-input v-model="residentForm.Home_address" placeholder="请输入家庭地址" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-card>

      <!-- 操作按钮 -->
      <div class="action-buttons" style="text-align: center; margin-top: 10px">
        <el-button type="primary" :loading="loading" size="small" @click="submitForm"
          >提交</el-button
        >
        <el-button size="small" @click="resetForm">重置</el-button>
        <el-button size="small" @click="goBack">返回</el-button>
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
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElRow,
  ElCol,
  ElCard,
  ElInputNumber,
  ElDialog,
  ElAutocomplete
} from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { addResident, addHousehold, getSearchSuggestions } from '@/api/resident'
import { getDictApi } from '@/api/common'
import ImportMapping from './components/ImportMapping.vue'
import { useUserStoreWithOut } from '@/store/modules/user'

const router = useRouter()
const userStore = useUserStoreWithOut()
const residentFormRef = ref<FormInstance>()
const householdFormRef = ref<FormInstance>()
const loading = ref(false)
const importDialogVisible = ref(false)

// 字典选项
const ethnicityOptions = ref<{ label: string; value: string }[]>([])
const villageGroupOptions = ref<{ label: string; value: string }[]>([])
const maritalStatusOptions = ref<{ label: string; value: string }[]>([])
const politicalStatusOptions = ref<{ label: string; value: string }[]>([])
const educationLevelOptions = ref<{ label: string; value: string }[]>([])
const militaryServiceOptions = ref<{ label: string; value: string }[]>([])
const householdTypeOptions = ref<{ label: string; value: string }[]>([])
const housingTypeOptions = ref<{ label: string; value: string }[]>([])
const relationshipOptions = ref<{ label: string; value: string }[]>([])

// 户主信息表单
const householdForm = reactive({
  id: '',
  household_number: '',
  householdHeadName: '',
  gender: '',
  ethnicity: '',
  householdHeadIdCard: '',
  phoneNumber: '',
  villageGroup: '',
  address: '',
  householdType: '',
  housingType: ''
})

// 居民信息表单
const residentForm = reactive({
  name: '',
  gender: '',
  date_of_birth: '',
  id_card: '',
  relationship_to_head: '',
  ethnicity: '汉族',
  marital_status: '未婚',
  political_status: '群众',
  education_level: '小学',
  military_service: '未服兵役',
  phone_number: '',
  village_group: '',
  Home_address: '',
  household_id: '',
  household_head_id: '',
  bank_card: '',
  bank_name: '',
  occupation: '',
  health_status: '',
  equity_shares: 0,
  registered_date: '',
  status: 'active'
})

// 表单验证规则
const residentRules: FormRules = {
  name: [{ required: true, message: '请输入居民姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  date_of_birth: [{ required: true, message: '请选择出生日期', trigger: 'change' }],
  id_card: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    {
      pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/,
      message: '请输入正确的身份证号码',
      trigger: 'blur'
    }
  ],
  relationship_to_head: [{ required: true, message: '请选择与户主关系', trigger: 'change' }],
  ethnicity: [{ required: true, message: '请选择民族', trigger: 'change' }],
  village_group: [{ required: true, message: '请选择村组', trigger: 'change' }]
}

// 身份证号输入处理
const handleIdCardInput = (value: string) => {
  if (value && value.length === 18) {
    parseIdCard(value)
  }
}

// 解析身份证号
const parseIdCard = (idCard: string) => {
  const birthDateStr = idCard.substring(6, 14)
  const birthDate = `${birthDateStr.substring(0, 4)}-${birthDateStr.substring(4, 6)}-${birthDateStr.substring(6, 8)}`
  const genderCode = parseInt(idCard.substring(16, 17))
  const gender = genderCode % 2 === 0 ? '女' : '男'

  residentForm.date_of_birth = birthDate
  residentForm.gender = gender
}

// 户主身份证号输入处理
const handleHouseholdIdCardInput = (value: string) => {
  if (value && value.length === 18) {
    const birthDateStr = value.substring(6, 14)
    const genderCode = parseInt(value.substring(16, 17))
    householdForm.gender = genderCode % 2 === 0 ? '女' : '男'
  }
}

// 获取户主姓名搜索建议
const fetchHouseholdHeadSuggestions = async (
  queryString: string,
  callback: (data: any[]) => void
) => {
  if (!queryString || queryString.trim().length < 1) {
    callback([])
    return
  }
  try {
    const res = await getSearchSuggestions({ keyword: queryString, type: 'householdHeadNames' })
    // 后端返回的数据在 householdHeadNames 字段中（直接返回，不在 data 中）
    const suggestions = res.householdHeadNames || []
    callback(suggestions)
  } catch (error) {
    callback([])
  }
}

// 户主姓名选择处理
const handleHouseholdHeadSelect = (item: any) => {
  console.log('选择户主:', item)
  if (item) {
    // 填充户主信息到表单
    householdForm.householdHeadName = item.householdHeadName || item.value || ''
    householdForm.household_number = item.householdNumber || ''
    householdForm.address = item.address || ''
    householdForm.villageGroup = item.villageGroup || ''
    householdForm.gender = item.gender || ''
    householdForm.householdHeadIdCard = item.householdHeadIdCard || ''
    householdForm.phoneNumber = item.phoneNumber || ''
    householdForm.householdType = item.householdType || ''
    householdForm.housingType = item.housingType || ''
    householdForm.ethnicity = item.ethnicity || ''

    // 重要：填充居民表单中的 household_id
    residentForm.household_id = item.householdNumber || ''
    residentForm.household_head_id = item.householdHeadId || ''
    residentForm.Home_address = item.address || residentForm.Home_address
    residentForm.village_group = item.villageGroup || residentForm.village_group

    ElMessage.success(`已选择户主：${item.householdHeadName || item.value}`)
  }
}

// 户主姓名输入处理
const handleHouseholdHeadInput = (value: string) => {
  console.log('输入户主姓名:', value)
  // 清空已选择的户主信息
  if (!value) {
    householdForm.household_number = ''
    householdForm.address = ''
    householdForm.villageGroup = ''
    residentForm.household_id = ''
    residentForm.household_head_id = ''
  }
}

// 与户主关系变化处理
const handleRelationshipChange = (value: string) => {
  console.log('关系变化:', value)
  if (value === '本人' || value === '户主') {
    // 如果是户主，自动将居民信息复制到户主信息
    householdForm.householdHeadName = residentForm.name
    householdForm.householdHeadIdCard = residentForm.id_card
    householdForm.gender = residentForm.gender
    householdForm.ethnicity = residentForm.ethnicity
    householdForm.villageGroup = residentForm.village_group
    householdForm.address = residentForm.Home_address
    householdForm.phoneNumber = residentForm.phone_number

    ElMessage.info('已自动将居民信息填充到户主信息，请补充户主的户口类型和住房类型')
  }
}

// 提交表单
const submitForm = async () => {
  if (!residentFormRef.value) return

  await residentFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        let householdId = residentForm.household_id

        // 如果是户主（本人），需要先创建户主信息
        if (
          residentForm.relationship_to_head === '本人' ||
          residentForm.relationship_to_head === '户主'
        ) {
          // 验证户主必填信息
          if (!householdForm.householdHeadName || !householdForm.householdHeadIdCard) {
            ElMessage.error('创建户主时，户主姓名和身份证号为必填项')
            loading.value = false
            return
          }

          // 创建户主
          const householdData = {
            household_head_name: householdForm.householdHeadName,
            household_head_id_card: householdForm.householdHeadIdCard,
            gender: householdForm.gender || residentForm.gender,
            ethnicity: householdForm.ethnicity || residentForm.ethnicity,
            village_group: householdForm.villageGroup || residentForm.village_group,
            address: householdForm.address || residentForm.Home_address,
            phone_number: householdForm.phoneNumber || residentForm.phone_number,
            household_type: householdForm.householdType || '农业户口',
            housing_type: householdForm.housingType || '自有住房'
          }

          console.log('创建户主:', householdData)
          const householdRes = await addHousehold(householdData)

          if (householdRes.code === 20000) {
            householdId = householdRes.data?.householdNumber
            ElMessage.success('创建户主成功')
          } else {
            ElMessage.error(householdRes.message || '创建户主失败')
            loading.value = false
            return
          }
        } else {
          // 非户主，必须选择已有家庭
          if (!householdId) {
            ElMessage.error('请选择户主或输入户主姓名搜索并选择')
            loading.value = false
            return
          }
        }

        // 准备居民数据
        const residentData = {
          name: residentForm.name,
          idCard: residentForm.id_card,
          gender: residentForm.gender,
          dateOfBirth: residentForm.date_of_birth,
          villageGroup: residentForm.village_group,
          address: residentForm.Home_address,
          phoneNumber: residentForm.phone_number,
          relationshipToHead: residentForm.relationship_to_head,
          ethnicity: residentForm.ethnicity,
          maritalStatus: residentForm.marital_status,
          politicalStatus: residentForm.political_status,
          educationLevel: residentForm.education_level,
          militaryService: residentForm.military_service,
          bankCard: residentForm.bank_card,
          bankName: residentForm.bank_name,
          occupation: residentForm.occupation,
          healthStatus: residentForm.health_status,
          equityShares: residentForm.equity_shares,
          householdId: householdId,
          householdHeadId: residentForm.household_head_id
        }

        console.log('提交居民数据:', residentData)
        const res = await addResident(residentData)
        if (res.code === 20000) {
          ElMessage.success('新增居民成功')
          router.push('/resident/query')
        } else {
          ElMessage.error(res.message || '新增居民失败')
        }
      } catch (error: any) {
        console.error('新增居民失败:', error)
        ElMessage.error(error?.response?.data?.message || '新增居民失败')
      } finally {
        loading.value = false
      }
    }
  })
}

// 重置表单
const resetForm = () => {
  residentFormRef.value?.resetFields()
  Object.assign(householdForm, {
    id: '',
    household_number: '',
    householdHeadName: '',
    gender: '',
    ethnicity: '',
    householdHeadIdCard: '',
    phoneNumber: '',
    villageGroup: '',
    address: '',
    householdType: '',
    housingType: ''
  })
}

// 返回
const goBack = () => {
  router.go(-1)
}

// 导入
const handleImport = () => {
  importDialogVisible.value = true
}

// 导入成功
const handleImportSuccess = () => {
  // importDialogVisible.value = false
  ElMessage.success('导入成功')
}

// 加载所有字典数据
const loadAllDictionaries = async () => {
  try {
    const res = await getDictApi()
    if (res.code === 20000 && res.data) {
      // /dictionaries 接口返回的是扁平数组，需要按 category 分组
      const dictArray = res.data
      const dictData: Record<string, any[]> = {}

      // 按 category 分组
      dictArray.forEach((item: any) => {
        if (!dictData[item.category]) {
          dictData[item.category] = []
        }
        dictData[item.category].push({
          id: item.id,
          value: item.value,
          label: item.label || item.value,
          display_order: item.display_order
        })
      })

      // 对每个分类内的选项按 display_order 排序
      Object.keys(dictData).forEach((key) => {
        dictData[key].sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      })

      // 加载字典数据到对应的响应式变量
      // 民族
      if (dictData['民族']) {
        ethnicityOptions.value = dictData['民族'].map((item: any) => ({
          label: item.label,
          value: item.value
        }))
      }
      // 村组
      if (dictData['村组']) {
        villageGroupOptions.value = dictData['村组'].map((item: any) => ({
          label: item.label,
          value: item.value
        }))
      }
      // 婚姻状况
      if (dictData['婚姻状况']) {
        maritalStatusOptions.value = dictData['婚姻状况'].map((item: any) => ({
          label: item.label,
          value: item.value
        }))
      }
      // 政治面貌
      if (dictData['政治面貌']) {
        politicalStatusOptions.value = dictData['政治面貌'].map((item: any) => ({
          label: item.label,
          value: item.value
        }))
      }
      // 文化程度
      if (dictData['文化程度']) {
        educationLevelOptions.value = dictData['文化程度'].map((item: any) => ({
          label: item.label,
          value: item.value
        }))
      }
      // 兵役状况
      if (dictData['兵役状况']) {
        militaryServiceOptions.value = dictData['兵役状况'].map((item: any) => ({
          label: item.label,
          value: item.value
        }))
      }
      // 户口类型
      if (dictData['户口类型']) {
        householdTypeOptions.value = dictData['户口类型'].map((item: any) => ({
          label: item.label,
          value: item.value
        }))
      }
      // 住房类型
      if (dictData['住房类型']) {
        housingTypeOptions.value = dictData['住房类型'].map((item: any) => ({
          label: item.label,
          value: item.value
        }))
      }
      // 与户主关系
      if (dictData['relationship_to_head']) {
        relationshipOptions.value = dictData['relationship_to_head'].map((item: any) => ({
          label: item.label,
          value: item.value
        }))
      }
    }
  } catch (error) {
    console.error('加载字典数据失败:', error)
  }
}

// 组件挂载时加载字典数据
onMounted(() => {
  if (!userStore.hasPermission('resident:add')) {
    ElMessage.error('当前账号没有新增居民权限')
    router.replace('/resident/query')
    return
  }
  loadAllDictionaries()
})
</script>

<style scoped lang="scss">
.resident-add-container {
  padding: 20px;

  .section-card {
    margin-bottom: 10px;

    .section-header {
      font-weight: bold;
      font-size: 16px;
    }
  }

  .action-buttons {
    text-align: center;
    margin-top: 10px;

    .el-button {
      margin: 0 10px;
      width: 100px;
    }
  }
}
</style>
