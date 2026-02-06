<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ContentWrap } from '@/components/ContentWrap'
import request from '@/axios'

const router = useRouter()

// 统计数据
const stats = reactive({
  villagerTotal: 1234,
  lowIncomeTotal: 89,
  disabledTotal: 45,
  notificationTotal: 0
})

// 人口结构数据
const populationData = ref<any[]>([])
// 调解档案月度统计数据
const mediationData = ref<any[]>([])
// 调解档案状态统计数据
const matterData = ref<any[]>([])

// 人口结构图表悬停提示
const populationTooltip = reactive({
  visible: false,
  ageGroup: '',
  count: 0,
  percentage: 0,
  x: 0,
  y: 0
})

// Canvas 引用
const populationChart = ref<HTMLCanvasElement | null>(null)
const matterChart = ref<HTMLCanvasElement | null>(null)
const disputeChart = ref<HTMLCanvasElement | null>(null)

// 快捷菜单
const quickMenus = [
  {
    name: '居民管理',
    icon: 'User',
    iconClass: 'menu-villager',
    path: '/resident/list'
  },
  {
    name: '低收入管理',
    icon: 'HomeFilled',
    iconClass: 'menu-low-income',
    path: '/special-people/low-income-list'
  },
  {
    name: '残疾人管理',
    icon: 'FirstAidKit',
    iconClass: 'menu-disabled',
    path: '/special-people/disabled-list'
  },
  {
    name: '纠纷处理',
    icon: 'ChatDotSquare',
    iconClass: 'menu-dispute',
    path: '/dispute/list'
  }
]

// 待办事项
const pendingMatters = [
  {
    id: 1,
    title: '张三低保申请审核',
    description: '村民张三提交的低保申请需要审核',
    deadline: '2025-12-31'
  },
  {
    id: 2,
    title: '李四残疾证更新',
    description: '村民李四的残疾证需要更新',
    deadline: '2025-12-30'
  },
  {
    id: 3,
    title: '王五家庭纠纷调解',
    description: '村民王五家庭纠纷需要调解',
    deadline: '2025-12-29'
  }
]

// 近期动态
const recentActivities = [
  {
    id: 1,
    title: '村民信息更新',
    description: '更新了村民赵六的联系电话',
    time: '2025-12-28 14:30'
  },
  {
    id: 2,
    title: '低收入认定',
    description: '完成了村民孙七的低收入认定',
    time: '2025-12-28 10:15'
  },
  {
    id: 3,
    title: '纠纷处理完成',
    description: '处理完成了村民周八的邻里纠纷',
    time: '2025-12-27 16:45'
  }
]

// 跳转到通知列表
const goToNotifications = () => {
  router.push('/notification')
}

// 跳转到居民查询
const goToResidents = () => {
  router.push('/resident/list')
}

// 跳转到低收入查询
const goToLowIncome = () => {
  router.push('/special-people/low-income-list')
}

// 跳转到残疾人查询
const goToDisabled = () => {
  router.push('/special-people/disabled-list')
}

// 快捷菜单点击事件
const handleQuickMenu = (path: string) => {
  router.push(path)
}

// 事项处理点击事件
const handleMatter = (id: number) => {
  router.push(`/matter/edit/${id}`)
}

