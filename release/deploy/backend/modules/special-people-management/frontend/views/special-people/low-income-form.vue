<template>
  <div class="app-container">
    <el-card>
      <el-form
        ref="lowIncomeForm"
        :model="formData"
        label-width="100px"
        size="small"
        class="demo-form"
      >
        <!-- 居民基本信息（只读，自动填充） -->
        <el-card class="section-card" style="margin-bottom: 10px; padding: 5px">
          <div slot="header" class="section-header">
            <span>居民基本信息</span>
          </div>
          <el-row :gutter="10">
            <el-col :span="6">
              <el-form-item label="居民姓名">
                <el-autocomplete
                  v-model="formData.name"
                  placeholder="请输入居民姓名"
                  size="small"
                  :fetch-suggestions="fetchResidentSuggestions"
                  @select="handleResidentSelect"
                  @input="handleResidentNameInput"
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
          <div slot="header" class="section-header">
            <span>低收入人员信息</span>
          </div>
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
                  value-format="yyyy-MM-dd"
                  format="yyyy-MM-dd"
                  size="small"
                  clearable
                  editable
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
                  value-format="yyyy-MM-dd"
                  format="yyyy-MM-dd"
                  size="small"
                  clearable
                  editable
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="结束日期" prop="endDate">
                <el-date-picker
                  v-model="formData.endDate"
                  type="date"
                  placeholder="选择结束日期"
                  value-format="yyyy-MM-dd"
                  format="yyyy-MM-dd"
                  size="small"
                  clearable
                  editable
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
                  @input="handleAccountNameInput"
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

<script>
import { getResidents, getResident } from '@/api/resident'
import {
  addLowIncomePerson,
  updateLowIncomePerson,
  addPolicyRecord,
  updatePolicyRecord
} from '@/api/special-people'
import { getDictionaryByCategory } from '@/api/dictionary'

