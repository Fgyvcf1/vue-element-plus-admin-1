<template>
  <div class="app-container">
    <el-card>
      <div class="page-header">
        <div>
          <div class="page-title">字典管理</div>
          <div class="page-subtitle">维护基础字典分类与字典值</div>
        </div>
      </div>

      <el-row :gutter="16">
        <el-col :xs="24" :sm="6">
          <el-card class="category-card" shadow="never">
            <template #header>
              <div class="category-header">
                <span>字典分类</span>
                <el-button type="primary" link size="small" :icon="Plus" @click="handleAddCategory">
                  新增
                </el-button>
              </div>
            </template>
            <div class="category-list">
              <div
                v-for="item in categoryList"
                :key="item.category"
                class="category-item"
                :class="{ active: selectedCategory === item.category }"
                @click="selectCategory(item.category)"
              >
                <span class="category-name">{{ item.category }}</span>
                <el-tag size="small" type="info">{{ item.count ?? 0 }}</el-tag>
              </div>
              <div v-if="categoryList.length === 0" class="empty-text">暂无字典分类</div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="18">
          <el-card class="dictionary-card" shadow="never">
            <template #header>
              <div class="dictionary-header">
                <span>
                  {{ selectedCategory ? `${selectedCategory} - 字典项` : '请选择分类' }}
                </span>
                <el-button
                  v-if="selectedCategory"
                  type="primary"
                  size="small"
                  :icon="Plus"
                  @click="handleAddItem"
                >
                  新增字典项
                </el-button>
              </div>
            </template>

            <el-form v-if="selectedCategory" :inline="true" class="filter-form">
              <el-form-item>
                <el-checkbox v-model="includeAll" @change="handleIncludeAllChange">
                  显示已停用
                </el-checkbox>
              </el-form-item>
            </el-form>

            <el-table
              v-if="selectedCategory"
              v-loading="loading"
              :data="dictionaryList"
              border
              size="small"
              style="width: 100%"
            >
              <el-table-column prop="value" label="字典值" min-width="200">
                <template #default="{ row }">
                  <span :class="{ 'inactive-text': row.status === 'inactive' }">
                    {{ row.value }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="display_order" label="排序" width="80" align="center" />
              <el-table-column label="启用" width="80" align="center">
                <template #default="{ row }">
                  <el-switch
                    v-model="row.status"
                    active-value="active"
                    inactive-value="inactive"
                    @change="(val) => handleStatusChange(row, val)"
                  />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120" align="center">
                <template #default="{ row }">
                  <el-button link size="small" type="primary" @click="handleEditItem(row)">
                    编辑
                  </el-button>
                  <el-button link size="small" type="danger" @click="handleDeleteItem(row)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <div v-if="!selectedCategory" class="empty-category">
              <p>请从左侧选择一个字典分类</p>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form ref="itemFormRef" :model="itemForm" :rules="itemRules" label-width="100px">
        <el-form-item label="所属分类">
          <el-input v-model="itemForm.category" disabled />
        </el-form-item>
        <el-form-item label="字典值" prop="value">
          <el-input v-model="itemForm.value" placeholder="请输入字典值" />
        </el-form-item>
        <el-form-item label="排序序号" prop="display_order">
          <el-input-number
            v-model="itemForm.display_order"
            :min="0"
            :max="999"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="categoryDialogVisible" title="新增字典分类" width="400px">
      <el-form
        ref="categoryFormRef"
        :model="categoryForm"
        :rules="categoryRules"
        label-width="100px"
      >
        <el-form-item label="分类名称" prop="category">
          <el-input v-model="categoryForm.category" placeholder="请输入分类名称（中文或英文）" />
        </el-form-item>
        <el-form-item label="字典值" prop="value">
          <el-input v-model="categoryForm.value" placeholder="请输入第一个字典值" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitCategory">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  getDictionaryCategories,
  getDictionaryItems,
  createDictionaryItem,
  updateDictionaryItem,
  updateDictionaryStatus,
  deleteDictionaryItem
} from '@/api/dictionary'

const loading = ref(false)
const categoryList = ref<{ category: string; count?: number }[]>([])
const selectedCategory = ref('')
const dictionaryList = ref<any[]>([])
const includeAll = ref(false)

const dialogVisible = ref(false)
const dialogTitle = ref('新增字典项')
const isEdit = ref(false)
const editId = ref<number | null>(null)
const itemFormRef = ref<FormInstance>()
const itemForm = reactive({
  category: '',
  value: '',
  display_order: 0
})

const itemRules: FormRules = {
  value: [{ required: true, message: '请输入字典值', trigger: 'blur' }],
  display_order: [{ required: true, message: '请输入排序序号', trigger: 'blur' }]
}

const categoryDialogVisible = ref(false)
const categoryFormRef = ref<FormInstance>()
const categoryForm = reactive({
  category: '',
  value: ''
})

