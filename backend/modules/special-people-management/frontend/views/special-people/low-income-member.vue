<template>
  <div class="app-container">
    <el-card>
      <el-form ref="lowIncomeForm" :model="formData" label-width="100px" size="small" class="demo-form">
        <!-- 居民基本信息（只读，自动填充） -->
        <el-card class="section-card" style="margin-bottom: 10px; padding: 5px">
          <div slot="header" class="section-header">
            <span>居民基本信息</span>
          </div>
          <el-row :gutter="10">
            <el-col :span="6">
              <el-form-item label="居民姓名">
                <el-input v-model="formData.name" disabled />
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
                <el-select
                  v-model="formData.status"
                  placeholder="请选择状态"
                  size="small"
                >
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
                <el-input v-model="formData.subsidyAmount" placeholder="请输入补贴金额" size="small" type="number" />
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
                <el-input v-model="formData.accountRelationship" placeholder="自动填充" size="small" readonly />
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
                <el-input v-model="formData.remark" placeholder="请输入备注" size="small" type="textarea" :rows="2" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <!-- 动态记录 -->
        <el-card class="section-card" style="margin-bottom: 10px; padding: 5px">
          <div slot="header" class="section-header">
            <span>成员动态记录</span>
          </div>
          <el-table :data="dynamicRecords" size="small" style="width: 100%" border>
            <el-table-column prop="recordDate" label="记录日期" width="120" align="center" />
            <el-table-column prop="recordType" label="记录类型" width="120" align="center" />
            <el-table-column prop="content" label="记录内容" min-width="300" />
            <el-table-column prop="operator" label="操作人" width="100" align="center" />
            <el-table-column prop="createTime" label="创建时间" width="180" align="center" />
          </el-table>
          <div style="margin-top: 10px; text-align: right">
            <el-button type="primary" size="small" icon="el-icon-plus" @click="handleAddRecord">添加记录</el-button>
          </div>
        </el-card>

        <div class="form-actions">
          <el-button type="primary" size="small" :loading="loading" @click="handleSave">保存</el-button>
          <el-button size="small" @click="handleCancel">取消</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { getResident } from '@/api/resident'
import { getLowIncomePerson, updateLowIncomePerson } from '@/api/special-people'
import { getDictionaryByCategory } from '@/api/dictionary'

export default {
  name: 'LowIncomeMember',
  data() {
    return {
      loading: false,
      title: '成员信息',
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
      },
      // 动态记录
      dynamicRecords: [
        {
          id: 1,
          recordDate: '2023-01-01',
          recordType: '新增',
          content: '新增低保人员',
          operator: '管理员',
          createTime: '2023-01-01 10:00:00'
        },
        {
          id: 2,
          recordDate: '2023-07-01',
          recordType: '调整',
          content: '调整补贴金额至500元',
          operator: '管理员',
          createTime: '2023-07-01 14:30:00'
        }
      ]
    }
  },
  created() {
    // 加载字典数据
    this.loadDictionaries()

    // 从路由参数获取低收入人员ID
    const memberId = this.$route.params.id
    if (memberId) {
      this.loadMemberData(memberId)
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

    // 加载成员数据
    async loadMemberData(id) {
      try {
        this.loading = true
        // 获取低收入人员数据
        const lowIncomeRes = await getLowIncomePerson(id)
        const lowIncomeData = lowIncomeRes.data

        // 获取居民数据
        const residentRes = await getResident(lowIncomeData.resident_id)
        const residentData = residentRes.data

        // 填充表单数据
        this.formData = {
          id: lowIncomeData.id,
          residentId: lowIncomeData.resident_id,
          name: residentData.name,
          idCard: residentData.idCard,
          gender: residentData.gender,
          dateOfBirth: residentData.dateOfBirth,
          age: residentData.age,
          phoneNumber: residentData.phoneNumber,
          policyType: lowIncomeData.enjoyPolicyType || '',
          enjoyLevel: lowIncomeData.enjoy_level || '',
          approvalDate: lowIncomeData.approval_date,
          status: lowIncomeData.status,
          hasSubsidy: lowIncomeData.has_subsidy ? 'true' : 'false',
          startDate: lowIncomeData.start_date,
          endDate: lowIncomeData.end_date,
          subsidyAmount: lowIncomeData.subsidy_amount,
          subsidyCycle: lowIncomeData.subsidy_cycle,
          accountName: residentData.name,
          bankName: lowIncomeData.bank_name || '',
          bankAccount: lowIncomeData.bank_account || '',
          remark: lowIncomeData.remark || ''
        }

        // 保存居民完整信息
        this.residentInfo = {
          relationship_to_head: residentData.relationship_to_head || '',
          bank_card: residentData.bank_card || '',
          bank_name: residentData.bank_name || '',
          household_id: residentData.household_id || ''
        }

        // 计算账户关系
        this.calculateAccountName()

        this.loading = false
      } catch (error) {
        console.error('获取成员数据失败:', error)
        this.$message.error('获取成员数据失败')
        this.loading = false
      }
    },

    // 处理账户名称输入
    async handleAccountNameInput(accountName) {
      // 当用户输入账户名称时，检查该名称是否在居民表中存在
      if (accountName.trim()) {
        try {
          // 查询居民表中是否存在该名称的居民
          const response = await getResident({ pageNum: 1, pageSize: 5, name: accountName.trim() })
          if (response && Array.isArray(response.data) && response.data.length > 0) {
            // 找到匹配的居民，使用第一个匹配结果
            const matchedResident = response.data[0]

            // 自动填充银行信息
            this.formData.bankName = matchedResident.bankName || matchedResident.bank_name || ''
            this.formData.bankAccount = matchedResident.bankCard || matchedResident.bank_card || ''

            // 自动填充账户关系
            this.formData.accountRelationship = matchedResident.relationshipToHead || matchedResident.relationship_to_head || ''
          }
        } catch (error) {
          console.error('查询居民信息失败:', error)
          // 发生错误时不影响用户输入，保持原有值
        }
      }
    },

    // 计算账户名称
    calculateAccountName() {
      const relationship = this.residentInfo.relationshipToHead || this.residentInfo.relationship_to_head
      if (!relationship) return

      let accountName = ''
      switch (relationship) {
        case '本人':
          accountName = '本人'
          break
        case '配偶':
          accountName = '配偶'
          break
        case '子':
          accountName = '父子'
          break
        case '女':
          accountName = '父女'
          break
        case '孙子':
        case '孙女':
          accountName = '祖孙'
          break
        default:
          accountName = relationship
      }
      this.formData.accountName = accountName
      this.formData.accountRelationship = relationship
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

        // 更新操作
        await updateLowIncomePerson(this.formData.id, saveData)
        this.$message.success('更新成员信息成功')

        this.loading = false
      } catch (error) {
        console.error('保存成员信息失败:', error)
        this.loading = false
        this.$message.error('保存成员信息失败')
      }
    },

    // 取消操作
    handleCancel() {
      this.$router.push('/special-people/low-income-list')
    },

    // 添加动态记录
    handleAddRecord() {
      this.$message.info('添加记录功能待实现')
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
