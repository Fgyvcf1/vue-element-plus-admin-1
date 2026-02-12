<template>
  <div class="app-container">
    <el-card>
      <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="居民姓名">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入居民姓名"
            clearable
            size="small"
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="身份证号">
          <el-input
            v-model="queryParams.idCard"
            placeholder="请输入身份证号"
            clearable
            size="small"
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="残疾类型">
          <el-select
            v-model="queryParams.disabilityType"
            placeholder="请选择残疾类型"
            clearable
            size="small"
            style="width: 150px"
            @change="handleQuery"
          >
            <el-option
              v-for="item in disabilityTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="残疾等级">
          <el-select
            v-model="queryParams.disabilityLevel"
            placeholder="请选择残疾等级"
            clearable
            size="small"
            style="width: 150px"
            @change="handleQuery"
          >
            <el-option
              v-for="item in disabilityLevelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" :icon="Search" @click="handleQuery">搜索</el-button>
          <el-button size="small" :icon="Refresh" @click="resetQuery">重置</el-button>
          <el-button type="info" size="small" :icon="Download" @click="handleExport">导出</el-button>
        </el-form-item>
      </el-form>

      <el-table
        v-loading="loading"
        :data="disabledList"
        size="small"
        style="width: 100%"
        fit
        :header-cell-style="{ textAlign: 'center', whiteSpace: 'normal', lineHeight: '1.4' }"
        @row-click="handleRowClick"
      >
        <el-table-column type="index" width="30" align="center" />
        <el-table-column prop="name" label="居民姓名" align="center" width="80" />
        <el-table-column prop="idCard" label="身份证号" align="center" width="160" />
        <el-table-column prop="gender" label="性别" align="center" width="40" />
        <el-table-column prop="age" label="年龄" align="center" width="40" />
        <el-table-column prop="disabilityType" label="残疾类型" align="center" width="100" />
        <el-table-column prop="disabilityLevel" label="残疾等级" align="center" width="100" />
        <el-table-column prop="certificateNumber" label="残疾证号" align="center" width="160" />
        <el-table-column prop="guardianName" label="监护人姓名" align="center" width="100" />
        <el-table-column prop="guardianPhone" label="监护人电话" align="center" width="120" />
      </el-table>

      <!-- 详情模态框 -->
      <el-dialog
        v-model="dialogVisible"
        title="残疾人信息详情"
        width="70%"
        :close-on-click-modal="true"
        @close="handleDialogClose"
      >
        <div style="margin-bottom: 16px; text-align: right;">
          <el-button v-if="!isEditing" type="primary" size="small" @click="handleEditDetail">编辑</el-button>
          <template v-else>
            <el-button type="primary" size="small" @click="handleSave">保存</el-button>
            <el-button size="small" @click="handleCancelEdit">取消</el-button>
          </template>
        </div>

        <!-- 第一部分：户主信息 -->
        <el-card shadow="hover" class="info-card" style="margin-bottom: 16px;">
          <template #header>
            <div class="clearfix">
              <span>户主信息</span>
            </div>
          </template>
          <el-form :model="householdInfo" label-width="100px" size="small">
            <el-row :gutter="12">
              <el-col :span="8">
                <el-form-item label="户主姓名">
                  <el-input v-model="householdInfo.householdHeadName" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="身份证号">
                  <el-input v-model="householdInfo.householdHeadIdCard" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="联系电话">
                  <el-input v-model="householdInfo.phoneNumber" disabled />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>

        <!-- 第二部分：残疾人个人信息 -->
        <el-card shadow="hover" class="info-card" style="margin-bottom: 16px;">
          <template #header>
            <div class="clearfix">
              <span>残疾人个人信息</span>
            </div>
          </template>
          <el-form :model="personInfo" label-width="100px" size="small">
            <el-row :gutter="12">
              <el-col :span="8">
                <el-form-item label="姓名">
                  <el-input v-model="personInfo.name" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="性别">
                  <el-input v-model="personInfo.gender" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="年龄">
                  <el-input v-model="personInfo.age" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="身份证号">
                  <el-input v-model="personInfo.idCard" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="16">
                <el-form-item label="家庭住址">
                  <el-input v-model="personInfo.address" disabled />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>

        <!-- 第三部分：残疾信息 -->
        <el-card shadow="hover" class="info-card" style="margin-bottom: 16px;">
          <template #header>
            <div class="clearfix">
              <span>残疾信息</span>
            </div>
          </template>
          <el-form :model="disabilityInfo" label-width="100px" size="small">
            <el-row :gutter="12">
              <el-col :span="8">
                <el-form-item label="残疾类型">
                  <el-select v-model="disabilityInfo.disabilityType" :disabled="!isEditing" style="width: 100%">
                    <el-option
                      v-for="item in disabilityTypeOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="残疾等级">
                  <el-select v-model="disabilityInfo.disabilityLevel" :disabled="!isEditing" style="width: 100%">
                    <el-option label="一级" value="一级" />
                    <el-option label="二级" value="二级" />
                    <el-option label="三级" value="三级" />
                    <el-option label="四级" value="四级" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="持证状态">
                  <el-select v-if="isEditing" v-model="disabilityInfo.certificateStatus" placeholder="请选择持证状态" style="width: 100%">
                    <el-option label="在持" value="在持" />
                    <el-option label="注销" value="注销" />
                  </el-select>
                  <el-tag v-else :type="disabilityInfo.certificateStatus === '在持' ? 'success' : 'info'" size="medium">
                    {{ disabilityInfo.certificateStatus }}
                  </el-tag>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="残疾证号">
                  <el-input v-model="disabilityInfo.certificateNumber" :disabled="!isEditing" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="初次发证日期">
                  <el-date-picker
                    v-model="disabilityInfo.issueDate"
                    type="date"
                    placeholder="选择日期"
                    value-format="YYYY-MM-DD"
                    :disabled="!isEditing"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>

        <!-- 第四部分：监护人信息 -->
        <el-card shadow="hover" class="info-card">
          <template #header>
            <div class="clearfix">
              <span>监护人信息</span>
            </div>
          </template>
          <el-form :model="guardianInfo" label-width="100px" size="small">
            <el-row :gutter="12">
              <el-col :span="8">
                <el-form-item label="监护人姓名">
                  <el-input v-model="guardianInfo.guardianName" :disabled="!isEditing" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="监护人电话">
                  <el-input v-model="guardianInfo.guardianPhone" :disabled="!isEditing" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="与残疾人关系">
                  <el-input v-model="guardianInfo.guardianRelationship" :disabled="!isEditing" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-card>

        <template #footer>
          <div class="dialog-footer">
            <el-button @click="dialogVisible = false">关闭</el-button>
          </div>
        </template>
      </el-dialog>

      <div v-if="total > 0" class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
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
  ElTable,
  ElTableColumn,
  ElTag,
  ElPagination,
  ElEmpty,
  ElDialog,
  ElDatePicker
} from 'element-plus'
import { Search, Refresh, Download } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'
import { getDisabledPersons, getDisabledPerson, updateDisabledPerson } from '@/api/disabled'
import { getDictionaryByCategory } from '@/api/dictionary'
import ExcelJS from 'exceljs'

