<template>
  <div class="app-container">
    <el-card>
      <div class="header-actions">
        <el-button v-hasPermi="'system:user'" type="primary" @click="handleAdd">新增用户</el-button>
      </div>

      <el-table v-loading="loading" :data="userList" style="width: 100%">
        <el-table-column type="index" width="50" label="序号" align="center" />
        <el-table-column prop="username" label="用户名" align="center" />
        <el-table-column prop="real_name" label="姓名" align="center" />
        <el-table-column prop="role_name" label="当前角色" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.role_name" type="success">{{ row.role_name }}</el-tag>
            <el-tag v-else type="info">未分配</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="300">
          <template #default="{ row }">
            <el-button v-hasPermi="'system:user'" link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button v-hasPermi="'system:user'" link type="warning" @click="handleAssignRole(row)">分配角色</el-button>
            <el-button v-hasPermi="'system:user'" link type="info" @click="handleResetPassword(row)">重置密码</el-button>
            <el-button v-hasPermi="'system:user'" link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑用户对话框 -->
    <el-dialog v-model="userDialogVisible" :title="userDialogTitle" width="500px">
      <el-form :model="userForm" label-width="80px" :rules="userRules" ref="userFormRef">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="姓名" prop="real_name">
          <el-input v-model="userForm.real_name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input v-model="userForm.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="userForm.role_id" placeholder="请选择角色" style="width: 100%">
            <el-option
              v-for="role in roleList"
              :key="role.id"
              :label="role.role_name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="userForm.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleUserSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分配角色对话框 -->
    <el-dialog v-model="roleDialogVisible" title="分配角色" width="400px">
      <el-form :model="roleForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="roleForm.username" disabled />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="roleForm.realName" disabled />
        </el-form-item>
        <el-form-item label="角色" required>
          <el-select v-model="roleForm.roleId" placeholder="请选择角色" style="width: 100%">
            <el-option
              v-for="role in roleList"
              :key="role.id"
              :label="role.role_name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleRoleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog v-model="passwordDialogVisible" title="重置密码" width="400px">
      <el-form :model="passwordForm" label-width="100px">
        <el-form-item label="用户名">
          <el-input v-model="passwordForm.username" disabled />
        </el-form-item>
        <el-form-item label="新密码" required>
          <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handlePasswordSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  ElCard,
  ElTable,
  ElTableColumn,
  ElTag,
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption,
  ElRadioGroup,
  ElRadio
} from 'element-plus'
import { getRoles, getUsers, createUser, updateUser, deleteUser, assignUserRole, resetUserPassword } from '@/api/permission'

const loading = ref(false)
const submitLoading = ref(false)
const userDialogVisible = ref(false)
const roleDialogVisible = ref(false)
const passwordDialogVisible = ref(false)
const userDialogTitle = ref('新增用户')
const isEdit = ref(false)
const userFormRef = ref<FormInstance>()

const userList = ref<any[]>([])
const roleList = ref<any[]>([])

const userForm = reactive({
  id: null as number | null,
  username: '',
  password: '',
  real_name: '',
  role_id: undefined as number | undefined,
  status: 'active'
})

const roleForm = reactive({
  userId: null as number | null,
  username: '',
  realName: '',
  roleId: undefined as number | undefined
})

const passwordForm = reactive({
  userId: null as number | null,
  username: '',
  newPassword: ''
})

const userRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  real_name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur', min: 6 }]
}

const loadUsers = async () => {
  loading.value = true
  try {
    const res = await getUsers()
    userList.value = res.data || []
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const loadRoles = async () => {
  try {
    const res = await getRoles()
    roleList.value = res.data || []
  } catch (error) {
    console.error('获取角色列表失败:', error)
  }
}

const handleAdd = () => {
  isEdit.value = false
  userDialogTitle.value = '新增用户'
  userForm.id = null
  userForm.username = ''
  userForm.password = ''
  userForm.real_name = ''
  userForm.role_id = undefined
  userForm.status = 'active'
  userDialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  userDialogTitle.value = '编辑用户'
  userForm.id = row.id
  userForm.username = row.username
  userForm.password = ''
  userForm.real_name = row.real_name
  userForm.role_id = row.role_id ?? undefined
  userForm.status = row.status || 'active'
  userDialogVisible.value = true
}

const handleUserSubmit = async () => {
  if (!userFormRef.value) return

  await userFormRef.value.validate(async (valid) => {
    if (!valid) return

    submitLoading.value = true
    try {
      if (isEdit.value && userForm.id) {
        await updateUser(userForm.id, {
          username: userForm.username,
          real_name: userForm.real_name,
          role_id: userForm.role_id,
          status: userForm.status
        })
        ElMessage.success('更新成功')
      } else {
        await createUser({
          username: userForm.username,
          password: userForm.password,
          real_name: userForm.real_name,
          role_id: userForm.role_id,
          status: userForm.status
        })
        ElMessage.success('创建成功')
      }
      userDialogVisible.value = false
      loadUsers()
    } catch (error: any) {
      console.error('提交失败:', error)
      ElMessage.error(error.response?.data?.message || '提交失败')
    } finally {
      submitLoading.value = false
    }
  })
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确认删除该用户吗？', '提示', { type: 'warning' })
    await deleteUser(row.id)
    ElMessage.success('删除成功')
    loadUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}

const handleAssignRole = (row: any) => {
  roleForm.userId = row.id
  roleForm.username = row.username
  roleForm.realName = row.real_name
  roleForm.roleId = row.role_id ?? undefined
  roleDialogVisible.value = true
}

const handleRoleSubmit = async () => {
  if (!roleForm.roleId) {
    ElMessage.warning('请选择角色')
    return
  }

  submitLoading.value = true
  try {
    await assignUserRole(roleForm.userId!, roleForm.roleId)
    ElMessage.success('角色分配成功')
    roleDialogVisible.value = false
    loadUsers()
  } catch (error: any) {
    console.error('分配角色失败:', error)
    ElMessage.error(error.response?.data?.message || '分配角色失败')
  } finally {
    submitLoading.value = false
  }
}

const handleResetPassword = (row: any) => {
  passwordForm.userId = row.id
  passwordForm.username = row.username
  passwordForm.newPassword = ''
  passwordDialogVisible.value = true
}

const handlePasswordSubmit = async () => {
  if (!passwordForm.newPassword) {
    ElMessage.warning('请输入新密码')
    return
  }

  if (passwordForm.newPassword.length < 6) {
    ElMessage.warning('密码长度不能少于6位')
    return
  }

  submitLoading.value = true
  try {
    await resetUserPassword(passwordForm.userId!, passwordForm.newPassword)
    ElMessage.success('密码重置成功')
    passwordDialogVisible.value = false
  } catch (error: any) {
    console.error('重置密码失败:', error)
    ElMessage.error(error.response?.data?.message || '重置密码失败')
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  loadUsers()
  loadRoles()
})
</script>

<style scoped>
.app-container {
  padding: 16px;
}

.header-actions {
  margin-bottom: 16px;
}
</style>
