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
        <el-button type="primary" size="small" @click="handleImport">导入</el-button>
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
                >
                  <el-option label="本人" value="本人" />
                  <el-option label="配偶" value="配偶" />
                  <el-option label="子" value="子" />
                  <el-option label="女" value="女" />
                  <el-option label="儿媳" value="儿媳" />
                  <el-option label="女婿" value="女婿" />
                  <el-option label="孙子" value="孙子" />
                  <el-option label="孙女" value="孙女" />
                  <el-option label="父亲" value="父亲" />
                  <el-option label="母亲" value="母亲" />
                  <el-option label="祖父" value="祖父" />
                  <el-option label="祖母" value="祖母" />
                  <el-option label="外祖父" value="外祖父" />
                  <el-option label="外祖母" value="外祖母" />
                  <el-option label="兄弟" value="兄弟" />
                  <el-option label="姐妹" value="姐妹" />
                  <el-option label="兄嫂" value="兄嫂" />
                  <el-option label="弟媳" value="弟媳" />
                  <el-option label="姐夫" value="姐夫" />
                  <el-option label="妹夫" value="妹夫" />
                  <el-option label="伯父" value="伯父" />
                  <el-option label="叔父" value="叔父" />
                  <el-option label="侄子" value="侄子" />
                  <el-option label="侄女" value="侄女" />
                  <el-option label="其他亲属" value="其他亲属" />
                  <el-option label="非亲属" value="非亲属" />
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
import { ref, reactive } from 'vue'
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
import ImportMapping from './components/ImportMapping.vue'

const router = useRouter()
const residentFormRef = ref<FormInstance>()
const householdFormRef = ref<FormInstance>()
const loading = ref(false)
const importDialogVisible = ref(false)

// 字典选项
const ethnicityOptions = ref([
  { label: '汉族', value: '汉族' },
  { label: '蒙古族', value: '蒙古族' },
  { label: '回族', value: '回族' },
  { label: '藏族', value: '藏族' },
  { label: '维吾尔族', value: '维吾尔族' },
  { label: '苗族', value: '苗族' },
  { label: '彝族', value: '彝族' },
  { label: '壮族', value: '壮族' },
  { label: '布依族', value: '布依族' },
  { label: '朝鲜族', value: '朝鲜族' },
  { label: '满族', value: '满族' },
  { label: '侗族', value: '侗族' },
  { label: '瑶族', value: '瑶族' },
  { label: '白族', value: '白族' },
  { label: '土家族', value: '土家族' },
  { label: '哈尼族', value: '哈尼族' },
  { label: '哈萨克族', value: '哈萨克族' },
  { label: '傣族', value: '傣族' },
  { label: '黎族', value: '黎族' },
  { label: '傈僳族', value: '傈僳族' },
  { label: '佤族', value: '佤族' },
  { label: '畲族', value: '畲族' },
  { label: '高山族', value: '高山族' },
  { label: '拉祜族', value: '拉祜族' },
  { label: '水族', value: '水族' },
  { label: '东乡族', value: '东乡族' },
  { label: '纳西族', value: '纳西族' },
  { label: '景颇族', value: '景颇族' },
  { label: '柯尔克孜族', value: '柯尔克孜族' },
  { label: '土族', value: '土族' },
  { label: '达斡尔族', value: '达斡尔族' },
  { label: '仫佬族', value: '仫佬族' },
  { label: '羌族', value: '羌族' },
  { label: '布朗族', value: '布朗族' },
  { label: '撒拉族', value: '撒拉族' },
  { label: '毛南族', value: '毛南族' },
  { label: '仡佬族', value: '仡佬族' },
  { label: '锡伯族', value: '锡伯族' },
  { label: '阿昌族', value: '阿昌族' },
  { label: '普米族', value: '普米族' },
  { label: '塔吉克族', value: '塔吉克族' },
  { label: '怒族', value: '怒族' },
  { label: '乌孜别克族', value: '乌孜别克族' },
  { label: '俄罗斯族', value: '俄罗斯族' },
  { label: '鄂温克族', value: '鄂温克族' },
  { label: '德昂族', value: '德昂族' },
  { label: '保安族', value: '保安族' },
  { label: '裕固族', value: '裕固族' },
  { label: '京族', value: '京族' },
  { label: '塔塔尔族', value: '塔塔尔族' },
  { label: '独龙族', value: '独龙族' },
  { label: '鄂伦春族', value: '鄂伦春族' },
  { label: '赫哲族', value: '赫哲族' },
  { label: '门巴族', value: '门巴族' },
  { label: '珞巴族', value: '珞巴族' },
  { label: '基诺族', value: '基诺族' }
])

