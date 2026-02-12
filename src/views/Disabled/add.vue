<template>
  <div class="app-container">
    <el-card>
      <el-form ref="disabledFormRef" :model="formData" :rules="formRules" label-width="100px" size="small" class="demo-form">
        <!-- 居民基本信息（只读，自动填充） -->
        <el-card class="section-card" style="margin-bottom: 10px; padding: 5px">
          <template #header>
            <div class="section-header">
              <span>居民基本信息</span>
            </div>
          </template>
          <el-row :gutter="10">
            <el-col :span="6">
              <el-form-item label="居民姓名" prop="name">
                <el-autocomplete
                  v-model="formData.name"
                  placeholder="请输入居民姓名"
                  size="small"
                  :fetch-suggestions="fetchResidentSuggestions"
                  @select="handleResidentSelect"
                  clearable
                  :disabled="isEdit"
                />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="身份证号">
                <el-input v-model="formData.idCard" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="性别">
                <el-input v-model="formData.gender" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="出生日期">
                <el-input v-model="formData.dateOfBirth" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="年龄">
                <el-input v-model="formData.age" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="联系电话">
                <el-input v-model="formData.phoneNumber" disabled />
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <!-- 残疾人信息 -->
        <el-card class="section-card" style="margin-bottom: 10px; padding: 5px">
          <template #header>
            <div class="section-header">
              <span>残疾人信息</span>
            </div>
          </template>
          <el-row :gutter="10">
            <el-col :span="8">
              <el-form-item label="残疾类型" prop="disabilityType">
                <el-select
                  v-model="formData.disabilityType"
                  placeholder="请选择残疾类型"
                  size="small"
                  clearable
                >
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
              <el-form-item label="残疾等级" prop="disabilityLevel">
                <el-select
                  v-model="formData.disabilityLevel"
                  placeholder="请选择残疾等级"
                  size="small"
                  clearable
                >
                  <el-option
                    v-for="item in disabilityLevelOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="残疾证号" prop="disabilityCardNumber">
                <el-input
                  v-model="formData.disabilityCardNumber"
                  placeholder="请输入残疾证号"
                  size="small"
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="监护人姓名" prop="guardianName">
                <el-input
                  v-model="formData.guardianName"
                  placeholder="请输入监护人姓名"
                  size="small"
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="监护人电话" prop="guardianPhoneNumber">
                <el-input
                  v-model="formData.guardianPhoneNumber"
                  placeholder="请输入监护人电话"
                  size="small"
                  clearable
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <div class="form-actions">
          <el-button type="primary" size="small" :loading="loading" @click="handleSave">保存</el-button>
          <el-button size="small" @click="handleCancel">取消</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
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
  ElAutocomplete
} from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getResidents, getResident } from '@/api/resident'
import {
  addDisabledPerson,
  updateDisabledPerson,
  getDisabledPerson
} from '@/api/disabled'
import { getDictionaryByCategory } from '@/api/dictionary'

const router = useRouter()
const route = useRoute()
const disabledFormRef = ref<FormInstance>()

const loading = ref(false)
const isEdit = ref(false)

// 字典选项
const disabilityTypeOptions = ref<{ label: string; value: string }[]>([])
const disabilityLevelOptions = ref<{ label: string; value: string }[]>([])

// 表单数据
const formData = reactive({
  id: null as number | null,
  residentId: null as number | null,
  name: '',
  idCard: '',
  gender: '',
  dateOfBirth: '',
  age: '',
  phoneNumber: '',
  disabilityType: '',
  disabilityLevel: '',
  disabilityCardNumber: '',
  guardianName: '',
  guardianPhoneNumber: ''
})

// 表单校验规则
const formRules = reactive<FormRules>({
  name: [{ required: true, message: '请选择居民', trigger: 'change' }],
  disabilityType: [{ required: true, message: '请选择残疾类型', trigger: 'change' }],
  disabilityLevel: [{ required: true, message: '请选择残疾等级', trigger: 'change' }]
})

