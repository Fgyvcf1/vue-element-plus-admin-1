<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '成员任职概览' : '新增成员'"
    width="680px"
    top="6vh"
    append-to-body
    :close-on-click-modal="true"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" size="small">
      <el-form-item label="机构类型">
        <el-input :model-value="orgTypeNameMap[orgType] || orgType" disabled />
      </el-form-item>

      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item label="姓名" prop="name">
            <el-autocomplete
              v-model="form.name"
              :fetch-suggestions="queryResidents"
              :trigger-on-focus="false"
              :disabled="formReadonly"
              clearable
              placeholder="请输入姓名搜索居民"
              style="width: 100%"
              @select="handleResidentSelect"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="性别">
            <el-input v-model="form.gender" disabled />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item label="联系电话">
            <el-input v-model="form.phoneNumber" disabled />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="身份证号">
            <el-input v-model="form.idCard" disabled />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item label="届数" prop="termNumber">
            <el-input v-model="form.termNumber" :disabled="formReadonly" placeholder="如：1、2" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="职务" prop="position">
            <el-select
              v-model="form.position"
              :disabled="formReadonly"
              placeholder="请选择职务"
              style="width: 100%"
            >
              <el-option
                v-for="item in positionOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="12">
        <el-col :span="12">
          <el-form-item label="任期开始" prop="termStartDate">
            <el-date-picker
              v-model="form.termStartDate"
              :disabled="formReadonly"
              type="date"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="任期结束">
            <el-date-picker
              v-model="form.termEndDate"
              :disabled="formReadonly"
              type="date"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status" :disabled="formReadonly">
          <el-radio value="current">现任</el-radio>
          <el-radio value="history">历届</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="备注">
        <el-input v-model="form.remarks" :disabled="formReadonly" type="textarea" :rows="3" />
      </el-form-item>
    </el-form>

    <div v-if="isEdit" class="history-section">
      <el-collapse v-model="historyCollapse">
        <el-collapse-item name="history" title="任职历史">
          <HistoryTimeline :resident-id="form.residentId" :reload-token="historyReloadToken" />
        </el-collapse-item>
      </el-collapse>
    </div>

    <template #footer>
      <el-button size="small" @click="handleClose">关闭</el-button>
      <el-button v-if="isEdit && !isEditing" type="primary" size="small" @click="enableEdit"
        >编辑</el-button
      >
      <el-button v-if="isEdit && isEditing" size="small" @click="cancelEdit">取消编辑</el-button>
      <el-button v-if="isEdit && isEditing" type="danger" size="small" @click="handleDelete"
        >删除</el-button
      >
      <el-button
        v-if="!isEdit || isEditing"
        type="primary"
        size="small"
        :loading="submitting"
        @click="handleSubmit"
        >保存</el-button
      >
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  ElMessage,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElAutocomplete,
  ElRow,
  ElCol,
  ElSelect,
  ElOption,
  ElDatePicker,
  ElRadioGroup,
  ElRadio,
  ElButton,
  ElCollapse,
  ElCollapseItem
} from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { addCommitteeMember, updateCommitteeMember } from '@/api/leadership'
import { getResidentList } from '@/api/resident'
import { getDictionaryByCategory } from '@/api/dictionary'
import HistoryTimeline from './HistoryTimeline.vue'
import { useUserStore } from '@/store/modules/user'

const props = defineProps<{
  visible: boolean
  formData: Record<string, any>
  orgType: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'submitted'): void
  (e: 'delete-member', id: number): void
}>()

const dialogVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val)
})

const userStore = useUserStore()
const canAdd = computed(() => userStore.hasPermission('organization:add'))
const canEdit = computed(() => userStore.hasPermission('organization:edit'))

const isEdit = computed(() => !!form.id)
const isEditing = ref(false)
const formReadonly = computed(() => isEdit.value && !isEditing.value)
const formRef = ref<FormInstance>()
const submitting = ref(false)
const historyCollapse = ref(['history'])
const positionOptions = ref<{ label: string; value: string }[]>([])
const historyReloadToken = ref(0)
const originalFormData = ref<Record<string, any> | null>(null)

const form = reactive({
  id: undefined as number | undefined,
  residentId: undefined as number | undefined,
  name: '',
  gender: '',
  phoneNumber: '',
  idCard: '',
  termNumber: '',
  position: '',
  termStartDate: '',
  termEndDate: '',
  status: 'current',
  remarks: ''
})

const orgTypeNameMap: Record<string, string> = {
  branch_committee: '支部委员会',
  village_committee: '村民委员会',
  economic_council: '集体经济组织理事会',
  economic_supervisor: '集体经济组织监事会',
  supervisory_committee: '村务监督委员会',
  group_leader: '村民小组长',
  village_representative: '村民代表',
  youth_women_org: '青年团妇组织'
}

