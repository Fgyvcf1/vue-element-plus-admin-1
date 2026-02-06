<script setup lang="tsx">
import { reactive, ref, watch, onMounted, unref, nextTick } from 'vue'
import { Form, FormSchema } from '@/components/Form'
import { useI18n } from '@/hooks/web/useI18n'
import { ElCheckbox, ElLink, ElMessage } from 'element-plus'
import { useForm } from '@/hooks/web/useForm'
import { loginApi, getTestRoleApi, getAdminRoleApi } from '@/api/login'
import { useAppStore } from '@/store/modules/app'
import { usePermissionStore } from '@/store/modules/permission'
import { useRouter } from 'vue-router'
import type { RouteLocationNormalizedLoaded, RouteRecordRaw } from 'vue-router'
import { UserType } from '@/api/login/types'
import { useValidator } from '@/hooks/web/useValidator'
import { useUserStore } from '@/store/modules/user'
import { BaseButton } from '@/components/Button'

const { required } = useValidator()
const emit = defineEmits(['to-register'])

const appStore = useAppStore()
const userStore = useUserStore()
const permissionStore = usePermissionStore()

const router = useRouter()

const { t } = useI18n()

const rules = {
  username: [required()],
  password: [required()]
}

const remember = ref(userStore.getRememberMe)
const loading = ref(false)

const schema = reactive<FormSchema[]>([
  {
    field: 'username',
    label: t('login.username'),
    component: 'Input',
    colProps: {
      span: 24
    },
    componentProps: {
      size: 'large'
    }
  },
  {
    field: 'password',
    label: t('login.password'),
    component: 'InputPassword',
    colProps: {
      span: 24
    },
    componentProps: {
      size: 'large'
    }
  },
  {
    field: 'tool',
    colProps: {
      span: 24
    },
    formItemProps: {
      slots: {
        default: () => {
          return (
            <div class="flex justify-between items-center w-[100%]">
              <ElCheckbox v-model={remember.value} label={t('login.remember')} size="large" />
              <ElLink type="primary" underline={false} onClick={toRegister}>
                {t('login.register')}
              </ElLink>
            </div>
          )
        }
      }
    }
  },
  {
    field: 'login',
    colProps: {
      span: 24
    },
    formItemProps: {
      slots: {
        default: () => {
          return (
            <BaseButton
              type="primary"
              class="w-[100%]"
              size="large"
              loading={loading.value}
              onClick={signIn}
            >
              {t('login.login')}
            </BaseButton>
          )
        }
      }
    }
  }
])

const { formRegister, formMethods } = useForm()
const { getFormData, getElFormExpose, setValues } = formMethods

// 初始化"记住我"信息
const initLoginInfo = () => {
  const loginInfo = userStore.getLoginInfo
  if (loginInfo) {
    const { username, password } = loginInfo
    setValues({ username, password })
  }
}
onMounted(() => initLoginInfo())

// 获取角色 & 生成路由
const getRole = async () => {
  const formData = await getFormData<UserType>()
  const params = { roleName: formData.username }

  const res =
    appStore.getDynamicRouter && appStore.getServerDynamicRouter
      ? await getAdminRoleApi(params)
      : await getTestRoleApi(params)

  if (!res) return

  const routers = res.data || []
  userStore.setRoleRouters(routers)

  if (appStore.getDynamicRouter && appStore.getServerDynamicRouter) {
    await permissionStore.generateRoutes('server', routers).catch(() => {})
  } else {
    await permissionStore.generateRoutes('frontEnd', routers).catch(() => {})
  }

  permissionStore.getAddRouters.forEach((route) => {
    router.addRoute(route as RouteRecordRaw)
  })
  permissionStore.setIsAddRouters(true)
}

// 登录
const signIn = async () => {
  const formRef = await getElFormExpose()
  if (!formRef) {
    console.error('formRef is null')
    return
  }

  await formRef.validate(async (isValid: boolean) => {
    if (!isValid) {
      console.log('表单验证失败')
      return
    }

    console.log('表单验证通过，开始登录')
    loading.value = true
    const formData = await getFormData<UserType>()

    try {
      const res = await loginApi(formData)
      if (!res) {
        console.log('登录失败')
        return
      }

      console.log('登录成功')

      // 记住我
      if (unref(remember)) {
        userStore.setLoginInfo({
          username: formData.username,
          password: formData.password
        })
      } else {
        userStore.setLoginInfo(undefined)
      }
      userStore.setRememberMe(unref(remember))
      userStore.setUserInfo(res.data)

      // 路由处理
      if (appStore.getDynamicRouter) {
        await getRole()
      } else {
        await permissionStore.generateRoutes('static').catch(() => {})
        permissionStore.getAddRouters.forEach((route) => {
          router.addRoute(route as RouteRecordRaw)
        })
        permissionStore.setIsAddRouters(true)
      }

      console.log('准备跳转到: /dashboard/index')
      console.log(
        'permissionStore.routers:',
        permissionStore.getRouters?.map((r) => ({
          path: r.path,
          name: r.name,
          childrenCount: r.children?.length
        }))
      )

      // 方案1: 使用 nextTick 等待路由注册完成后跳转（尝试修复动态路由时序问题）
      await nextTick()
      await router.replace('/dashboard/index')

      // 方案2: 如果方案1不工作，使用硬刷新（备用方案）
      // window.location.replace('/#/dashboard/index')
    } catch (error) {
      console.error('登录错误:', error)
      ElMessage.error('登录失败')
    } finally {
      loading.value = false
    }
  })
}

// 去注册页面
const toRegister = () => {
  emit('to-register')
}
</script>

<template>
  <div class="login-form">
    <h2 class="text-2xl font-bold text-center mb-8">{{ t('login.login') }}</h2>
    <Form
      :schema="schema"
      :rules="rules"
      label-position="top"
      hide-required-asterisk
      size="large"
      :label-width="0"
      @register="formRegister"
    />
  </div>
</template>

<style scoped lang="less">
.login-form {
  padding: 20px;
}
</style>
