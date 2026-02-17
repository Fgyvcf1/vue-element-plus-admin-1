import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import type { App } from 'vue'
import Layout from '@/layout/Layout.vue'
import { useI18n } from '@/hooks/web/useI18n'
import { NO_RESET_WHITE_LIST } from '@/constants'

// 导入模块路由
import residentRouter from './modules/resident'
import specialPeopleRouter from './modules/specialPeople'
import organizationRouter from './modules/organization'
import todoReminderRouter from './modules/todoReminder'
import mediationRouter from './modules/mediation'
import permissionRouter from './modules/permission'
import systemSettingsRouter from './modules/systemSettings'

const { t } = useI18n()

export const constantRouterMap: AppRouteRecordRaw[] = [
  {
    path: '/',
    component: Layout,
    redirect: '/index',
    name: 'Root',
    meta: {
      hidden: true
    }
  },
  {
    path: '/redirect',
    component: Layout,
    name: 'RedirectWrap',
    children: [
      {
        path: '/redirect/:path(.*)',
        name: 'Redirect',
        component: () => import('@/views/Redirect/Redirect.vue'),
        meta: {}
      }
    ],
    meta: {
      hidden: true,
      noTagsView: true
    }
  },
  {
    path: '/login',
    component: () => import('@/views/Login/Login.vue'),
    name: 'Login',
    meta: {
      hidden: true,
      title: t('router.login'),
      noTagsView: true
    }
  },
  {
    path: '/personal',
    component: Layout,
    redirect: '/personal/personal-center',
    name: 'Personal',
    meta: {
      title: t('router.personal'),
      hidden: true,
      canTo: true
    },
    children: [
      {
        path: 'personal-center',
        component: () => import('@/views/Personal/PersonalCenter/PersonalCenter.vue'),
        name: 'PersonalCenter',
        meta: {
          title: t('router.personalCenter'),
          hidden: true,
          canTo: true
        }
      }
    ]
  }
]

export const asyncRouterMap: AppRouteRecordRaw[] = [
  {
    path: '/index',
    component: Layout,
    name: 'Dashboard',
    meta: {
      title: '仪表盘',
      icon: 'vi-material-symbols:dashboard'
    },
    children: [
      {
        path: '',
        component: () => import('@/views/Dashboard/index.vue'),
        name: 'DashboardIndex',
        meta: {
          title: '首页',
          icon: 'vi-ep:house',
          noCache: true,
          affix: true
        }
      }
    ]
  },

  {
    path: '/error',
    component: Layout,
    redirect: '/error/404',
    name: 'Error',
    meta: {
      title: t('router.errorPage'),
      icon: 'vi-ci:error',
      alwaysShow: true,
      hidden: true,
      canTo: true
    },
    children: [
      {
        path: '404-demo',
        component: () => import('@/views/Error/404.vue'),
        name: '404Demo',
        meta: {
          title: '404'
        }
      },
      {
        path: '403-demo',
        component: () => import('@/views/Error/403.vue'),
        name: '403Demo',
        meta: {
          title: '403'
        }
      },
      {
        path: '500-demo',
        component: () => import('@/views/Error/500.vue'),
        name: '500Demo',
        meta: {
          title: '500'
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/views/Error/404.vue'),
    name: 'NoFind',
    meta: {
      hidden: true,
      title: '404',
      noTagsView: true
    }
  },
  // 合并居民模块路由
  ...residentRouter,
  ...specialPeopleRouter,
  ...organizationRouter,
  ...todoReminderRouter,
  ...mediationRouter,
  ...permissionRouter,
  ...systemSettingsRouter
]

const router = createRouter({
  history: createWebHashHistory(),
  strict: true,
  routes: [...constantRouterMap, ...asyncRouterMap] as RouteRecordRaw[],
  scrollBehavior: () => ({ left: 0, top: 0 })
})

export const resetRouter = (): void => {
  router.getRoutes().forEach((route) => {
    const { name } = route
    if (name && !NO_RESET_WHITE_LIST.includes(name as string)) {
      router.hasRoute(name) && router.removeRoute(name)
    }
  })
}

export const setupRouter = (app: App<Element>) => {
  app.use(router)
}

export default router
