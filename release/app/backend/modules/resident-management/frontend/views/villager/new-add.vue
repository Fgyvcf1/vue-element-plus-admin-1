<template>
  <div class="app-container">
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
        <el-button type="primary" size="mini" @click="handleImport">导入</el-button>
      </div>

      <!-- 导入对话框 -->
      <el-dialog
        title="居民信息导入"
        :visible.sync="importDialogVisible"
        width="800px"
        :close-on-click-modal="false"
      >
        <ImportMapping
          :visible="importDialogVisible"
          @close="importDialogVisible = false"
          @import-success="handleImportSuccess"
        />
      </el-dialog>

      <!-- 户主信息部分 -->
      <el-card class="section-card" style="margin-bottom: 10px; padding: 5px">
        <div slot="header" class="section-header">
          <span>户主信息</span>
        </div>
        <el-form ref="householdForm" :model="householdForm" label-width="100px" size="small">
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
                <el-select v-model="householdForm.gender" placeholder="请选择性别" size="small">
                  <el-option label="男" value="男" />
                  <el-option label="女" value="女" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="民族">
                <el-select v-model="householdForm.ethnicity" placeholder="请选择民族" size="small">
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
        <div slot="header" class="section-header">
          <span>居民信息</span>
        </div>
        <el-form
          ref="residentForm"
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
                <el-select v-model="residentForm.gender" placeholder="请选择性别" size="small">
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
                  value-format="yyyy-MM-dd"
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
                <el-select v-model="residentForm.ethnicity" placeholder="请选择民族" size="small">
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
                  value-format="yyyy-MM-dd"
                  size="small"
                />
              </el-form-item>
            </el-col>
            <el-col v-show="false" :span="6">
              <el-form-item label="状态" prop="status">
                <el-select v-model="residentForm.status" placeholder="请选择状态" size="small">
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

<script>
import request from '@/utils/request'
import { getSearchSuggestions, addResident, addHousehold } from '@/api/resident'
import dictionaryCache from '@/utils/dictionary-cache'
import ImportMapping from './components/ImportMapping.vue'

