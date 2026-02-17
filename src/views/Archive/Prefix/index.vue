<template>
  <div class="app-container">
    <div class="header">
      <h2>档案编号前缀管理</h2>
      <el-button type="primary" :icon="Plus" @click="handleAdd">添加前缀</el-button>
    </div>

    <el-card>
      <el-table v-loading="loading" :data="prefixList" border style="width: 100%">
        <el-table-column type="index" width="50" align="center" label="序号" />
        <el-table-column prop="prefix" label="前缀" min-width="200" />
        <el-table-column prop="sequence_number" label="当前序号" width="120" align="center">
          <template #default="{ row }">
            {{ row.sequence_number || row.current_number || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" min-width="300" show-overflow-tooltip />
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="danger" size="small" :icon="Delete" @click="handleDelete(row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加前缀对话框 -->
    <el-dialog v-model="dialogVisible" title="添加前缀" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="前缀" prop="prefix" required>
          <el-input v-model="form.prefix" placeholder="请输入前缀，如：2024-村名-" />
        </el-form-item>
        <el-form-item label="当前序号">
          <el-input-number
            v-model="form.sequence_number"
            :min="0"
            :max="999999"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入说明" />
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { getArchivePrefixes, addArchivePrefix, deleteArchivePrefix } from '@/api/archive'

const loading = ref(false)
const prefixList = ref<any[]>([])
const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref<any>(null)

const form = reactive({
  prefix: '',
  sequence_number: 0,
  description: ''
})

const rules = {
  prefix: [{ required: true, message: '请输入前缀', trigger: 'blur' }]
}

const loadPrefixes = async () => {
  loading.value = true
  try {
    const res = await getArchivePrefixes()
    prefixList.value = res.data || []
  } catch (error) {
    console.error('获取前缀列表失败:', error)
    ElMessage.error('获取前缀列表失败')
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  form.prefix = ''
  form.sequence_number = 0
  form.description = ''
  dialogVisible.value = true
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    await addArchivePrefix({
      prefix: form.prefix,
      sequence_number: form.sequence_number
    })
    ElMessage.success('添加成功')
    dialogVisible.value = false
    loadPrefixes()
  } catch (error) {
    console.error('添加前缀失败:', error)
    ElMessage.error('添加前缀失败')
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除前缀 "${row.prefix}" 吗？`, '提示', {
      type: 'warning'
    })
    await deleteArchivePrefix(row.prefix)
    ElMessage.success('删除成功')
    loadPrefixes()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadPrefixes()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}
</style>
