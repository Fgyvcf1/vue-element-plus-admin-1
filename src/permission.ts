import router from './router'
import { useAppStoreWithOut } from '@/store/modules/app'
import type { RouteRecordRaw } from 'vue-router'
import { useTitle } from '@/hooks/web/useTitle'
import { useNProgress } from '@/hooks/web/useNProgress'
import { usePermissionStoreWithOut } from '@/store/modules/permission'
import { usePageLoading } from '@/hooks/web/usePageLoading'
import { NO_REDIRECT_WHITE_LIST } from '@/constants'
import { useUserStoreWithOut } from '@/store/modules/user'
import { ElMessage } from 'element-plus'
import { getMyPermission } from '@/api/permission'

const { start, done } = useNProgress()

const { loadStart, loadDone } = usePageLoading()

router.beforeEach(async (to, from, next) => {
  start()
  loadStart()
  const permissionStore = usePermissionStoreWithOut()
  const appStore = useAppStoreWithOut()
  const userStore = useUserStoreWithOut()

  console.log('导航守卫:', {
    to: to.path,
    from: from.path,
    hasUserInfo: !!userStore.getUserInfo,
    dynamicRouter: appStore.getDynamicRouter,
    isAddRouters: permissionStore.getIsAddRouters,
    matched: to.matched.length,
    matchedPaths: to.matched.map((m) => m.path),
    matchedNames: to.matched.map((m) => m.name)
  })

  // 用户已登录或有 token
  if (userStore.getUserInfo || userStore.getToken) {
    // 已登录用户访问登录页，重定向到首页
    if (to.path === '/login') {
      next({ path: '/index', replace: true })
      return
    }

    const isSuperAdmin = userStore.getUserInfo?.role === 'superadmin'

    // 非超级管理员禁止访问权限管理/系统设置
    if (!isSuperAdmin && (to.path.startsWith('/permission') || to.path.startsWith('/system'))) {
      ElMessage.warning('当前账号没有权限')
      next(false)
      return
    }

    // 静态路由模式：检查权限后通过
    if (!appStore.getDynamicRouter) {
      console.log('静态路由模式，检查权限...')

      // 静态路由模式下补齐权限与菜单
      if (userStore.getPermissions.length === 0) {
        const res = await getMyPermission().catch(() => null)
        if (res?.data) {
          userStore.setPermissions(res.data.permissions || [])
        }
        await permissionStore
          .generateRoutes('static', undefined, userStore.getPermissions)
          .catch(() => {})
      }

      // 检查路由权限
      const requiredPermission = to.meta?.permission as string
      if (requiredPermission && !userStore.hasPermission(requiredPermission)) {
        console.log('无权限访问:', requiredPermission)
        ElMessage.warning('当前账号没有权限')
        next(false)
        return
      }

      console.log('权限检查通过，允许导航')
      next()
      return
    }

    // 动态路由模式：检查是否需要生成路由
    if (!permissionStore.getIsAddRouters) {
      console.log('动态路由模式，生成路由...')
      let roleRouters = userStore.getRoleRouters || []

      // 服务端动态路由：必要时重新拉取权限与菜单
      if (appStore.getServerDynamicRouter) {
        const needRefresh =
          !Array.isArray(roleRouters) ||
          roleRouters.length === 0 ||
          userStore.getPermissions.length === 0

        if (needRefresh) {
          const res = await getMyPermission().catch(() => null)
          if (res?.data) {
            roleRouters = res.data.menus || []
            userStore.setRoleRouters(roleRouters)
            userStore.setPermissions(res.data.permissions || [])
          }
        }
      }

      if (appStore.serverDynamicRouter) {
        await permissionStore.generateRoutes(
          'server',
          roleRouters as AppCustomRouteRecordRaw[],
          userStore.getPermissions
        )
      } else {
        await permissionStore.generateRoutes(
          'frontEnd',
          roleRouters as string[],
          userStore.getPermissions
        )
      }

      // 添加动态路由
      const addRouters = permissionStore.getRawAddRouters
      addRouters.forEach((route) => {
        router.addRoute(route as RouteRecordRaw)
      })

      permissionStore.setIsAddRouters(true)
      console.log('动态路由添加完成')
    }

    // 动态路由模式下也做权限校验（防止手动输入URL）
    const requiredPermission = to.meta?.permission as string
    if (requiredPermission && !userStore.hasPermission(requiredPermission)) {
      ElMessage.warning('当前账号没有权限')
      next(false)
      return
    }

    // 路由检查通过，允许导航
    console.log('路由检查通过，允许导航')
    next()
    return
  }

  // 用户未登录
  if (NO_REDIRECT_WHITE_LIST.indexOf(to.path) !== -1) {
    console.log('白名单路由，直接通过:', to.path)
    next()
  } else {
    console.log('未登录，跳转到登录页:', to.path)
    next(`/login?redirect=${to.path}`)
  }
})

router.afterEach((to) => {
  useTitle(to?.meta?.title as string)
  done()
  loadDone()
})
