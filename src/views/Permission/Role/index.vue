<template>
  <div class="app-container">
    <el-card>
      <div class="header-actions">
        <el-button v-hasPermi="'system:role'" type="primary" @click="handleAdd">新增角色</el-button>
      </div>

      <el-table v-loading="loading" :data="roleList" style="width: 100%">
        <el-table-column type="index" width="50" label="序号" align="center" />
        <el-table-column prop="role_name" label="角色名称" align="center" />
        <el-table-column prop="role_code" label="角色编码" align="center" />
        <el-table-column prop="description" label="描述" align="center" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="200">
          <template #default="{ row }">
            <el-button v-hasPermi="'system:role'" link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button v-hasPermi="'system:role'" link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="角色名称" required>
          <el-input v-model="formData.role_name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色编码" required>
          <el-input v-model="formData.role_code" placeholder="请输入角色编码" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="权限配置">
          <div class="permission-tree">
            <div v-for="(permissions, module) in permissionGroups" :key="module" class="module-group">
              <div class="module-title">{{ getModuleName(module) }}</div>
              <el-checkbox-group v-model="formData.permissionIds">
                <el-checkbox
                  v-for="perm in permissions"
                  :key="perm.id"
                  :label="perm.id"
                >
                  {{ perm.description }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ElCard,
  ElButton,
  ElTable,
  ElTableColumn,
  ElTag,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElRadioGroup,
  ElRadio,
  ElCheckboxGroup,
  ElCheckbox
} from 'element-plus'
import { getRoles, getRoleById, createRole, updateRole, deleteRole, getPermissionsByModule } from '@/api/permission'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const dialogTitle = ref('新增角色')
const roleList = ref<any[]>([])
const permissionGroups = ref<any>({})

const formData = reactive({
  id: null as number | null,
  role_name: '',
  role_code: '',
  description: '',
  status: 'active',
  permissionIds: [] as number[]
})

const moduleNames: Record<string, string> = {
  resident: '居民管理',
  special: '特殊人群管理',
  organization: '机构管理',
  mediation: '人民调解',
  todo: '待办提醒',
  system: '系统管理'
}

const getModuleName = (module: string) => moduleNames[module] || module

const loadRoles = async () => {
  loading.value = true
  try {
    const res = await getRoles()
    roleList.value = res.data || []
  } catch (error) {
    console.error('获取角色列表失败:', error)
    ElMessage.error('获取角色列表失败')
  } finally {
    loading.value = false
  }
}

const loadPermissions = async () => {
  try {
    const res = await getPermissionsByModule()
    permissionGroups.value = res.data || {}
  } catch (error) {
    console.error('获取权限列表失败:', error)
  }
}

const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增角色'
  formData.id = null
  formData.role_name = ''
  formData.role_code = ''
  formData.description = ''
  formData.status = 'active'
  formData.permissionIds = []
  dialogVisible.value = true
}

const handleEdit = async (row: any) => {
  isEdit.value = true
  dialogTitle.value = '编辑角色'
  try {
    const res = await getRoleById(row.id)
    const data = res.data
    formData.id = data.id
    formData.role_name = data.role_name
    formData.role_code = data.role_code
    formData.description = data.description
    formData.status = data.status
    formData.permissionIds = data.permissionIds || []
    dialogVisible.value = true
  } catch (error) {
    console.error('获取角色详情失败:', error)
    ElMessage.error('获取角色详情失败')
  }
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确认删除该角色吗？', '提示', { type: 'warning' })
    await deleteRole(row.id)
    ElMessage.success('删除成功')
    loadRoles()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const handleSubmit = async () => {
  if (!formData.role_name || !formData.role_code) {
    ElMessage.warning('请填写完整信息')
    return
  }

  submitLoading.value = true
  try {
    const data = {
      role_name: formData.role_name,
      role_code: formData.role_code,
      description: formData.description,
      status: formData.status,
      permissionIds: formData.permissionIds
    }

    if (isEdit.value && formData.id) {
      await updateRole(formData.id, data)
      ElMessage.success('更新成功')
    } else {
      await createRole(data)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadRoles()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败')
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  loadRoles()
  loadPermissions()
})
</script>

<style scoped>
.header-actions {
  margin-bottom: 16px;
}

.permission-tree {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px;
}

.module-group {
  margin-bottom: 16px;
}

.module-group:last-child {
  margin-bottom: 0;
}

.module-title {
  font-weight: bold;
  margin-bottom: 8px;
  color: #303133;
}
</style>
