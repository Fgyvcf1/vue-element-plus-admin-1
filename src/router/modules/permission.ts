import { Layout } from '@/utils/routerHelper'

const permissionRouter: AppRouteRecordRaw[] = [
  {
    path: '/permission',
    component: Layout,
    redirect: '/permission/role',
    name: 'Permission',
    meta: {
      title: '权限管理',
      icon: 'vi-ep:setting',
      orderNo: 105,
      permission: 'system:view'
    },
    children: [
      {
        path: 'role',
        component: () => import('@/views/Permission/Role/index.vue'),
        name: 'RoleManagement',
        meta: {
          title: '角色管理',
          permission: 'system:role'
        }
      },
      {
        path: 'user',
        component: () => import('@/views/Permission/User/index.vue'),
        name: 'UserRoleManagement',
        meta: {
          title: '用户管理',
          permission: 'system:user'
        }
      }
    ]
  }
]

export default permissionRouter
