<template>
  <div class="app-container">
    <el-card>
      <div slot="header" class="clearfix">
        <span>政策享受记录管理</span>
        <el-button type="primary" size="small" icon="el-icon-plus" @click="handleAddRecord">新增政策记录</el-button>
      </div>

      <!-- 低收入人员基本信息 -->
      <el-card shadow="hover" class="info-card">
        <div slot="header" class="clearfix">
          <span>人员基本信息</span>
        </div>
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
              <el-tag :type="personInfo.status === 'active' ? 'success' : personInfo.status === 'suspended' ? 'warning' : 'danger'">
                {{ personInfo.status === 'active' ? '在享' : personInfo.status === 'suspended' ? '暂停' : '取消' }}
              </el-tag>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 政策享受记录时间轴 -->
      <el-card shadow="hover" class="info-card">
        <div slot="header" class="clearfix">
          <span>政策享受历史</span>
        </div>
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
                  <el-button size="mini" type="primary" icon="el-icon-edit" @click="handleEditRecord(record)">
                    编辑
                  </el-button>
                  <el-button size="mini" type="danger" icon="el-icon-delete" @click="handleDeleteRecord(record)">
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
                      <span class="value">{{ record.subsidyAmount ? record.subsidyAmount + '元/' + formatCycle(record.subsidyCycle) : '无补助' }}</span>
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
                      <el-tag :type="record.status === 'active' ? 'success' : 'warning'" size="small">
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
          <div style="text-align: center; color: #909399; padding: 20px;">
            <i class="el-icon-info" style="font-size: 24px; margin-bottom: 10px; display: block;" />
            <span>暂无政策享受记录</span>
          </div>
        </div>
      </el-card>

      <!-- 政策记录表单对话框 -->
      <el-dialog
        :title="formTitle"
        :visible.sync="dialogVisible"
        width="60%"
        size="small"
      >
        <el-form ref="recordForm" :model="formData" label-width="120px" size="small">
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item label="政策类型" prop="policyType">
                <el-input
                  v-model="formData.policyType"
                  placeholder="请输入政策类型"
                  size="small"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="开始日期" prop="startDate">
                <el-date-picker
                  v-model="formData.startDate"
                  type="date"
                  placeholder="选择开始日期"
                  value-format="yyyy-MM-dd"
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
                  value-format="yyyy-MM-dd"
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
                  rows="3"
                  size="small"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button size="small" @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" size="small" :loading="loading" @click="handleSaveRecord">保存</el-button>
        </div>
      </el-dialog>
    </el-card>
  </div>
</template>

<script>
import { getPolicyRecords, addPolicyRecord, updatePolicyRecord } from '@/api/special-people'
import { getLowIncomePerson } from '@/api/special-people'

export default {
  name: 'PolicyRecord',
  data() {
    return {
      loading: false,
      dialogVisible: false,
      formTitle: '新增政策记录',
      lowIncomePersonId: null,
      personInfo: {
        name: '',
        idCard: '',
        lowIncomeType: '',
        status: 'active'
      },
      policyRecords: [],
      formData: {
        id: null,
        lowIncomePersonId: null,
        policyType: '',
        startDate: '',
        endDate: '',
        subsidyAmount: null,
        subsidyCycle: 'monthly',
        subsidyAccount: '',
        accountHolderRelationship: '',
        status: 'active',
        remark: ''
      }
    }
  },
  created() {
    // 从路由参数获取低收入人员ID
    this.lowIncomePersonId = this.$route.params.id
    if (this.lowIncomePersonId) {
      this.loadPersonInfo()
      this.loadPolicyRecords()
    }
  },
  methods: {
    // 加载人员信息
    async loadPersonInfo() {
      try {
        this.loading = true
        const response = await getLowIncomePerson(this.lowIncomePersonId)
        if (response && response.data) {
          const data = response.data
          this.personInfo = {
            name: data.name || '',
            idCard: data.idCard || '',
            lowIncomeType: data.low_income_type || '',
            status: data.status || 'active'
          }
        }
      } catch (error) {
        console.error('获取人员信息失败:', error)
        this.$message.error('获取人员信息失败')
      } finally {
        this.loading = false
      }
    },

    // 加载政策记录
    async loadPolicyRecords() {
      try {
        this.loading = true
        const response = await getPolicyRecords({ low_income_person_id: this.lowIncomePersonId })
        if (response && response.data) {
          // 将API返回的数据转换为组件需要的格式
          this.policyRecords = response.data.map(item => ({
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
        this.$message.error('获取政策记录失败')
      } finally {
        this.loading = false
      }
    },

    // 格式化日期
    formatDate(date) {
      if (!date) return ''
      return date
    },

    // 格式化补助周期
    formatCycle(cycle) {
      const cycleMap = {
        monthly: '月',
        quarterly: '季度',
        yearly: '年'
      }
      return cycleMap[cycle] || cycle
    },

    // 新增政策记录
    handleAddRecord() {
      this.formTitle = '新增政策记录'
      this.formData = {
        id: null,
        lowIncomePersonId: this.lowIncomePersonId,
        policyType: '',
        startDate: '',
        endDate: '',
        subsidyAmount: null,
        subsidyCycle: 'monthly',
        subsidyAccount: '',
        accountHolderRelationship: '',
        status: 'active',
        remark: ''
      }
      this.dialogVisible = true
    },

    // 编辑政策记录
    handleEditRecord(record) {
      this.formTitle = '编辑政策记录'
      this.formData = {
        ...record
      }
      this.dialogVisible = true
    },

    // 删除政策记录
    handleDeleteRecord(record) {
      this.$confirm(`确定要删除政策记录【${record.policyType}】吗？`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 这里应该调用实际的API删除记录
        // 模拟删除
        this.policyRecords = this.policyRecords.filter(item => item.id !== record.id)
        this.$message.success('删除成功')
      }).catch(() => {
        // 取消删除
      })
    },

    // 表单验证
    validateForm() {
      return new Promise((resolve) => {
        this.$refs.recordForm.validate((valid) => {
          resolve(valid)
        })
      })
    },

    // 保存政策记录
    async handleSaveRecord() {
      const isValid = await this.validateForm()
      if (!isValid) {
        return
      }

      this.loading = true
      try {
        // 准备保存数据，转换为API需要的格式
        const saveData = {
          low_income_person_id: this.lowIncomePersonId,
          policy_type: this.formData.policyType,
          has_subsidy: !!this.formData.subsidyAmount,
          start_date: this.formData.startDate,
          end_date: this.formData.endDate,
          subsidy_amount: this.formData.subsidyAmount,
          subsidy_cycle: this.formData.subsidyCycle,
          account_name: this.personInfo.name, // 默认使用本人姓名
          account_relationship: this.formData.accountHolderRelationship,
          bank_name: '默认银行', // 可以根据实际需求调整
          bank_account: this.formData.subsidyAccount,
          status: this.formData.status,
          remark: this.formData.remark
        }

        if (this.formData.id) {
          // 更新现有记录
          await updatePolicyRecord(this.formData.id, saveData)
          this.$message.success('更新政策记录成功')
        } else {
          // 添加新记录
          await addPolicyRecord(saveData)
          this.$message.success('新增政策记录成功')
        }

        // 刷新政策记录列表
        this.loadPolicyRecords()
        this.dialogVisible = false
        this.loading = false
      } catch (error) {
        console.error('保存政策记录失败:', error)
        this.$message.error('保存政策记录失败')
        this.loading = false
      }
    }
  }
}
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
</style>
