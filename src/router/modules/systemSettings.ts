import { Layout } from '@/utils/routerHelper'

const systemSettingsRouter: AppRouteRecordRaw[] = [
  {
    path: '/system',
    component: Layout,
    redirect: '/system/index',
    name: 'SystemSettings',
    meta: {
      orderNo: 105,
      title: '系统设置',
      icon: 'vi-ep:setting',
      permission: 'system:view'
    },
    children: [
      {
        path: 'index',
        component: () => import('@/views/SystemSettings/Overview/index.vue'),
        name: 'SystemSettingsOverview',
        meta: {
          title: '设置概览',
          hidden: true,
          noTagsView: true,
          permission: 'system:view'
        }
      },
      {
        path: 'notification',
        component: () => import('@/views/SystemSettings/NotificationConfig/index.vue'),
        name: 'NotificationConfig',
        meta: {
          title: '通知配置',
          icon: 'vi-ep:bell',
          permission: 'system:view'
        }
      },
      {
        path: 'dictionary',
        component: () => import('@/views/SystemSettings/Dictionary/index.vue'),
        name: 'DictionaryManagement',
        meta: {
          title: '字典管理',
          icon: 'vi-ep:collection-tag',
          permission: 'system:view'
        }
      }
    ]
  }
]

export default systemSettingsRouter
