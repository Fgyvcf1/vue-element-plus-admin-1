<template>
  <el-dialog
    :visible.sync="dialogVisible"
    width="80%"
    :close-on-click-modal="true"
    top="5%"
    class="resident-detail-dialog"
  >
    <div slot="title" class="dialog-header">
      <span class="dialog-title">{{ title }}</span>
      <div class="dialog-header-buttons">
        <el-button
          v-if="!isAddingNew && !isEditable"
          type="primary"
          size="small"
          :loading="loading"
          @click="handleEdit"
          >修改</el-button
        >
        <el-button
          v-if="!isAddingNew"
          type="primary"
          size="small"
          :loading="loading"
          @click="handleSameHouseholdAdd"
          >同户新增</el-button
        >
        <el-button type="success" size="small" :loading="loading" @click="handleSave"
          >保存</el-button
        >
        <el-button v-if="isEditable" type="info" size="small" @click="cancelEdit">取消</el-button>
      </div>
    </div>

    <!-- 户主信息区 -->
    <el-card shadow="hover" class="info-card compact-card">
      <div slot="header" class="clearfix">
        <span>户主信息</span>
      </div>
      <el-form :model="householdForm" label-width="100px" size="small" class="compact-form">
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="户主姓名">
              <el-input
                v-model="householdForm.householdHeadName"
                :disabled="!isEditable && !isAddingNew"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="性别">
              <el-select
                v-model="householdForm.gender"
                placeholder="请选择性别"
                :disabled="!isEditable && !isAddingNew"
              >
                <el-option label="男" value="男" />
                <el-option label="女" value="女" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="电话号码">
              <el-input
                v-model="householdForm.phoneNumber"
                :disabled="!isEditable && !isAddingNew"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="民族">
              <el-select
                v-model="householdForm.ethnicity"
                placeholder="请选择民族"
                :disabled="!isEditable && !isAddingNew"
              >
                <el-option
                  v-for="option in ethnicityOptions"
                  :key="option.id"
                  :label="option.value"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="身份证号码">
              <el-input
                v-model="householdForm.householdHeadIdCard"
                :disabled="!isEditable && !isAddingNew"
                @change="handleHouseholdIdCardChange"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="户口类型">
              <el-select
                v-model="householdForm.householdType"
                placeholder="请选择户口类型"
                :disabled="!isEditable && !isAddingNew"
              >
                <el-option
                  v-for="option in householdTypeOptions"
                  :key="option.id"
                  :label="option.value"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="住房类型">
              <el-select
                v-model="householdForm.housingType"
                placeholder="请选择住房类型"
                :disabled="!isEditable && !isAddingNew"
              >
                <el-option
                  v-for="option in housingTypeOptions"
                  :key="option.id"
                  :label="option.value"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="村组">
              <el-select
                v-model="householdForm.villageGroup"
                placeholder="请选择村组"
                :disabled="!isEditable && !isAddingNew"
              >
                <el-option
                  v-for="option in villageGroupOptions"
                  :key="option.id"
                  :label="option.value"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item label="家庭地址">
              <el-input v-model="householdForm.address" :disabled="!isEditable && !isAddingNew" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 成员信息区 -->
    <el-card shadow="hover" class="info-card compact-card">
      <div slot="header" class="clearfix">
        <span>成员信息</span>
      </div>
      <el-form :model="residentForm" label-width="100px" size="small" class="compact-form">
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="居民姓名">
              <el-input v-model="residentForm.name" :disabled="!isEditable && !isAddingNew" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="身份证号">
              <el-input
                v-model="residentForm.idCard"
                :disabled="!isEditable && !isAddingNew"
                @change="handleIdCardChange"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="性别">
              <el-select
                v-model="residentForm.gender"
                placeholder="请选择性别"
                :disabled="!isEditable && !isAddingNew"
                @change="handleGenderChange"
              >
                <el-option label="男" value="男" />
                <el-option label="女" value="女" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="与户主关系">
              <el-select
                v-model="residentForm.relationshipToHead"
                placeholder="请选择与户主关系"
                :disabled="!isEditable && !isAddingNew"
              >
                <el-option
                  v-for="option in relationshipOptions"
                  :key="option.id"
                  :label="option.value"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="民族">
              <el-select
                v-model="residentForm.ethnicity"
                placeholder="请选择民族"
                :disabled="!isEditable && !isAddingNew"
              >
                <el-option
                  v-for="option in ethnicityOptions"
                  :key="option.id"
                  :label="option.value"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="出生日期">
              <el-date-picker
                v-model="residentForm.dateOfBirth"
                type="date"
                placeholder="选择日期"
                value-format="yyyy-MM-dd"
                size="small"
                :disabled="!isEditable && !isAddingNew"
                @change="handleDateOfBirthChange"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="年龄">
              <el-input v-model="age" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="婚姻状况">
              <el-select
                v-model="residentForm.maritalStatus"
                placeholder="请选择婚姻状况"
                :disabled="!isEditable && !isAddingNew"
              >
                <el-option
                  v-for="option in maritalStatusOptions"
                  :key="option.id"
                  :label="option.value"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="兵役状况">
              <el-select
                v-model="residentForm.militaryService"
                placeholder="请选择兵役状况"
                :disabled="!isEditable && !isAddingNew"
              >
                <el-option
                  v-for="option in militaryServiceOptions"
                  :key="option.id"
                  :label="option.value"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="政治面貌">
              <el-select
                v-model="residentForm.politicalStatus"
                placeholder="请选择政治面貌"
                :disabled="!isEditable && !isAddingNew"
              >
                <el-option
                  v-for="option in politicalStatusOptions"
                  :key="option.id"
                  :label="option.value"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="文化程度">
              <el-select
                v-model="residentForm.educationLevel"
                placeholder="请选择文化程度"
                :disabled="!isEditable && !isAddingNew"
              >
                <el-option
                  v-for="option in educationLevelOptions"
                  :key="option.id"
                  :label="option.value"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="村组">
              <el-select
                v-model="residentForm.villageGroup"
                placeholder="请选择村组"
                :disabled="!isEditable && !isAddingNew"
              >
                <el-option
                  v-for="option in villageGroupOptions"
                  :key="option.id"
                  :label="option.value"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item label="家庭地址">
              <el-input v-model="residentForm.address" :disabled="!isEditable && !isAddingNew" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="联系电话">
              <el-input
                v-model="residentForm.phoneNumber"
                :disabled="!isEditable && !isAddingNew"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="银行帐号">
              <el-input v-model="residentForm.bankCard" :disabled="!isEditable && !isAddingNew" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="开户行">
              <el-input v-model="residentForm.bankName" :disabled="!isEditable && !isAddingNew" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <div style="display: flex; flex-direction: row; gap: 20px; align-items: center">
              <div style="flex: 1">
                <el-form-item label="股权">
                  <el-input
                    v-model="residentForm.equityShares"
                    :disabled="!isEditable && !isAddingNew"
                  />
                </el-form-item>
              </div>
              <div style="flex: 1">
                <el-form-item label="当前状态">
                  <el-tag :type="statusType" size="small">
                    {{ statusText }}
                  </el-tag>
                </el-form-item>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 成员列表区 -->
    <el-card shadow="hover" class="info-card compact-card">
      <div slot="header" class="clearfix">
        <span>家庭成员列表（{{ filteredHouseholdMembers.length }}人）</span>
        <el-button type="text" size="mini" class="header-button" @click="toggleShowInactive">
          {{ showInactiveMembers ? '仅显示正常成员' : '显示所有成员' }}
        </el-button>
      </div>
      <el-table
        :data="filteredHouseholdMembers"
        size="mini"
        style="width: 100%"
        class="compact-table"
        @row-click="handleMemberRowClick"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="姓名" width="80" />
        <el-table-column prop="gender" label="性别" width="60" />
        <el-table-column prop="relationshipToHead" label="与户主关系" width="100" />
        <el-table-column prop="age" label="年龄" width="60">
          <template slot-scope="scope">
            <span class="age-text">{{ scope.row.age }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="idCard" label="身份证号码" width="180" />
        <el-table-column prop="phoneNumber" label="联系电话" width="120" />
        <el-table-column prop="maritalStatus" label="婚姻状况" width="80" />
        <el-table-column prop="bankCard" label="银行帐号" width="150" />
      </el-table>
    </el-card>

    <!-- 迁途改销功能区 -->
    <el-card shadow="hover" class="info-card compact-card">
      <div slot="header" class="clearfix">
        <span>迁途改销</span>
        <el-button type="text" size="mini" class="header-button" @click="toggleMigration">
          <i
            :class="['el-icon', isMigrationExpanded ? 'el-icon-arrow-up' : 'el-icon-arrow-down']"
          />
        </el-button>
      </div>
      <div v-if="isMigrationExpanded" class="migration-form">
        <el-form :model="migrationForm" label-width="80px" size="small" class="compact-form">
          <!-- 第一行：迁入和迁出 -->
          <el-row :gutter="12">
            <el-col :span="6">
              <el-form-item label="迁入日期">
                <el-date-picker
                  v-model="migrationForm.migrationInDate"
                  type="date"
                  placeholder="选择迁入日期"
                  value-format="yyyyMMdd"
                  format="yyyyMMdd"
                  size="small"
                  :disabled="!isMigrationEditable"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="迁入原因">
                <el-input
                  v-model="migrationForm.migrationInReason"
                  placeholder="请输入迁入原因"
                  size="small"
                  :disabled="!isMigrationEditable"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="迁出日期">
                <el-date-picker
                  v-model="migrationForm.migrationOutDate"
                  type="date"
                  placeholder="选择迁出日期"
                  value-format="yyyyMMdd"
                  format="yyyyMMdd"
                  size="small"
                  :disabled="!isMigrationEditable"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="迁出原因">
                <el-input
                  v-model="migrationForm.migrationOutReason"
                  placeholder="请输入迁出原因"
                  size="small"
                  :disabled="!isMigrationEditable"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 第二行：死亡和恢复 -->
          <el-row :gutter="12">
            <el-col :span="6">
              <el-form-item label="死亡时间">
                <el-date-picker
                  v-model="migrationForm.deathDate"
                  type="date"
                  placeholder="选择死亡日期"
                  value-format="yyyyMMdd"
                  format="yyyyMMdd"
                  size="small"
                  :disabled="!isMigrationEditable"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="死亡原因">
                <el-input
                  v-model="migrationForm.deathReason"
                  placeholder="请输入死亡原因"
                  size="small"
                  :disabled="!isMigrationEditable"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="恢复原因">
                <el-input
                  v-model="migrationForm.recoveryReason"
                  placeholder="请输入恢复状态原因"
                  size="small"
                  :disabled="!isMigrationEditable"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <!-- 操作按钮区域 -->
        <div class="migration-buttons" style="margin-top: 15px; text-align: right">
          <el-button
            v-if="!isMigrationEditable"
            type="primary"
            size="small"
            @click="toggleMigrationEdit"
          >
            修改
          </el-button>
          <div v-else>
            <el-button
              type="text"
              size="small"
              @click="cancelMigrationEdit"
              style="margin-right: 10px"
            >
              取消
            </el-button>
            <el-button type="primary" size="small" @click="handleMigrationSave"> 保存 </el-button>
          </div>
        </div>
      </div>
    </el-card>
  </el-dialog>
</template>

<script>
import request from '@/utils/request'
import dictionaryCache from '@/utils/dictionary-cache'
import { getDisabledPersons, deleteDisabledPerson } from '@/api/special-people'

export default {
  name: 'ResidentDetailDialog',
  props: {
    value: {
      type: Boolean,
      default: false
    },
    residentData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      dialogVisible: this.value,
      title: '居民详细信息',
      // 控制表单是否可编辑
      isEditable: false,
      // 统一使用驼峰命名，避免下划线
      householdForm: {
        householdNumber: '',
        villageGroup: '',
        householdHeadId: null,
        householdHeadName: '',
        ethnicity: '汉族',
        householdType: '农业户口',
        housingType: '自有住房',
        address: '',
        phoneNumber: '',
        registeredDate: '',
        status: 'active',
        householdHeadIdCard: '',
        gender: ''
      },
      residentForm: {
        name: '',
        idCard: '',
        gender: '',
        dateOfBirth: '',
        villageGroup: '',
        address: '',
        bankCard: '',
        phoneNumber: '',
        bankName: '',
        householdId: null,
        householdHeadId: null,
        ethnicity: '汉族',
        relationshipToHead: '其他',
        maritalStatus: '未婚',
        politicalStatus: '群众',
        militaryService: '未服兵役',
        educationLevel: '小学',
        status: 'active',
        registeredPermanentResidence: 1,
        registeredDate: '',
        statusUpdatedAt: '',
        statusChangeReason: '',
        deathDate: ''
      },
      migrationForm: {
        migrationInDate: '',
        migrationInReason: '',
        migrationOutDate: '',
        migrationOutReason: '',
        deathDate: '',
        deathReason: '',
        recoveryReason: ''
      },
      // 迁途改销编辑状态
      isMigrationEditable: false,
      // 迁途改销备份数据，用于取消编辑时恢复
      originalMigrationForm: {},
      householdMembers: [],
      filteredHouseholdMembers: [],
      showInactiveMembers: false,
      currentResidentId: null,
      currentHouseholdId: null,
      isAddingNew: false,
      loading: false,
      relationshipOptions: [],
      // 字典选项
      ethnicityOptions: [],
      householdTypeOptions: [],
      housingTypeOptions: [],
      maritalStatusOptions: [],
      politicalStatusOptions: [],
      militaryServiceOptions: [],
      educationLevelOptions: [],
      villageGroupOptions: [],
      // 控制迁途改销展开/收起
      isMigrationExpanded: false,
      // 身份证号自动填充标记
      isIdCardAutoFill: true,
      isGenderAutoFill: true,
      isDateOfBirthAutoFill: true
    }
  },
  computed: {
    statusText() {
      const status = this.residentForm.status || 'active'
      return this.getMemberStatusText(status)
    },
    statusType() {
      const status = this.residentForm.status || 'active'
      return this.getMemberStatusType(status)
    },
    age() {
      if (!this.residentForm.dateOfBirth) {
        return ''
      }
      const birthDate = new Date(this.residentForm.dateOfBirth)
      const now = new Date()
      let age = now.getFullYear() - birthDate.getFullYear()
      const monthDiff = now.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
        age--
      }
      return age
    }
  },
  watch: {
    value(val) {
      this.dialogVisible = val
      if (val) {
        this.initData()
      }
    },
    dialogVisible(val) {
      this.$emit('input', val)
    },
    residentData: {
      handler(newVal) {
        if (this.dialogVisible && newVal && newVal.id) {
          // 当residentData变化时，重置currentResidentId，确保使用最新的residentData.id
          this.currentResidentId = null
          this.initData()
        }
      },
      deep: true
    },
    showInactiveMembers: {
      handler(newVal) {
        this.filterHouseholdMembers()
      }
    }
  },
  created() {
    this.loadRelationshipOptions()
    this.loadAllDictionaries()
  },
  methods: {
    // 初始化数据
    initData() {
      this.loading = true
      try {
        // 优先使用currentResidentId（如果存在的话，比如点击家庭成员列表中的成员时设置的）
        // 否则从residentData中获取ID（比如点击居民列表中的居民时设置的）
        let residentId, householdId

        if (this.currentResidentId && this.currentHouseholdId) {
          // 如果已经通过点击家庭成员列表设置了currentResidentId和currentHouseholdId，则使用它们
          residentId = this.currentResidentId
          householdId = this.currentHouseholdId
        } else if (this.residentData && this.residentData.id) {
          // 否则从residentData中获取ID
          residentId = this.residentData.id
          householdId = this.residentData.householdId || this.residentData.household_id
          // 更新currentResidentId和currentHouseholdId
          this.currentResidentId = residentId
          this.currentHouseholdId = householdId
        }

        if (residentId && householdId) {
          this.isAddingNew = false

          // 并行加载数据
          Promise.all([
            this.loadHouseholdInfo(householdId),
            this.loadResidentInfo(residentId),
            this.loadHouseholdMembers(householdId)
          ])
            .then(() => {
              // 如果户主身份证号为空，尝试从家庭成员中获取
              if (!this.householdForm.householdHeadIdCard) {
                // 首先检查当前居民是否是户主
                if (
                  this.residentForm.relationshipToHead === '本人' ||
                  this.residentForm.relationshipToHead === '户主'
                ) {
                  this.householdForm.householdHeadIdCard = this.residentForm.idCard
                  this.householdForm.gender = this.residentForm.gender
                } else {
                  // 否则从家庭成员列表中查找户主
                  const headMember = this.householdMembers.find(
                    (member) =>
                      member.relationship_to_head === '本人' ||
                      member.relationship_to_head === '户主'
                  )
                  if (headMember) {
                    this.householdForm.householdHeadIdCard = headMember.idCard || headMember.id_card
                    this.householdForm.gender = headMember.gender
                  }
                }
              }
            })
            .finally(() => {
              this.loading = false
            })
        } else {
          this.resetFormData()
          this.loading = false
        }
      } catch (error) {
        console.error('初始化数据失败:', error)
        this.loading = false
      }
    },

    // 重置表单数据
    resetFormData() {
      this.currentResidentId = null
      this.currentHouseholdId = null
      this.isAddingNew = false

      // 重置户主表单
      this.householdForm = {
        householdNumber: '',
        villageGroup: '',
        householdHeadId: null,
        householdHeadName: '',
        ethnicity: '汉族',
        householdType: '农业户口',
        housingType: '自有住房',
        address: '',
        phoneNumber: '',
        registeredDate: '',
        status: 'active',
        householdHeadIdCard: '',
        gender: ''
      }

      // 重置成员表单
      this.residentForm = {
        name: '',
        idCard: '',
        gender: '',
        dateOfBirth: '',
        villageGroup: '',
        address: '',
        bankCard: '',
        phoneNumber: '',
        bankName: '',
        householdId: null,
        householdHeadId: null,
        ethnicity: '汉族',
        relationshipToHead: '其他',
        maritalStatus: '未婚',
        politicalStatus: '群众',
        militaryService: '未服兵役',
        educationLevel: '小学',
        status: 'active',
        registeredPermanentResidence: 1,
        registeredDate: '',
        statusUpdatedAt: '',
        statusChangeReason: '',
        equityShares: 0
      }

      this.householdMembers = []
      this.filteredHouseholdMembers = []
      this.resetMigrationForm()
      this.isIdCardAutoFill = true
      this.isGenderAutoFill = true
      this.isDateOfBirthAutoFill = true
    },

    // 重置迁途改销表单 - 只在需要时调用
    resetMigrationForm() {
      this.migrationForm = {
        migrationInDate: '',
        migrationInReason: '',
        migrationOutDate: '',
        migrationOutReason: '',
        deathDate: '',
        deathReason: '',
        recoveryReason: ''
      }
    },

    // 加载与户主关系选项
    async loadRelationshipOptions() {
      try {
        const data = await dictionaryCache.getDictionary('relationship_to_head')
        this.relationshipOptions = data.sort((a, b) => a.displayOrder - b.displayOrder)
      } catch (error) {
        console.error('加载与户主关系选项失败:', error)
        this.$message.error('加载与户主关系选项失败')
      }
    },

    // 加载所有字典数据
    async loadAllDictionaries() {
      try {
        // 同时加载多个字典数据，使用Promise.all提高效率
        const [
          ethnicityData,
          householdTypeData,
          housingTypeData,
          maritalStatusData,
          politicalStatusData,
          militaryServiceData,
          educationLevelData,
          villageGroupData
        ] = await Promise.all([
          dictionaryCache.getDictionary('民族'),
          dictionaryCache.getDictionary('户口类型'),
          dictionaryCache.getDictionary('住房类型'),
          dictionaryCache.getDictionary('婚姻状况'),
          dictionaryCache.getDictionary('政治面貌'),
          dictionaryCache.getDictionary('兵役状况'),
          dictionaryCache.getDictionary('文化程度'),
          dictionaryCache.getDictionary('村组')
        ])

        // 处理各字典数据
        if (Array.isArray(ethnicityData)) {
          this.ethnicityOptions = ethnicityData
        }

        if (Array.isArray(householdTypeData)) {
          this.householdTypeOptions = householdTypeData
        }

        if (Array.isArray(housingTypeData)) {
          this.housingTypeOptions = housingTypeData
        }

        if (Array.isArray(maritalStatusData)) {
          this.maritalStatusOptions = maritalStatusData
        }

        if (Array.isArray(politicalStatusData)) {
          this.politicalStatusOptions = politicalStatusData
        }

        if (Array.isArray(militaryServiceData)) {
          this.militaryServiceOptions = militaryServiceData
        }

        if (Array.isArray(educationLevelData)) {
          this.educationLevelOptions = educationLevelData
        }

        if (Array.isArray(villageGroupData)) {
          this.villageGroupOptions = villageGroupData
        }
      } catch (error) {
        console.error('加载字典数据失败:', error)
      }
    },

    // 点击修改按钮
    handleEdit() {
      this.isEditable = true
      this.title = '修改居民信息'
    },

    // 取消修改
    cancelEdit() {
      this.isEditable = false
      this.title = '居民详细信息'
      // 重新初始化数据，恢复原始状态
      this.initData()
    },

    // 加载户主信息
    loadHouseholdInfo(householdId) {
      return new Promise((resolve, reject) => {
        if (!householdId) {
          resolve()
          return
        }

        request
          .get(`/households/${householdId}`)
          .then((response) => {
            if (response.code === 20000 && response.data) {
              // 直接使用响应数据，不再做字段名映射
              this.householdForm = {
                householdNumber: response.data.household_number || '',
                villageGroup: response.data.village_group || '',
                householdHeadId: response.data.household_head_id || null,
                householdHeadName: response.data.household_head_name || '',
                ethnicity: response.data.ethnicity || '汉族',
                householdType: response.data.household_type || '农业户口',
                housingType: response.data.housing_type || '自有住房',
                address: response.data.address || '',
                phoneNumber: response.data.phone_number || '',
                registeredDate: response.data.registered_date || '',
                status: response.data.status || 'active',
                householdHeadIdCard: response.data.household_head_id_card || '',
                gender: response.data.gender || ''
              }
            }
            resolve()
          })
          .catch((error) => {
            console.error('获取户主信息失败:', error)
            this.$message.error('获取户主信息失败')
            resolve()
          })
      })
    },

    // 加载成员详细信息
    loadResidentInfo(residentId) {
      return new Promise((resolve, reject) => {
        if (!residentId) {
          resolve()
          return
        }

        request
          .get(`/residents/${residentId}`)
          .then((response) => {
            if (response.code === 20000 && response.data) {
              // 同时处理下划线命名和驼峰命名的字段，确保数据显示稳定
              this.residentForm = {
                name: response.data.name || '',
                idCard: response.data.id_card || response.data.idCard || '',
                gender: response.data.gender || '',
                dateOfBirth: response.data.date_of_birth || response.data.dateOfBirth || '',
                villageGroup: response.data.village_group || response.data.villageGroup || '',
                address:
                  response.data.home_address ||
                  response.data.homeAddress ||
                  response.data.address ||
                  '',
                bankCard: response.data.bank_card || response.data.bankCard || '',
                phoneNumber: response.data.phone_number || response.data.phoneNumber || '',
                bankName: response.data.bank_name || response.data.bankName || '',
                householdId: response.data.household_id || response.data.householdId || null,
                householdHeadId:
                  response.data.household_head_id || response.data.householdHeadId || null,
                ethnicity: response.data.ethnicity || '汉族',
                relationshipToHead:
                  response.data.relationship_to_head || response.data.relationshipToHead || '其他',
                maritalStatus:
                  response.data.marital_status || response.data.maritalStatus || '未婚',
                politicalStatus:
                  response.data.political_status || response.data.politicalStatus || '群众',
                militaryService:
                  response.data.military_service || response.data.militaryService || '未服兵役',
                educationLevel:
                  response.data.education_level || response.data.educationLevel || '小学',
                status: response.data.status || 'active',
                registeredPermanentResidence:
                  response.data.registered_permanent_residence ||
                  response.data.registeredPermanentResidence ||
                  1,
                registeredDate: response.data.registered_date || response.data.registeredDate || '',
                statusUpdatedAt:
                  response.data.status_updated_at || response.data.statusUpdatedAt || '',
                statusChangeReason:
                  response.data.status_change_reason || response.data.statusChangeReason || '',
                deathDate: response.data.death_date || response.data.deathDate || '',
                equityShares: response.data.equity_shares || response.data.equityShares || 0
              }

              // 填充迁途改销表单数据 - 从最新的变动记录中获取
              this.migrationForm = {
                migrationInDate:
                  response.data.migration_in_date || response.data.migrationInDate || '',
                migrationInReason:
                  response.data.migration_in_reason || response.data.migrationInReason || '',
                migrationOutDate:
                  response.data.migration_out_date || response.data.migrationOutDate || '',
                migrationOutReason:
                  response.data.migration_out_reason || response.data.migrationOutReason || '',
                deathDate: response.data.death_date || response.data.deathDate || '',
                deathReason: response.data.death_reason || response.data.deathReason || '',
                recoveryReason: ''
              }

              // 备份迁途改销数据，用于取消编辑时恢复
              this.originalMigrationForm = JSON.parse(JSON.stringify(this.migrationForm))
            }
            resolve()
          })
          .catch((error) => {
            console.error('获取成员信息失败:', error)
            this.$message.error('获取成员信息失败')
            resolve()
          })
      })
    },

    // 切换迁途改销编辑模式
    toggleMigrationEdit() {
      this.isMigrationEditable = true
      // 备份当前数据，用于取消编辑时恢复
      this.originalMigrationForm = JSON.parse(JSON.stringify(this.migrationForm))
    },

    // 取消迁途改销编辑
    cancelMigrationEdit() {
      this.isMigrationEditable = false
      // 恢复原始数据
      this.migrationForm = JSON.parse(JSON.stringify(this.originalMigrationForm))
    },

    // 加载家庭成员
    loadHouseholdMembers(householdId) {
      return new Promise((resolve, reject) => {
        if (!householdId) {
          this.householdMembers = []
          this.filteredHouseholdMembers = []
          resolve()
          return
        }

        request
          .get(`/households/${householdId}/members`)
          .then((response) => {
            if (response.code === 20000) {
              // 格式化成员数据，统一使用驼峰命名
              this.householdMembers = response.data.map((member) => ({
                ...member,
                idCard: member.id_card || member.idCard || '',
                phoneNumber: member.phone_number || member.phoneNumber || '',
                bankCard: member.bank_card || member.bankCard || '',
                bankName: member.bank_name || member.bankName || '',
                dateOfBirth: member.date_of_birth || member.dateOfBirth || '',
                villageGroup: member.village_group || member.villageGroup || '',
                relationshipToHead: member.relationship_to_head || member.relationshipToHead || '',
                maritalStatus: member.marital_status || member.maritalStatus || '',
                politicalStatus: member.political_status || member.politicalStatus || '',
                militaryService: member.military_service || member.militaryService || '',
                educationLevel: member.education_level || member.educationLevel || '',
                statusUpdatedAt: member.status_updated_at || member.statusUpdatedAt || ''
              }))
              this.filterHouseholdMembers()
            }
            resolve()
          })
          .catch((error) => {
            console.error('获取家庭成员失败:', error)
            this.$message.error('获取家庭成员失败')
            this.householdMembers = []
            this.filteredHouseholdMembers = []
            resolve()
          })
      })
    },

    // 同户新增
    handleSameHouseholdAdd() {
      this.isAddingNew = true
      // 清空成员信息，保留户主信息
      this.residentForm = {
        ...this.residentForm,
        name: '',
        idCard: '',
        gender: '',
        dateOfBirth: '',
        villageGroup: this.householdForm.villageGroup,
        address: this.householdForm.address,
        bankCard: '',
        phoneNumber: '',
        bankName: '',
        householdId: this.currentHouseholdId,
        householdHeadId: this.householdForm.householdHeadId,
        relationshipToHead: '其他',
        status: 'active'
      }
      this.resetMigrationForm()
      this.isIdCardAutoFill = true
      this.isGenderAutoFill = true
      this.isDateOfBirthAutoFill = true
    },

    // 非同户新增
    handleDifferentHouseholdAdd() {
      this.isAddingNew = true
      // 清空所有信息
      this.householdForm = {
        householdNumber: `HH${Date.now()}`,
        villageGroup: '',
        householdHeadId: null,
        householdHeadName: '',
        ethnicity: '汉族',
        householdType: '农业户口',
        housingType: '自有住房',
        address: '',
        phoneNumber: '',
        registeredDate: '',
        status: 'active',
        householdHeadIdCard: '',
        gender: ''
      }

      this.residentForm = {
        name: '',
        idCard: '',
        gender: '',
        dateOfBirth: '',
        villageGroup: '',
        address: '',
        bankCard: '',
        phoneNumber: '',
        bankName: '',
        householdId: null,
        householdHeadId: null,
        ethnicity: '汉族',
        relationshipToHead: '户主',
        maritalStatus: '未婚',
        politicalStatus: '群众',
        militaryService: '未服兵役',
        educationLevel: '小学',
        status: 'active',
        registeredPermanentResidence: 1,
        registeredDate: '',
        statusUpdatedAt: '',
        statusChangeReason: ''
      }

      this.householdMembers = []
      this.filteredHouseholdMembers = []
      this.currentHouseholdId = null
      this.resetMigrationForm()
      this.isIdCardAutoFill = true
      this.isGenderAutoFill = true
      this.isDateOfBirthAutoFill = true
    },

    // 身份证号变化处理
    handleIdCardChange() {
      if (
        !this.isIdCardAutoFill ||
        !this.residentForm.idCard ||
        this.residentForm.idCard.length !== 18
      ) {
        return
      }

      // 自动填充性别
      if (this.isGenderAutoFill) {
        const genderCode = parseInt(this.residentForm.idCard.substring(16, 17))
        this.residentForm.gender = genderCode % 2 === 0 ? '女' : '男'
      }

      // 自动填充出生日期
      if (this.isDateOfBirthAutoFill) {
        const birthDateStr = this.residentForm.idCard.substring(6, 14)
        this.residentForm.dateOfBirth = `${birthDateStr.substring(0, 4)}-${birthDateStr.substring(4, 6)}-${birthDateStr.substring(6, 8)}`
      }
    },

    // 性别变化处理
    handleGenderChange() {
      this.isGenderAutoFill = false
    },

    // 出生日期变化处理
    handleDateOfBirthChange() {
      this.isDateOfBirthAutoFill = false
    },

    // 户主身份证号变化处理
    handleHouseholdIdCardChange() {
      const idCard = this.householdForm.householdHeadIdCard
      if (!idCard || idCard.length !== 18) {
        return
      }

      // 自动填充性别
      const genderCode = parseInt(idCard.substring(16, 17))
      this.householdForm.gender = genderCode % 2 === 0 ? '女' : '男'

      // 自动填充出生日期（虽然户主信息中没有出生日期字段，但可以保留逻辑）
    },

    // 保存数据
    handleSave() {
      if (!this.validateForm()) {
        return
      }

      this.loading = true
      try {
        if (this.isAddingNew) {
          this.addResident()
        } else {
          this.updateResident()
        }
      } catch (error) {
        console.error('保存数据失败:', error)
        this.$message.error('保存数据失败')
        this.loading = false
      }
    },

    // 表单验证
    validateForm() {
      // 检查居民信息必填字段
      if (
        !this.residentForm.name ||
        (typeof this.residentForm.name === 'string' && this.residentForm.name.trim() === '')
      ) {
        this.$message.error('请输入居民姓名')
        return false
      }

      if (
        !this.residentForm.idCard ||
        (typeof this.residentForm.idCard === 'string' && this.residentForm.idCard.trim() === '')
      ) {
        this.$message.error('请输入身份证号')
        return false
      }

      if (
        !this.residentForm.gender ||
        (typeof this.residentForm.gender === 'string' && this.residentForm.gender.trim() === '')
      ) {
        this.$message.error('请选择性别')
        return false
      }

      if (!this.residentForm.dateOfBirth) {
        this.$message.error('请选择出生日期')
        return false
      }

      if (
        !this.residentForm.relationshipToHead ||
        (typeof this.residentForm.relationshipToHead === 'string' &&
          this.residentForm.relationshipToHead.trim() === '')
      ) {
        this.$message.error('请选择与户主关系')
        return false
      }

      if (
        !this.residentForm.villageGroup ||
        (typeof this.residentForm.villageGroup === 'string' &&
          this.residentForm.villageGroup.trim() === '')
      ) {
        this.$message.error('请选择村组')
        return false
      }

      if (
        !this.residentForm.ethnicity ||
        (typeof this.residentForm.ethnicity === 'string' &&
          this.residentForm.ethnicity.trim() === '')
      ) {
        this.$message.error('请选择民族')
        return false
      }

      // 对于非同户新增，需要验证户主信息
      if (this.isAddingNew && !this.currentHouseholdId) {
        if (
          !this.householdForm.householdHeadName ||
          (typeof this.householdForm.householdHeadName === 'string' &&
            this.householdForm.householdHeadName.trim() === '')
        ) {
          this.$message.error('请输入户主姓名')
          return false
        }

        if (
          !this.householdForm.householdHeadIdCard ||
          (typeof this.householdForm.householdHeadIdCard === 'string' &&
            this.householdForm.householdHeadIdCard.trim() === '')
        ) {
          this.$message.error('请输入户主身份证号码')
          return false
        }

        if (
          !this.householdForm.address ||
          (typeof this.householdForm.address === 'string' &&
            this.householdForm.address.trim() === '')
        ) {
          this.$message.error('请输入家庭地址')
          return false
        }

        if (
          !this.householdForm.villageGroup ||
          (typeof this.householdForm.villageGroup === 'string' &&
            this.householdForm.villageGroup.trim() === '')
        ) {
          this.$message.error('请选择村组')
          return false
        }

        if (
          !this.householdForm.ethnicity ||
          (typeof this.householdForm.ethnicity === 'string' &&
            this.householdForm.ethnicity.trim() === '')
        ) {
          this.$message.error('请选择民族')
          return false
        }
      }

      return true
    },

    // 新增居民
    addResident() {
      if (this.isAddingNew && !this.currentHouseholdId) {
        // 非同户新增，先创建户主，再创建居民
        this.addDifferentHouseholdResident()
      } else {
        // 同户新增，直接创建居民
        this.addSameHouseholdResident()
      }
    },

    // 同户新增居民
    addSameHouseholdResident() {
      const residentData = {
        name: this.residentForm.name,
        id_card: this.residentForm.idCard,
        gender: this.residentForm.gender,
        date_of_birth: this.residentForm.dateOfBirth,
        village_group: this.residentForm.villageGroup,
        Home_address: this.residentForm.address,
        bank_card: this.residentForm.bankCard,
        phone_number: this.residentForm.phoneNumber,
        bank_name: this.residentForm.bankName,
        household_id: this.currentHouseholdId,
        household_head_id: this.householdForm.householdHeadId,
        ethnicity: this.residentForm.ethnicity,
        relationship_to_head: this.residentForm.relationshipToHead,
        marital_status: this.residentForm.maritalStatus,
        political_status: this.residentForm.politicalStatus,
        military_service: this.residentForm.militaryService,
        education_level: this.residentForm.educationLevel,
        status: 'active',
        registered_permanent_residence: this.residentForm.registeredPermanentResidence,
        registered_date: this.residentForm.registeredDate || new Date().toISOString().split('T')[0]
      }

      request
        .post('/residents', residentData)
        .then((response) => {
          if (response.code === 20000) {
            this.$message.success('新增居民成功')
            this.$emit('refresh-list')
            // 强制刷新成员列表
            this.loadHouseholdMembers(this.currentHouseholdId)
            // 重置表单
            this.handleSameHouseholdAdd()
          } else {
            this.$message.error('新增居民失败')
          }
        })
        .catch((error) => {
          console.error('新增居民失败:', error)
          this.$message.error('新增居民失败')
        })
        .finally(() => {
          this.loading = false
        })
    },

    // 非同户新增居民
    addDifferentHouseholdResident() {
      // 创建户主
      const householdData = {
        household_number: this.householdForm.householdNumber || `HH${Date.now()}`,
        village_group: this.householdForm.villageGroup,
        household_head_name: this.householdForm.householdHeadName,
        household_head_id_card: this.householdForm.householdHeadIdCard,
        ethnicity: this.householdForm.ethnicity,
        household_type: this.householdForm.householdType,
        housing_type: this.householdForm.housingType,
        address: this.householdForm.address,
        phone_number: this.householdForm.phoneNumber,
        gender: this.householdForm.gender
      }

      request
        .post('/households', householdData)
        .then((householdResponse) => {
          if (
            householdResponse.code === 20000 &&
            householdResponse.data &&
            householdResponse.data.id
          ) {
            const newHouseholdId = householdResponse.data.id

            // 创建居民
            const residentData = {
              name: this.residentForm.name,
              id_card: this.residentForm.idCard,
              gender: this.residentForm.gender,
              date_of_birth: this.residentForm.dateOfBirth,
              village_group: this.residentForm.villageGroup,
              Home_address: this.residentForm.address,
              bank_card: this.residentForm.bankCard,
              phone_number: this.residentForm.phoneNumber,
              bank_name: this.residentForm.bankName,
              household_id: newHouseholdId,
              household_head_id: newHouseholdId,
              ethnicity: this.residentForm.ethnicity,
              relationship_to_head: '户主',
              marital_status: this.residentForm.maritalStatus,
              political_status: this.residentForm.politicalStatus,
              military_service: this.residentForm.militaryService,
              education_level: this.residentForm.educationLevel,
              status: 'active',
              registered_permanent_residence: this.residentForm.registeredPermanentResidence,
              registered_date:
                this.residentForm.registeredDate || new Date().toISOString().split('T')[0]
            }

            return request.post('/residents', residentData)
          } else {
            throw new Error('创建户主失败')
          }
        })
        .then((residentResponse) => {
          if (residentResponse.code === 20000) {
            this.$message.success('新增居民成功')
            this.$emit('refresh-list')
            // 重置表单
            this.resetFormData()
          } else {
            throw new Error('创建居民失败')
          }
        })
        .catch((error) => {
          console.error('新增居民失败:', error)
          this.$message.error('新增居民失败')
        })
        .finally(() => {
          this.loading = false
        })
    },

    // 更新居民
    updateResident() {
      const residentData = {
        name: this.residentForm.name,
        id_card: this.residentForm.idCard,
        gender: this.residentForm.gender,
        date_of_birth: this.residentForm.dateOfBirth,
        village_group: this.residentForm.villageGroup,
        Home_address: this.residentForm.address,
        bank_card: this.residentForm.bankCard,
        phone_number: this.residentForm.phoneNumber,
        bank_name: this.residentForm.bankName,
        household_id: this.currentHouseholdId,
        household_head_id: this.householdForm.householdHeadId,
        ethnicity: this.residentForm.ethnicity,
        relationship_to_head: this.residentForm.relationshipToHead,
        marital_status: this.residentForm.maritalStatus,
        political_status: this.residentForm.politicalStatus,
        military_service: this.residentForm.militaryService,
        education_level: this.residentForm.educationLevel,
        status: this.residentForm.status,
        death_date: this.residentForm.deathDate || null,
        equity_shares: this.residentForm.equityShares || 0
      }

      // 先更新居民信息
      request
        .put(`/residents/${this.currentResidentId}`, residentData)
        .then((response) => {
          if (response.code === 20000) {
            // 再更新户主信息（传递完整的户主信息字段）
            const householdData = {
              household_number: this.householdForm.householdNumber,
              village_group: this.householdForm.villageGroup,
              household_head_id: this.householdForm.householdHeadId,
              household_head_name: this.householdForm.householdHeadName,
              ethnicity: this.householdForm.ethnicity,
              household_type: this.householdForm.householdType,
              housing_type: this.householdForm.housingType,
              address: this.householdForm.address,
              phone_number: this.householdForm.phoneNumber,
              gender: this.householdForm.gender,
              household_head_id_card: this.householdForm.householdHeadIdCard
            }

            return request.put(`/households/${this.currentHouseholdId}`, householdData)
          } else {
            throw new Error('更新居民信息失败')
          }
        })
        .then((householdResponse) => {
          this.$message.success('更新居民信息成功')
          this.$emit('refresh-list')
          // 强制刷新数据
          this.initData()
          // 保存成功后将isEditable设置为false，恢复模态框的只读状态
          this.isEditable = false
          this.title = '居民详细信息'
        })
        .catch((error) => {
          console.error('更新信息失败:', error)
          this.$message.error('更新信息失败')
        })
        .finally(() => {
          this.loading = false
        })
    },

    // 切换迁途改销展开状态
    toggleMigration() {
      this.isMigrationExpanded = !this.isMigrationExpanded
    },

    // 切换显示/隐藏非active成员
    toggleShowInactive() {
      this.showInactiveMembers = !this.showInactiveMembers
      this.filterHouseholdMembers()
    },

    // 过滤家庭成员列表
    filterHouseholdMembers() {
      if (this.showInactiveMembers) {
        this.filteredHouseholdMembers = [...this.householdMembers]
      } else {
        this.filteredHouseholdMembers = this.householdMembers.filter(
          (member) => member.status === 'active' || member.status === undefined
        )
      }
    },

    // 点击成员列表行，切换编辑当前成员
    handleMemberRowClick(row) {
      this.currentResidentId = row.id
      this.currentHouseholdId = row.householdId || row.household_id
      this.initData()
    },

    // 获取成员状态文本
    getMemberStatusText(status) {
      switch (status) {
        case 'active':
          return '正常'
        case 'migrated_out':
          return '迁出'
        case 'deceased':
          return '死亡'
        default:
          return '未知'
      }
    },

    // 获取成员状态类型
    getMemberStatusType(status) {
      switch (status) {
        case 'active':
          return 'success'
        case 'migrated_out':
          return 'warning'
        case 'deceased':
          return 'danger'
        default:
          return 'info'
      }
    },

    // 迁途改销统一保存处理
    handleMigrationSave() {
      // 构建请求参数
      const params = {}
      let actionType = ''
      let successMsg = ''

      // 检查哪些字段有内容，决定要执行的操作
      if (this.migrationForm.migrationInDate) {
        // 有迁入信息，执行迁入操作
        params.migration_in_date = this.migrationForm.migrationInDate
        params.migration_in_reason = this.migrationForm.migrationInReason
        params.status = 'active'
        actionType = 'migrated_in'
        successMsg = '迁入信息保存成功'
      }

      if (this.migrationForm.migrationOutDate) {
        // 有迁出信息，执行迁出操作
        params.migration_out_date = this.migrationForm.migrationOutDate
        params.migration_out_reason = this.migrationForm.migrationOutReason
        params.status = 'migrated_out'
        actionType = 'migrated_out'
        successMsg = '迁出信息保存成功'
      }

      if (this.migrationForm.deathDate) {
        // 有死亡信息，执行死亡注销操作
        params.death_date = this.migrationForm.deathDate
        params.death_reason = this.migrationForm.deathReason
        params.status = 'deceased'
        actionType = 'deceased'
        successMsg = '死亡注销信息保存成功'
      }

      if (this.migrationForm.recoveryReason) {
        // 有恢复原因，执行状态恢复操作
        params.status = 'active'
        actionType = 'recovered'
        successMsg = '状态恢复成功'
      }

      // 验证是否有要保存的内容
      if (Object.keys(params).length === 0) {
        this.$message.warning('请填写至少一个变更信息')
        return
      }

      // 调用后端API保存数据
      request
        .put(`/residents/${this.currentResidentId}/status`, params)
        .then((response) => {
          if (response.code === 20000) {
            this.$message.success(successMsg)

            // 如果居民死亡，自动取消残疾人数据
            if (params.status === 'deceased') {
              this.handleDisabledPersonOnDeath(this.currentResidentId)
            }

            this.$emit('refresh-list')
            // 重新加载居民信息，以显示最新的状态和变动记录
            this.loadResidentInfo(this.currentResidentId)
            // 退出编辑模式
            this.isMigrationEditable = false
          } else {
            this.$message.error('保存失败')
          }
        })
        .catch((error) => {
          console.error('保存失败:', error)
          this.$message.error('保存失败')
        })
    },

    // 处理居民死亡时的残疾人数据
    handleDisabledPersonOnDeath(residentId) {
      // 获取该居民的残疾人数据
      getDisabledPersons({ residentId: residentId })
        .then((response) => {
          if (response.code === 20000 && response.data && response.data.length > 0) {
            // 存在残疾人数据，删除对应的记录
            const disabledPersonId = response.data[0].id
            deleteDisabledPerson(disabledPersonId)
              .then((deleteResponse) => {
                if (deleteResponse.code === 20000) {
                  this.$message.success('残疾人数据已自动取消')
                } else {
                  console.error('取消残疾人数据失败:', deleteResponse)
                  this.$message.warning('取消残疾人数据失败，请手动处理')
                }
              })
              .catch((error) => {
                console.error('取消残疾人数据失败:', error)
                this.$message.warning('取消残疾人数据失败，请手动处理')
              })
          }
        })
        .catch((error) => {
          console.error('获取残疾人数据失败:', error)
          // 这里不显示错误提示，因为不影响主流程
        })
    }
  }
}
</script>

