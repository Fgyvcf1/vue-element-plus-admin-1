import { Layout } from '@/utils/routerHelper'

const mediationRouter: AppRouteRecordRaw[] = [
  {
    path: '/mediation',
    component: Layout,
    redirect: '/mediation/archive',
    name: 'Mediation',
    meta: {
      orderNo: 104
    },
    children: [
      {
        path: 'archive',
        component: () => import('@/views/Archive/index.vue'),
        name: 'ArchiveList',
        meta: {
          title: '人民调解',
          icon: 'vi-ep:folder-checked'
        }
      },
      {
        path: 'archive-detail/:id',
        component: () => import('@/views/Archive/detail.vue'),
        name: 'ArchiveDetail',
        meta: {
          title: '档案详情',
          noTagsView: true,
          noCache: true,
          hidden: true,
          canTo: true,
          activeMenu: '/mediation/archive'
        }
      },
      {
        path: 'case-file',
        component: () => import('@/views/Archive/CaseFile/index.vue'),
        name: 'CaseFileList',
        meta: {
          title: '调解案卷',
          icon: 'vi-ep:document-copy',
          hidden: true
        }
      },
      {
        path: 'prefix',
        component: () => import('@/views/Archive/Prefix/index.vue'),
        name: 'ArchivePrefix',
        meta: {
          title: '前缀管理',
          icon: 'vi-ep:setting',
          hidden: true
        }
      }
    ]
  }
]

export default mediationRouter