const villageGroupOptions = ref([
  { label: '一组', value: '一组' },
  { label: '二组', value: '二组' },
  { label: '三组', value: '三组' },
  { label: '四组', value: '四组' },
  { label: '五组', value: '五组' },
  { label: '六组', value: '六组' },
  { label: '七组', value: '七组' },
  { label: '八组', value: '八组' },
  { label: '九组', value: '九组' },
  { label: '十组', value: '十组' }
])

const maritalStatusOptions = ref([
  { label: '未婚', value: '未婚' },
  { label: '已婚', value: '已婚' },
  { label: '离异', value: '离异' },
  { label: '丧偶', value: '丧偶' }
])

const politicalStatusOptions = ref([
  { label: '群众', value: '群众' },
  { label: '共青团员', value: '共青团员' },
  { label: '中共党员', value: '中共党员' },
  { label: '民主党派', value: '民主党派' }
])

const educationLevelOptions = ref([
  { label: '小学', value: '小学' },
  { label: '初中', value: '初中' },
  { label: '高中', value: '高中' },
  { label: '中专', value: '中专' },
  { label: '大专', value: '大专' },
  { label: '本科', value: '本科' },
  { label: '研究生', value: '研究生' }
])

const militaryServiceOptions = ref([
  { label: '未服兵役', value: '未服兵役' },
  { label: '已服兵役', value: '已服兵役' },
  { label: '现役', value: '现役' }
])

const householdTypeOptions = ref([
  { label: '农业户口', value: '农业户口' },
  { label: '非农业户口', value: '非农业户口' },
  { label: '居民户口', value: '居民户口' }
])

const housingTypeOptions = ref([
  { label: '自有住房', value: '自有住房' },
  { label: '租赁住房', value: '租赁住房' },
  { label: '借住', value: '借住' },
  { label: '其他', value: '其他' }
])

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
  callback: (data: { value: string }[]) => void
) => {
  if (!queryString || queryString.trim().length < 1) {
    callback([])
    return
  }
  try {
    const res = await getSearchSuggestions({ keyword: queryString, type: 'householdHeadNames' })
    callback(res.data || [])
  } catch (error) {
    callback([])
  }
}

// 户主姓名选择处理
const handleHouseholdHeadSelect = (item: { value: string }) => {
  console.log('选择户主:', item)
  // 这里可以调用API获取户主详情并填充表单
}

// 户主姓名输入处理
const handleHouseholdHeadInput = (value: string) => {
  console.log('输入户主姓名:', value)
}

// 提交表单
const submitForm = async () => {
  if (!residentFormRef.value) return

  await residentFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
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
          householdId: residentForm.household_id,
          householdHeadId: residentForm.household_head_id
        }

        const res = await addResident(residentData)
        if (res.code === 200) {
          ElMessage.success('新增居民成功')
          router.push('/resident/list')
        } else {
          ElMessage.error(res.message || '新增居民失败')
        }
      } catch (error) {
        console.error('新增居民失败:', error)
        ElMessage.error('新增居民失败')
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
  importDialogVisible.value = false
  ElMessage.success('导入成功')
}
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