<style scoped>
.dialog-header-buttons {
  margin-bottom: 12px;
  display: flex;
  gap: 6px;
}

/* 按钮背景色设置为#304156 */
.dialog-header-buttons .el-button {
  background-color: #304156 !important;
  border-color: #304156 !important;
  color: white !important;
}

.info-card {
  margin-bottom: 12px;
}

.compact-card {
  margin-bottom: 12px;
}

.compact-form {
  margin-bottom: 0;
}

/* 取消字体加粗 */
.compact-form .el-form-item__label {
  font-weight: normal !important;
  padding-right: 6px;
}

.header-button {
  float: right;
  margin-right: 6px;
  font-weight: normal;
}

.migration-form {
  margin-top: 6px;
}

.migration-buttons {
  margin-top: 6px;
  display: flex;
  gap: 6px;
}

.compact-table {
  margin-bottom: 0;
}

.compact-table .el-table__row {
  height: 24px !important;
}

.compact-table .el-table__cell {
  padding: 3px 6px !important;
  line-height: 24px !important;
}

/* 减小卡片内边距 */
.compact-card .el-card__body {
  padding: 6px;
}

/* 减小卡片头部内边距 */
.compact-card .el-card__header {
  padding: 4px 6px;
}

/* 减小表单项目间距 */
.compact-form .el-form-item {
  margin-bottom: 6px;
}

