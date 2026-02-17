import { ElSubMenu, ElMenuItem } from 'element-plus'
import { unref } from 'vue'
import { hasOneShowingChild } from '../helper'
import { isUrl } from '@/utils/is'
import { useRenderMenuTitle } from './useRenderMenuTitle'
import { pathResolve } from '@/utils/routerHelper'
import { useDesign } from '@/hooks/web/useDesign'
import { useUserStore } from '@/store/modules/user'

const { getPrefixCls } = useDesign()
const prefixCls = getPrefixCls('submenu')

const { renderMenuTitle } = useRenderMenuTitle()

export const useRenderMenuItem = (menuMode) =>
  // allRouters: AppRouteRecordRaw[] = [],
  {
    const renderMenuItem = (routers: AppRouteRecordRaw[], parentPath = '/') => {
      const userStore = useUserStore()
      const hasPerm = (perm?: string | string[]) => {
        if (!perm) return true
        if (Array.isArray(perm)) return perm.some((p) => userStore.hasPermission(p))
        return userStore.hasPermission(perm)
      }

      const canShow = (route: AppRouteRecordRaw): boolean => {
        const meta = route.meta ?? {}
        const roleCode = userStore.getUserInfo?.role
        if (roleCode === 'readonly' && (route.path === '/permission' || route.path === '/system')) {
          return false
        }
        if (meta.hidden) return false
        const allowed = hasPerm(meta.permission as string | string[] | undefined)
        if (allowed) return true
        const children = route.children || []
        return children.some(canShow)
      }

      // 调试：打印路由信息
      if (routers.some((r) => r.path === '/resident')) {
        console.log(
          ' Resident routers:',
          routers.find((r) => r.path === '/resident')
        )
      }
      return routers
        .filter((v) => canShow(v))
        .map((v) => {
          const meta = v.meta ?? {}
          const renderChildren = (v.children || []).filter((child) => canShow(child))
          const { oneShowingChild, onlyOneChild } = hasOneShowingChild(renderChildren, v)
          const fullPath = isUrl(v.path) ? v.path : pathResolve(parentPath, v.path) // getAllParentPath<AppRouteRecordRaw>(allRouters, v.path).join('/')

          // 调试：打印居民管理路由信息
          if (v.path === 'resident' || v.path === '/resident') {
            console.log(' Resident menu:', {
              path: v.path,
              oneShowingChild,
              onlyOneChild,
              alwaysShow: meta?.alwaysShow,
              children: v.children
            })
          }

          if (
            oneShowingChild &&
            (!onlyOneChild?.children || onlyOneChild?.noShowingChildren) &&
            !meta?.alwaysShow
          ) {
            return (
              <ElMenuItem
                index={onlyOneChild ? pathResolve(fullPath, onlyOneChild.path) : fullPath}
              >
                {{
                  default: () => renderMenuTitle(onlyOneChild ? onlyOneChild?.meta : meta)
                }}
              </ElMenuItem>
            )
          } else {
            return (
              <ElSubMenu
                index={fullPath}
                popperClass={unref(menuMode) === 'vertical' ? `${prefixCls}-popper--vertical` : ''}
              >
                {{
                  title: () => renderMenuTitle(meta),
                  default: () => renderMenuItem(renderChildren, fullPath)
                }}
              </ElSubMenu>
            )
          }
        })
    }

    return {
      renderMenuItem
    }
  }
