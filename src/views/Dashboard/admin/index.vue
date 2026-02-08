<template>
  <div class="dashboard-editor-container">
    <!-- 顶部统计面板 -->
    <el-row :gutter="16" class="stat-row">
      <el-col :span="6" :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-item" @click="goToResidents">
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
      <el-col :span="6" :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-item" @click="goToLowIncome">
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
      <el-col :span="6" :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-item" @click="goToDisabled">
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
      <el-col :span="6" :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-item" @click="goToNotifications">
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
      <el-col :xs="24" :lg="8">
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
      <el-col :xs="24" :lg="8">
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
      <el-col :xs="24" :lg="8">
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, h } from 'vue'
import { useRouter } from 'vue-router'
import { ElRow, ElCol, ElCard, ElIcon } from 'element-plus'
import { User, HomeFilled, FirstAidKit, InfoFilled } from '@element-plus/icons-vue'
import request from '@/axios'

const router = useRouter()

// 统计数据
const stats = ref({
  villagerTotal: 1234,
  lowIncomeTotal: 89,
  disabledTotal: 45,
  notificationTotal: 0
})

// 人口结构数据
const populationData = ref([])
// 调解档案月度统计数据
const mediationData = ref([])
// 调解档案状态统计数据
const matterData = ref([])

// 人口结构图表悬停提示
const populationTooltip = ref({
  visible: false,
  ageGroup: '',
  count: 0,
  percentage: 0,
  x: 0,
  y: 0
})

// Canvas 引用
const populationChart = ref(null)
const matterChart = ref(null)
const disputeChart = ref(null)

// 获取统计数据
const getStats = async () => {
  // 获取居民总数（状态为正常的）
  try {
    const residentsRes = await request.get({
      url: '/residents',
      params: { status: 'active', pageNum: 1, pageSize: 1 }
    })
    if (residentsRes.code === 20000) {
      stats.value.villagerTotal = residentsRes.totalPersons || residentsRes.total || 0
    }
  } catch (error) {
    console.error('获取居民总数失败:', error)
  }

  // 获取低收入人数
  try {
    const lowIncomeRes = await request.get({ url: '/low-income-persons' })
    if (lowIncomeRes.code === 20000) {
      stats.value.lowIncomeTotal =
        lowIncomeRes.total || (lowIncomeRes.data ? lowIncomeRes.data.length : 0)
    }
  } catch (error) {
    console.error('获取低收入人数失败:', error)
  }

  // 获取残疾人数
  try {
    const disabledRes = await request.get({ url: '/disabled-persons' })
    if (disabledRes.code === 20000) {
      stats.value.disabledTotal =
        disabledRes.total || (disabledRes.data ? disabledRes.data.length : 0)
    }
  } catch (error) {
    console.error('获取残疾人数失败:', error)
  }

  // 获取通知数量
  try {
    const notificationRes = await request.get({ url: '/notifications' })
    if (notificationRes.code === 20000) {
      stats.value.notificationTotal =
        notificationRes.total || (notificationRes.data ? notificationRes.data.length : 0)
    }
  } catch (error) {
    console.error('获取通知数量失败:', error)
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
    const response = await request.get({ url: '/population-structure' })
    if (response.code === 20000 && response.data) {
      const filteredData = response.data.filter((item) => item.count > 0)

      populationData.value = filteredData.map((item, index) => {
        const color = customColors[index % customColors.length]
        return {
          value: item.count,
          name: item.ageGroup,
          color: color
        }
      })
      nextTick(() => {
        initPopulationChart()
      })
    }
  } catch (error) {
    console.error('获取人口结构统计失败:', error)
    // 使用空数据
    populationData.value = []
  }
}

// 人口结构饼图
const initPopulationChart = () => {
  if (!populationChart.value) return
  const ctx = populationChart.value.getContext('2d')
  drawPieChart(ctx, populationData.value, 140, 140, 100)
}

