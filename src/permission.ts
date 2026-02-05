import router from './router'
import { useAppStoreWithOut } from '@/store/modules/app'
import type { RouteRecordRaw } from 'vue-router'
import { useTitle } from '@/hooks/web/useTitle'
import { useNProgress } from '@/hooks/web/useNProgress'
import { usePermissionStoreWithOut } from '@/store/modules/permission'
import { usePageLoading } from '@/hooks/web/usePageLoading'
import { NO_REDIRECT_WHITE_LIST } from '@/constants'
import { useUserStoreWithOut } from '@/store/modules/user'

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
      next({ path: '/dashboard/index', replace: true })
      return
    }

    // 静态路由模式：所有路由已在初始化时加载，直接通过
    if (!appStore.getDynamicRouter) {
      console.log('静态路由模式，直接通过')
      next()
      return
    }

    // 动态路由模式：检查是否需要生成路由
    if (!permissionStore.getIsAddRouters) {
      console.log('动态路由模式，生成路由...')
      const roleRouters = userStore.getRoleRouters || []

      if (appStore.serverDynamicRouter) {
        await permissionStore.generateRoutes('server', roleRouters as AppCustomRouteRecordRaw[])
      } else {
        await permissionStore.generateRoutes('frontEnd', roleRouters as string[])
      }

      // 添加动态路由
      const addRouters = permissionStore.getRawAddRouters
      addRouters.forEach((route) => {
        router.addRoute(route as RouteRecordRaw)
      })

      permissionStore.setIsAddRouters(true)
      console.log('动态路由添加完成')
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