// 获取统计数据
const getStats = async () => {
  try {
    // 获取居民总数（状态为正常的）
    const villagerRes = await request.get({ url: '/residents', params: { status: 'active' } })
    if (villagerRes.code === 20000) {
      stats.villagerTotal = villagerRes.totalPersons || 0
    }

    // 获取低收入人数（状态为在享的）
    const lowIncomeRes = await request.get({
      url: '/low-income-persons',
      params: { status: 'active' }
    })
    if (lowIncomeRes.code === 20000) {
      stats.lowIncomeTotal = lowIncomeRes.data ? lowIncomeRes.data.length : 0
    }

    // 获取残疾人数
    const disabledRes = await request.get({ url: '/disabled-persons' })
    if (disabledRes.code === 20000) {
      stats.disabledTotal = disabledRes.data ? disabledRes.data.length : 0
    }

    // 获取当月通知总数
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const startDate = formatDate(startOfMonth)
    const endDate = formatDate(endOfMonth)

    const notificationRes = await request.get({
      url: '/notification',
      params: { start_date: startDate, end_date: endDate }
    })
    if (notificationRes.code === 20000) {
      stats.notificationTotal = notificationRes.data ? notificationRes.data.length : 0
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

// 获取人口结构数据
const getPopulationStructure = async () => {
  const customColors = [
    '#AFF5CD',
    '#4888E0',
    '#22E0AE',
    '#542E7F',
    '#55C3E6',
    '#C89BF5',
    '#313CE1',
    '#6B61E6'
  ]

  try {
    const res = await request.get({ url: '/population-structure' })
    if (res.code === 20000 && res.data) {
      const filteredData = res.data.filter((item: any) => item.count > 0)
      populationData.value = filteredData.map((item: any, index: number) => ({
        value: item.count,
        name: item.ageGroup,
        color: customColors[index % customColors.length]
      }))
      await nextTick()
      initPopulationChart()
    }
  } catch (error) {
    console.error('获取人口结构统计失败:', error)
    populationData.value = [
      { value: 200, name: '0-6岁', color: '#AFF5CD' },
      { value: 450, name: '7-17岁', color: '#4888E0' },
      { value: 350, name: '18-59岁', color: '#22E0AE' },
      { value: 234, name: '60-69岁', color: '#542E7F' },
      { value: 100, name: '70-79岁', color: '#55C3E6' },
      { value: 50, name: '80-89岁', color: '#C89BF5' }
    ]
    await nextTick()
    initPopulationChart()
  }
}

// 人口结构饼图
const initPopulationChart = () => {
  if (!populationChart.value) return
  const ctx = populationChart.value.getContext('2d')
  if (!ctx) return
  drawPieChart(ctx, populationData.value, 140, 140, 100)
}

// 获取调解档案状态统计
const getMatterStats = async () => {
  try {
    const res = await request.get({ url: '/archives/status-stats' })
    if (res.code === 20000 && res.data) {
      matterData.value = res.data
      await nextTick()
      initMatterChart()
    }
  } catch (error) {
    console.error('获取调解状态统计失败:', error)
    matterData.value = [
      { name: '已完成', value: 0, color: '#67C23A' },
      { name: '处理中', value: 0, color: '#E6A23C' },
      { name: '待处理', value: 0, color: '#F56C6C' }
    ]
    await nextTick()
    initMatterChart()
  }
}

// 事项进度柱状图
const initMatterChart = () => {
  if (!matterChart.value) return
  const ctx = matterChart.value.getContext('2d')
  if (!ctx) return
  drawBarChart(ctx, matterData.value, 280, 280)
}

// 获取调解档案月度统计
const getMediationStats = async () => {
  try {
    const res = await request.get({ url: '/archives/mediation-monthly-stats' })
    if (res.code === 20000 && res.data) {
      mediationData.value = res.data
      await nextTick()
      initDisputeChart()
    }
  } catch (error) {
    console.error('获取调解月度统计失败:', error)
    mediationData.value = [
      { month: '1月', count: 0 },
      { month: '2月', count: 0 },
      { month: '3月', count: 0 },
      { month: '4月', count: 0 },
      { month: '5月', count: 0 },
      { month: '6月', count: 0 }
    ]
    await nextTick()
    initDisputeChart()
  }
}

// 纠纷处理趋势图
const initDisputeChart = () => {
  if (!disputeChart.value) return
  const ctx = disputeChart.value.getContext('2d')
  if (!ctx) return
  drawLineChart(ctx, mediationData.value, 280, 280)
}

// 绘制饼图
const drawPieChart = (
  ctx: CanvasRenderingContext2D,
  data: any[],
  centerX: number,
  centerY: number,
  radius: number
) => {
  let startAngle = 0
  const total = data.reduce((sum, item) => sum + item.value, 0)

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  data.forEach((item) => {
    const sliceAngle = (2 * Math.PI * item.value) / total

    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle)
    ctx.closePath()
    ctx.fillStyle = item.color
    ctx.fill()

    const labelAngle = startAngle + sliceAngle / 2
    const labelX = centerX + Math.cos(labelAngle) * (radius + 20)
    const labelY = centerY + Math.sin(labelAngle) * (radius + 20)
    ctx.fillStyle = '#333'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(item.name, labelX, labelY)

    item._startAngle = startAngle
    item._endAngle = startAngle + sliceAngle

    startAngle += sliceAngle
  })

  const canvas = ctx.canvas
  const handleMouseMove = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const dx = x - centerX
    const dy = y - centerY
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance <= radius) {
      let angle = Math.atan2(dy, dx)
      if (angle < 0) angle += 2 * Math.PI

      const hoveredItem = data.find((item) => angle >= item._startAngle && angle < item._endAngle)

      if (hoveredItem) {
        const percentage = ((hoveredItem.value / total) * 100).toFixed(2)

        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        const tooltipWidth = 150
        const canvasWidth = ctx.canvas.width

        let tooltipX
        if (mouseX + tooltipWidth + 20 > canvasWidth) {
          tooltipX = mouseX - tooltipWidth - 20
        } else {
          tooltipX = mouseX + 20
        }

        populationTooltip.visible = true
        populationTooltip.ageGroup = hoveredItem.name
        populationTooltip.count = hoveredItem.value
        populationTooltip.percentage = Number(percentage)
        populationTooltip.x = tooltipX
        populationTooltip.y = mouseY - 20

        canvas.style.cursor = 'pointer'
      } else {
        populationTooltip.visible = false
        canvas.style.cursor = 'default'
      }
    }
  }

  if ((canvas as any)._populationChartHandler) {
    canvas.removeEventListener('mousemove', (canvas as any)._populationChartHandler)
  }
  ;(canvas as any)._populationChartHandler = handleMouseMove
  canvas.addEventListener('mousemove', handleMouseMove)

  canvas.onmouseleave = () => {
    populationTooltip.visible = false
  }
}

