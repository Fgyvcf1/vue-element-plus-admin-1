<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="80%"
    top="100px"
    :close-on-click-modal="true"
    :append-to-body="true"
    :modal-append-to-body="true"
    teleported
    class="resident-detail-dialog"
  >
    <template #header>
      <div class="dialog-header">
        <span class="dialog-title">{{ title }}</span>
        <div class="dialog-header-buttons">
          <el-button :style="{ visibility: !isAddingNew && !isEditable ? 'visible' : 'hidden' }" type="primary" size="small" :loading="loading" @click="handleEdit">修改</el-button>
          <el-button :style="{ visibility: !isAddingNew ? 'visible' : 'hidden' }" type="primary" size="small" :loading="loading" @click="handleSameHouseholdAdd">同户新增</el-button>
          <el-button type="success" size="small" :loading="loading" @click="handleSave">保存</el-button>
          <el-dropdown
            v-if="!isAddingNew && isCurrentUserHead"
            trigger="click"
            :teleported="true"
            popper-class="header-dropdown-popper"
            @command="handleHouseholdCommand"
          >
            <el-button type="info" size="small" class="dropdown-trigger-btn">
              <el-icon><CaretBottom /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="changeHead">更换户主</el-dropdown-item>
                <el-dropdown-item command="splitHousehold">独立成户</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-dropdown
            v-if="!isAddingNew && !isCurrentUserHead"
            trigger="click"
            :teleported="true"
            popper-class="header-dropdown-popper"
            @command="handleHouseholdCommand"
          >
            <el-button type="info" size="small" class="dropdown-trigger-btn">
              <el-icon><CaretBottom /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="changeHead">更换户主</el-dropdown-item>
                <el-dropdown-item command="splitHousehold">独立成户</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button :style="{ visibility: isEditable ? 'visible' : 'hidden' }" type="info" size="small" @click="cancelEdit">取消</el-button>
        </div>
      </div>
    </template>

    <!-- 户主信息区 -->
    <el-card shadow="hover" class="info-card compact-card">
      <template #header>
        <div class="clearfix">
          <span>户主信息</span>
        </div>
      </template>
      <el-form :model="householdForm" label-width="100px" size="small" class="compact-form">
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="户主姓名">
              <div v-if="!isEditable && !isAddingNew" class="readonly-text">{{ householdForm.householdHeadName }}</div>
              <el-input v-else v-model="householdForm.householdHeadName" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="性别">
              <div v-if="!isEditable && !isAddingNew" class="readonly-text">{{ householdForm.gender }}</div>
              <el-select v-else v-model="householdForm.gender" placeholder="请选择性别">
                <el-option label="男" value="男" />
                <el-option label="女" value="女" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="电话号码">
              <div v-if="!isEditable && !isAddingNew" class="readonly-text">{{ householdForm.phoneNumber }}</div>
              <el-input v-else v-model="householdForm.phoneNumber" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="民族">
              <div v-if="!isEditable && !isAddingNew" class="readonly-text">{{ householdForm.ethnicity }}</div>
              <el-select v-else v-model="householdForm.ethnicity" placeholder="请选择民族">
                <el-option v-for="option in ethnicityOptions" :key="option.id" :label="option.value" :value="option.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="身份证号码">
              <div v-if="!isEditable && !isAddingNew" class="readonly-text">{{ householdForm.householdHeadIdCard }}</div>
              <el-input v-else v-model="householdForm.householdHeadIdCard" @change="handleHouseholdIdCardChange" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="户口类型">
              <div v-if="!isEditable && !isAddingNew" class="readonly-text">{{ householdForm.householdType }}</div>
              <el-select v-else v-model="householdForm.householdType" placeholder="请选择户口类型">
                <el-option v-for="option in householdTypeOptions" :key="option.id" :label="option.value" :value="option.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="住房类型">
              <div v-if="!isEditable && !isAddingNew" class="readonly-text">{{ householdForm.housingType }}</div>
              <el-select v-else v-model="householdForm.housingType" placeholder="请选择住房类型">
                <el-option v-for="option in housingTypeOptions" :key="option.id" :label="option.value" :value="option.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="村组">
              <div v-if="!isEditable && !isAddingNew" class="readonly-text">{{ householdForm.villageGroup }}</div>
              <el-select v-else v-model="householdForm.villageGroup" placeholder="请选择村组">
                <el-option v-for="option in villageGroupOptions" :key="option.id" :label="option.value" :value="option.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item label="家庭地址">
              <div v-if="!isEditable && !isAddingNew" class="readonly-text">{{ householdForm.address }}</div>
              <el-input v-else v-model="householdForm.address" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 成员信息区 -->
    <el-card shadow="hover" class="info-card compact-card">
      <template #header>
        <div class="clearfix">
          <span>成员信息</span>
        </div>
      </template>
      <el-form :model="residentForm" label-width="100px" size="small" class="compact-form">
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="居民姓名">
              <div v-if="!isEditable && !isAddingNew" class="readonly-text">{{ residentForm.name }}</div>
              <el-input v-else v-model="residentForm.name" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="身份证号">
              <div v-if="!isEditable && !isAddingNew" class="readonly-text">{{ residentForm.idCard }}</div>
              <el-input v-else v-model="residentForm.idCard" @change="handleIdCardChange" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="性别">
              <div v-if="!isEditable && !isAddingNew" class="readonly-text">{{ residentForm.gender }}</div>
              <el-select v-else v-model="residentForm.gender" placeholder="请选择性别" @change="handleGenderChange">
                <el-option label="男" value="男" />
                <el-option label="女" value="女" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="与户主关系">
              <div v-if="!isEditable && !isAddingNew" class="readonly-text">{{ residentForm.relationshipToHead }}</div>
              <el-select v-else v-model="residentForm.relationshipToHead" placeholder="请选择与户主关系">
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
              <div v-if="!isEditable && !isAddingNew" class="readonly-text">{{ residentForm.ethnicity }}</div>
              <el-select v-else v-model="residentForm.ethnicity" placeholder="请选择民族">
                <el-option v-for="option in ethnicityOptions" :key="option.id" :label="option.value" :value="option.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="出生日期">
              <div v-if="!isEditable && !isAddingNew" class="readonly-text">{{ residentForm.dateOfBirth }}</div>
              <el-date-picker
                v-else
                v-model="residentForm.dateOfBirth"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                size="small"
                @change="handleDateOfBirthChange"
                :popper-options="{ zIndex: 30000 }"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="年龄">
              <div class="readonly-text">{{ age }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="婚姻状况">
              <div v-if="!isEditable && !isAddingNew" class="readonly-text">{{ residentForm.maritalStatus }}</div>
              <el-select v-else v-model="residentForm.maritalStatus" placeholder="请选择婚姻状况">
                <el-option v-for="option in maritalStatusOptions" :key="option.id" :label="option.value" :value="option.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="兵役状况">
              <div v-if="!isEditable && !isAddingNew" class="readonly-text">{{ residentForm.militaryService }}</div>
              <el-select v-else v-model="residentForm.militaryService" placeholder="请选择兵役状况">
                <el-option v-for="option in militaryServiceOptions" :key="option.id" :label="option.value" :value="option.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="政治面貌">
              <div v-if="!isEditable && !isAddingNew" class="readonly-text">{{ residentForm.politicalStatus }}</div>
              <el-select v-else v-model="residentForm.politicalStatus" placeholder="请选择政治面貌">
                <el-option v-for="option in politicalStatusOptions" :key="option.id" :label="option.value" :value="option.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="文化程度">
              <div v-if="!isEditable && !isAddingNew" class="readonly-text">{{ residentForm.educationLevel }}</div>
              <el-select v-else v-model="residentForm.educationLevel" placeholder="请选择文化程度">
                <el-option v-for="option in educationLevelOptions" :key="option.id" :label="option.value" :value="option.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="村组">
              <div v-if="!isEditable && !isAddingNew" class="readonly-text">{{ residentForm.villageGroup }}</div>
              <el-select v-else v-model="residentForm.villageGroup" placeholder="请选择村组">
                <el-option v-for="option in villageGroupOptions" :key="option.id" :label="option.value" :value="option.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item label="家庭地址">
              <div v-if="!isEditable && !isAddingNew" class="readonly-text">{{ residentForm.address }}</div>
              <el-input v-else v-model="residentForm.address" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="联系电话">
              <div v-if="!isEditable && !isAddingNew" class="readonly-text">{{ residentForm.phoneNumber }}</div>
              <el-input v-else v-model="residentForm.phoneNumber" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="银行帐号">
              <div v-if="!isEditable && !isAddingNew" class="readonly-text">{{ residentForm.bankCard }}</div>
              <el-input v-else v-model="residentForm.bankCard" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="开户行">
              <div v-if="!isEditable && !isAddingNew" class="readonly-text">{{ residentForm.bankName }}</div>
              <el-input v-else v-model="residentForm.bankName" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <div style="display: flex; flex-direction: row; gap: 20px; align-items: center;">
              <div style="flex: 1;">
                <el-form-item label="股权">
                  <div v-if="!isEditable && !isAddingNew" class="readonly-text">{{ residentForm.equityShares }}</div>
                  <el-input v-else v-model="residentForm.equityShares" />
                </el-form-item>
              </div>
              <div style="flex: 1;">
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

    <!-- 更换户主对话框 -->
    <el-dialog
      v-model="changeHeadDialogVisible"
      title="更换户主"
      width="550px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-form label-width="120px" size="small">
        <el-form-item label="当前户主">
          <span class="readonly-text">{{ householdForm.householdHeadName }}</span>
        </el-form-item>
        
        <!-- 选择更换类型 -->
        <el-form-item label="更换类型">
          <el-radio-group v-model="changeHeadType">
            <el-radio label="same">同户更换</el-radio>
            <el-radio label="other">跨户迁移</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <!-- 同户更换：选择新户主 -->
        <template v-if="changeHeadType === 'same'">
          <el-form-item v-if="isCurrentUserHead" label="新户主" required>
            <el-select v-model="newHeadId" placeholder="请选择新户主" style="width: 100%">
              <el-option
                v-for="member in eligibleNewHeads"
                :key="member.id"
                :label="member.name + ' (' + member.relationshipToHead + ')'"
                :value="member.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item v-else label="新户主">
            <span class="readonly-text">{{ residentForm.name }} (将自己设为户主)</span>
          </el-form-item>
        </template>
        
        <!-- 跨户迁移：搜索并选择目标家庭 -->
        <template v-if="changeHeadType === 'other'">
          <el-form-item label="目标户主" required>
            <el-autocomplete
              v-model="targetHouseholdHeadName"
              :fetch-suggestions="fetchHouseholdHeadSuggestions"
              placeholder="请输入户主姓名搜索"
              style="width: 100%"
              value-key="householdHeadName"
              :trigger-on-focus="false"
              :debounce="300"
              @select="handleTargetHouseholdSelect"
            >
              <template #default="{ item }">
                <div>{{ item.householdHeadName }} - {{ item.address }}</div>
              </template>
            </el-autocomplete>
          </el-form-item>
          <el-form-item v-if="selectedTargetHousehold" label="目标地址">
            <span class="readonly-text">{{ selectedTargetHousehold.address }}</span>
          </el-form-item>
        </template>
        
        <el-form-item label="与户主关系" required>
          <el-select v-model="oldHeadNewRelationship" placeholder="请选择与户主的关系" style="width: 100%">
            <el-option
              v-for="option in relationshipOptions"
              :key="option.id"
              :label="option.value"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="changeHeadDialogVisible = false">取消</el-button>
        <el-button type="primary" size="small" :loading="loading" @click="confirmChangeHead">确定</el-button>
      </template>
    </el-dialog>

    <!-- 成员列表区 -->
    <el-card shadow="hover" class="info-card compact-card">
      <template #header>
        <div class="clearfix">
          <span>家庭成员列表（{{ filteredHouseholdMembers.length }}人）</span>
          <el-button type="primary" link size="small" class="header-button" @click="toggleShowInactive">
            {{ showInactiveMembers ? '仅显示正常成员' : '显示所有成员' }}
          </el-button>
        </div>
      </template>
      <el-table
        :data="filteredHouseholdMembers"
        size="small"
        style="width: 100%"
        class="compact-table"
        @row-click="handleMemberRowClick"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="姓名" width="80" />
        <el-table-column prop="gender" label="性别" width="60" />
        <el-table-column prop="relationshipToHead" label="与户主关系" width="100" />
        <el-table-column prop="age" label="年龄" width="60">
          <template #default="scope">
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
      <template #header>
        <div class="clearfix">
          <span>迁途改销</span>
          <el-icon
            class="header-button toggle-arrow-icon"
            :class="{ 'is-expanded': isMigrationExpanded }"
            @click="toggleMigration"
          >
            <ArrowDown />
          </el-icon>
        </div>
      </template>
      <div v-if="isMigrationExpanded" class="migration-form">
        <el-form :model="migrationForm" label-width="80px" size="small" class="compact-form">
          <!-- 第一行：迁入和迁出 -->
          <el-row :gutter="12">
            <el-col :span="6">
              <el-form-item label="迁入日期">
                <div v-if="!isMigrationEditable" class="readonly-text">{{ migrationForm.migrationInDate || '-' }}</div>
                <el-date-picker
                  v-else
                  v-model="migrationForm.migrationInDate"
                  type="date"
                  placeholder="选择迁入日期"
                  value-format="YYYY-MM-DD"
                  format="YYYY-MM-DD"
                  size="small"
                  :popper-options="{ zIndex: 30000 }"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="迁入原因">
                <div v-if="!isMigrationEditable" class="readonly-text">{{ migrationForm.migrationInReason || '-' }}</div>
                <el-input
                  v-else
                  v-model="migrationForm.migrationInReason"
                  placeholder="请输入迁入原因"
                  size="small"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="迁出日期">
                <div v-if="!isMigrationEditable" class="readonly-text">{{ migrationForm.migrationOutDate || '-' }}</div>
                <el-date-picker
                  v-else
                  v-model="migrationForm.migrationOutDate"
                  type="date"
                  placeholder="选择迁出日期"
                  value-format="YYYY-MM-DD"
                  format="YYYY-MM-DD"
                  size="small"
                  :popper-options="{ zIndex: 30000 }"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="迁出原因">
                <div v-if="!isMigrationEditable" class="readonly-text">{{ migrationForm.migrationOutReason || '-' }}</div>
                <el-input
                  v-else
                  v-model="migrationForm.migrationOutReason"
                  placeholder="请输入迁出原因"
                  size="small"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 第二行：死亡和恢复 -->
          <el-row :gutter="12">
            <el-col :span="6">
              <el-form-item label="死亡时间">
                <div v-if="!isMigrationEditable" class="readonly-text">{{ migrationForm.deathDate || '-' }}</div>
                <el-date-picker
                  v-else
                  v-model="migrationForm.deathDate"
                  type="date"
                  placeholder="选择死亡日期"
                  value-format="YYYY-MM-DD"
                  format="YYYY-MM-DD"
                  size="small"
                  :popper-options="{ zIndex: 30000 }"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="死亡原因">
                <div v-if="!isMigrationEditable" class="readonly-text">{{ migrationForm.deathReason || '-' }}</div>
                <el-input
                  v-else
                  v-model="migrationForm.deathReason"
                  placeholder="请输入死亡原因"
                  size="small"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="恢复原因">
                <div v-if="!isMigrationEditable" class="readonly-text">{{ migrationForm.recoveryReason || '-' }}</div>
                <el-input
                  v-else
                  v-model="migrationForm.recoveryReason"
                  placeholder="请输入恢复状态原因"
                  size="small"
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
              type="info"
              size="small"
              style="margin-right: 10px"
              @click="cancelMigrationEdit"
            >
              取消
            </el-button>
            <el-button
              type="primary"
              size="small"
              @click="handleMigrationSave"
            >
              保存
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import {
  ElMessage,
  ElMessageBox,
  ElDialog,
  ElButton,
  ElTag,
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption,
  ElDatePicker,
  ElRow,
  ElCol,
  ElTable,
  ElTableColumn,
  ElIcon,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
  ElRadio,
  ElRadioGroup,
  ElAutocomplete
} from 'element-plus'
import { CaretBottom, ArrowDown } from '@element-plus/icons-vue'
import { getResidentDetail, addResident, updateResident, updateResidentStatus, getSearchSuggestions } from '@/api/resident'
import { getHouseholdDetail, getHouseholdMembers, updateHousehold, createHousehold } from '@/api/household'
import { getDictApi } from '@/api/common'
import request from '@/axios'

const props = defineProps<{
  modelValue: boolean
  residentId: string | number | null
  householdId: string | number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'refresh-list': []
}>()

// 对话框可见性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 标题
const title = ref('居民详细信息')

// 加载状态
const loading = ref(false)

// 是否可编辑
const isEditable = ref(false)

// 是否新增模式
const isAddingNew = ref(false)

// 当前居民ID和户ID
const currentResidentId = ref<string | number | null>(null)
const currentHouseholdId = ref<string | number | null>(null)

// 户主表单
const householdForm = ref({
  householdNumber: '',
  villageGroup: '',
  householdHeadId: null as string | number | null,
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
})

// 居民表单
const residentForm = ref({
  name: '',
  idCard: '',
  gender: '',
  dateOfBirth: '',
  villageGroup: '',
  address: '',
  bankCard: '',
  phoneNumber: '',
  bankName: '',
  householdId: null as string | number | null,
  householdHeadId: null as string | number | null,
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
  deathDate: '',
  equityShares: 0
})

// 迁途改销表单
const migrationForm = ref({
  migrationInDate: '',
  migrationInReason: '',
  migrationOutDate: '',
  migrationOutReason: '',
  deathDate: '',
  deathReason: '',
  recoveryReason: ''
})

// 迁途改销编辑状态
const isMigrationEditable = ref(false)
const originalMigrationForm = ref({})

// 更换户主对话框
const changeHeadDialogVisible = ref(false)
const changeHeadType = ref<'same' | 'other'>('same') // 更换类型：same-同户更换，other-跨户迁移
const newHeadId = ref<number | string | null>(null)
const oldHeadNewRelationship = ref('')

// 跨户迁移相关
const targetHouseholdHeadName = ref('')
const selectedTargetHousehold = ref<any>(null)

// 当前居民是否是户主
const isCurrentUserHead = computed(() => {
  return residentForm.value.relationshipToHead === '本人' || residentForm.value.relationshipToHead === '户主'
})

// 可作为新户主的成员列表（排除当前户主）
const eligibleNewHeads = computed(() => {
  return householdMembers.value.filter(member => 
    member.id !== currentResidentId.value && 
    member.status === 'active'
  )
})

// 家庭成员列表
const householdMembers = ref<any[]>([])
const filteredHouseholdMembers = ref<any[]>([])
const showInactiveMembers = ref(false)

// 迁途改销展开状态
const isMigrationExpanded = ref(false)

// 自动填充标记
const isIdCardAutoFill = ref(true)
const isGenderAutoFill = ref(true)
const isDateOfBirthAutoFill = ref(true)

// 字典选项
const relationshipOptions = ref<any[]>([])
const ethnicityOptions = ref<any[]>([])
const householdTypeOptions = ref<any[]>([])
const housingTypeOptions = ref<any[]>([])
const maritalStatusOptions = ref<any[]>([])
const politicalStatusOptions = ref<any[]>([])
const militaryServiceOptions = ref<any[]>([])
const educationLevelOptions = ref<any[]>([])
const villageGroupOptions = ref<any[]>([])

// 计算属性：状态文本
const statusText = computed(() => {
  const status = residentForm.value.status || 'active'
  return getMemberStatusText(status)
})

// 计算属性：状态类型
const statusType = computed(() => {
  const status = residentForm.value.status || 'active'
  return getMemberStatusType(status)
})

// 计算属性：年龄
const age = computed(() => {
  if (!residentForm.value.dateOfBirth) {
    return ''
  }
  const birthDate = new Date(residentForm.value.dateOfBirth)
  const now = new Date()
  let age = now.getFullYear() - birthDate.getFullYear()
  const monthDiff = now.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age--
  }
  return age.toString()
})