// 获取调解档案状态统计
const getMatterStats = async () => {
  try {
    const response = await request.get({ url: '/archives/status-stats' })
    if (response.code === 20000 && response.data) {
      matterData.value = response.data
      nextTick(() => {
        initMatterChart()
      })
    }
  } catch (error) {
    console.error('获取调解状态统计失败:', error)
    matterData.value = []
  }
}

// 事项进度柱状图
const initMatterChart = () => {
  if (!matterChart.value) return
  const ctx = matterChart.value.getContext('2d')
  drawBarChart(ctx, matterData.value, 280, 280)
}

// 获取调解档案月度统计
const getMediationStats = async () => {
  try {
    const response = await request.get({ url: '/archives/mediation-monthly-stats' })
    if (response.code === 20000 && response.data) {
      mediationData.value = response.data
      nextTick(() => {
        initDisputeChart()
      })
    }
  } catch (error) {
    console.error('获取调解月度统计失败:', error)
    mediationData.value = []
  }
}

// 纠纷处理趋势图
const initDisputeChart = () => {
  if (!disputeChart.value) return
  const ctx = disputeChart.value.getContext('2d')
  drawLineChart(ctx, mediationData.value, 280, 280)
}

// 绘制饼图
const drawPieChart = (ctx, data, centerX, centerY, radius) => {
  let startAngle = 0
  const total = data.reduce((sum, item) => sum + item.value, 0)

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  data.forEach((item, index) => {
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
  const handleMouseMove = (e) => {
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

        populationTooltip.value = {
          visible: true,
          ageGroup: hoveredItem.name,
          count: hoveredItem.value,
          percentage: percentage,
          x: tooltipX,
          y: mouseY - 20
        }
        canvas.style.cursor = 'pointer'
      } else {
        populationTooltip.value.visible = false
        canvas.style.cursor = 'default'
      }
    } else {
      populationTooltip.value.visible = false
      canvas.style.cursor = 'default'
    }
  }

  if (canvas._populationChartHandler) {
    canvas.removeEventListener('mousemove', canvas._populationChartHandler)
  }
  canvas._populationChartHandler = handleMouseMove
  canvas.addEventListener('mousemove', handleMouseMove)

  canvas.onmouseleave = () => {
    populationTooltip.value.visible = false
  }
}

// 绘制柱状图
const drawBarChart = (ctx, data, width, height) => {
  const padding = 40
  const barWidth = (width - 2 * padding) / data.length
  const maxValue = Math.max(...data.map((item) => item.value))
  const scale = (height - 2 * padding) / maxValue

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
const drawLineChart = (ctx, data, width, height) => {
  const padding = 40
  const pointRadius = 4
  const stepX = (width - 2 * padding) / (data.length - 1)
  const maxValue = Math.max(...data.map((item) => item.count))
  const scale = (height - 2 * padding) / maxValue

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

// 路由跳转方法
const goToNotifications = () => {
  router.push('/notification')
}

const goToResidents = () => {
  router.push('/resident/query')
}

const goToLowIncome = () => {
  router.push('/special-people/low-income-list')
}

const goToDisabled = () => {
  router.push('/special-people/disabled-list')
}

onMounted(() => {
  getStats()
  getPopulationStructure()
  getMediationStats()
  getMatterStats()
})
</script>

<style lang="scss" scoped>
.dashboard-editor-container {
  padding: 20px;
  background-color: rgb(240, 242, 245);
  position: relative;
}

// 统计行样式 - 确保横向排列
.stat-row {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 24px;

  .el-col {
    margin-bottom: 16px;
  }
}

// 统计卡片样式
.stat-card {
  min-width: 200px;
  cursor: pointer;
  transition: all 0.3s;

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
    border-radius: 50%;
    background: #ecf5ff url('/icons/disabled-icon.png') no-repeat center center;
    background-size: 80%;
  }

  &.notification {
    background-color: #f0f9eb;
    color: #67c23a;
  }
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
</style>
