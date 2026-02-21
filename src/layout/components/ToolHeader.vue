<script lang="tsx">
import { defineComponent, computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { ElBadge, ElDropdown, ElDropdownItem, ElDropdownMenu, ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { Icon } from '@/components/Icon'
import { Collapse } from '@/components/Collapse'
import { LocaleDropdown } from '@/components/LocaleDropdown'
import { SizeDropdown } from '@/components/SizeDropdown'
import { UserInfo } from '@/components/UserInfo'
import { Screenfull } from '@/components/Screenfull'
import { Breadcrumb } from '@/components/Breadcrumb'
import { useAppStore } from '@/store/modules/app'
import { useDesign } from '@/hooks/web/useDesign'
import {
  batchMarkTodoRemindersRead,
  getLatestTodoReminders,
  getTodoReminderUnreadCount,
  markAllTodoRemindersRead
} from '@/api/todoReminder'

export default defineComponent({
  name: 'ToolHeader',
  setup() {
    const { getPrefixCls, variables } = useDesign()
    const prefixCls = getPrefixCls('tool-header')
    const appStore = useAppStore()
    const router = useRouter()

    // 面包屑
    const breadcrumb = computed(() => appStore.getBreadcrumb)

    // 折叠图标
    const hamburger = computed(() => appStore.getHamburger)

    // 全屏图标
    const screenfull = computed(() => appStore.getScreenfull)

    // 尺寸图标
    const size = computed(() => appStore.getSize)

    // 布局
    const layout = computed(() => appStore.getLayout)

    // 多语言图标
    const locale = computed(() => appStore.getLocale)

    const notificationCount = ref(0)
    const latestList = ref<any[]>([])
    let timer: number | undefined

    const refreshNotificationData = async () => {
      try {
        const [countRes, latestRes] = await Promise.all([
          getTodoReminderUnreadCount(),
          getLatestTodoReminders(5)
        ])
        notificationCount.value = countRes?.data?.unreadCount || 0
        latestList.value = latestRes?.data || []
      } catch (error) {
        // 不阻塞主流程
        console.error('刷新待办提醒失败:', error)
      }
    }

    const markOneReadAndOpen = async (row: any) => {
      try {
        const id = Number(row?.id)
        if (id && Number(row?.is_read) === 0) {
          await batchMarkTodoRemindersRead([id])
        }
        await router.push('/todo-reminder/index')
        refreshNotificationData()
      } catch (error) {
        ElMessage.error('打开提醒失败')
      }
    }

    const handleBellCommand = async (command: string) => {
      if (command === 'goto-all') {
        await router.push('/todo-reminder/index')
        return
      }

      if (command === 'mark-all-read') {
        await markAllTodoRemindersRead()
        ElMessage.success('已全部标记为已读')
        await refreshNotificationData()
      }
    }

    onMounted(() => {
      refreshNotificationData()
      timer = window.setInterval(() => {
        refreshNotificationData()
      }, 30000)
    })

    onBeforeUnmount(() => {
      if (timer) {
        window.clearInterval(timer)
      }
    })

    return () => (
      <div
        id={`${variables.namespace}-tool-header`}
        class={[
          prefixCls,
          'h-[var(--top-tool-height)] relative px-[var(--top-tool-p-x)] flex items-center justify-between'
        ]}
      >
        {layout.value !== 'top' ? (
          <div class="h-full flex items-center">
            {hamburger.value && layout.value !== 'cutMenu' ? (
              <Collapse class="custom-hover" color="var(--top-header-text-color)"></Collapse>
            ) : undefined}
            {breadcrumb.value ? <Breadcrumb class="<md:hidden"></Breadcrumb> : undefined}
          </div>
        ) : undefined}
        <div class="h-full flex items-center">
          {screenfull.value ? (
            <Screenfull class="custom-hover" color="var(--top-header-text-color)"></Screenfull>
          ) : undefined}
          {size.value ? (
            <SizeDropdown class="custom-hover" color="var(--top-header-text-color)"></SizeDropdown>
          ) : undefined}
          {locale.value ? (
            <LocaleDropdown
              class="custom-hover"
              color="var(--top-header-text-color)"
            ></LocaleDropdown>
          ) : undefined}
          <ElDropdown
            trigger="click"
            onCommand={handleBellCommand}
            {...{
              'onVisible-change': (visible: boolean) => visible && refreshNotificationData()
            }}
          >
            {{
              default: () => (
                <div
                  class="custom-hover flex items-center justify-center cursor-pointer"
                  title="待办提醒"
                >
                  <ElBadge
                    value={notificationCount.value}
                    max={99}
                    hidden={notificationCount.value <= 0}
                  >
                    <Icon icon="vi-ep:bell" size={18} color="var(--top-header-text-color)" />
                  </ElBadge>
                </div>
              ),
              dropdown: () => (
                <ElDropdownMenu class="w-[320px]">
                  <ElDropdownItem command="goto-all">进入待办提醒</ElDropdownItem>
                  <ElDropdownItem command="mark-all-read" disabled={notificationCount.value <= 0}>
                    全部标记已读
                  </ElDropdownItem>
                  <div class="px-10px py-6px text-12px text-[#909399]">最近5条</div>
                  {latestList.value.length === 0 ? (
                    <div class="px-12px py-10px text-12px text-[#909399]">暂无提醒</div>
                  ) : (
                    latestList.value.map((row) => (
                      <ElDropdownItem
                        key={row.id}
                        class="!whitespace-normal"
                        onClick={() => markOneReadAndOpen(row)}
                      >
                        <div class="w-[280px] overflow-hidden">
                          <div class="text-13px truncate">
                            {Number(row.is_read) === 0 ? '● ' : ''}
                            {row.title || '-'}
                          </div>
                          <div class="text-12px text-[#909399] truncate">{row.content || '-'}</div>
                        </div>
                      </ElDropdownItem>
                    ))
                  )}
                </ElDropdownMenu>
              )
            }}
          </ElDropdown>
          <UserInfo></UserInfo>
        </div>
      </div>
    )
  }
})
</script>

<style lang="less" scoped>
@prefix-cls: ~'@{adminNamespace}-tool-header';

.@{prefix-cls} {
  transition: left var(--transition-time-02);
}
</style>
