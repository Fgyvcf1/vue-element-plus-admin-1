import { defineStore } from 'pinia'
import { asyncRouterMap, constantRouterMap } from '@/router'
import {
  generateRoutesByFrontEnd,
  generateRoutesByServer,
  flatMultiLevelRoutes
} from '@/utils/routerHelper'
import { store } from '../index'
import { cloneDeep } from 'lodash-es'

export interface PermissionState {
  routers: AppRouteRecordRaw[]
  addRouters: AppRouteRecordRaw[]
  isAddRouters: boolean
  menuTabRouters: AppRouteRecordRaw[]
}

export const usePermissionStore = defineStore('permission', {
  state: (): PermissionState => ({
    // 默认显示 constantRouterMap + asyncRouterMap 中的所有路由
    // 这样静态路由模式下也能显示所有菜单
    routers: cloneDeep(constantRouterMap).concat(cloneDeep(asyncRouterMap)),
    addRouters: [],
    isAddRouters: false,
    menuTabRouters: []
  }),
  getters: {
    getRouters(): AppRouteRecordRaw[] {
      // 对路由进行排序，确保首页排在第一位，居民管理排在第二位
      const sortedRouters = [...this.routers].sort((a, b) => {
        // 首页（Dashboard）排在最前面
        if (a.path === '/dashboard') return -1
        if (b.path === '/dashboard') return 1
        // 居民管理排在第二位
        if (a.path === '/resident') return -1
        if (b.path === '/resident') return 1
        return 0
      })
      return sortedRouters
    },
    getAddRouters(): AppRouteRecordRaw[] {
      return flatMultiLevelRoutes(cloneDeep(this.addRouters))
    },
    // 用于 router.addRoute 的原始路由（保留 component）
    getRawAddRouters(): AppRouteRecordRaw[] {
      return cloneDeep(this.addRouters)
    },
    getIsAddRouters(): boolean {
      return this.isAddRouters
    },
    getMenuTabRouters(): AppRouteRecordRaw[] {
      return this.menuTabRouters
    }
  },
  actions: {
    generateRoutes(
      type: 'server' | 'frontEnd' | 'static',
      routers?: AppCustomRouteRecordRaw[] | string[]
    ): Promise<unknown> {
      return new Promise<void>((resolve) => {
        let routerMap: AppRouteRecordRaw[] = []
        if (type === 'server') {
          // 模拟后端过滤菜单
          routerMap = generateRoutesByServer(routers as AppCustomRouteRecordRaw[])
        } else if (type === 'frontEnd') {
          // 模拟前端过滤菜单
          routerMap = generateRoutesByFrontEnd(cloneDeep(asyncRouterMap), routers as string[])
        } else {
          // 直接读取静态路由表
          routerMap = cloneDeep(asyncRouterMap)
        }
        // 动态路由，404一定要放到最后面
        this.addRouters = routerMap.concat([
          {
            path: '/:path(.*)*',
            redirect: '/404',
            name: '404Page',
            meta: {
              hidden: true,
              breadcrumb: false
            }
          }
        ])
        // 渲染菜单的所有路由
        this.routers = cloneDeep(constantRouterMap).concat(routerMap)
        resolve()
      })
    },
    setIsAddRouters(state: boolean): void {
      this.isAddRouters = state
    },
    setMenuTabRouters(routers: AppRouteRecordRaw[]): void {
      this.menuTabRouters = routers
    },
    // 重置路由状态，强制重新加载
    resetRouters(): void {
      // 重置时合并 constantRouterMap 和 asyncRouterMap，确保所有菜单都显示
      this.routers = cloneDeep(constantRouterMap).concat(cloneDeep(asyncRouterMap))
      this.addRouters = []
      this.isAddRouters = false
    }
  },
  persist: {
    // 只持久化部分状态，routers 不持久化，确保每次都能重新加载
    paths: ['isAddRouters', 'menuTabRouters']
  }
})

export const usePermissionStoreWithOut = () => {
  return usePermissionStore(store)
}