// 加载字典数据
const loadDictionaries = async () => {
  try {
    console.log('开始加载字典数据...')
    
    // 加载残疾类型字典（注意：字典表中分类是"残疾类型"，不是"残疾类别"）
    const typeRes = await getDictionaryByCategory('残疾类型')
    console.log('残疾类型字典响应:', typeRes)
    
    // 响应拦截器已经返回了 response.data，所以直接使用 typeRes.data
    if (typeRes.data) {
      disabilityTypeOptions.value = typeRes.data.map((item: any) => ({
        label: item.label || item.value,
        value: item.value
      }))
      console.log('残疾类型选项:', disabilityTypeOptions.value)
    }

    // 加载残疾等级字典
    const levelRes = await getDictionaryByCategory('残疾等级')
    console.log('残疾等级字典响应:', levelRes)
    
    if (levelRes.data) {
      disabilityLevelOptions.value = levelRes.data.map((item: any) => ({
        label: item.label || item.value,
        value: item.value
      }))
      console.log('残疾等级选项:', disabilityLevelOptions.value)
    }
  } catch (error) {
    console.error('加载字典数据失败:', error)
    ElMessage.warning('加载字典数据失败，使用默认选项')
  }
  
  // 如果没有获取到数据，使用默认值
  if (disabilityTypeOptions.value.length === 0) {
    console.log('使用默认残疾类别选项')
    disabilityTypeOptions.value = [
      { label: '视力残疾', value: '视力残疾' },
      { label: '听力残疾', value: '听力残疾' },
      { label: '言语残疾', value: '言语残疾' },
      { label: '肢体残疾', value: '肢体残疾' },
      { label: '智力残疾', value: '智力残疾' },
      { label: '精神残疾', value: '精神残疾' },
      { label: '多重残疾', value: '多重残疾' }
    ]
  }
  if (disabilityLevelOptions.value.length === 0) {
    console.log('使用默认残疾等级选项')
    disabilityLevelOptions.value = [
      { label: '一级', value: '一级' },
      { label: '二级', value: '二级' },
      { label: '三级', value: '三级' },
      { label: '四级', value: '四级' }
    ]
  }
}

// 获取居民姓名建议
const fetchResidentSuggestions = async (queryString: string, cb: (data: any[]) => void) => {
  if (!queryString) {
    cb([])
    return
  }

  try {
    const response = await getResidents({ pageNum: 1, pageSize: 10, name: queryString })
    const suggestions = (response.data.data || []).map((item: any) => ({
      value: item.name,
      id: item.id,
      household_id: item.household_id
    }))
    cb(suggestions)
  } catch (error) {
    console.error('获取居民建议失败:', error)
    cb([])
  }
}

// 处理居民选择
const handleResidentSelect = async (item: any) => {
  if (item.id) {
    await loadResidentInfo(item.id)
  }
}

// 根据居民ID加载居民信息
const loadResidentInfo = async (residentId: number) => {
  try {
    loading.value = true
    console.log('开始加载居民信息, residentId:', residentId)
    const response = await getResident(residentId)
    console.log('获取居民信息响应:', response)

    // 处理不同的响应格式
    let resident = null
    if (response.data && response.data.code === 20000 && response.data.data) {
      // 标准格式: { code: 20000, data: {...} }
      resident = response.data.data
    } else if (response.data && response.data.id) {
      // 直接返回数据格式: { id: ..., name: ... }
      resident = response.data
    }

    if (resident) {
      console.log('获取到居民数据:', resident)

      // 自动填充居民基本信息 - 同时支持驼峰和下划线命名
      formData.residentId = resident.id
      formData.name = resident.name || ''
      formData.idCard = resident.idCard || resident.id_card || ''
      formData.gender = resident.gender || ''
      formData.dateOfBirth = resident.dateOfBirth || resident.date_of_birth || ''
      formData.age = String(resident.age || '')
      formData.phoneNumber = resident.phoneNumber || resident.phone_number || ''

      console.log('表单数据已填充:', formData)
      ElMessage.success(`已加载居民信息: ${formData.name}`)
    } else {
      console.error('无法获取居民数据，响应格式:', response)
      ElMessage.error('无法获取居民信息')
    }
  } catch (error) {
    console.error('获取居民信息失败:', error)
    ElMessage.error('获取居民信息失败')
  } finally {
    loading.value = false
  }
}