/* 减小行间距 */
.compact-form .el-row {
  margin-bottom: 0;
}

/* 减小表单控件高度 */
.compact-form .el-input__inner,
.compact-form .el-select__input {
  height: 24px !important;
  line-height: 24px !important;
  padding: 0 6px !important;
  font-weight: normal !important;
}

/* 减小下拉选择器高度 */
.compact-form .el-select .el-input {
  height: 24px;
}

/* 减小日期选择器高度 */
.compact-form .el-date-editor {
  width: 100%;
}

.compact-form .el-date-editor .el-input__inner {
  height: 24px !important;
  line-height: 24px !important;
  font-weight: normal !important;
}

/* 减小表头字体大小和内边距 */
.compact-card .el-card__header {
  font-weight: normal !important;
  font-size: 14px;
}

/* 确保所有文本元素都是正常粗细 */
.el-tag,
.el-input,
.el-select,
.el-date-picker {
  font-weight: normal !important;
}

/* 对话框头部样式，将标题和按钮放在同一行 */
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0 !important;
  margin: 0 !important;
}

/* 对话框标题样式 */
.dialog-title {
  font-size: 14px !important;
  font-weight: normal !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* 确保按钮显示正常 */
.dialog-header-buttons {
  display: flex !important;
  gap: 6px !important;
  margin: 0 !important;
  padding: 0 !important;
  margin-right: 40px !important;
}

/* 确保对话框内容区域显示正常 */
.resident-detail-dialog .el-dialog__body {
  padding: 10px !important;
}

/* 加深年龄字体颜色并移除背景色 */
.age-text {
  color: #304156 !important; /* 使用与其他文本一致的深色 */
  font-weight: normal;
}

/* 移除禁用状态的背景色，设置为白色 */
/* 使用更具体的选择器，确保覆盖Element UI默认样式 */
.compact-form /deep/ .el-input.is-disabled .el-input__inner,
.compact-form /deep/ .el-select.is-disabled .el-input__inner,
.compact-form /deep/ .el-date-editor.is-disabled .el-input__inner,
.compact-form /deep/ .el-input.is-disabled .el-textarea__inner {
  color: #304156 !important;
  font-weight: normal;
  background-color: #ffffff !important; /* 使用#ffffff代替#fff，确保优先级 */
  border-color: #dcdfe6 !important;
  cursor: default;
}

/* 直接为所有禁用的表单元素设置白色背景，确保覆盖所有情况 */
.el-input.is-disabled .el-input__inner,
.el-select.is-disabled .el-input__inner,
.el-date-editor.is-disabled .el-input__inner,
.el-input.is-disabled .el-textarea__inner {
  background-color: #ffffff !important;
}
</style>