const rules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  termNumber: [{ required: true, message: '请输入届数', trigger: 'blur' }],
  position: [{ required: true, message: '请选择职务', trigger: 'change' }],
  termStartDate: [{ required: true, message: '请选择任期开始', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const assignForm = (data: Record<string, any>) => {
  form.id = data.id
  form.residentId = data.residentId || data.resident_id
  form.name = data.name || ''
  form.gender = data.gender || ''
  form.phoneNumber = data.phoneNumber || data.phone_number || ''
  form.idCard = data.idCard || data.id_card || ''
  form.termNumber = String(data.termNumber || data.term_number || '')
  form.position = data.position || ''
  form.termStartDate =
    data.termStartDate || data.term_start_date || new Date().toISOString().slice(0, 10)
  form.termEndDate = data.termEndDate || data.term_end_date || ''
  form.status = data.status || 'current'
  form.remarks = data.remarks || ''
}

const resetForm = () => {
  assignForm({
    id: undefined,
    residentId: undefined,
    name: '',
    gender: '',
    phoneNumber: '',
    idCard: '',
    termNumber: '',
    position: '',
    termStartDate: new Date().toISOString().slice(0, 10),
    termEndDate: '',
    status: 'current',
    remarks: ''
  })
}

const loadPositionOptions = async () => {
  try {
    const res = await getDictionaryByCategory('职务')
    const list = Array.isArray(res.data) ? res.data : []
    positionOptions.value = list.map((item: any) => ({
      label: item.label || item.value,
      value: item.value
    }))
  } catch {
    positionOptions.value = []
  }
}

watch(
  () => props.visible,
  (val) => {
    if (!val) return
    loadPositionOptions()
    historyReloadToken.value += 1
    if (props.formData && Object.keys(props.formData).length > 0) {
      assignForm(props.formData)
      originalFormData.value = { ...props.formData }
      isEditing.value = false
    } else {
      resetForm()
      originalFormData.value = null
      isEditing.value = true
    }
  }
)

const enableEdit = () => {
  if (!canEdit.value) {
    ElMessage.warning('当前账号没有权限')
    return
  }
  isEditing.value = true
}

const cancelEdit = () => {
  if (originalFormData.value) {
    assignForm(originalFormData.value)
  }
  formRef.value?.clearValidate()
  isEditing.value = false
}

const queryResidents = async (query: string, cb: (data: any[]) => void) => {
  if (!query) {
    cb([])
    return
  }
  try {
    const response = await getResidentList({ pageNum: 1, pageSize: 10, name: query })
    const list = response.data || []
    cb(
      list.map((item: any) => ({
        ...item,
        value: item.name
      }))
    )
  } catch {
    cb([])
  }
}

const handleResidentSelect = (selectedResident: any) => {
  form.name = selectedResident.name || ''
  form.gender = selectedResident.gender || ''
  form.phoneNumber = selectedResident.phoneNumber || selectedResident.phone_number || ''
  form.idCard = selectedResident.idCard || selectedResident.id_card || ''
  form.residentId = selectedResident.id
}

const handleSubmit = async () => {
  if (isEdit.value && !canEdit.value) {
    ElMessage.warning('当前账号没有权限')
    return
  }
  if (!isEdit.value && !canAdd.value) {
    ElMessage.warning('当前账号没有权限')
    return
  }
  if (formReadonly.value) {
    return
  }
  await formRef.value?.validate()

  if (!form.residentId) {
    ElMessage.warning('请选择居民')
    return
  }
  if (form.status === 'history' && !form.termEndDate) {
    ElMessage.warning('历届成员必须填写任期结束日期')
    return
  }
  if (form.termEndDate && form.termStartDate > form.termEndDate) {
    ElMessage.warning('任期结束日期不能早于任期开始')
    return
  }

  submitting.value = true
  try {
    const payload = {
      residentId: form.residentId,
      organizationType: props.orgType,
      termNumber: form.termNumber,
      termStartDate: form.termStartDate,
      termEndDate: form.termEndDate || null,
      position: form.position,
      status: form.status,
      remarks: form.remarks || null
    }

    if (isEdit.value && form.id) {
      await updateCommitteeMember(form.id, payload)
      ElMessage.success('更新成功')
      historyReloadToken.value += 1
    } else {
      await addCommitteeMember(payload)
      ElMessage.success('新增成功')
    }

    emit('submitted')
    handleClose()
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const handleDelete = () => {
  if (form.id) emit('delete-member', form.id)
}

const handleClose = () => {
  formRef.value?.clearValidate()
  isEditing.value = false
  emit('update:visible', false)
}
</script>

<style scoped>
.history-section {
  margin-top: 12px;
  border-top: 1px solid #ebeef5;
  padding-top: 12px;
}
</style>