// 加载编辑数据
const loadEditData = async (id: number) => {
  try {
    loading.value = true
    const response = await getDisabledPerson(id)
    if (response.data.data) {
      const data = response.data.data
      isEdit.value = true

      // 填充表单数据
      formData.id = data.id || null
      formData.residentId = data.resident_id
      formData.name = data.name || ''
      formData.idCard = data.idCard || ''
      formData.gender = data.gender || ''
      formData.dateOfBirth = (data as any).dateOfBirth || ''
      formData.age = String((data as any).age || '')
      formData.phoneNumber = (data as any).phoneNumber || ''
      
      formData.disabilityType = data.disability_type
      formData.disabilityLevel = data.disability_level
      formData.disabilityCardNumber = data.disability_card_number || ''
      formData.guardianName = data.guardian_name || ''
      formData.guardianPhoneNumber = data.guardian_phone_number || ''
    }
  } catch (error) {
    console.error('获取编辑数据失败:', error)
    ElMessage.error('获取编辑数据失败')
  } finally {
    loading.value = false
  }
}

// 保存数据
const handleSave = async () => {
  console.log('开始保存残疾人信息...');
  if (!disabledFormRef.value) {
    console.error('表单引用无效');
    return;
  }

  try {
    console.log('触发表单验证...');
    const valid = await disabledFormRef.value.validate();
    console.log('表单验证结果:', valid);

    if (valid) {
      loading.value = true;
      console.log('表单验证通过，准备保存数据');

      const saveData = {
        resident_id: formData.residentId,
        disability_type: formData.disabilityType,
        disability_level: formData.disabilityLevel,
        certificate_number: formData.disabilityCardNumber || null,
        guardian_name: formData.guardianName || null,
        guardian_phone: formData.guardianPhoneNumber || null
      };
      
      console.log('待保存的数据 (saveData):', JSON.stringify(saveData, null, 2));

      if (!saveData.resident_id) {
          ElMessage.error('居民ID丢失，无法保存');
          loading.value = false;
          return;
      }

      if (isEdit.value && formData.id) {
        console.log('执行更新操作, ID:', formData.id);
        await updateDisabledPerson(formData.id, saveData);
        ElMessage.success('更新残疾人信息成功');
      } else {
        console.log('执行新增操作');
        await addDisabledPerson(saveData);
        ElMessage.success('新增残疾人信息成功');
      }

      // 跳转回列表页
      router.push({ name: 'DisabledList' });
    } else {
        console.warn('表单验证失败');
        ElMessage.warning('请检查表单必填项');
    }
  } catch (error: any) {
    console.error('保存残疾人信息时发生严重错误:', error);
    // 检查是否是校验未通过的错误（promise reject）
    if (error && typeof error === 'object' && !error.response) {
      // 很可能是校验错误，上面已经提示，这里不再重复
    } else {
      ElMessage.error(error.response?.data?.message || error.message || '保存残疾人信息失败');
    }
  } finally {
    loading.value = false;
  }
}

// 取消操作
const handleCancel = () => {
  router.push('/special-people/disabled-list')
}

onMounted(() => {
  loadDictionaries()

  // 从路由参数获取居民ID（新增模式）
  const residentId = route.query.residentId
  if (residentId) {
    formData.residentId = Number(residentId)
    loadResidentInfo(Number(residentId))
  }

  // 从路由参数获取编辑ID（编辑模式）
  const editId = route.params.id
  if (editId) {
    loadEditData(Number(editId))
  }
})
</script>

<style scoped>
.section-card {
  margin-bottom: 10px;
  padding: 5px;
}

.section-header {
  font-weight: bold;
}

.form-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}
</style>