const router = useRouter()
const queryFormRef = ref<FormInstance>()

const loading = ref(false)
const disabledList = ref<any[]>([])
const total = ref(0)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  name: '',
  idCard: '',
  disabilityType: '',
  disabilityLevel: ''
})

const dialogVisible = ref(false)
const isEditing = ref(false)
const selectedDisabledPersonId = ref<number | null>(null)

// 详情信息
const householdInfo = reactive({
  householdHeadName: '',
  householdHeadIdCard: '',
  phoneNumber: ''
})

const personInfo = reactive({
  name: '',
  gender: '',
  age: '',
  idCard: '',
  address: ''
})

const disabilityInfo = reactive({
  disabilityType: '',
  disabilityLevel: '',
  certificateStatus: '在持',
  certificateNumber: '',
  issueDate: ''
})

const guardianInfo = reactive({
  guardianName: '',
  guardianPhone: '',
  guardianRelationship: ''
})

const disabilityTypeOptions = ref<{ label: string; value: string }[]>([])
const disabilityLevelOptions = ref<{ label: string; value: string }[]>([])

const loadDictionaries = async () => {
  try {
    const typeRes = await getDictionaryByCategory('残疾类型')
    disabilityTypeOptions.value = (typeRes.data || []).map((item: any) => ({
      label: item.value,
      value: item.value
    }))

    const levelRes = await getDictionaryByCategory('残疾等级')
    disabilityLevelOptions.value = (levelRes.data || []).map((item: any) => ({
      label: item.value,
      value: item.value
    }))
  } catch (error) {
    console.error('加载字典数据失败:', error)
  }
}