// 监听对话框显示
watch(() => props.modelValue, (val) => {
  if (val) {
    currentResidentId.value = null
    currentHouseholdId.value = null
    isMigrationExpanded.value = false
    isEditable.value = false
    isAddingNew.value = false
    title.value = '居民详细信息'
    initData()
  } else {
    resetFormData()
  }
})

// 监听residentData变化
watch(() => props.residentId, (newVal, oldVal) => {
  // 只在对话框打开、ID变化且不在编辑状态下才重新加载数据
  if (dialogVisible.value && newVal && newVal !== oldVal && !isEditable.value && !isMigrationEditable.value) {
    currentResidentId.value = null
    currentHouseholdId.value = null
    initData()
  }
})

// 初始化数据
const initData = async () => {
  loading.value = true
  try {
    let residentId, householdId

    // 优先使用currentResidentId（如果存在的话，比如点击家庭成员列表中的成员时设置的）
    // 否则从props中获取ID（比如点击居民列表中的居民时设置的）
    if (currentResidentId.value && currentHouseholdId.value) {
      // 如果已经通过点击家庭成员列表设置了currentResidentId和currentHouseholdId，则使用它们
      residentId = currentResidentId.value
      householdId = currentHouseholdId.value
    } else if (props.residentId && props.householdId) {
      // 否则从props中获取ID
      residentId = props.residentId
      householdId = props.householdId
      // 更新currentResidentId和currentHouseholdId
      currentResidentId.value = residentId
      currentHouseholdId.value = householdId
    }

    if (residentId && householdId) {
      isAddingNew.value = false
      await Promise.all([
        loadHouseholdInfo(householdId),
        loadResidentInfo(residentId),
        loadHouseholdMembers(householdId)
      ])
    } else {
      resetFormData()
    }
  } catch (error) {
    console.error('初始化数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 重置表单数据
const resetFormData = () => {
  currentResidentId.value = null
  currentHouseholdId.value = null
  isAddingNew.value = false

  householdForm.value = {
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

  residentForm.value = {
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
    deathDate: '',
    equityShares: 0
  }

  householdMembers.value = []
  filteredHouseholdMembers.value = []
  resetMigrationForm()
  isIdCardAutoFill.value = true
  isGenderAutoFill.value = true
  isDateOfBirthAutoFill.value = true
}

// 重置迁途改销表单
const resetMigrationForm = () => {
  migrationForm.value = {
    migrationInDate: '',
    migrationInReason: '',
    migrationOutDate: '',
    migrationOutReason: '',
    deathDate: '',
    deathReason: '',
    recoveryReason: ''
  }
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
          display_order: item.display_order
        })
      })

      // 对每个分类内的选项按 display_order 排序
      Object.keys(dictData).forEach(key => {
        dictData[key].sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      })

      ethnicityOptions.value = dictData['民族'] || []
      householdTypeOptions.value = dictData['户口类型'] || []
      housingTypeOptions.value = dictData['住房类型'] || []
      maritalStatusOptions.value = dictData['婚姻状况'] || []
      politicalStatusOptions.value = dictData['政治面貌'] || []
      militaryServiceOptions.value = dictData['兵役状况'] || []
      educationLevelOptions.value = dictData['文化程度'] || []
      villageGroupOptions.value = dictData['村组'] || []
      relationshipOptions.value = dictData['relationship_to_head'] || []
    }
  } catch (error) {
    console.error('加载字典数据失败:', error)
  }
}

