import { Layout } from '@/utils/routerHelper'

const organizationRouter: AppRouteRecordRaw[] = [
  {
    path: '/organization',
    component: Layout,
    redirect: '/organization/leadership-members',
    name: 'OrganizationRoot',
    meta: {
      orderNo: 102
    },
    children: [
      {
        path: 'index',
        component: () => import('@/views/Leadership/Members/index.vue'),
        name: 'OrganizationIndexCompat',
        meta: {
          title: '机构管理',
          hidden: true,
          noTagsView: true,
          activeMenu: '/organization/leadership-members'
        }
      },
      {
        path: 'leadership-members',
        component: () => import('@/views/Leadership/Members/index.vue'),
        name: 'OrganizationManagement',
        meta: {
          title: '机构管理',
          icon: 'vi-ep:office-building'
        }
      }
    ]
  }
]

export default organizationRouter
