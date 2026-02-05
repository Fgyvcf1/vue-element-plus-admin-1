<template>
  <el-dialog
    :title="isEdit ? '成员任职概览' : '新增成员'"
    :visible.sync="dialogVisible"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form ref="form" :model="form" :rules="rules" label-width="120px" size="small">
      <el-form-item label="机构类型" prop="organizationType">
        <el-input :value="orgTypeNameMap[orgType] || orgType" disabled style="width: 100%" />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="姓名" prop="name">
            <el-autocomplete
              v-model="form.name"
              :fetch-suggestions="queryResidents"
              placeholder="请输入姓名或搜索居民"
              :trigger-on-focus="false"
              clearable
              style="width: 100%"
              @select="handleResidentSelect"
            >
              <template slot-scope="{ item }">
                <div style="display: flex; justify-content: space-between;">
                  <span>{{ item.name }}</span>
                  <span style="color: #8492a6; font-size: 12px">{{ item.idCard }}</span>
                </div>
              </template>
            </el-autocomplete>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="性别" prop="gender">
            <el-input v-model="form.gender" disabled />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="联系电话" prop="phoneNumber">
            <el-input v-model="form.phoneNumber" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="身份证号" prop="idCard">
            <el-input v-model="form.idCard" disabled />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="届数" prop="termNumber">
            <el-input v-model="form.termNumber" placeholder="请输入届数（如：1、2）" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="职务" prop="position">
            <el-select v-model="form.position" placeholder="请选择职务" style="width: 100%" @focus="loadPositionOptions">
              <el-option
                v-for="item in positionOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="任期开始" prop="termStartDate">
            <el-date-picker
              v-model="form.termStartDate"
              type="date"
              placeholder="选择日期"
              value-format="yyyy-MM-dd"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="任期结束" prop="termEndDate">
            <el-date-picker
              v-model="form.termEndDate"
              type="date"
              placeholder="现任可不填"
              value-format="yyyy-MM-dd"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio label="current">现任</el-radio>
          <el-radio label="history">历届</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="备注">
        <el-input v-model="form.remarks" type="textarea" :rows="3" placeholder="请输入备注信息" />
      </el-form-item>
    </el-form>

    <!-- 历史任职统计区域（仅编辑模式显示） -->
    <div v-if="isEdit" class="history-section">
      <el-collapse v-model="historyCollapse">
        <el-collapse-item name="history" title="任职历史">
          <HistoryTimeline :resident-id="form.residentId" />
        </el-collapse-item>
      </el-collapse>
    </div>

    <div slot="footer">
      <!-- 新增模式：只显示取消和确定按钮 -->
      <template v-if="!isEdit">
        <el-button size="small" @click="handleClose">取消</el-button>
        <el-button type="primary" size="small" :loading="submitting" @click="handleSubmit">
          确定
        </el-button>
      </template>

      <!-- 编辑模式：显示取消、删除和确定按钮 -->
      <template v-else>
        <el-button size="small" @click="handleClose">取消</el-button>
        <el-button type="danger" size="small" icon="el-icon-delete" @click="handleDelete">
          删除
        </el-button>
        <el-button type="primary" size="small" :loading="submitting" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </div>
  </el-dialog>
</template>

<script>
import { addCommitteeMember, updateCommitteeMember } from '@/api/leadership'
import { getResidents } from '@/api/resident'
import dictionaryCache from '@/utils/dictionary-cache'
import HistoryTimeline from './HistoryTimeline'