// 点击修改按钮
const handleEdit = () => {
  isEditable.value = true
  title.value = '修改居民信息'
}

// 取消修改
const cancelEdit = () => {
  isEditable.value = false
  title.value = '居民详细信息'
  initData()
}

// 加载户主信息
const loadHouseholdInfo = async (householdId: string | number) => {
  try {
    const res = await getHouseholdDetail(householdId)
    if (res.code === 20000 && res.data) {
      const data = res.data
      householdForm.value = {
        householdNumber: data.household_number || '',
        villageGroup: data.village_group || '',
        householdHeadId: data.household_head_id || null,
        householdHeadName: data.household_head_name || '',
        ethnicity: data.ethnicity || '汉族',
        householdType: data.household_type || '农业户口',
        housingType: data.housing_type || '自有住房',
        address: data.address || '',
        phoneNumber: data.phone_number || '',
        registeredDate: data.registered_date || '',
        status: data.status || 'active',
        householdHeadIdCard: data.household_head_id_card || '',
        gender: data.gender || ''
      }
    }
  } catch (error) {
    console.error('获取户主信息失败:', error)
    ElMessage.error('获取户主信息失败')
  }
}

// 加载居民信息
const loadResidentInfo = async (residentId: string | number) => {
  try {
    const res = await getResidentDetail(residentId.toString())
    if (res.code === 20000 && res.data) {
      const data = res.data
      residentForm.value = {
        name: data.name || '',
        idCard: data.id_card || data.idCard || '',
        gender: data.gender || '',
        dateOfBirth: data.date_of_birth || data.dateOfBirth || '',
        villageGroup: data.village_group || data.villageGroup || '',
        address: data.home_address || data.homeAddress || data.address || '',
        bankCard: data.bank_card || data.bankCard || '',
        phoneNumber: data.phone_number || data.phoneNumber || '',
        bankName: data.bank_name || data.bankName || '',
        householdId: data.household_id || data.householdId || null,
        householdHeadId: data.household_head_id || data.householdHeadId || null,
        ethnicity: data.ethnicity || '汉族',
        relationshipToHead: data.relationship_to_head || data.relationshipToHead || '其他',
        maritalStatus: data.marital_status || data.maritalStatus || '未婚',
        politicalStatus: data.political_status || data.politicalStatus || '群众',
        militaryService: data.military_service || data.militaryService || '未服兵役',
        educationLevel: data.education_level || data.educationLevel || '小学',
        status: data.status || 'active',
        registeredPermanentResidence: data.registered_permanent_residence || data.registeredPermanentResidence || 1,
        registeredDate: data.registered_date || data.registeredDate || '',
        statusUpdatedAt: data.status_updated_at || data.statusUpdatedAt || '',
        statusChangeReason: data.status_change_reason || data.statusChangeReason || '',
        deathDate: data.death_date || data.deathDate || '',
        equityShares: data.equity_shares !== undefined && data.equity_shares !== null ? data.equity_shares : (data.equityShares || 0)
      }

      // 填充迁途改销数据
      migrationForm.value = {
        migrationInDate: data.migration_in_date || data.migrationInDate || '',
        migrationInReason: data.migration_in_reason || data.migrationInReason || '',
        migrationOutDate: data.migration_out_date || data.migrationOutDate || '',
        migrationOutReason: data.migration_out_reason || data.migrationOutReason || '',
        deathDate: data.death_date || data.deathDate || '',
        deathReason: data.death_reason || data.deathReason || '',
        recoveryReason: ''
      }

      originalMigrationForm.value = JSON.parse(JSON.stringify(migrationForm.value))
    }
  } catch (error) {
    console.error('获取居民信息失败:', error)
    ElMessage.error('获取居民信息失败')
  }
}

