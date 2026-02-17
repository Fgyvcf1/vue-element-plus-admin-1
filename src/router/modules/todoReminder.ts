import { Layout } from '@/utils/routerHelper'

const todoReminderRouter: AppRouteRecordRaw[] = [
  {
    path: '/todo-reminder',
    component: Layout,
    redirect: '/todo-reminder/index',
    name: 'TodoReminderRoot',
    meta: {
      title: '待办提醒',
      icon: 'vi-ep:bell',
      orderNo: 103
    },
    children: [
      {
        path: 'index',
        component: () => import('@/views/TodoReminder/index.vue'),
        name: 'TodoReminderIndex',
        meta: {
          title: '待办提醒',
          icon: 'vi-ep:bell',
          noCache: true
        }
      }
    ]
  },
  {
    path: '/notification',
    component: Layout,
    redirect: '/todo-reminder/index',
    name: 'NotificationCompat',
    meta: {
      hidden: true,
      noTagsView: true
    },
    children: [
      {
        path: 'index',
        component: () => import('@/views/TodoReminder/index.vue'),
        name: 'NotificationCompatIndex',
        meta: {
          title: '待办提醒',
          hidden: true,
          noTagsView: true,
          activeMenu: '/todo-reminder/index'
        }
      }
    ]
  }
]

export default todoReminderRouter