export default {
  name: 'LowIncomeForm',
  data() {
    return {
      loading: false,
      title: '新增低收入人员',
      // 字典选项
      policyTypeOptions: [], // 享受政策选项
      levelOptions: [], // 档次选项
      subsidyCycleOptions: ['每月', '每季度', '每半年', '每年'], // 补贴周期选项
      householdMembers: [], // 全户人员选项
      relationshipOptions: [], // 与户主关系选项
      // 表单数据
      formData: {
        id: null,
        residentId: null,
        name: '',
        idCard: '',
        gender: '',
        dateOfBirth: '',
        age: '',
        phoneNumber: '',
        policyType: '', // 政策类型
        enjoyLevel: '', // 享受档次
        approvalDate: '',
        status: 'active',
        hasSubsidy: 'false',
        startDate: '',
        endDate: '',
        subsidyAmount: '',
        subsidyCycle: '',
        selectedHouseholdMember: '', // 选择的全户人员（已废弃，改用 accountName）
        accountName: '',
        accountRelationship: '', // 从字典表中选择的与户主关系
        bankName: '',
        bankAccount: '',
        remark: ''
      },
      // 居民完整信息
      residentInfo: {
        relationship_to_head: '',
        bank_card: '',
        bank_name: '',
        household_id: ''
      }
    }
  },
  created() {
    // 加载字典数据
    this.loadDictionaries()

    // 从路由参数获取居民ID
    const residentId = this.$route.query.residentId
    if (residentId) {
      this.formData.residentId = residentId
      this.loadResidentInfo(residentId)
    }

    // 从路由参数获取编辑ID
    const editId = this.$route.params.id
    if (editId) {
      this.title = '编辑低收入人员'
      // 这里应该调用API获取编辑数据
      // this.loadEditData(editId)
    }
  },
  methods: {
    // 加载字典数据
    async loadDictionaries() {
      try {
        // 加载享受政策选项
        const policyTypeRes = await getDictionaryByCategory('享受政策')
        this.policyTypeOptions = policyTypeRes.data || []

        // 加载档次选项
        const levelRes = await getDictionaryByCategory('档次')
        this.levelOptions = levelRes.data || []

        // 加载与户主关系选项
        const relationshipRes = await getDictionaryByCategory('relationship_to_head')
        this.relationshipOptions = relationshipRes.data || []
      } catch (error) {
        console.error('加载字典数据失败:', error)
        this.$message.error('加载字典数据失败')
      }
    },

    // 根据居民ID或姓名加载居民信息
    async loadResidentInfo(identifier, isName = false) {
      try {
        this.loading = true
        let resident = null

        if (isName) {
          // 根据姓名查询
          const response = await getResidents({ pageNum: 1, pageSize: 10, name: identifier })
          if (response && Array.isArray(response.data) && response.data.length > 0) {
            resident = response.data[0]
          }
        } else {
          // 根据ID查询，使用单个居民API
          const response = await getResident(identifier)
          if (response && response.code === 20000) {
            resident = response.data
          }
        }

        if (resident) {
          // 保存居民完整信息
          this.residentInfo = {
            relationship_to_head: resident.relationshipToHead || '',
            bank_card: resident.bankCard || '',
            bank_name: resident.bankName || '',
            household_id: resident.householdId || ''
          }
          // 自动填充居民基本信息
          this.formData = {
            ...this.formData,
            residentId: resident.id,
            name: resident.name,
            idCard: resident.idCard,
            gender: resident.gender,
            dateOfBirth: resident.dateOfBirth,
            age: resident.age,
            phoneNumber: resident.phoneNumber,
            // 自动填充银行信息（居民本人的）
            bankName: resident.bankName || '',
            bankAccount: resident.bankCard || '',
            // 设置默认账户名称为居民本人
            accountName: resident.name,
            // 设置账户关系为居民与户主的关系
            accountRelationship: resident.relationshipToHead || ''
          }
          // 加载全户人员信息
          this.loadHouseholdMembers(resident.householdId)
        }
      } catch (error) {
        console.error('获取居民信息失败:', error)
        this.$message.error('获取居民信息失败')
      } finally {
        this.loading = false
      }
    },

    // 获取居民姓名建议
    async fetchResidentSuggestions(queryString, cb) {
      if (!queryString) {
        cb([])
        return
      }

      try {
        const response = await getResidents({ pageNum: 1, pageSize: 10, name: queryString })
        const suggestions = response.data.map((item) => ({
          value: item.name,
          id: item.id,
          household_id: item.household_id
        }))
        cb(suggestions)
      } catch (error) {
        console.error('获取居民建议失败:', error)
        cb([])
      }
    },

    // 处理居民姓名输入变化
    async handleResidentNameInput(name) {
      // 当居民姓名变化时，这里可以添加相应的处理逻辑
      // 注意：这里需要谨慎处理，避免频繁请求
    },

    // 处理居民选择
    handleResidentSelect(item) {
      // 当选择居民时，加载该居民的完整信息和全户人员
      this.loadResidentInfo(item.id)
    },

    // 加载全户人员信息
    async loadHouseholdMembers(householdId) {
      try {
        if (!householdId) return
        // 这里应该调用获取全户人员的API，暂时使用列表API模拟
        const response = await getResidents({
          pageNum: 1,
          pageSize: 100,
          household_id: householdId
        })
        if (response && Array.isArray(response.data)) {
          this.householdMembers = response.data.map((member) => ({
            id: member.id,
            name: member.name,
            relationship: member.relationship_to_head || ''
          }))
        }
      } catch (error) {
        console.error('获取全户人员信息失败:', error)
        this.$message.error('获取全户人员信息失败')
      }
    },

    // 处理账户名称输入
    async handleAccountNameInput(accountName) {
      // 当用户输入账户名称时，只显示建议，不自动填充
      // 自动填充功能由handleResidentSelect方法处理
    },

    // 计算账户名称
    calculateAccountName() {
      const relationship = this.residentInfo.relationship_to_head
      if (!relationship) return

      // 默认为居民本人姓名
      this.formData.accountName = this.formData.name
      this.formData.accountRelationship = relationship
      console.log(
        '计算出的账户名称和关系:',
        this.formData.accountName,
        this.formData.accountRelationship
      )
    },

    // 政策类型变化处理
    handlePolicyTypeChange() {
      // 如果政策类型为最低生活保证金，显示档次选项，否则直接使用政策类型作为享受档次
      if (this.formData.policyType === '最低生活保证金') {
        this.formData.enjoyLevel = ''
      } else {
        this.formData.enjoyLevel = this.formData.policyType
      }
    },

    // 加载编辑数据
    loadEditData(id) {
      // 这里应该调用API获取编辑数据
      this.loading = true
      setTimeout(() => {
        // 模拟数据
        this.formData = {
          id: id,
          residentId: 1,
          name: '张三',
          idCard: '110101199001011234',
          gender: '男',
          dateOfBirth: '1990-01-01',
          age: 35,
          phoneNumber: '13800138000',
          lowIncomeType: 'low_guarantee',
          applyDate: '2023-01-01',
          approvalDate: '2023-01-10',
          status: 'active'
        }
        this.loading = false
      }, 500)
    },

    // 表单验证
    validateForm() {
      return new Promise((resolve) => {
        this.$refs.lowIncomeForm.validate((valid) => {
          resolve(valid)
        })
      })
    },

    // 保存数据
    async handleSave() {
      const isValid = await this.validateForm()
      if (!isValid) {
        return
      }

      this.loading = true
      try {
        // 准备保存数据
        const saveData = {
          resident_id: this.formData.residentId,
          low_income_type: this.formData.policyType || '最低生活保证金',
          approval_date: this.formData.approvalDate,
          status: this.formData.status,
          // 政策记录相关字段
          policy_type: this.formData.policyType,
          has_subsidy: this.formData.hasSubsidy === 'true',
          start_date: this.formData.startDate,
          end_date: this.formData.endDate,
          subsidy_amount: this.formData.subsidyAmount,
          subsidy_cycle: this.formData.subsidyCycle,
          enjoy_level: this.formData.enjoyLevel,
          account_name: this.formData.accountName,
          account_relationship: this.formData.accountRelationship,
          bank_name: this.formData.bankName,
          bank_account: this.formData.bankAccount,
          remark: this.formData.remark
        }

        let lowIncomePersonId
        if (this.formData.id) {
          // 更新操作
          await updateLowIncomePerson(this.formData.id, saveData)
          lowIncomePersonId = this.formData.id
          this.$message.success('更新低收入人员信息成功')
        } else {
          // 新增操作
          const result = await addLowIncomePerson(saveData)
          lowIncomePersonId = result.data.id
          this.$message.success('新增低收入人员成功')
        }

        // 准备政策记录数据
        const policyRecordData = {
          low_income_person_id: lowIncomePersonId,
          policy_type: this.formData.policyType || '最低生活保证金',
          start_date: this.formData.startDate,
          end_date: this.formData.endDate,
          subsidy_amount: this.formData.subsidyAmount,
          subsidy_cycle: this.formData.subsidyCycle,
          enjoy_level: this.formData.enjoyLevel,
          account_name: this.formData.accountName,
          bank_name: this.formData.bankName,
          bank_account: this.formData.bankAccount,
          account_relationship: this.formData.accountRelationship,
          status: this.formData.status,
          remark: this.formData.remark
        }

        // 保存政策记录
        await addPolicyRecord(policyRecordData)
        this.$message.success('保存政策记录成功')

        this.loading = false
        this.$router.push('/special-people/low-income-list')
      } catch (error) {
        console.error('保存低收入人员信息失败:', error)
        this.$message.error('保存低收入人员信息失败')
        this.loading = false
      }
    },

    // 取消操作
    handleCancel() {
      this.$router.push('/special-people/low-income-list')
    }
  }
}
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
