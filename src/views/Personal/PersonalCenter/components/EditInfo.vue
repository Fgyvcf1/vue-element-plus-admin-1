<script lang="ts" setup>
import { FormSchema, Form } from '@/components/Form'
import { useForm } from '@/hooks/web/useForm'
import { useValidator } from '@/hooks/web/useValidator'
import { reactive, ref, watch } from 'vue'
import { ElDivider, ElMessage, ElMessageBox } from 'element-plus'
import { updateProfile } from '@/api/user'

const props = defineProps({
  userInfo: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits<{
  (e: 'updated', data: any): void
}>()

const { required, phone, maxlength, email } = useValidator()

const formSchema = reactive<FormSchema[]>([
  {
    field: 'realName',
    label: '昵称',
    component: 'Input',
    colProps: {
      span: 24
    }
  },
  {
    field: 'phoneNumber',
    label: '手机号码',
    component: 'Input',
    colProps: {
      span: 24
    }
  },
  {
    field: 'email',
    label: '邮箱',
    component: 'Input',
    colProps: {
      span: 24
    }
  }
])

const rules = reactive({
  realName: [required(), maxlength(50)],
  phoneNumber: [phone()],
  email: [email()]
})

const { formRegister, formMethods } = useForm()
const { setValues, getElFormExpose } = formMethods

watch(
  () => props.userInfo,
  (value) => {
    setValues(value)
  },
  {
    immediate: true,
    deep: true
  }
)

const saveLoading = ref(false)
const save = async () => {
  const elForm = await getElFormExpose()
  const valid = await elForm?.validate().catch((err) => {
    console.log(err)
  })
  if (valid) {
    ElMessageBox.confirm('是否确认修改?', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        try {
          saveLoading.value = true
          const formData = await formMethods.getFormData(false)
          const res = await updateProfile({
            realName: formData.realName,
            phoneNumber: formData.phoneNumber,
            email: formData.email
          })
          if (res?.code === 20000) {
            ElMessage.success('修改成功')
            emit('updated', res.data)
          } else {
            ElMessage.error(res?.message || '修改失败')
          }
        } catch (error) {
          console.log(error)
        } finally {
          saveLoading.value = false
        }
      })
      .catch(() => {})
  }
}
</script>

<template>
  <Form :rules="rules" @register="formRegister" :schema="formSchema" />
  <ElDivider />
  <BaseButton type="primary" @click="save">保存</BaseButton>
</template>