const getList = async () => {
  loading.value = true
  try {
    const response = await getDisabledPersons(queryParams)
    // 注意：经过响应拦截器处理后，response 直接是后端返回的数据结构
    disabledList.value = response.data || []
    total.value = response.total || 0
  } catch (error) {
    console.error('获取残疾人数据失败:', error)
    ElMessage.error('获取残疾人数据失败')
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.pageNum = 1
  getList()
}

const resetQuery = () => {
  queryFormRef.value?.resetFields()
  handleQuery()
}

const handleRowClick = async (row: any) => {
  selectedDisabledPersonId.value = row.id
  dialogVisible.value = true
  isEditing.value = false

  try {
    const response = await getDisabledPerson(row.id)
    // 注意：经过响应拦截器处理后，response 直接是后端返回的数据结构
    if (response.data) {
      const data = response.data

      // 填充户主信息
      Object.assign(householdInfo, {
        householdHeadName: data.householdHeadName || '',
        householdHeadIdCard: data.householdHeadIdCard || '',
        phoneNumber: data.phoneNumber || ''
      })

      // 填充个人信息
      Object.assign(personInfo, {
        name: data.name || '',
        gender: data.gender || '',
        age: data.age || '',
        idCard: data.idCard || '',
        address: data.address || ''
      })

      // 填充残疾信息
      Object.assign(disabilityInfo, {
        disabilityType: data.disabilityType || '',
        disabilityLevel: data.disabilityLevel || '',
        certificateStatus: data.certificateStatus || '在持',
        certificateNumber: data.certificateNumber || '',
        issueDate: data.issueDate || ''
      })

      // 填充监护人信息
      Object.assign(guardianInfo, {
        guardianName: data.guardianName || '',
        guardianPhone: data.guardianPhone || '',
        guardianRelationship: data.guardianRelationship || ''
      })
    }
  } catch (error) {
    console.error('获取残疾人详情失败:', error)
    ElMessage.error('获取残疾人详情失败')
  }
}

const handleDialogClose = () => {
  selectedDisabledPersonId.value = null
  isEditing.value = false
}

const handleEditDetail = () => {
  isEditing.value = true
}

const handleCancelEdit = () => {
  isEditing.value = false
  // 重新加载数据，恢复原始值
  if (selectedDisabledPersonId.value) {
    handleRowClick({ id: selectedDisabledPersonId.value })
  }
}

const handleSave = async () => {
  try {
    if (!selectedDisabledPersonId.value) {
      ElMessage.error('记录ID丢失，无法保存')
      return
    }

    // 构建更新数据
    const updateData = {
      disability_type: disabilityInfo.disabilityType,
      disability_level: disabilityInfo.disabilityLevel,
      certificate_number: disabilityInfo.certificateNumber || null,
      certificate_status: disabilityInfo.certificateStatus,
      issue_date: disabilityInfo.issueDate || null,
      guardian_name: guardianInfo.guardianName || null,
      guardian_phone: guardianInfo.guardianPhone || null,
      guardian_relationship: guardianInfo.guardianRelationship || null
    }

    console.log('准备更新的数据:', updateData)

    // 调用更新API
    await updateDisabledPerson(selectedDisabledPersonId.value, updateData)
    ElMessage.success('保存成功')
    isEditing.value = false
    getList()
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  }
}

const handleExport = () => {
  // 导出逻辑
}

onMounted(() => {
  loadDictionaries()
  getList()
})
</script>

<style scoped>
.demo-form-inline .el-form-item {
  margin-bottom: 16px;
}
.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.info-card {
  margin-bottom: 16px;
}

.clearfix {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>