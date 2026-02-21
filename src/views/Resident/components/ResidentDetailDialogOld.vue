<template>
  <el-dialog
    v-model="visible"
    title="居民信息详情"
    width="800px"
    destroy-on-close
    :close-on-click-modal="false"
  >
    <el-descriptions :column="2" border v-loading="loading">
      <el-descriptions-item label="姓名" :span="1">{{ residentInfo.name }}</el-descriptions-item>
      <el-descriptions-item label="性别" :span="1">{{ residentInfo.gender }}</el-descriptions-item>
      <el-descriptions-item label="身份证号" :span="2">{{
        residentInfo.idCard
      }}</el-descriptions-item>
      <el-descriptions-item label="出生日期" :span="1">{{
        residentInfo.birthDate
      }}</el-descriptions-item>
      <el-descriptions-item label="民族" :span="1">{{ residentInfo.nation }}</el-descriptions-item>
      <el-descriptions-item label="村组" :span="1">{{
        residentInfo.villageGroup
      }}</el-descriptions-item>
      <el-descriptions-item label="联系电话" :span="1">{{
        residentInfo.phone
      }}</el-descriptions-item>
      <el-descriptions-item label="详细地址" :span="2">{{
        residentInfo.address
      }}</el-descriptions-item>
      <el-descriptions-item label="户主姓名" :span="1">{{
        residentInfo.householderName
      }}</el-descriptions-item>
      <el-descriptions-item label="与户主关系" :span="1">{{
        residentInfo.relation
      }}</el-descriptions-item>
      <el-descriptions-item label="状态" :span="1">
        <el-tag :type="getStatusType(residentInfo.status)">{{ residentInfo.status }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="登记时间" :span="1">{{
        residentInfo.createTime
      }}</el-descriptions-item>
    </el-descriptions>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button type="primary" @click="handleEdit" v-if="canEdit">编辑</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  ElMessage,
  ElDialog,
  ElButton,
  ElTag,
  ElDescriptions,
  ElDescriptionsItem
} from 'element-plus'
import { getResidentDetail } from '@/api/resident'

const props = defineProps<{
  modelValue: boolean
  residentId: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  edit: [id: string]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const residentInfo = ref<any>({})
const canEdit = ref(true)

// 获取居民详情
const fetchDetail = async () => {
  if (!props.residentId) return

  loading.value = true
  try {
    const res = await getResidentDetail(props.residentId)
    residentInfo.value = res.data || {}
  } catch (error) {
    console.error('获取居民详情失败:', error)
    ElMessage.error('获取居民详情失败')
  } finally {
    loading.value = false
  }
}

// 编辑
const handleEdit = () => {
  emit('edit', props.residentId)
  visible.value = false
}

// 获取状态标签类型
const getStatusType = (
  status: string
): 'success' | 'warning' | 'info' | 'primary' | 'danger' => {
  const typeMap: Record<string, 'success' | 'warning' | 'info' | 'primary' | 'danger'> = {
    正常: 'success',
    迁出: 'warning',
    死亡: 'info'
  }
  return typeMap[status] || 'info'
}

// 监听对话框显示
watch(
  () => props.modelValue,
  (val) => {
    if (val && props.residentId) {
      fetchDetail()
    }
  }
)
</script>