export default {
  name: 'NewResidentAdd',
  components: {
    ImportMapping
  },
  data() {
    return {
      loading: false,
      importDialogVisible: false,
      // 字典数据
      ethnicityOptions: [],
      villageGroupOptions: [],
      householdTypeOptions: [],
      housingTypeOptions: [],
      maritalStatusOptions: [],
      politicalStatusOptions: [],
      militaryServiceOptions: [],
      educationLevelOptions: [],
      // 户主信息表单
      householdForm: {
        id: '',
        household_number: '',
        householdHeadName: '',
        gender: '',
        ethnicity: '',
        householdHeadIdCard: '',
        phoneNumber: '',
        householdType: '',
        housingType: '',
        villageGroup: '',
        address: ''
      },
      // 居民信息表单
      residentForm: {
        name: '',
        gender: '',
        date_of_birth: '',
        id_card: '',
        relationship_to_head: '',
        ethnicity: '汉族',
        marital_status: '未婚',
        political_status: '群众',
        military_service: '未服兵役',
        bank_card: '',
        bank_name: '',
        village_group: '',
        education_level: '小学',
        occupation: '',
        phone_number: '',
        health_status: '',
        equity_shares: 0,
        registered_date: new Date().toISOString().slice(0, 10),
        status: 'active',
        Home_address: '',
        household_id: '',
        household_head_id: ''
      },
      // 表单验证规则
      residentRules: {
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
        relationship_to_head: [{ required: true, message: '请输入与户主关系', trigger: 'blur' }],
        ethnicity: [{ required: true, message: '请输入民族', trigger: 'blur' }],
        village_group: [{ required: true, message: '请选择村组', trigger: 'change' }]
      },
      // 用于存储完整的户主信息
      fullHouseholdData: {}
    }
  },
  created() {
    // 加载字典数据
    this.loadDictionaries()
  },
  methods: {
    // 获取户主姓名建议
    fetchHouseholdHeadSuggestions(queryString, callback) {
      if (!queryString || queryString.trim().length < 1) {
        callback([])
        return
      }

      getSearchSuggestions({ keyword: queryString, type: 'householdHeadNames' })
        .then((response) => {
          if (response && response.code === 20000) {
            callback(response.householdHeadNames || [])
          } else {
            callback([])
          }
        })
        .catch(() => {
          callback([])
        })
    },

    // 处理户主姓名输入
    handleHouseholdHeadInput(value) {
      if (!value) {
        // 清空自动填充的数据
        this.householdForm.id = ''
        this.householdForm.household_number = ''
        this.householdForm.gender = ''
        this.householdForm.ethnicity = ''
        this.householdForm.householdHeadIdCard = ''
        this.householdForm.phoneNumber = ''
        this.householdForm.householdType = ''
        this.householdForm.housingType = ''
        this.householdForm.villageGroup = ''
        this.householdForm.address = ''
        this.residentForm.household_id = ''
        this.residentForm.household_head_id = ''
        this.residentForm.village_group = ''
        this.residentForm.Home_address = ''
      }
    },

    // 选择户主姓名
    handleHouseholdHeadSelect(item) {
      // 根据户主姓名查询完整信息
      this.loading = true
      request
        .get(`/households?household_head_name=${encodeURIComponent(item.value)}`)
        .then((response) => {
          if (response && response.code === 20000 && response.data && response.data.length > 0) {
            const householdData = response.data[0]
            this.fullHouseholdData = householdData

            // 填充户主信息
            this.householdForm.id = householdData.id
            this.householdForm.household_number = householdData.household_number
            this.householdForm.gender = householdData.gender
            this.householdForm.ethnicity = householdData.ethnicity
            this.householdForm.householdHeadIdCard = householdData.household_head_id_card
            this.householdForm.phoneNumber = householdData.phone_number
            this.householdForm.householdType = householdData.household_type
            this.householdForm.housingType = householdData.housing_type
            this.householdForm.villageGroup = householdData.village_group
            this.householdForm.address = householdData.address

            // 填充居民的家庭信息
            this.residentForm.household_id = householdData.id
            this.residentForm.household_head_id =
              householdData.household_head_id || householdData.id
            this.residentForm.village_group = householdData.village_group
            this.residentForm.Home_address = householdData.address
          }
        })
        .catch((error) => {
          console.error('获取户主信息失败:', error)
          this.$message.error('获取户主信息失败')
        })
        .finally(() => {
          this.loading = false
        })
    },

    // 提交表单
    submitForm() {
      this.$refs.residentForm.validate((valid) => {
        if (valid) {
          this.loading = true

          // 判断是否需要创建户主
          if (!this.residentForm.household_id || this.residentForm.household_id === '') {
            // 需要创建户主
            this.createHouseholdAndResident()
          } else {
            // 不需要创建户主，直接创建居民
            this.createResident()
          }
        } else {
          return false
        }
      })
    },

    // 创建居民
    createResident() {
      // 转换表单数据格式，确保与后端期望的一致
      const residentData = {
        // 转换下划线命名为驼峰命名，同时保留下划线命名的字段，确保后端能正确接收
        name: this.residentForm.name,
        idCard: this.residentForm.id_card,
        id_card: this.residentForm.id_card,
        gender: this.residentForm.gender,
        dateOfBirth: this.residentForm.date_of_birth,
        date_of_birth: this.residentForm.date_of_birth,
        villageGroup: this.residentForm.village_group,
        village_group: this.residentForm.village_group,
        address: this.residentForm.Home_address,
        Home_address: this.residentForm.Home_address,
        bankCard: this.residentForm.bank_card,
        bank_card: this.residentForm.bank_card,
        phoneNumber: this.residentForm.phone_number,
        phone_number: this.residentForm.phone_number,
        bankName: this.residentForm.bank_name,
        bank_name: this.residentForm.bank_name,
        household_id: this.residentForm.household_id,
        household_head_id: this.residentForm.household_head_id,
        status: this.residentForm.status,
        relationship_to_head: this.residentForm.relationship_to_head,
        ethnicity: this.residentForm.ethnicity,
        marital_status: this.residentForm.marital_status,
        political_status: this.residentForm.political_status,
        military_service: this.residentForm.military_service,
        education_level: this.residentForm.education_level,
        registered_date: this.residentForm.registered_date,
        occupation: this.residentForm.occupation,
        health_status: this.residentForm.health_status,
        equityShares: this.residentForm.equity_shares,
        equity_shares: this.residentForm.equity_shares
      }

      // 添加调试信息
      console.log('提交的居民数据:', residentData)

      // 返回Promise，以便调用者处理异步流程
      return addResident(residentData)
        .then((response) => {
          console.log('新增居民响应:', response)
          if (response && response.code === 20000) {
            this.$message.success('新增居民成功')
            this.$router.push('/resident/list')
          } else {
            this.$message.error(response.message || '新增居民失败')
          }
          return response
        })
        .catch((error) => {
          console.error('新增居民失败:', error)
          const errorMessage = error.response?.data?.message || error.message || '新增居民失败'
          this.$message.error(errorMessage)
          throw error
        })
        .finally(() => {
          this.loading = false
        })
    },

    // 生成基础户编号（村组拼音首字母+身份证后6位）
    generateBaseHouseholdId(villageGroup, idCard) {
      if (!villageGroup || !idCard) {
        return ''
      }

      // 简单的中文首字母提取函数
      const getChineseFirstLetter = (char) => {
        const pinyinMap = {
          赵: 'Z',
          钱: 'Q',
          孙: 'S',
          李: 'L',
          周: 'Z',
          吴: 'W',
          郑: 'Z',
          王: 'W',
          冯: 'F',
          陈: 'C',
          褚: 'C',
          卫: 'W',
          蒋: 'J',
          沈: 'S',
          韩: 'H',
          杨: 'Y',
          朱: 'Z',
          秦: 'Q',
          尤: 'Y',
          许: 'X',
          何: 'H',
          吕: 'L',
          施: 'S',
          张: 'Z',
          孔: 'K',
          曹: 'C',
          严: 'Y',
          华: 'H',
          金: 'J',
          魏: 'W',
          陶: 'T',
          姜: 'J',
          戚: 'Q',
          谢: 'X',
          邹: 'Z',
          喻: 'Y',
          柏: 'B',
          水: 'S',
          窦: 'D',
          章: 'Z',
          云: 'Y',
          苏: 'S',
          潘: 'P',
          葛: 'G',
          奚: 'X',
          范: 'F',
          彭: 'P',
          郎: 'L',
          鲁: 'L',
          韦: 'W',
          昌: 'C',
          马: 'M',
          苗: 'M',
          凤: 'F',
          花: 'H',
          方: 'F',
          俞: 'Y',
          任: 'R',
          袁: 'Y',
          柳: 'L',
          酆: 'F',
          鲍: 'B',
          史: 'S',
          唐: 'T',
          费: 'F',
          廉: 'L',
          岑: 'C',
          薛: 'X',
          雷: 'L',
          贺: 'H',
          倪: 'N',
          汤: 'T',
          滕: 'T',
          殷: 'Y',
          罗: 'L',
          毕: 'B',
          郝: 'H',
          邬: 'W',
          安: 'A',
          常: 'C',
          乐: 'L',
          于: 'Y',
          时: 'S',
          傅: 'F',
          皮: 'P',
          卞: 'B',
          齐: 'Q',
          康: 'K',
          伍: 'W',
          余: 'Y',
          元: 'Y',
          卜: 'B',
          顾: 'G',
          孟: 'M',
          平: 'P',
          黄: 'H',
          和: 'H',
          穆: 'M',
          萧: 'X',
          尹: 'Y',
          姚: 'Y',
          邵: 'S',
          湛: 'Z',
          汪: 'W',
          祁: 'Q',
          毛: 'M',
          禹: 'Y',
          狄: 'D',
          米: 'M',
          贝: 'B',
          明: 'M',
          臧: 'Z',
          计: 'J',
          伏: 'F',
          成: 'C',
          戴: 'D',
          谈: 'T',
          宋: 'S',
          茅: 'M',
          庞: 'P',
          熊: 'X',
          纪: 'J',
          舒: 'S',
          屈: 'Q',
          项: 'X',
          祝: 'Z',
          董: 'D',
          梁: 'L',
          杜: 'D',
          阮: 'R',
          蓝: 'L',
          闵: 'M',
          席: 'X',
          季: 'J',
          麻: 'M',
          强: 'Q',
          贾: 'J',
          路: 'L',
          娄: 'L',
          江: 'J',
          童: 'T',
          颜: 'Y',
          郭: 'G',
          梅: 'M',
          盛: 'S',
          林: 'L',
          刁: 'D',
          钟: 'Z',
          徐: 'X',
          邱: 'Q',
          骆: 'L',
          高: 'G',
          夏: 'X',
          蔡: 'C',
          田: 'T',
          樊: 'F',
          胡: 'H',
          凌: 'L',
          霍: 'H',
          虞: 'Y',
          万: 'W',
          支: 'Z',
          柯: 'K',
          昝: 'Z',
          管: 'G',
          卢: 'L',
          莫: 'M',
          经: 'J',
          房: 'F',
          裘: 'Q',
          缪: 'M',
          干: 'G',
          解: 'X',
          应: 'Y',
          宗: 'Z',
          丁: 'D',
          宣: 'X',
          贲: 'B',
          邓: 'D',
          郁: 'Y',
          单: 'S',
          杭: 'H',
          洪: 'H',
          包: 'B',
          诸: 'Z',
          左: 'Z',
          石: 'S',
          崔: 'C',
          吉: 'J',
          钮: 'N',
          龚: 'G',
          程: 'C',
          嵇: 'J',
          邢: 'X',
          滑: 'H',
          裴: 'P',
          陆: 'L',
          荣: 'R',
          翁: 'W',
          荀: 'X',
          羊: 'Y',
          於: 'Y',
          惠: 'H',
          甄: 'Z',
          曲: 'Q',
          家: 'J',
          封: 'F',
          芮: 'R',
          羿: 'Y',
          储: 'C',
          靳: 'J',
          汲: 'J',
          邴: 'B',
          糜: 'M',
          松: 'S',
          井: 'J',
          段: 'D',
          富: 'F',
          巫: 'W',
          乌: 'W',
          焦: 'J',
          巴: 'B',
          弓: 'G',
          牧: 'M',
          隗: 'K',
          山: 'S',
          谷: 'G',
          车: 'C',
          侯: 'H',
          宓: 'M',
          蓬: 'P',
          全: 'Q',
          郗: 'X',
          班: 'B',
          仰: 'Y',
          秋: 'Q',
          仲: 'Z',
          伊: 'Y',
          宫: 'G',
          宁: 'N',
          仇: 'Q',
          栾: 'L',
          暴: 'B',
          甘: 'G',
          钭: 'T',
          厉: 'L',
          戎: 'R',
          祖: 'Z',
          武: 'W',
          符: 'F',
          刘: 'L',
          景: 'J',
          詹: 'Z',
          束: 'S',
          龙: 'L',
          叶: 'Y',
          幸: 'X',
          司: 'S',
          韶: 'S',
          郜: 'G',
          黎: 'L',
          蓟: 'J',
          薄: 'B',
          印: 'Y',
          宿: 'S',
          白: 'B',
          怀: 'H',
          蒲: 'P',
          邰: 'T',
          从: 'C',
          鄂: 'E',
          索: 'S',
          咸: 'X',
          籍: 'J',
          赖: 'L',
          卓: 'Z',
          蔺: 'L',
          屠: 'T',
          蒙: 'M',
          池: 'C',
          乔: 'Q',
          阴: 'Y',
          郁: 'Y',
          胥: 'X',
          能: 'N',
          苍: 'C',
          双: 'S',
          闻: 'W',
          莘: 'S',
          党: 'D',
          翟: 'Z',
          谭: 'T',
          贡: 'G',
          劳: 'L',
          逄: 'P',
          姬: 'J',
          申: 'S',
          扶: 'F',
          堵: 'D',
          冉: 'R',
          宰: 'Z',
          郦: 'L',
          雍: 'Y',
          却: 'Q',
          璩: 'Q',
          桑: 'S',
          桂: 'G',
          濮: 'P',
          牛: 'N',
          寿: 'S',
          通: 'T',
          边: 'B',
          扈: 'H',
          燕: 'Y',
          冀: 'J',
          僪: 'Y',
          浦: 'P',
          尚: 'S',
          农: 'N',
          温: 'W',
          别: 'B',
          庄: 'Z',
          晏: 'Y',
          柴: 'C',
          瞿: 'Q',
          阎: 'Y',
          充: 'C',
          慕: 'M',
          连: 'L',
          茹: 'R',
          习: 'X',
          宦: 'H',
          艾: 'Y',
          鱼: 'Y',
          容: 'R',
          向: 'X',
          古: 'G',
          易: 'Y',
          慎: 'S',
          戈: 'G',
          廖: 'L',
          庾: 'Y',
          终: 'Z',
          暨: 'J',
          居: 'J',
          衡: 'H',
          步: 'B',
          都: 'D',
          耿: 'G',
          满: 'M',
          弘: 'H',
          匡: 'K',
          国: 'G',
          文: 'W',
          寇: 'K',
          广: 'G',
          禄: 'L',
          阙: 'Q',
          东: 'D',
          欧: 'O',
          殳: 'S',
          沃: 'W',
          利: 'L',
          蔚: 'W',
          越: 'Y',
          夔: 'K',
          隆: 'L',
          师: 'S',
          巩: 'G',
          厍: 'S',
          聂: 'N',
          晁: 'C',
          勾: 'G',
          敖: 'O',
          融: 'R',
          冷: 'L',
          訾: 'Z',
          辛: 'X',
          阚: 'K',
          那: 'N',
          简: 'J',
          饶: 'R',
          空: 'K',
          曾: 'Z',
          毋: 'W',
          沙: 'S',
          乜: 'N',
          养: 'Y',
          鞠: 'J',
          须: 'X',
          丰: 'F',
          巢: 'C',
          关: 'G',
          蒯: 'K',
          相: 'X',
          查: 'Z',
          后: 'H',
          荆: 'J',
          红: 'H',
          游: 'Y',
          竺: 'Z',
          权: 'Q',
          逯: 'L',
          盖: 'G',
          益: 'Y',
          桓: 'H',
          公: 'G',
          万俟: 'M',
          司马: 'S',
          上官: 'S',
          欧阳: 'O',
          夏侯: 'X',
          诸葛: 'Z',
          闻人: 'W',
          东方: 'D',
          赫连: 'H',
          皇甫: 'H',
          尉迟: 'Y',
          公羊: 'G',
          澹台: 'D',
          公冶: 'G',
          宗政: 'Z',
          濮阳: 'P',
          淳于: 'C',
          单于: 'C',
          太叔: 'T',
          申屠: 'S',
          公孙: 'G',
          慕容: 'M',
          仲孙: 'Z',
          钟离: 'Z',
          长孙: 'Z',
          宇文: 'Y',
          司徒: 'S',
          鲜于: 'X',
          司空: 'S',
          闾丘: 'L',
          司徒: 'S',
          亓官: 'Q',
          司寇: 'S',
          仉: 'Z',
          督: 'D',
          子车: 'Z',
          颛孙: 'Z',
          端木: 'D',
          巫马: 'W',
          公西: 'G',
          漆雕: 'Q',
          乐正: 'L',
          壤驷: 'R',
          公良: 'G',
          拓跋: 'T',
          夹谷: 'J',
          宰父: 'Z',
          谷梁: 'G',
          晋: 'J',
          楚: 'C',
          闫: 'Y',
          法: 'F',
          汝: 'R',
          鄢: 'Y',
          涂: 'T',
          钦: 'Q',
          段干: 'D',
          百里: 'B',
          东郭: 'D',
          南门: 'N',
          呼延: 'H',
          归: 'G',
          海: 'H',
          羊舌: 'Y',
          微生: 'W',
          岳: 'Y',
          帅: 'S',
          亢: 'K',
          况: 'K',
          郈: 'H',
          有: 'Y',
          琴: 'Q',
          梁丘: 'L',
          左丘: 'Z',
          东门: 'D',
          西门: 'X',
          商: 'S',
          牟: 'M',
          佘: 'S',
          佴: 'N',
          伯: 'B',
          赏: 'S',
          南宫: 'N',
          墨: 'M',
          哈: 'H',
          谯: 'Q',
          笪: 'D',
          年: 'N',
          爱: 'A',
          阳: 'Y',
          佟: 'T',
          第五: 'D',
          言: 'Y',
          福: 'F',
          百: 'B',
          家: 'J',
          姓: 'X',
          终: 'Z',
          梁: 'L',
          丘: 'Q',
          左: 'Z',
          丘: 'Q',
          东: 'D',
          门: 'M',
          西: 'X',
          门: 'M',
          商: 'S',
          牟: 'M',
          佘: 'S',
          佴: 'N',
          伯: 'B',
          赏: 'S',
          南: 'N',
          宫: 'G',
          墨: 'M',
          哈: 'H',
          谯: 'Q',
          笪: 'D',
          年: 'N',
          爱: 'A',
          阳: 'Y',
          佟: 'T',
          第: 'D',
          五: 'W',
          言: 'Y',
          福: 'F',
          百: 'B',
          家: 'J',
          姓: 'X'
        }

        // 先检查是否在映射表中
        if (pinyinMap[char]) {
          return pinyinMap[char]
        }

        // 如果不在映射表中，返回空字符串或默认值
        return ''
      }

      // 提取所有字的首字母
      const chars = villageGroup.split('')
      let initials = ''
      for (let i = 0; i < chars.length; i++) {
        const initial = getChineseFirstLetter(chars[i])
        if (initial) {
          initials += initial
        }
      }

      const groupCode = initials || 'UNKNOWN'

      // 提取身份证后6位
      const idCardSuffix = idCard.substring(idCard.length - 6)

      const baseHouseholdId = `${groupCode}${idCardSuffix}`

      return baseHouseholdId
    },

    // 生成基础户编号（村组拼音首字母+身份证后6位）
    generateBaseHouseholdId(villageGroup, idCard) {
      if (!villageGroup || !idCard) {
        return ''
      }

      // 简单的中文首字母提取函数
      const getChineseFirstLetter = (char) => {
        const pinyinMap = {
          赵: 'Z',
          钱: 'Q',
          孙: 'S',
          李: 'L',
          周: 'Z',
          吴: 'W',
          郑: 'Z',
          王: 'W',
          冯: 'F',
          陈: 'C',
          褚: 'C',
          卫: 'W',
          蒋: 'J',
          沈: 'S',
          韩: 'H',
          杨: 'Y',
          朱: 'Z',
          秦: 'Q',
          尤: 'Y',
          许: 'X',
          何: 'H',
          吕: 'L',
          施: 'S',
          张: 'Z',
          孔: 'K',
          曹: 'C',
          严: 'Y',
          华: 'H',
          金: 'J',
          魏: 'W',
          陶: 'T',
          姜: 'J',
          戚: 'Q',
          谢: 'X',
          邹: 'Z',
          喻: 'Y',
          柏: 'B',
          水: 'S',
          窦: 'D',
          章: 'Z',
          云: 'Y',
          苏: 'S',
          潘: 'P',
          葛: 'G',
          奚: 'X',
          范: 'F',
          彭: 'P',
          郎: 'L',
          鲁: 'L',
          韦: 'W',
          昌: 'C',
          马: 'M',
          苗: 'M',
          凤: 'F',
          花: 'H',
          方: 'F',
          俞: 'Y',
          任: 'R',
          袁: 'Y',
          柳: 'L',
          酆: 'F',
          鲍: 'B',
          史: 'S',
          唐: 'T',
          费: 'F',
          廉: 'L',
          岑: 'C',
          薛: 'X',
          雷: 'L',
          贺: 'H',
          倪: 'N',
          汤: 'T',
          滕: 'T',
          殷: 'Y',
          罗: 'L',
          毕: 'B',
          郝: 'H',
          邬: 'W',
          安: 'A',
          常: 'C',
          乐: 'L',
          于: 'Y',
          时: 'S',
          傅: 'F',
          皮: 'P',
          卞: 'B',
          齐: 'Q',
          康: 'K',
          伍: 'W',
          余: 'Y',
          元: 'Y',
          卜: 'B',
          顾: 'G',
          孟: 'M',
          平: 'P',
          黄: 'H',
          和: 'H',
          穆: 'M',
          萧: 'X',
          尹: 'Y',
          姚: 'Y',
          邵: 'S',
          湛: 'Z',
          汪: 'W',
          祁: 'Q',
          毛: 'M',
          禹: 'Y',
          狄: 'D',
          米: 'M',
          贝: 'B',
          明: 'M',
          臧: 'Z',
          计: 'J',
          伏: 'F',
          成: 'C',
          戴: 'D',
          谈: 'T',
          宋: 'S',
          茅: 'M',
          庞: 'P',
          熊: 'X',
          纪: 'J',
          舒: 'S',
          屈: 'Q',
          项: 'X',
          祝: 'Z',
          董: 'D',
          梁: 'L',
          杜: 'D',
          阮: 'R',
          蓝: 'L',
          闵: 'M',
          席: 'X',
          季: 'J',
          麻: 'M',
          强: 'Q',
          贾: 'J',
          路: 'L',
          娄: 'L',
          江: 'J',
          童: 'T',
          颜: 'Y',
          郭: 'G',
          梅: 'M',
          盛: 'S',
          林: 'L',
          刁: 'D',
          钟: 'Z',
          徐: 'X',
          邱: 'Q',
          骆: 'L',
          高: 'G',
          夏: 'X',
          蔡: 'C',
          田: 'T',
          樊: 'F',
          胡: 'H',
          凌: 'L',
          霍: 'H',
          虞: 'Y',
          万: 'W',
          支: 'Z',
          柯: 'K',
          昝: 'Z',
          管: 'G',
          卢: 'L',
          莫: 'M',
          经: 'J',
          房: 'F',
          裘: 'Q',
          缪: 'M',
          干: 'G',
          解: 'X',
          应: 'Y',
          宗: 'Z',
          丁: 'D',
          宣: 'X',
          贲: 'B',
          邓: 'D',
          郁: 'Y',
          单: 'S',
          杭: 'H',
          洪: 'H',
          包: 'B',
          诸: 'Z',
          左: 'Z',
          石: 'S',
          崔: 'C',
          吉: 'J',
          钮: 'N',
          龚: 'G',
          程: 'C',
          嵇: 'J',
          邢: 'X',
          滑: 'H',
          裴: 'P',
          陆: 'L',
          荣: 'R',
          翁: 'W',
          荀: 'X',
          羊: 'Y',
          於: 'Y',
          惠: 'H',
          甄: 'Z',
          曲: 'Q',
          家: 'J',
          封: 'F',
          芮: 'R',
          羿: 'Y',
          储: 'C',
          靳: 'J',
          汲: 'J',
          邴: 'B',
          糜: 'M',
          松: 'S',
          井: 'J',
          段: 'D',
          富: 'F',
          巫: 'W',
          乌: 'W',
          焦: 'J',
          巴: 'B',
          弓: 'G',
          牧: 'M',
          隗: 'K',
          山: 'S',
          谷: 'G',
          车: 'C',
          侯: 'H',
          宓: 'M',
          蓬: 'P',
          全: 'Q',
          郗: 'X',
          班: 'B',
          仰: 'Y',
          秋: 'Q',
          仲: 'Z',
          伊: 'Y',
          宫: 'N',
          宁: 'N',
          仇: 'Q',
          栾: 'L',
          暴: 'B',
          甘: 'G',
          钭: 'T',
          厉: 'L',
          戎: 'R',
          祖: 'Z',
          武: 'W',
          符: 'F',
          刘: 'L',
          景: 'J',
          詹: 'Z',
          束: 'S',
          龙: 'L',
          叶: 'Y',
          幸: 'X',
          司: 'S',
          韶: 'S',
          郜: 'G',
          黎: 'L',
          蓟: 'J',
          薄: 'B',
          印: 'Y',
          宿: 'S',
          白: 'B',
          怀: 'H',
          蒲: 'P',
          邰: 'T',
          从: 'C',
          鄂: 'E',
          索: 'S',
          咸: 'X',
          籍: 'J',
          赖: 'L',
          卓: 'Z',
          蔺: 'L',
          屠: 'T',
          蒙: 'M',
          池: 'C',
          乔: 'Q',
          阴: 'Y',
          郁: 'Y',
          胥: 'X',
          能: 'N',
          苍: 'C',
          双: 'S',
          闻: 'W',
          莘: 'S',
          党: 'D',
          翟: 'Z',
          谭: 'T',
          贡: 'G',
          劳: 'L',
          逄: 'P',
          姬: 'J',
          申: 'S',
          扶: 'F',
          堵: 'D',
          冉: 'R',
          宰: 'Z',
          郦: 'L',
          雍: 'Y',
          却: 'Q',
          璩: 'Q',
          桑: 'S',
          桂: 'G',
          濮: 'P',
          牛: 'N',
          寿: 'S',
          通: 'T',
          边: 'B',
          扈: 'H',
          燕: 'Y',
          冀: 'J',
          僪: 'Y',
          浦: 'P',
          尚: 'S',
          农: 'N',
          温: 'W',
          别: 'B',
          庄: 'Z',
          晏: 'Y',
          柴: 'C',
          瞿: 'Q',
          阎: 'Y',
          充: 'C',
          慕: 'M',
          连: 'L',
          茹: 'R',
          习: 'X',
          宦: 'H',
          艾: 'Y',
          鱼: 'Y',
          容: 'R',
          向: 'X',
          古: 'G',
          易: 'Y',
          慎: 'S',
          戈: 'G',
          廖: 'L',
          庾: 'Y',
          终: 'Z',
          暨: 'J',
          居: 'J',
          衡: 'H',
          步: 'B',
          都: 'D',
          耿: 'G',
          满: 'M',
          弘: 'H',
          匡: 'K',
          国: 'G',
          文: 'W',
          寇: 'K',
          广: 'G',
          禄: 'L',
          阙: 'Q',
          东: 'D',
          欧: 'O',
          殳: 'S',
          沃: 'W',
          利: 'L',
          蔚: 'W',
          越: 'Y',
          夔: 'K',
          隆: 'L',
          师: 'S',
          巩: 'G',
          厍: 'S',
          聂: 'N',
          晁: 'C',
          勾: 'G',
          敖: 'O',
          融: 'R',
          冷: 'L',
          訾: 'Z',
          辛: 'X',
          阚: 'K',
          那: 'N',
          简: 'J',
          饶: 'R',
          空: 'K',
          曾: 'Z',
          毋: 'W',
          沙: 'S',
          乜: 'N',
          养: 'Y',
          鞠: 'J',
          须: 'X',
          丰: 'F',
          巢: 'C',
          关: 'G',
          蒯: 'K',
          相: 'X',
          查: 'Z',
          后: 'H',
          荆: 'J',
          红: 'H',
          游: 'Y',
          竺: 'Z',
          权: 'Q',
          逯: 'L',
          盖: 'G',
          益: 'Y',
          桓: 'H',
          公: 'G',
          万俟: 'M',
          司马: 'S',
          上官: 'S',
          欧阳: 'O',
          夏侯: 'X',
          诸葛: 'Z',
          闻人: 'W',
          东方: 'D',
          赫连: 'H',
          皇甫: 'H',
          尉迟: 'Y',
          公羊: 'G',
          澹台: 'D',
          公冶: 'G',
          宗政: 'Z',
          濮阳: 'P',
          淳于: 'C',
          单于: 'C',
          太叔: 'T',
          申屠: 'S',
          公孙: 'G',
          慕容: 'M',
          仲孙: 'Z',
          钟离: 'Z',
          长孙: 'Z',
          宇文: 'Y',
          司徒: 'S',
          鲜于: 'X',
          司空: 'S',
          闾丘: 'L',
          司徒: 'S',
          亓官: 'Q',
          司寇: 'S',
          仉: 'Z',
          督: 'D',
          子车: 'Z',
          颛孙: 'Z',
          端木: 'D',
          巫马: 'W',
          公西: 'G',
          漆雕: 'Q',
          乐正: 'L',
          壤驷: 'R',
          公良: 'G',
          拓跋: 'T',
          夹谷: 'J',
          宰父: 'Z',
          谷梁: 'G',
          晋: 'J',
          楚: 'C',
          闫: 'Y',
          法: 'F',
          汝: 'R',
          鄢: 'Y',
          涂: 'T',
          钦: 'Q',
          段干: 'D',
          百里: 'B',
          东郭: 'D',
          南门: 'N',
          呼延: 'H',
          归: 'G',
          海: 'H',
          羊舌: 'Y',
          微生: 'W',
          岳: 'Y',
          帅: 'S',
          亢: 'K',
          况: 'K',
          郈: 'H',
          有: 'Y',
          琴: 'Q',
          梁丘: 'L',
          左丘: 'Z',
          东门: 'D',
          西门: 'X',
          商: 'S',
          牟: 'M',
          佘: 'S',
          佴: 'N',
          伯: 'B',
          赏: 'S',
          南宫: 'N',
          墨: 'M',
          哈: 'H',
          谯: 'Q',
          笪: 'D',
          年: 'N',
          爱: 'A',
          阳: 'Y',
          佟: 'T',
          第五: 'D',
          言: 'Y',
          福: 'F',
          百: 'B',
          家: 'J',
          姓: 'X',
          终: 'Z',
          梁: 'L',
          丘: 'Q',
          左: 'Z',
          丘: 'Q',
          东: 'D',
          门: 'M',
          西: 'X',
          门: 'M',
          商: 'S',
          牟: 'M',
          佘: 'S',
          佴: 'N',
          伯: 'B',
          赏: 'S',
          南: 'N',
          宫: 'G',
          墨: 'M',
          哈: 'H',
          谯: 'Q',
          笪: 'D',
          年: 'N',
          爱: 'A',
          阳: 'Y',
          佟: 'T',
          第: 'D',
          五: 'W',
          言: 'Y',
          福: 'F',
          百: 'B',
          家: 'J',
          姓: 'X'
        }

        // 先检查是否在映射表中
        if (pinyinMap[char]) {
          return pinyinMap[char]
        }

        // 如果不在映射表中，返回空字符串或默认值
        return ''
      }

      // 提取所有字的首字母
      const chars = villageGroup.split('')
      let initials = ''
      for (let i = 0; i < chars.length; i++) {
        const initial = getChineseFirstLetter(chars[i])
        if (initial) {
          initials += initial
        }
      }

      const groupCode = initials || 'UNKNOWN'

      // 提取身份证后6位
      const idCardSuffix = idCard.substring(idCard.length - 6)

      const baseHouseholdId = `${groupCode}${idCardSuffix}`

      return baseHouseholdId
    },

    // 检查户编号是否已存在
    async checkHouseholdNumberExists(baseHouseholdId) {
      try {
        const response = await request({
          url: `/households/check-household-number?household_number=${baseHouseholdId}`,
          method: 'get'
        })
        return response && response.exists
      } catch (error) {
        console.error('检查户编号失败:', error)
        return false
      }
    },

    // 创建户主和居民
    async createHouseholdAndResident() {
      this.loading = true

      try {
        // 生成户编号
        let householdNumber = ''
        const villageGroup = this.householdForm.villageGroup || this.residentForm.village_group
        const idCard = this.householdForm.householdHeadIdCard || this.residentForm.id_card

        if (villageGroup && idCard) {
          const baseHouseholdId = this.generateBaseHouseholdId(villageGroup, idCard)

          // 检查是否已存在，如果存在则自动加1
          const exists = await this.checkHouseholdNumberExists(baseHouseholdId)

          if (!exists) {
            // 不存在相同的，直接返回基础ID
            householdNumber = baseHouseholdId
          } else {
            // 存在相同的，尝试后缀1-9
            let found = false
            for (let i = 1; i <= 9; i++) {
              const tryNumber = `${baseHouseholdId}${i}`
              const tryExists = await this.checkHouseholdNumberExists(tryNumber)
              if (!tryExists) {
                householdNumber = tryNumber
                found = true
                break
              }
            }

            if (!found) {
              // 如果1-9都存在，使用HH+时间戳
              householdNumber = `HH${Date.now()}`
            }
          }
        } else {
          // 信息不完整，使用HH+时间戳
          householdNumber = `HH${Date.now()}`
        }

        // 更新表单中的户编号显示
        this.householdForm.household_number = householdNumber

        // 转换户主数据格式
        const householdData = {
          household_number: householdNumber,
          village_group: villageGroup,
          household_head_name: this.householdForm.householdHeadName || this.residentForm.name,
          household_head_id_card: idCard,
          ethnicity: this.householdForm.ethnicity || this.residentForm.ethnicity,
          household_type: this.householdForm.householdType || '农业户口',
          housing_type: this.householdForm.housingType || '自有住房',
          address: this.householdForm.address || this.residentForm.Home_address,
          phone_number: this.householdForm.phoneNumber || this.residentForm.phone_number,
          gender: this.householdForm.gender || this.residentForm.gender
        }

        console.log('提交的户主数据:', householdData)

        // 先创建户主
        const householdResponse = await addHousehold(householdData)
        console.log('新增户主响应:', householdResponse)

        if (
          householdResponse &&
          householdResponse.code === 20000 &&
          householdResponse.data &&
          householdResponse.data.id
        ) {
          // 户主创建成功，获取新的household_id
          const newHouseholdId = householdResponse.data.id

          // 更新居民数据的household_id和household_head_id
          this.residentForm.household_id = newHouseholdId
          this.residentForm.household_head_id = newHouseholdId

          // 创建居民
          const residentResponse = await this.createResident()

          // 居民创建成功后，更新household的household_head_id为居民id
          if (
            residentResponse &&
            residentResponse.code === 20000 &&
            residentResponse.data &&
            residentResponse.data.id
          ) {
            const newResidentId = residentResponse.data.id

            // 更新household的household_head_id
            const updateResponse = await request({
              url: `/households/${newHouseholdId}`,
              method: 'put',
              data: {
                household_head_id: newResidentId
              }
            })

            console.log('更新户主ID响应:', updateResponse)
            if (updateResponse && updateResponse.code === 20000) {
              console.log('户主ID更新成功')
            }
          }
        } else {
          this.$message.error('新增户主失败')
        }
      } catch (error) {
        console.error('新增户主或居民失败:', error)
        this.$message.error(error.response?.data?.message || error.message || '新增户主或居民失败')
      } finally {
        this.loading = false
        console.log('提交的户主数据:', householdData)
      }
    },

    // 重置表单
    resetForm() {
      try {
        this.$refs.residentForm.resetFields()
      } catch (error) {
        console.error('重置居民表单失败:', error)
      }

      // 重置户主表单
      this.householdForm = {
        id: '',
        householdHeadName: '',
        gender: '',
        ethnicity: '',
        householdHeadIdCard: '',
        phoneNumber: '',
        householdType: '',
        housingType: '',
        villageGroup: '',
        address: ''
      }

      // 重置居民表单
      this.residentForm = {
        name: '',
        gender: '',
        date_of_birth: '',
        id_card: '',
        relationship_to_head: '',
        ethnicity: '',
        marital_status: '',
        political_status: '',
        military_service: '',
        bank_card: '',
        bank_name: '',
        village_group: '',
        education_level: '',
        occupation: '',
        phone_number: '',
        health_status: '',
        equity_shares: 0,
        registered_date: new Date().toISOString().slice(0, 10),
        status: 'active',
        Home_address: '',
        household_id: '',
        household_head_id: ''
      }
    },

    // 返回
    goBack() {
      this.$router.go(-1)
    },

    // 加载字典数据
    async loadDictionaries() {
      try {
        // 同时加载多个字典数据，使用Promise.all提高效率
        const [
          ethnicityData,
          villageGroupData,
          householdTypeData,
          housingTypeData,
          maritalStatusData,
          politicalStatusData,
          militaryServiceData,
          educationLevelData
        ] = await Promise.all([
          dictionaryCache.getDictionary('民族'),
          dictionaryCache.getDictionary('村组'),
          dictionaryCache.getDictionary('户口类型'),
          dictionaryCache.getDictionary('住房类型'),
          dictionaryCache.getDictionary('婚姻状况'),
          dictionaryCache.getDictionary('政治面貌'),
          dictionaryCache.getDictionary('兵役状况'),
          dictionaryCache.getDictionary('文化程度')
        ])

        // 处理民族数据
        if (Array.isArray(ethnicityData)) {
          this.ethnicityOptions = ethnicityData.map((item) => ({
            label: item.value,
            value: item.value
          }))
        }

        // 处理村组数据
        if (Array.isArray(villageGroupData)) {
          this.villageGroupOptions = villageGroupData.map((item) => ({
            label: item.value,
            value: item.value
          }))
        }

        // 处理户口类型数据
        if (Array.isArray(householdTypeData)) {
          this.householdTypeOptions = householdTypeData.map((item) => ({
            label: item.value,
            value: item.value
          }))
        }

        // 处理住房类型数据
        if (Array.isArray(housingTypeData)) {
          this.housingTypeOptions = housingTypeData.map((item) => ({
            label: item.value,
            value: item.value
          }))
        }

        // 处理婚姻状况数据
        if (Array.isArray(maritalStatusData)) {
          this.maritalStatusOptions = maritalStatusData.map((item) => ({
            label: item.value,
            value: item.value
          }))
        }

        // 处理政治面貌数据
        if (Array.isArray(politicalStatusData)) {
          this.politicalStatusOptions = politicalStatusData.map((item) => ({
            label: item.value,
            value: item.value
          }))
        }

        // 处理兵役状况数据
        if (Array.isArray(militaryServiceData)) {
          this.militaryServiceOptions = militaryServiceData.map((item) => ({
            label: item.value,
            value: item.value
          }))
        }

        // 处理文化程度数据
        if (Array.isArray(educationLevelData)) {
          this.educationLevelOptions = educationLevelData.map((item) => ({
            label: item.value,
            value: item.value
          }))
        }
      } catch (error) {
        console.error('加载字典数据失败:', error)
        // 如果没有从字典获取到数据，使用默认民族列表
        this.ethnicityOptions = [
          { label: '汉族', value: '汉族' },
          { label: '蒙古族', value: '蒙古族' },
          { label: '回族', value: '回族' },
          { label: '藏族', value: '藏族' },
          { label: '维吾尔族', value: '维吾尔族' },
          { label: '苗族', value: '苗族' },
          { label: '彝族', value: '彝族' },
          { label: '壮族', value: '壮族' },
          { label: '布依族', value: '布依族' },
          { label: '朝鲜族', value: '朝鲜族' }
        ]
        // 设置默认户口类型选项
        this.householdTypeOptions = [
          { label: '农业户口', value: '农业户口' },
          { label: '非农业户口', value: '非农业户口' }
        ]
        // 设置默认住房类型选项
        this.housingTypeOptions = [
          { label: '自有住房', value: '自有住房' },
          { label: '租赁住房', value: '租赁住房' }
        ]
      }
    },

    // 身份证号自动填充性别和出生日期（居民）
    handleIdCardInput(value) {
      if (value && value.length === 18) {
        this.parseIdCard(value, 'resident')
      }
    },

    // 身份证号自动填充性别和出生日期（户主）
    handleHouseholdIdCardInput(value) {
      if (value && value.length === 18) {
        this.parseIdCard(value, 'household')
      }
    },

    // 解析身份证号
    parseIdCard(idCard, type) {
      // 出生日期解析：第7-14位是出生日期
      const birthDateStr = idCard.substring(6, 14)
      const birthDate = `${birthDateStr.substring(0, 4)}-${birthDateStr.substring(4, 6)}-${birthDateStr.substring(6, 8)}`

      // 性别解析：第17位，奇数为男，偶数为女
      const genderCode = parseInt(idCard.substring(16, 17))
      const gender = genderCode % 2 === 0 ? '女' : '男'

      // 根据类型填充数据
      if (type === 'resident') {
        this.residentForm.date_of_birth = birthDate
        this.residentForm.gender = gender
      } else if (type === 'household') {
        this.householdForm.date_of_birth = birthDate
        this.householdForm.gender = gender
      }
    },

    // 处理导入功能
    handleImport() {
      this.importDialogVisible = true
    },

    // 处理导入成功
    handleImportSuccess() {
      this.$message.success('导入成功')
      this.importDialogVisible = false
      // 可以选择跳转到居民列表页面
      // this.$router.push('/resident/list')
    }
  }
}
</script>

<style scoped>
.section-card {
  margin-bottom: 20px;
}

.section-header {
  font-weight: bold;
}

.action-buttons {
  margin-top: 20px;
  text-align: center;
}

.action-buttons .el-button {
  margin: 0 10px;
  width: 120px;
}
</style>