// 绘制柱状图
const drawBarChart = (
  ctx: CanvasRenderingContext2D,
  data: any[],
  width: number,
  height: number
) => {
  const padding = 40
  const barWidth = (width - 2 * padding) / data.length
  const maxValue = Math.max(...data.map((item) => item.value))
  const scale = (height - 2 * padding) / (maxValue || 1)

  ctx.clearRect(0, 0, width, height)
  ctx.beginPath()
  ctx.moveTo(padding, padding)
  ctx.lineTo(padding, height - padding)
  ctx.lineTo(width - padding, height - padding)
  ctx.strokeStyle = '#ccc'
  ctx.stroke()

  data.forEach((item, index) => {
    const x = padding + index * barWidth + barWidth * 0.2
    const barHeight = item.value * scale
    const y = height - padding - barHeight

    ctx.fillStyle = item.color
    ctx.fillRect(x, y, barWidth * 0.6, barHeight)

    ctx.fillStyle = '#333'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(item.name, x + barWidth * 0.3, height - padding + 15)
    ctx.fillText(item.value, x + barWidth * 0.3, y - 5)
  })
}

// 绘制折线图
const drawLineChart = (
  ctx: CanvasRenderingContext2D,
  data: any[],
  width: number,
  height: number
) => {
  const padding = 40
  const pointRadius = 4
  const stepX = (width - 2 * padding) / (data.length - 1 || 1)
  const maxValue = Math.max(...data.map((item) => item.count))
  const scale = (height - 2 * padding) / (maxValue || 1)

  ctx.clearRect(0, 0, width, height)
  ctx.beginPath()
  ctx.moveTo(padding, padding)
  ctx.lineTo(padding, height - padding)
  ctx.lineTo(width - padding, height - padding)
  ctx.strokeStyle = '#ccc'
  ctx.stroke()

  ctx.beginPath()
  data.forEach((item, index) => {
    const x = padding + index * stepX
    const y = height - padding - item.count * scale

    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }

    ctx.fillStyle = '#409EFF'
    ctx.beginPath()
    ctx.arc(x, y, pointRadius, 0, 2 * Math.PI)
    ctx.fill()

    ctx.fillStyle = '#333'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(item.month, x, height - padding + 15)
    ctx.fillText(item.count, x, y - 10)
  })
  ctx.strokeStyle = '#409EFF'
  ctx.stroke()
}

onMounted(() => {
  getStats()
  getPopulationStructure()
  getMediationStats()
  getMatterStats()
})
</script>

