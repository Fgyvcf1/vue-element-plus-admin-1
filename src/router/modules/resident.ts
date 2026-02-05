import type { AppRouteRecordRaw } from '@/router/types'
import { Layout } from '@/utils/routerHelper'

/**
 * 居民管理模块路由
 * 模块独立，便于后期维护
 * 
 * 原项目结构：
 * - 居民管理（一级菜单）
 *   - 居民查询（二级菜单）
 *   - 新增居民（二级菜单）
 *   - 编辑居民（二级菜单，隐藏）
 */
const residentRouter: AppRouteRecordRaw[] = [
  {
    path: '/resident',
    component: Layout,
    redirect: '/resident/list',
    name: 'Resident',
    meta: {
      title: '居民管理',
      icon: 'user',
      orderNo: 100  // 菜单排序，放在首页之后
    },
    children: [
      {
        path: 'list',
        component: () => import('@/views/Resident/Query.vue'),
        name: 'ResidentList',
        meta: {
          title: '居民查询',
          icon: 'list',
          noCache: true
        }
      },
      {
        path: 'add',
        component: () => import('@/views/Resident/Add.vue'),
        name: 'ResidentAdd',
        meta: {
          title: '新增居民',
          icon: 'plus',
          noCache: true
        }
      },
      {
        path: 'edit/:id',
        component: () => import('@/views/Resident/Edit.vue'),
        name: 'ResidentEdit',
        meta: {
          title: '编辑居民',
          noCache: true,
          activeMenu: '/resident/list',
          hidden: true  // 不在菜单显示
        }
      }
    ]
  }
]

export default residentRouter
