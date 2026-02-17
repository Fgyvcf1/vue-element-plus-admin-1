<template>
  <div class="app-container">
    <el-card>
      <div class="page-header">
        <div>
          <div class="page-title">通知配置</div>
          <div class="page-subtitle">用于配置生日提醒等系统通知参数</div>
        </div>
        <el-tag type="info">共 {{ total }} 条配置</el-tag>
      </div>

      <el-form :inline="true" :model="queryParams" class="query-form">
        <el-form-item label="配置组">
          <el-select
            v-model="queryParams.group"
            placeholder="全部"
            clearable
            size="small"
            style="width: 160px"
            @change="handleQuery"
          >
            <el-option
              v-for="item in groupOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关键字">
          <el-input
            v-model="queryParams.keyword"
            placeholder="配置名称/键/描述"
            clearable
            size="small"
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" @click="handleQuery">查询</el-button>
          <el-button size="small" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-row class="action-row">
        <el-col :span="12">
          <el-button type="primary" size="small" :icon="Plus" @click="handleAdd">
            新增配置
          </el-button>
          <el-button
            type="success"
            size="small"
            :icon="Check"
            :disabled="selectedConfigs.length === 0"
            @click="handleBatchSave"
          >
            批量保存
          </el-button>
        </el-col>
      </el-row>

      <el-table
        v-loading="loading"
        :data="configList"
        size="small"
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="config_name" label="配置名称" width="200" />
        <el-table-column prop="config_key" label="配置键" width="200">
          <template #default="{ row }">
            <el-tag size="small">{{ row.config_key }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="config_group" label="配置组" width="120">
          <template #default="{ row }">
            <el-tag :type="row.config_group === 'notification' ? 'warning' : 'info'" size="small">
              {{ getGroupLabel(row.config_group) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="配置值" min-width="200">
          <template #default="{ row }">
            <el-input
              v-if="row.value_type === 'string'"
              v-model="row.config_value"
              placeholder="请输入配置值"
              @change="handleConfigChange(row)"
            />
            <el-input-number
              v-else-if="row.value_type === 'number'"
              v-model="row.config_value"
              :min="0"
              @change="handleConfigChange(row)"
            />
            <el-switch
              v-else-if="row.value_type === 'boolean'"
              v-model="row.config_value"
              :active-value="'1'"
              :inactive-value="'0'"
              @change="handleConfigChange(row)"
            />
            <el-time-picker
              v-else-if="row.value_type === 'time'"
              v-model="row.config_value"
              value-format="HH:mm:ss"
              @change="handleConfigChange(row)"
            />
            <el-input
              v-else
              v-model="row.config_value"
              placeholder="请输入配置值"
              @change="handleConfigChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="is_system" label="系统配置" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_system === 1 ? 'danger' : 'success'" size="small">
              {{ row.is_system === 1 ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link size="small" type="primary" @click="handleSave(row)">保存</el-button>
            <el-button
              v-if="row.is_system !== 1"
              link
              size="small"
              type="danger"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form ref="configFormRef" :model="configForm" :rules="configRules" label-width="100px">
        <el-form-item label="配置名称" prop="config_name">
          <el-input v-model="configForm.config_name" placeholder="请输入配置名称" />
        </el-form-item>
        <el-form-item label="配置键" prop="config_key">
          <el-input v-model="configForm.config_key" placeholder="请输入配置键（英文）" />
        </el-form-item>
        <el-form-item label="配置组" prop="config_group">
          <el-select
            v-model="configForm.config_group"
            placeholder="请选择配置组"
            style="width: 100%"
          >
            <el-option
              v-for="item in groupOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="值类型" prop="value_type">
          <el-select v-model="configForm.value_type" placeholder="请选择值类型" style="width: 100%">
            <el-option label="字符串" value="string" />
            <el-option label="数字" value="number" />
            <el-option label="布尔值" value="boolean" />
            <el-option label="时间" value="time" />
          </el-select>
        </el-form-item>
        <el-form-item label="配置值" prop="config_value">
          <el-input v-model="configForm.config_value" placeholder="请输入配置值" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="configForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Check } from '@element-plus/icons-vue'
import {
  getConfigList,
  getConfigGroups,
  createConfig,
  updateConfig,
  updateConfigsBatch,
  deleteConfig
} from '@/api/config'

const loading = ref(false)
const configList = ref<any[]>([])
const total = ref(0)
const groupOptions = ref<{ label: string; value: string }[]>([])
const selectedConfigs = ref<any[]>([])

const queryParams = reactive({
  page: 1,
  pageSize: 20,
  group: 'notification',
  keyword: ''
})

const dialogVisible = ref(false)
const dialogTitle = ref('新增配置')
const configFormRef = ref<FormInstance>()
const configForm = reactive({
  config_name: '',
  config_key: '',
  config_group: 'notification',
  value_type: 'string',
  config_value: '',
  description: ''
})

const configRules: FormRules = {
  config_name: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
  config_key: [
    { required: true, message: '请输入配置键', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
      message: '配置键只能包含字母、数字和下划线，且不能以数字开头',
      trigger: 'blur'
    }
  ],
  config_group: [{ required: true, message: '请选择配置组', trigger: 'change' }],
  value_type: [{ required: true, message: '请选择值类型', trigger: 'change' }],
  config_value: [{ required: true, message: '请输入配置值', trigger: 'blur' }]
}

const getGroupLabel = (group?: string) => {
  if (group === 'notification') return '通知配置'
  if (group === 'system') return '系统配置'
  if (group === 'dictionary') return '字典配置'
  return group || ''
}

const normalizeValueType = (row: any) => {
  if (row.value_type === 'number' && row.config_value !== null && row.config_value !== undefined) {
    const numeric = Number(row.config_value)
    row.config_value = Number.isNaN(numeric) ? 0 : numeric
  }
  return row
}

const getList = async () => {
  loading.value = true
  try {
    const res = await getConfigList({
      page: queryParams.page,
      pageSize: queryParams.pageSize,
      group: queryParams.group,
      keyword: queryParams.keyword
    })
    const data = res.data || {}
    configList.value = (data.list || []).map((item: any) => normalizeValueType({ ...item }))
    total.value = data.total || 0
  } catch (error) {
    console.error('获取配置列表失败:', error)
    ElMessage.error('获取配置列表失败')
  } finally {
    loading.value = false
  }
}

const fetchConfigGroups = async () => {
  try {
    const res = await getConfigGroups()
    groupOptions.value = res.data || []
  } catch (error) {
    console.error('获取配置组失败:', error)
  }
}

const handleQuery = () => {
  queryParams.page = 1
  getList()
}

const resetQuery = () => {
  queryParams.page = 1
  queryParams.pageSize = 20
  queryParams.group = 'notification'
  queryParams.keyword = ''
  getList()
}

const handleSelectionChange = (val: any[]) => {
  selectedConfigs.value = val
}

const handleConfigChange = (row: any) => {
  row.changed = true
}

const handleSave = async (row: any) => {
  try {
    let value = row.config_value
    if (row.value_type === 'number') {
      value = String(value ?? '')
    }
    const res = await updateConfig(row.config_key, value)
    if (res.code === 20000) {
      ElMessage.success('保存成功')
      row.changed = false
    }
  } catch (error) {
    console.error('保存配置失败:', error)
    ElMessage.error('保存配置失败')
  }
}

const handleBatchSave = async () => {
  const changedConfigs = selectedConfigs.value.filter((item) => item.changed)
  if (changedConfigs.length === 0) {
    ElMessage.warning('没有需要保存的配置')
    return
  }

  try {
    const configs = changedConfigs.map((item) => ({
      key: item.config_key,
      value: item.value_type === 'number' ? String(item.config_value ?? '') : item.config_value
    }))
    const res = await updateConfigsBatch(configs)
    if (res.code === 20000) {
      ElMessage.success(`成功保存 ${res.data?.updated ?? configs.length} 条配置`)
      getList()
    }
  } catch (error) {
    console.error('批量保存失败:', error)
    ElMessage.error('批量保存失败')
  }
}

const handleAdd = () => {
  dialogTitle.value = '新增配置'
  dialogVisible.value = true
  configForm.config_name = ''
  configForm.config_key = ''
  configForm.config_group = 'notification'
  configForm.value_type = 'string'
  configForm.config_value = ''
  configForm.description = ''
  configFormRef.value?.resetFields()
}

const handleSubmit = () => {
  configFormRef.value?.validate(async (valid) => {
    if (!valid) return
    try {
      const res = await createConfig({
        key: configForm.config_key,
        value: configForm.config_value,
        name: configForm.config_name,
        group: configForm.config_group,
        type: configForm.value_type,
        description: configForm.description
      })
      if (res.code === 20000) {
        ElMessage.success('创建成功')
        dialogVisible.value = false
        getList()
      }
    } catch (error) {
      console.error('创建配置失败:', error)
      ElMessage.error('创建配置失败')
    }
  })
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确认删除该配置吗？', '提示', { type: 'warning' })
    const res = await deleteConfig(row.config_key)
    if (res.code === 20000) {
      ElMessage.success('删除成功')
      getList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除配置失败:', error)
      ElMessage.error('删除配置失败')
    }
  }
}

onMounted(() => {
  fetchConfigGroups()
  getList()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.page-subtitle {
  margin-top: 4px;
  color: #909399;
  font-size: 13px;
}

.query-form {
  margin-bottom: 12px;
}

.action-row {
  margin-bottom: 12px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