<template>
  <div class="dashboard-container">
    <!-- 顶部统计面板 -->
    <el-row :gutter="16" style="margin-bottom: 24px">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" @click="goToResidents">
          <div class="stat-item">
            <div class="stat-info">
              <div class="stat-title">居民总数</div>
              <div class="stat-number">{{ stats.villagerTotal }}</div>
            </div>
            <div class="stat-icon villager" @click.stop="goToResidents">
              <el-icon><User /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" @click="goToLowIncome">
          <div class="stat-item">
            <div class="stat-info">
              <div class="stat-title">低收入人数</div>
              <div class="stat-number">{{ stats.lowIncomeTotal }}</div>
            </div>
            <div class="stat-icon low-income" @click.stop="goToLowIncome">
              <el-icon><HomeFilled /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" @click="goToDisabled">
          <div class="stat-item">
            <div class="stat-info">
              <div class="stat-title">残疾人人数</div>
              <div class="stat-number">{{ stats.disabledTotal }}</div>
            </div>
            <div class="stat-icon disabled" @click.stop="goToDisabled">
              <el-icon><FirstAidKit /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" @click="goToNotifications">
          <div class="stat-item">
            <div class="stat-info">
              <div class="stat-title">通知提醒</div>
              <div class="stat-number">{{ stats.notificationTotal }}</div>
            </div>
            <div class="stat-icon notification" @click.stop="goToNotifications">
              <el-icon><InfoFilled /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="24" style="margin-bottom: 24px">
      <el-col :xs="24" :sm="12" :lg="8">
        <el-card>
          <template #header>
            <div class="clearfix">
              <span>人口结构</span>
            </div>
          </template>
          <div class="chart-container" style="position: relative">
            <canvas ref="populationChart" width="280" height="280"></canvas>
            <!-- 鼠标悬停提示 -->
            <div
              v-if="populationTooltip.visible"
              class="chart-tooltip"
              :style="{ left: populationTooltip.x + 'px', top: populationTooltip.y + 'px' }"
            >
              <div class="tooltip-title">{{ populationTooltip.ageGroup }}</div>
              <div class="tooltip-value">人口数量: {{ populationTooltip.count }}人</div>
              <div class="tooltip-value">占比: {{ populationTooltip.percentage }}%</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="8">
        <el-card>
          <template #header>
            <div class="clearfix">
              <span>事项进度</span>
            </div>
          </template>
          <div class="chart-container">
            <canvas ref="matterChart" width="280" height="280"></canvas>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="8">
        <el-card>
          <template #header>
            <div class="clearfix">
              <span>纠纷处理趋势</span>
            </div>
          </template>
          <div class="chart-container">
            <canvas ref="disputeChart" width="280" height="280"></canvas>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷菜单和待办事项 -->
    <el-row :gutter="24">
      <el-col :xs="24" :sm="24" :md="12" :lg="12">
        <ContentWrap title="快捷菜单">
          <div class="quick-menu-grid">
            <div
              v-for="menu in quickMenus"
              :key="menu.name"
              class="quick-menu-item"
              @click="handleQuickMenu(menu.path)"
            >
              <div class="quick-menu-icon" :class="menu.iconClass">
                <el-icon :icon="'ep:' + menu.icon.toLowerCase()" />
              </div>
              <div class="quick-menu-text">{{ menu.name }}</div>
            </div>
          </div>
        </ContentWrap>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12" :lg="12">
        <ContentWrap title="待办事项">
          <div
            v-for="matter in pendingMatters"
            :key="matter.id"
            class="pending-item"
            @click="handleMatter(matter.id)"
          >
            <div class="pending-title">{{ matter.title }}</div>
            <div class="pending-desc">{{ matter.description }}</div>
            <div class="pending-deadline">截止: {{ matter.deadline }}</div>
          </div>
        </ContentWrap>
      </el-col>
    </el-row>
  </div>
</template>

<style lang="scss" scoped>
.dashboard-container {
  padding: 20px;
  background-color: #f0f2f5;
}

// 统计卡片样式
.stat-card {
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 0;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }
}

.stat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-info {
  flex: 1;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;

  &.villager {
    background-color: #ecf5ff;
    color: #409eff;
  }

  &.low-income {
    background-color: #f0f9eb;
    color: #67c23a;
  }

  &.disabled {
    background-color: #ecf5ff;
    color: #409eff;
  }

  &.notification {
    background-color: #f0f9eb;
    color: #67c23a;
  }
}

// 快捷菜单网格布局
.quick-menu-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.quick-menu-item {
  text-align: center;
  padding: 20px 0;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background-color: #f5f7fa;
    border-radius: 4px;
  }
}

.quick-menu-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin: 0 auto 10px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.menu-villager {
    background-color: #ecf5ff;
    color: #409eff;
  }

  &.menu-low-income {
    background-color: #f0f9eb;
    color: #67c23a;
  }

  &.menu-disabled {
    background-color: #fdf6ec;
    color: #e6a23c;
  }

  &.menu-dispute {
    background-color: #fef0f0;
    color: #f56c6c;
  }
}

.quick-menu-text {
  font-size: 14px;
  color: #303133;
}

// 图表容器
.chart-container {
  padding: 20px 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

// 图表提示框
.chart-tooltip {
  position: absolute;
  background-color: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  z-index: 1000;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

  .tooltip-title {
    font-weight: bold;
    margin-bottom: 4px;
  }

  .tooltip-value {
    color: #fff;
  }
}

// 待办事项样式
.pending-item {
  padding: 15px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background-color: #f5f7fa;
  }

  &:last-child {
    border-bottom: none;
  }

  .pending-title {
    font-size: 14px;
    font-weight: bold;
    color: #303133;
    margin-bottom: 5px;
  }

  .pending-desc {
    font-size: 12px;
    color: #606266;
    margin-bottom: 5px;
  }

  .pending-deadline {
    font-size: 12px;
    color: #f56c6c;
  }
}
</style>