export default {
  name: 'MemberForm',
  components: {
    HistoryTimeline
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    formData: {
      type: Object,
      default: () => ({})
    },
    orgType: {
      type: String,
      default: 'branch_committee'
    },
    termOptions: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      form: {},
      positionOptions: [],
      residentLoading: false,
      submitting: false,
      historyCollapse: [],
      orgTypeNameMap: {
        'branch_committee': '支部委员会',
        'village_committee': '村民委员会',
        'economic_council': '集体经济组织理事会',
        'economic_supervisor': '集体经济组织监事会',
        'supervisory_committee': '村务监督委员会',
        'group_leader': '村民小组长',
        'village_representative': '村民代表',
        'youth_women_org': '青年团妇组织'
      },
      rules: {
        name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
        termNumber: [{ required: true, message: '请输入届数', trigger: 'blur' }],
        position: [{ required: true, message: '请选择职务', trigger: 'change' }],
        termStartDate: [{ required: true, message: '请选择任期开始', trigger: 'change' }]
      }
    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    },
    isEdit() {
      return !!this.form.id
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.form = { ...this.formData }
        console.log('MemberForm: 对话框打开，form 数据:', this.form)
        console.log('MemberForm: residentId:', this.form.residentId, '类型:', typeof this.form.residentId)

        if (!this.isEdit) {
          this.form.termStartDate = new Date().toISOString().split('T')[0]
          this.form.status = 'current'
        }
      }
    },
    formData(val) {
      if (val && Object.keys(val).length > 0) {
        console.log('MemberForm: formData 变化:', val)
        this.form = { ...val }
      }
    }
  },
  methods: {
    async loadPositionOptions() {
      try {
        const dicts = await dictionaryCache.getDictionary('职务')
        this.positionOptions = dicts.map(item => ({
          label: item.value,
          value: item.value
        }))
      } catch (error) {
        console.error('加载职务字典失败:', error)
        this.$message.error('加载职务字典失败')
      }
    },
    async queryResidents(query, cb) {
      if (!query) {
        cb([])
        return
      }

      this.residentLoading = true
      try {
        const response = await getResidents({ name: query })
        const residents = response.data || []
        const results = residents.map(item => ({
          ...item,
          value: item.name
        }))
        cb(results)
      } finally {
        this.residentLoading = false
      }
    },
    async handleResidentSelect(selectedResident) {
      if (!selectedResident) return

      this.form.name = selectedResident.name
      this.form.gender = selectedResident.gender
      this.form.phoneNumber = selectedResident.phoneNumber
      this.form.idCard = selectedResident.idCard
      this.form.residentId = selectedResident.id
    },
    async handleSubmit() {
      try {
        await this.$refs.form.validate()
      } catch (error) {
        return
      }

      // 验证：历届必须填写结束日期
      if (this.form.status === 'history' && !this.form.termEndDate) {
        this.$message.warning('历届成员必须填写任期结束日期')
        return
      }

      // 验证：结束日期不能早于开始日期
      if (this.form.termEndDate && this.form.termStartDate > this.form.termEndDate) {
        this.$message.warning('任期结束日期不能早于开始日期')
        return
      }

      this.submitting = true
      try {
        const data = {
          residentId: this.form.residentId,
          organizationType: this.orgType,
          organizationName: this.orgTypeNameMap[this.orgType] || '',
          termNumber: this.form.termNumber,
          termStartDate: this.form.termStartDate,
          termEndDate: this.form.termEndDate || null,
          position: this.form.position,
          status: this.form.status,
          remarks: this.form.remarks
        }

        if (this.isEdit) {
          await updateCommitteeMember(this.form.id, data)
          this.$message.success('更新成功')
        } else {
          await addCommitteeMember(data)
          this.$message.success('新增成功')
        }

        this.$emit('submit')
        this.handleClose()
      } catch (error) {
        console.error('提交失败:', error)
        this.$message.error(error.message || '操作失败')
      } finally {
        this.submitting = false
      }
    },
    handleDelete() {
      // 触发父组件的删除方法
      this.$emit('delete-member', this.form.id)
    },
    handleClose() {
      this.$refs.form.resetFields()
      this.residentOptions = []
      this.dialogVisible = false
    }
  }
}
</script>

<style scoped>
.history-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.history-section /deep/ .el-collapse-item__header {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
  padding-left: 8px;
}

.history-section /deep/ .el-collapse-item__wrap {
  background-color: #fafafa;
  border: none;
}

.history-section /deep/ .el-collapse-item__content {
  padding: 16px 8px;
}
</style>