const categoryRules: FormRules = {
  category: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  value: [{ required: true, message: '请输入字典值', trigger: 'blur' }]
}

const fetchCategories = async () => {
  try {
    const res = await getDictionaryCategories({ withCount: 1 })
    const data = res.data || []
    categoryList.value = Array.isArray(data)
      ? data.map((item: any) => (typeof item === 'string' ? { category: item, count: 0 } : item))
      : []
  } catch (error) {
    console.error('获取字典分类失败:', error)
    ElMessage.error('获取字典分类失败')
  }
}

const fetchDictionaryItems = async () => {
  if (!selectedCategory.value) return
  loading.value = true
  try {
    const res = await getDictionaryItems({
      category: selectedCategory.value,
      include_all: includeAll.value ? 1 : 0
    })
    dictionaryList.value = res.data || []
  } catch (error) {
    console.error('获取字典项失败:', error)
    ElMessage.error('获取字典项失败')
  } finally {
    loading.value = false
  }
}

const selectCategory = (category: string) => {
  selectedCategory.value = category
  fetchDictionaryItems()
}

const handleIncludeAllChange = () => {
  fetchDictionaryItems()
}

const handleAddItem = () => {
  isEdit.value = false
  editId.value = null
  dialogTitle.value = '新增字典项'
  itemForm.category = selectedCategory.value
  itemForm.value = ''
  itemForm.display_order = dictionaryList.value.length + 1
  dialogVisible.value = true
  itemFormRef.value?.clearValidate()
}

const handleEditItem = (row: any) => {
  isEdit.value = true
  editId.value = row.id
  dialogTitle.value = '编辑字典项'
  itemForm.category = row.category
  itemForm.value = row.value
  itemForm.display_order = row.display_order ?? 0
  dialogVisible.value = true
  itemFormRef.value?.clearValidate()
}

const handleSubmit = () => {
  itemFormRef.value?.validate(async (valid) => {
    if (!valid) return
    try {
      if (isEdit.value && editId.value !== null) {
        await updateDictionaryItem(editId.value, {
          category: itemForm.category,
          value: itemForm.value,
          display_order: itemForm.display_order
        })
        ElMessage.success('字典项更新成功')
      } else {
        await createDictionaryItem({
          category: itemForm.category,
          value: itemForm.value,
          display_order: itemForm.display_order
        })
        ElMessage.success('字典项创建成功')
      }
      dialogVisible.value = false
      fetchDictionaryItems()
      fetchCategories()
    } catch (error) {
      console.error('保存字典项失败:', error)
      ElMessage.error('保存失败')
    }
  })
}

const handleStatusChange = async (row: any, newStatus: string | number | boolean) => {
  const status =
    newStatus === true ? 'active' : newStatus === false ? 'inactive' : String(newStatus)
  try {
    await updateDictionaryStatus(row.id, status)
    ElMessage.success(status === 'active' ? '已启用' : '已停用')
    fetchDictionaryItems()
    fetchCategories()
  } catch (error) {
    console.error('切换状态失败:', error)
    ElMessage.error('操作失败')
    row.status = status === 'active' ? 'inactive' : 'active'
  }
}

const handleDeleteItem = async (row: any) => {
  try {
    await ElMessageBox.confirm('确认删除该字典项吗？删除后不可恢复！', '警告', {
      type: 'error'
    })
    await deleteDictionaryItem(row.id)
    ElMessage.success('删除成功')
    fetchDictionaryItems()
    fetchCategories()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除字典项失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const handleAddCategory = () => {
  categoryForm.category = ''
  categoryForm.value = ''
  categoryDialogVisible.value = true
  categoryFormRef.value?.clearValidate()
}

const handleSubmitCategory = () => {
  categoryFormRef.value?.validate(async (valid) => {
    if (!valid) return
    try {
      await createDictionaryItem({
        category: categoryForm.category,
        value: categoryForm.value,
        display_order: 1
      })
      ElMessage.success('字典分类创建成功')
      categoryDialogVisible.value = false
      await fetchCategories()
      selectedCategory.value = categoryForm.category
      fetchDictionaryItems()
    } catch (error) {
      console.error('创建字典分类失败:', error)
      ElMessage.error('创建失败')
    }
  })
}

onMounted(() => {
  fetchCategories()
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

.category-card {
  min-height: 520px;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-list {
  max-height: 520px;
  overflow-y: auto;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  margin-bottom: 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.category-item:hover {
  background-color: #f5f7fa;
}

.category-item.active {
  background-color: #ecf5ff;
  border-left: 3px solid #409eff;
}

.category-name {
  font-size: 14px;
  color: #303133;
}

.dictionary-card {
  min-height: 520px;
}

.dictionary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-form {
  margin-bottom: 12px;
}

.inactive-text {
  color: #909399;
  text-decoration: line-through;
}

.empty-text {
  text-align: center;
  color: #909399;
  padding: 30px 0;
}

.empty-category {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #909399;
}
</style>
