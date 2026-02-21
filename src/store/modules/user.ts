import { defineStore } from 'pinia'
import { store } from '../index'
import { UserLoginType, UserType } from '@/api/login/types'
import { ElMessageBox } from 'element-plus'
import { useI18n } from '@/hooks/web/useI18n'
import { loginOutApi } from '@/api/login'
import { useTagsViewStore } from './tagsView'
import { usePermissionStore } from './permission'

interface UserState {
  userInfo?: UserType
  tokenKey: string
  token: string
  roleRouters?: string[] | AppCustomRouteRecordRaw[]
  rememberMe: boolean
  loginInfo?: UserLoginType
  permissions: string[]
}

export const useUserStore = defineStore('user', {
  state: (): UserState => {
    return {
      userInfo: undefined,
      tokenKey: 'Authorization',
      token: '',
      roleRouters: undefined,
      rememberMe: true,
      loginInfo: undefined,
      permissions: []
    }
  },
  getters: {
    getTokenKey(): string {
      return this.tokenKey
    },
    getToken(): string {
      return this.token
    },
    getUserInfo(): UserType | undefined {
      return this.userInfo
    },
    getRoleRouters(): string[] | AppCustomRouteRecordRaw[] | undefined {
      return this.roleRouters
    },
    getRememberMe(): boolean {
      return this.rememberMe
    },
    getLoginInfo(): UserLoginType | undefined {
      return this.loginInfo
    },
    getPermissions(): string[] {
      return this.permissions
    }
  },
  actions: {
    setTokenKey(tokenKey: string) {
      this.tokenKey = tokenKey
    },
    setToken(token: string) {
      this.token = token
    },
    setUserInfo(userInfo?: UserType) {
      this.userInfo = userInfo
    },
    setRoleRouters(roleRouters: string[] | AppCustomRouteRecordRaw[]) {
      this.roleRouters = roleRouters
    },
    logoutConfirm() {
      const { t } = useI18n()
      ElMessageBox.confirm(t('common.loginOutMessage'), t('common.reminder'), {
        confirmButtonText: t('common.ok'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      })
        .then(() => {
          // 立即执行本地退出
          this.reset()
          // 后台调用退出 API（不阻塞）
          loginOutApi().catch(() => {})
        })
        .catch(() => {})
    },
    reset() {
      const tagsViewStore = useTagsViewStore()
      const permissionStore = usePermissionStore()

      console.log('开始退出流程...')

      // 1. 先清空用户信息（确保 tagsViewStore.delAllViews 能正确清空非固定标签）
      this.setUserInfo(undefined)

      // 2. 清除所有标签视图
      tagsViewStore.delAllViews()

      // 3. 清除其他状态
      this.setToken('')
      this.setRoleRouters([])
      this.setPermissions([])

      // 2. 重置权限状态
      permissionStore.setIsAddRouters(false)

      // 3. 清除 localStorage 中的持久化状态
      localStorage.removeItem('pinia-state-user')
      localStorage.removeItem('pinia-state-permission')
      localStorage.removeItem('pinia-state-tagsView')
      localStorage.removeItem('pinia-state-app')
      localStorage.removeItem('pinia-state-lock')

      console.log('状态已清除，准备跳转到登录页')

      // 4. 跳转到登录页，使用 window.location 确保页面刷新
      window.location.replace('/#/login')
    },
    logout() {
      this.reset()
    },
    setRememberMe(rememberMe: boolean) {
      this.rememberMe = rememberMe
    },
    setLoginInfo(loginInfo: UserLoginType | undefined) {
      this.loginInfo = loginInfo
    },
    setPermissions(permissions: string[]) {
      this.permissions = permissions
    },
    hasPermission(permission: string): boolean {
      // 超级管理员拥有所有权限
      const role = this.userInfo?.role
      if (role === 'superadmin') return true
      // 人民调解：除只读用户外均可增删改查
      if (role && role !== 'readonly' && permission.startsWith('mediation:')) return true
      return this.permissions.includes(permission)
    }
  },
  persist: {
    key: 'pinia-state-user',
    pick: ['userInfo', 'tokenKey', 'token', 'roleRouters', 'rememberMe', 'loginInfo']
    // 排除 permissions，每次登录重新获取
  }
})

export const useUserStoreWithOut = () => {
  return useUserStore(store)
}
