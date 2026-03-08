import type { AppRouteRecordRaw } from '@/router/types'
import { Layout } from '@/utils/routerHelper'
import { useI18n } from '@/hooks/web/useI18n'

const { t } = useI18n()

/**
 * 居民管理模块路由
 * 父级菜单：居民管理
 * 子菜单：居民查询、新增居民
 */
const residentRouter: AppRouteRecordRaw[] = [
  {
    path: '/resident',
    component: Layout,
    redirect: '/resident/query',
    name: 'Resident',
    meta: {
      title: t('router.resident'),
      icon: 'vi-material-symbols:group-outline',
      alwaysShow: true,
      orderNo: 100
    },
    children: [
      {
        path: 'query',
        component: () => import('@/views/Resident/Query.vue'),
        name: 'ResidentQuery',
        meta: {
          title: t('router.residentQuery')
        }
      },
      {
        path: 'population-death-report',
        component: () => import('@/views/Resident/PopulationDeathReport.vue'),
        name: 'ResidentPopulationDeathReport',
        meta: {
          title: '人口增减上报',
          noTagsView: true,
          noCache: true,
          hidden: true,
          canTo: true,
          activeMenu: '/resident/query'
        }
      },
      {
        path: 'add',
        component: () => import('@/views/Resident/Add.vue'),
        name: 'ResidentAdd',
        meta: {
          title: t('router.residentAdd')
        }
      },
      {
        path: 'edit/:id',
        component: () => import('@/views/Resident/Edit.vue'),
        name: 'ResidentEdit',
        meta: {
          title: t('router.residentEdit'),
          noCache: true,
          activeMenu: '/resident/query',
          hidden: true
        }
      }
    ]
  }
]

export default residentRouter
