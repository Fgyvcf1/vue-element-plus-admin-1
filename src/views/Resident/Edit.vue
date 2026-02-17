<template>
  <div class="resident-edit-container">
    <el-card>
      <template #header>
        <span>编辑居民信息</span>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="form.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="性别" prop="gender">
              <el-select v-model="form.gender" placeholder="请选择性别" style="width: 100%">
                <el-option label="男" value="男" />
                <el-option label="女" value="女" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="身份证号" prop="idCard">
              <el-input
                v-model="form.idCard"
                placeholder="请输入身份证号"
                maxlength="18"
                disabled
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="出生日期" prop="birthDate">
              <el-date-picker
                v-model="form.birthDate"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="村组" prop="villageGroup">
              <el-select v-model="form.villageGroup" placeholder="请选择村组" style="width: 100%">
                <el-option
                  v-for="item in villageGroupOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="民族" prop="nation">
              <el-select v-model="form.nation" placeholder="请选择民族" style="width: 100%">
                <el-option
                  v-for="item in ethnicityOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
                <el-option label="正常" value="正常" />
                <el-option label="迁出" value="迁出" />
                <el-option label="死亡" value="死亡" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="家庭地址" prop="address">
              <el-input v-model="form.address" placeholder="请输入家庭地址" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <div class="action-buttons">
        <el-button v-hasPermi="'resident:edit'" type="primary" :loading="loading" @click="submitForm">
          保存
        </el-button>
        <el-button @click="goBack">返回</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ElMessage,
  ElInput,
  ElButton,
  ElSelect,
  ElOption,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElRow,
  ElCol,
  ElCard
} from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getResidentDetail, updateResident } from '@/api/resident'
import { useUserStoreWithOut } from '@/store/modules/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStoreWithOut()
const formRef = ref<FormInstance>()
const loading = ref(false)
const residentId = route.params.id as string

// 选项数据
const ethnicityOptions = ref([
  { label: '汉族', value: '汉族' },
  { label: '蒙古族', value: '蒙古族' },
  { label: '回族', value: '回族' },
  { label: '藏族', value: '藏族' },
  { label: '维吾尔族', value: '维吾尔族' },
  { label: '苗族', value: '苗族' },
  { label: '彝族', value: '彝族' },
  { label: '壮族', value: '壮族' }
])

const villageGroupOptions = ref([
  { label: '一组', value: '一组' },
  { label: '二组', value: '二组' },
  { label: '三组', value: '三组' },
  { label: '四组', value: '四组' },
  { label: '五组', value: '五组' }
])

// 表单数据
const form = reactive({
  id: '',
  name: '',
  gender: '',
  idCard: '',
  birthDate: '',
  villageGroup: '',
  address: '',
  phone: '',
  nation: '',
  status: '正常'
})

// 表单验证规则
const rules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  birthDate: [{ required: true, message: '请选择出生日期', trigger: 'change' }],
  villageGroup: [{ required: true, message: '请选择村组', trigger: 'change' }]
}

// 获取居民详情
const fetchDetail = async () => {
  if (!residentId) return

  try {
    const res = await getResidentDetail(residentId)
    if (res.data) {
      Object.assign(form, res.data)
    }
  } catch (error) {
    console.error('获取居民详情失败:', error)
    ElMessage.error('获取居民详情失败')
  }
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const res = await updateResident(form.id, form)
        if (res.code === 200) {
          ElMessage.success('更新成功')
          router.push('/resident/query')
        } else {
          ElMessage.error(res.message || '更新失败')
        }
      } catch (error) {
        console.error('更新失败:', error)
        ElMessage.error('更新失败')
      } finally {
        loading.value = false
      }
    }
  })
}

// 返回
const goBack = () => {
  router.go(-1)
}

// 初始化
onMounted(() => {
  if (!userStore.hasPermission('resident:edit')) {
    ElMessage.error('当前账号没有编辑居民权限')
    router.replace('/resident/query')
    return
  }
  fetchDetail()
})
</script>

<style scoped lang="scss">
.resident-edit-container {
  padding: 20px;

  .action-buttons {
    text-align: center;
    margin-top: 20px;

    .el-button {
      margin: 0 10px;
      width: 120px;
    }
  }
}
</style>