// 加载家庭成员
const loadHouseholdMembers = async (householdId: string | number) => {
  try {
    const res = await getHouseholdMembers(householdId)
    if (res.code === 20000 && res.data) {
      householdMembers.value = res.data.map((member: any) => ({
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
      filterHouseholdMembers()
    }
  } catch (error) {
    console.error('获取家庭成员失败:', error)
    ElMessage.error('获取家庭成员失败')
    householdMembers.value = []
    filteredHouseholdMembers.value = []
  }
}

// 同户新增
const handleSameHouseholdAdd = () => {
  isAddingNew.value = true
  residentForm.value = {
    ...residentForm.value,
    name: '',
    idCard: '',
    gender: '',
    dateOfBirth: '',
    villageGroup: householdForm.value.villageGroup,
    address: householdForm.value.address,
    bankCard: '',
    phoneNumber: '',
    bankName: '',
    householdId: currentHouseholdId.value,
    householdHeadId: householdForm.value.householdHeadId,
    relationshipToHead: '其他',
    status: 'active',
    equityShares: 0
  }
  resetMigrationForm()
  isIdCardAutoFill.value = true
  isGenderAutoFill.value = true
  isDateOfBirthAutoFill.value = true
}

// 身份证号变化处理
const handleIdCardChange = () => {
  if (!isIdCardAutoFill.value || !residentForm.value.idCard || residentForm.value.idCard.length !== 18) {
    return
  }

  // 自动填充性别
  if (isGenderAutoFill.value) {
    const genderCode = parseInt(residentForm.value.idCard.substring(16, 17))
    residentForm.value.gender = genderCode % 2 === 0 ? '女' : '男'
  }

  // 自动填充出生日期
  if (isDateOfBirthAutoFill.value) {
    const birthDateStr = residentForm.value.idCard.substring(6, 14)
    residentForm.value.dateOfBirth = `${birthDateStr.substring(0, 4)}-${birthDateStr.substring(4, 6)}-${birthDateStr.substring(6, 8)}`
  }
}

// 性别变化处理
const handleGenderChange = () => {
  isGenderAutoFill.value = false
}

// 出生日期变化处理
const handleDateOfBirthChange = () => {
  isDateOfBirthAutoFill.value = false
}

// 户主身份证号变化处理
const handleHouseholdIdCardChange = () => {
  const idCard = householdForm.value.householdHeadIdCard
  if (!idCard || idCard.length !== 18) {
    return
  }

  // 自动填充性别
  const genderCode = parseInt(idCard.substring(16, 17))
  householdForm.value.gender = genderCode % 2 === 0 ? '女' : '男'
}

// 保存数据
const handleSave = async () => {
  if (!validateForm()) {
    return
  }

  loading.value = true
  try {
    if (isAddingNew.value) {
      await addResidentData()
    } else {
      await updateResidentData()
    }
  } catch (error) {
    console.error('保存数据失败:', error)
    ElMessage.error('保存数据失败')
  } finally {
    loading.value = false
  }
}

// 表单验证
const validateForm = () => {
  // 检查居民信息必填字段
  if (!residentForm.value.name || residentForm.value.name.trim() === '') {
    ElMessage.error('请输入居民姓名')
    return false
  }

  if (!residentForm.value.idCard || residentForm.value.idCard.trim() === '') {
    ElMessage.error('请输入身份证号')
    return false
  }

  if (!residentForm.value.gender || residentForm.value.gender.trim() === '') {
    ElMessage.error('请选择性别')
    return false
  }

  if (!residentForm.value.dateOfBirth) {
    ElMessage.error('请选择出生日期')
    return false
  }

  if (!residentForm.value.relationshipToHead || residentForm.value.relationshipToHead.trim() === '') {
    ElMessage.error('请选择与户主关系')
    return false
  }

  if (!residentForm.value.villageGroup || residentForm.value.villageGroup.trim() === '') {
    ElMessage.error('请选择村组')
    return false
  }

  if (!residentForm.value.ethnicity || residentForm.value.ethnicity.trim() === '') {
    ElMessage.error('请选择民族')
    return false
  }

  // 对于非同户新增，需要验证户主信息
  if (isAddingNew.value && !currentHouseholdId.value) {
    if (!householdForm.value.householdHeadName || householdForm.value.householdHeadName.trim() === '') {
      ElMessage.error('请输入户主姓名')
      return false
    }

    if (!householdForm.value.householdHeadIdCard || householdForm.value.householdHeadIdCard.trim() === '') {
      ElMessage.error('请输入户主身份证号码')
      return false
    }

    if (!householdForm.value.address || householdForm.value.address.trim() === '') {
      ElMessage.error('请输入家庭地址')
      return false
    }

    if (!householdForm.value.villageGroup || householdForm.value.villageGroup.trim() === '') {
      ElMessage.error('请选择村组')
      return false
    }

    if (!householdForm.value.ethnicity || householdForm.value.ethnicity.trim() === '') {
      ElMessage.error('请选择民族')
      return false
    }
  }

  return true
}

// 新增居民
const addResidentData = async () => {
  if (isAddingNew.value && !currentHouseholdId.value) {
    // 非同户新增
    await addDifferentHouseholdResident()
  } else {
    // 同户新增
    await addSameHouseholdResident()
  }
}

// 同户新增居民
const addSameHouseholdResident = async () => {
  const householdId = currentHouseholdId.value || residentForm.value.householdId
  if (!householdId) {
    ElMessage.error('户ID不能为空，请重新打开对话框')
    return
  }

  const residentData = {
    name: residentForm.value.name,
    id_card: residentForm.value.idCard,
    gender: residentForm.value.gender,
    date_of_birth: residentForm.value.dateOfBirth,
    village_group: residentForm.value.villageGroup,
    Home_address: residentForm.value.address,
    bank_card: residentForm.value.bankCard,
    phone_number: residentForm.value.phoneNumber,
    bank_name: residentForm.value.bankName,
    household_id: householdId,
    household_head_id: householdForm.value.householdHeadId,
    ethnicity: residentForm.value.ethnicity,
    relationship_to_head: residentForm.value.relationshipToHead,
    marital_status: residentForm.value.maritalStatus,
    political_status: residentForm.value.politicalStatus,
    military_service: residentForm.value.militaryService,
    education_level: residentForm.value.educationLevel,
    status: 'active',
    registered_permanent_residence: residentForm.value.registeredPermanentResidence,
    registered_date: residentForm.value.registeredDate || new Date().toISOString().split('T')[0],
    equity_shares: residentForm.value.equityShares || 0
  }

  try {
    const res = await addResident(residentData)
    if (res.code === 20000) {
      ElMessage.success('新增居民成功')
      emit('refresh-list')
      await loadHouseholdMembers(householdId)
      handleSameHouseholdAdd()
    } else {
      ElMessage.error('新增居民失败')
    }
  } catch (error) {
    console.error('新增居民失败:', error)
    ElMessage.error('新增居民失败')
  }
}

// 非同户新增居民
const addDifferentHouseholdResident = async () => {
  try {
    // 创建户主
    const householdData = {
      household_number: householdForm.value.householdNumber || `HH${Date.now()}`,
      village_group: householdForm.value.villageGroup,
      household_head_name: householdForm.value.householdHeadName,
      household_head_id_card: householdForm.value.householdHeadIdCard,
      ethnicity: householdForm.value.ethnicity,
      household_type: householdForm.value.householdType,
      housing_type: householdForm.value.housingType,
      address: householdForm.value.address,
      phone_number: householdForm.value.phoneNumber,
      gender: householdForm.value.gender
    }

    const householdRes = await createHousehold(householdData)
    if (householdRes.code !== 20000 || !householdRes.data?.id) {
      throw new Error('创建户主失败')
    }

    const newHouseholdId = householdRes.data.id

    // 创建居民
    const residentData = {
      name: residentForm.value.name,
      id_card: residentForm.value.idCard,
      gender: residentForm.value.gender,
      date_of_birth: residentForm.value.dateOfBirth,
      village_group: residentForm.value.villageGroup,
      Home_address: residentForm.value.address,
      bank_card: residentForm.value.bankCard,
      phone_number: residentForm.value.phoneNumber,
      bank_name: residentForm.value.bankName,
      household_id: newHouseholdId,
      household_head_id: newHouseholdId,
      ethnicity: residentForm.value.ethnicity,
      relationship_to_head: '户主',
      marital_status: residentForm.value.maritalStatus,
      political_status: residentForm.value.politicalStatus,
      military_service: residentForm.value.militaryService,
      education_level: residentForm.value.educationLevel,
      status: 'active',
      registered_permanent_residence: residentForm.value.registeredPermanentResidence,
      registered_date: residentForm.value.registeredDate || new Date().toISOString().split('T')[0]
    }

    const residentRes = await addResident(residentData)
    if (residentRes.code === 20000) {
      ElMessage.success('新增居民成功')
      emit('refresh-list')
      resetFormData()
    } else {
      throw new Error('创建居民失败')
    }
  } catch (error) {
    console.error('新增居民失败:', error)
    ElMessage.error('新增居民失败')
  }
}

// 更新居民
const updateResidentData = async () => {
  try {
    const residentData = {
      name: residentForm.value.name,
      id_card: residentForm.value.idCard,
      gender: residentForm.value.gender,
      date_of_birth: residentForm.value.dateOfBirth,
      village_group: residentForm.value.villageGroup,
      Home_address: residentForm.value.address,
      bank_card: residentForm.value.bankCard,
      phone_number: residentForm.value.phoneNumber,
      bank_name: residentForm.value.bankName,
      household_id: currentHouseholdId.value,
      household_head_id: householdForm.value.householdHeadId,
      ethnicity: residentForm.value.ethnicity,
      relationship_to_head: residentForm.value.relationshipToHead,
      marital_status: residentForm.value.maritalStatus,
      political_status: residentForm.value.politicalStatus,
      military_service: residentForm.value.militaryService,
      education_level: residentForm.value.educationLevel,
      status: residentForm.value.status,
      death_date: residentForm.value.deathDate || null,
      equity_shares: residentForm.value.equityShares || 0
    }

    // 更新居民信息
    const res = await updateResident(currentResidentId.value!.toString(), residentData)
    if (res.code !== 20000) {
      throw new Error('更新居民信息失败')
    }

    // 更新户主信息
    const householdData = {
      household_number: householdForm.value.householdNumber,
      village_group: householdForm.value.villageGroup,
      household_head_id: householdForm.value.householdHeadId,
      household_head_name: householdForm.value.householdHeadName,
      ethnicity: householdForm.value.ethnicity,
      household_type: householdForm.value.householdType,
      housing_type: householdForm.value.housingType,
      address: householdForm.value.address,
      phone_number: householdForm.value.phoneNumber,
      gender: householdForm.value.gender,
      household_head_id_card: householdForm.value.householdHeadIdCard
    }

    await updateHousehold(currentHouseholdId.value!, householdData)

    ElMessage.success('更新居民信息成功')
    emit('refresh-list')
    await initData()
    isEditable.value = false
    title.value = '居民详细信息'
  } catch (error) {
    console.error('更新信息失败:', error)
    ElMessage.error('更新信息失败')
  }
}

// 打开更换户主对话框
const openChangeHeadDialog = () => {
  // 重置对话框状态
  changeHeadType.value = 'same'
  newHeadId.value = null
  oldHeadNewRelationship.value = ''
  targetHouseholdHeadName.value = ''
  selectedTargetHousehold.value = null
  
  // 如果当前用户不是户主，自动将自己设为新户主（同户更换时）
  if (!isCurrentUserHead.value) {
    newHeadId.value = currentResidentId.value
  }
  
  changeHeadDialogVisible.value = true
}

// 搜索目标户主建议
const fetchHouseholdHeadSuggestions = async (queryString: string, cb: any) => {
  if (!queryString || queryString.length < 1) {
    cb([])
    return
  }
  
  try {
    const res = await getSearchSuggestions({ keyword: queryString, type: 'householdHeadNames' })
    if (res.code === 20000 && res.householdHeadNames) {
      // 过滤掉当前家庭
      const results = res.householdHeadNames.filter((item: any) => 
        item.householdNumber !== currentHouseholdId.value
      ).map((item: any) => ({
        householdNumber: item.householdNumber,
        householdHeadName: item.householdHeadName,
        address: item.address,
        householdHeadId: item.householdHeadId,
        value: item.householdHeadName
      }))
      cb(results)
    } else {
      cb([])
    }
  } catch (error) {
    console.error('搜索户主失败:', error)
    cb([])
  }
}

// 选择目标家庭
const handleTargetHouseholdSelect = (item: any) => {
  selectedTargetHousehold.value = item
}

// 确认更换户主
const confirmChangeHead = async () => {
  // 验证
  if (!oldHeadNewRelationship.value) {
    ElMessage.error('请选择与户主的关系')
    return
  }

  loading.value = true
  try {
    let res
    
    if (changeHeadType.value === 'same') {
      // 同户更换
      if (!newHeadId.value) {
        ElMessage.error('请选择新户主')
        loading.value = false
        return
      }
      
      res = await request.post({
        url: `/households/${currentHouseholdId.value}/change-head`,
        data: {
          newHeadResidentId: newHeadId.value,
          oldHeadNewRelationship: oldHeadNewRelationship.value
        }
      })
    } else {
      // 跨户迁移
      if (!selectedTargetHousehold.value) {
        ElMessage.error('请选择目标家庭')
        loading.value = false
        return
      }
      
      res = await request.post({
        url: `/residents/${currentResidentId.value}/migrate-household`,
        data: {
          targetHouseholdNumber: selectedTargetHousehold.value.householdNumber,
          targetHouseholdHeadId: selectedTargetHousehold.value.householdHeadId,
          relationshipToHead: oldHeadNewRelationship.value
        }
      })
    }

    if (res.code === 20000) {
      ElMessage.success(changeHeadType.value === 'same' ? '更换户主成功' : '迁移家庭成功')
      changeHeadDialogVisible.value = false
      await initData()
      emit('refresh-list')
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (error: any) {
    console.error('操作失败:', error)
    ElMessage.error(error?.response?.data?.message || '操作失败')
  } finally {
    loading.value = false
  }
}

// 处理户主信息下拉菜单命令
const handleHouseholdCommand = (command: string) => {
  console.log('handleHouseholdCommand 被调用:', command)
  if (command === 'changeHead') {
    openChangeHeadDialog()
  } else if (command === 'splitHousehold') {
    handleSplitHousehold()
  }
}

// 独立成户处理
const handleSplitHousehold = async () => {
  console.log('handleSplitHousehold 被调用', {
    currentResidentId: currentResidentId.value,
    isCurrentUserHead: isCurrentUserHead.value,
    relationshipToHead: residentForm.value.relationshipToHead
  })
  
  if (isCurrentUserHead.value) {
    ElMessage.warning('当前居民是户主，无法独立成户')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定将 "${residentForm.value.name}" 独立成户吗？\n\n独立后该居民将成为新户主，与原家庭分离。`,
      '确认独立成户',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }

  loading.value = true
  try {
    const res = await request.post({
      url: `/residents/${currentResidentId.value}/split-household`,
      data: {
        keepAddress: true,
        keepVillageGroup: true
      }
    })

    if (res.code === 20000) {
      ElMessage.success('独立成户成功')
      emit('refresh-list')
      dialogVisible.value = false
    } else {
      ElMessage.error(res.message || '独立成户失败')
    }
  } catch (error: any) {
    console.error('独立成户失败:', error)
    ElMessage.error(error?.response?.data?.message || '独立成户失败')
  } finally {
    loading.value = false
  }
}

// 切换迁途改销展开状态
const toggleMigration = () => {
  isMigrationExpanded.value = !isMigrationExpanded.value
}

// 切换迁途改销编辑模式
const toggleMigrationEdit = () => {
  isMigrationEditable.value = true
  originalMigrationForm.value = JSON.parse(JSON.stringify(migrationForm.value))
}

// 取消迁途改销编辑
const cancelMigrationEdit = () => {
  isMigrationEditable.value = false
  migrationForm.value = JSON.parse(JSON.stringify(originalMigrationForm.value))
}

// 切换显示/隐藏非active成员
const toggleShowInactive = () => {
  showInactiveMembers.value = !showInactiveMembers.value
  filterHouseholdMembers()
}

// 过滤家庭成员列表
const filterHouseholdMembers = () => {
  if (showInactiveMembers.value) {
    filteredHouseholdMembers.value = [...householdMembers.value]
  } else {
    filteredHouseholdMembers.value = householdMembers.value.filter(member => member.status === 'active' || member.status === undefined)
  }
}

// 点击成员列表行，切换编辑当前成员
const handleMemberRowClick = async (row: any) => {
  // 避免重复点击同一个成员
  if (currentResidentId.value === row.id) {
    return
  }
  
  // 重置编辑状态，避免按钮显示状态变化导致闪烁
  isEditable.value = false
  title.value = '居民详细信息'
  
  currentResidentId.value = row.id
  currentHouseholdId.value = row.householdId || row.household_id
  
  // 静默加载数据，不显示loading，避免按钮闪烁
  try {
    await Promise.all([
      loadHouseholdInfo(currentHouseholdId.value!),
      loadResidentInfo(currentResidentId.value!)
      // 不重新加载家庭成员列表，避免表格闪烁
    ])
  } catch (error) {
    console.error('切换成员失败:', error)
  }
}

// 获取成员状态文本
const getMemberStatusText = (status: string) => {
  switch (status) {
    case 'active': return '正常'
    case 'migrated_out': return '迁出'
    case 'deceased': return '死亡'
    default: return '未知'
  }
}

// 获取成员状态类型
const getMemberStatusType = (status: string) => {
  switch (status) {
    case 'active': return 'success'
    case 'migrated_out': return 'warning'
    case 'deceased': return 'danger'
    default: return 'info'
  }
}

// 迁途改销统一保存处理
const handleMigrationSave = async () => {
  const params: any = {}
  let successMsg = ''

  // 检查哪些字段有内容，决定要执行的操作
  if (migrationForm.value.migrationInDate) {
    params.migration_in_date = migrationForm.value.migrationInDate
    params.migration_in_reason = migrationForm.value.migrationInReason
    params.status = 'active'
    successMsg = '迁入信息保存成功'
  }

  if (migrationForm.value.migrationOutDate) {
    params.migration_out_date = migrationForm.value.migrationOutDate
    params.migration_out_reason = migrationForm.value.migrationOutReason
    params.status = 'migrated_out'
    successMsg = '迁出信息保存成功'
  }

  if (migrationForm.value.deathDate) {
    params.death_date = migrationForm.value.deathDate
    params.death_reason = migrationForm.value.deathReason
    params.status = 'deceased'
    successMsg = '死亡注销成功'
  }

  if (migrationForm.value.recoveryReason) {
    params.recovery_reason = migrationForm.value.recoveryReason
    params.status = 'active'
    successMsg = '状态恢复成功'
  }

  if (!successMsg) {
    ElMessage.warning('请填写至少一项信息')
    return
  }

  try {
    // 使用专门的 status 接口，会记录变动日志
    const res = await updateResidentStatus(currentResidentId.value!.toString(), params)
    if (res.code === 20000) {
      ElMessage.success(successMsg)
      isMigrationEditable.value = false
      await initData()
      emit('refresh-list')
    } else {
      ElMessage.error('保存失败')
    }
  } catch (error) {
    console.error('保存迁途改销信息失败:', error)
    ElMessage.error('保存失败')
  }
}

// 组件挂载时加载字典数据
onMounted(() => {
  loadAllDictionaries()
})
</script>

<style scoped lang="less">
/* 对话框头部样式，将标题和按钮放在同一行 */
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  .dialog-title {
    font-size: 16px;
    font-weight: 600;
  }

  .dialog-header-buttons {
    display: flex;
    gap: 8px;
    min-height: 32px;
    align-items: center;

    .dropdown-trigger-btn {
      padding: 0 8px;
      min-width: 32px;

      .el-icon {
        font-size: 14px;
      }
    }
  }
}

// 标题栏下拉菜单弹出层样式
:deep(.header-dropdown-popper) {
  z-index: 30001 !important;
}

/* 注意：禁用输入框背景样式已在全局样式文件 index.less 中定义 */

// 只读文本样式 - 固定宽度与输入框一致
.readonly-text {
  padding: 0 12px;
  height: 24px;
  line-height: 24px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #ffffff;
  color: #606266;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  box-sizing: border-box;
}

.info-card {
  margin-bottom: 10px;
  overflow: visible;

  :deep(.el-card__header) {
    position: relative;
    z-index: 1;
    overflow: visible;
  }

  :deep(.el-card__body) {
    overflow: visible;
  }
}

.compact-form {
  :deep(.el-form-item) {
    margin-bottom: 8px;

    // 确保表单项内容区宽度一致
    .el-form-item__content {
      width: calc(100% - 80px); // 减去标签宽度

      // 输入框、选择器、日期选择器统一宽度
      .el-input,
      .el-select,
      .el-date-editor {
        width: 100%;
      }
    }
  }

  :deep(.el-form-item__label) {
    font-size: 13px;
    padding-right: 8px;
    width: 80px;
  }
}

.compact-table {
  :deep(.el-table__cell) {
    padding: 4px 0;
  }

  :deep(.cell) {
    font-size: 13px;
  }
}

.clearfix {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .header-button {
    padding: 0;

    // 菜单栏风格的箭头图标
    &.toggle-arrow-icon {
      font-size: 16px;
      color: #409EFF;
      cursor: pointer;
      transition: transform 0.3s ease;
      padding: 4px;
      border-radius: 4px;

      &:hover {
        background-color: rgba(64, 158, 255, 0.1);
      }

      // 展开时旋转箭头
      &.is-expanded {
        transform: rotate(180deg);
      }
    }
  }
}

.age-text {
  color: #304156;
  font-weight: normal;
}

.migration-form {
  padding: 10px 0;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.migration-buttons {
  margin-top: 15px;
  text-align: right;
}

</style>