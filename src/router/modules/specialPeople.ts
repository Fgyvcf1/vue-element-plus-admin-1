import { Layout } from '@/utils/routerHelper'

const specialPeopleRouter: AppRouteRecordRaw[] = [
  {
    path: '/special-people',
    component: Layout,
    redirect: '/special-people/low-income-list',
    name: 'SpecialPeople',
    meta: {
      title: '特殊人群管理',
      icon: 'vi-ep:user-filled',
      alwaysShow: true,
      orderNo: 101
    },
    children: [
      // 低收入人员查询
      {
        path: 'low-income-list',
        component: () => import('@/views/LowIncome/index.vue'),
        name: 'LowIncomeList',
        meta: {
          title: '低收入人员查询'
        }
      },
      // 低收入人员添加
      {
        path: 'low-income/add',
        component: () => import('@/views/LowIncome/add.vue'),
        name: 'LowIncomeAdd',
        meta: {
          title: '新增低收入人员',
          noTagsView: true,
          noCache: true,
          hidden: true,
          canTo: true,
          activeMenu: '/special-people/low-income-list'
        }
      },
      // 低收入人员编辑
      {
        path: 'low-income/edit/:id',
        component: () => import('@/views/LowIncome/add.vue'),
        name: 'LowIncomeEdit',
        meta: {
          title: '编辑低收入人员',
          noTagsView: true,
          noCache: true,
          hidden: true,
          canTo: true,
          activeMenu: '/special-people/low-income-list'
        }
      },
      // 政策享受记录管理
      {
        path: 'policy-record/:id',
        component: () => import('@/views/LowIncome/policy-record.vue'),
        name: 'PolicyRecord',
        meta: {
          title: '政策享受记录',
          noTagsView: true,
          noCache: true,
          hidden: true,
          canTo: true,
          activeMenu: '/special-people/low-income-list'
        }
      },
      // 残疾人查询
      {
        path: 'disabled-list',
        component: () => import('@/views/Disabled/index.vue'),
        name: 'DisabledList',
        meta: {
          title: '残疾人查询'
        }
      },
      // 新增残疾人（通过居民查询右键菜单添加，不在菜单栏显示）
      {
        path: 'disabled/add',
        component: () => import('@/views/Disabled/add.vue'),
        name: 'DisabledAdd',
        meta: {
          title: '新增残疾人',
          noTagsView: true,
          noCache: true,
          hidden: true,
          canTo: true,
          activeMenu: '/special-people/disabled-list'
        }
      },
      // 编辑残疾人
      {
        path: 'disabled/edit/:id',
        component: () => import('@/views/Disabled/add.vue'),
        name: 'DisabledEdit',
        meta: {
          title: '编辑残疾人',
          noTagsView: true,
          noCache: true,
          hidden: true,
          canTo: true,
          activeMenu: '/special-people/disabled-list'
        }
      }
    ]
  }
]

export default specialPeopleRouter
