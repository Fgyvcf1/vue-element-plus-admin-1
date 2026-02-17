<template>
  <div v-loading="loading">
    <div v-if="!loading && historyList.length > 0" class="stats-cards">
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalTerms }}</div>
          <div class="stat-label">累计届数</div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalYears }}</div>
          <div class="stat-label">累计年数</div>
          <div class="stat-tip">不足6个月不计，>=6个月算1年</div>
        </div>
      </el-card>
    </div>

    <div v-if="!loading && historyList.length === 0" class="empty-tip">暂无任职记录</div>

    <el-card v-else-if="!loading" shadow="hover" class="table-card">
      <el-table :data="sortedHistoryList" border stripe size="small" style="width: 100%">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="organization_type" label="组织机构" width="150" align="center">
          <template #default="{ row }">{{ getOrgName(row.organization_type) }}</template>
        </el-table-column>
        <el-table-column prop="term_number" label="届数" width="100" align="center">
          <template #default="{ row }">第{{ row.term_number }}届</template>
        </el-table-column>
        <el-table-column prop="position" label="职务" width="120" align="center" />
        <el-table-column prop="term_start_date" label="任期开始" width="120" align="center" />
        <el-table-column prop="term_end_date" label="任期结束" width="120" align="center">
          <template #default="{ row }">{{ row.term_end_date || '至今' }}</template>
        </el-table-column>
        <el-table-column label="任职时长" width="100" align="center">
          <template #default="{ row }">{{
            calculateServiceTime(row.term_start_date, row.term_end_date)
          }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'current' ? 'success' : 'info'" size="small">
              {{ row.status === 'current' ? '现任' : '历届' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="remarks"
          label="备注"
          min-width="140"
          align="center"
          show-overflow-tooltip
        />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { getMemberHistory } from '@/api/leadership'
import { ElMessage, ElCard, ElTable, ElTableColumn, ElTag } from 'element-plus'

const props = defineProps<{
  residentId?: number | string | null
  reloadToken?: number
}>()

const loading = ref(false)
const historyList = ref<any[]>([])
const stats = reactive({
  totalTerms: 0,
  totalYears: 0
})

const sortedHistoryList = computed(() => {
  const list = [...historyList.value]
  return list.sort((a, b) => {
    if (a.status === 'current' && b.status !== 'current') return -1
    if (a.status !== 'current' && b.status === 'current') return 1
    return (
      new Date(String(b.term_start_date)).getTime() - new Date(String(a.term_start_date)).getTime()
    )
  })
})

const calculateStats = () => {
  stats.totalTerms = historyList.value.length
  stats.totalYears = 0
  const now = new Date()
  const intervals: Array<{ start: Date; end: Date }> = []

  for (const item of historyList.value) {
    const start = new Date(String(item.term_start_date))
    const end = item.term_end_date ? new Date(String(item.term_end_date)) : now
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) continue
    intervals.push({ start, end })
  }

  const mergedIntervals = mergeOverlappingIntervals(intervals)
  let totalDays = 0
  for (const interval of mergedIntervals) {
    const diffDays = Math.ceil(
      (interval.end.getTime() - interval.start.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (diffDays >= 182.5) {
      totalDays += diffDays
    }
  }
  stats.totalYears = Math.round(totalDays / 365)
}

const mergeOverlappingIntervals = (intervals: Array<{ start: Date; end: Date }>) => {
  if (intervals.length <= 1) return intervals
  const sorted = [...intervals].sort((a, b) => a.start.getTime() - b.start.getTime())
  const merged: Array<{ start: Date; end: Date }> = [sorted[0]]

  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i]
    const lastMerged = merged[merged.length - 1]
    if (current.start.getTime() <= lastMerged.end.getTime()) {
      lastMerged.end = new Date(Math.max(lastMerged.end.getTime(), current.end.getTime()))
    } else {
      merged.push(current)
    }
  }

  return merged
}

const loadHistory = async (residentId: number | string) => {
  loading.value = true
  try {
    const response = await getMemberHistory(Number(residentId))
    historyList.value = Array.isArray(response.data) ? response.data : []
    calculateStats()
  } catch (error) {
    historyList.value = []
    calculateStats()
    ElMessage.error('加载历史记录失败')
  } finally {
    loading.value = false
  }
}

watch(
  [() => props.residentId, () => props.reloadToken],
  ([val]) => {
    if (!val) {
      historyList.value = []
      calculateStats()
      return
    }
    loadHistory(val)
  },
  { immediate: true }
)

const calculateServiceTime = (startDateStr?: string, endDateStr?: string) => {
  if (!startDateStr) return '-'
  const start = new Date(startDateStr)
  const end = endDateStr ? new Date(endDateStr) : new Date()
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return '-'
  const years = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365))
  return `${years}年`
}

const getOrgName = (orgType: string) => {
  const orgMap: Record<string, string> = {
    branch_committee: '支部委员会',
    village_committee: '村民委员会',
    economic_council: '集体经济组织理事会',
    economic_supervisor: '集体经济组织监事会',
    supervisory_committee: '村务监督委员会',
    group_leader: '村民小组长',
    village_representative: '村民代表',
    youth_women_org: '青年团妇组织'
  }
  return orgMap[orgType] || orgType || '-'
}
</script>

<style scoped>
.stats-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.stat-content {
  text-align: center;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--el-color-primary);
}

.stat-label {
  margin-top: 4px;
  color: #606266;
}

.stat-tip {
  margin-top: 2px;
  font-size: 12px;
  color: #909399;
}

.empty-tip {
  color: #909399;
  text-align: center;
  padding: 20px 0;
}
</style>
