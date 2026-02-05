<template>
  <div>
    <div v-loading="loading">
      <!-- 统计卡片 - 只显示累计届数和累计年数 -->
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
            <div class="stat-tip">不足6个月不计，≥6个月算1年</div>
          </div>
        </el-card>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && historyList.length === 0" class="empty-tip">
        暂无任职记录
      </div>

      <!-- 任职历史表格 -->
      <el-card v-else shadow="hover" class="table-card">
        <el-table :data="sortedHistoryList" border stripe style="width: 100%">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="organization_type" label="组织机构" width="150" align="center">
            <template slot-scope="scope">
              {{ getOrgName(scope.row.organization_type) }}
            </template>
          </el-table-column>
          <el-table-column prop="term_number" label="届数" width="100" align="center">
            <template slot-scope="scope">
              第{{ scope.row.term_number }}届
            </template>
          </el-table-column>
          <el-table-column prop="position" label="职务" width="120" align="center" />
          <el-table-column prop="term_start_date" label="任期开始" width="120" align="center" />
          <el-table-column prop="term_end_date" label="任期结束" width="120" align="center">
            <template slot-scope="scope">
              {{ scope.row.term_end_date || '至今' }}
            </template>
          </el-table-column>
          <el-table-column label="任职时长" width="120" align="center">
            <template slot-scope="scope">
              {{ calculateServiceTime(scope.row.term_start_date, scope.row.term_end_date) }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="80" align="center">
            <template slot-scope="scope">
              <el-tag :type="scope.row.status === 'current' ? 'success' : 'info'" size="small">
                {{ scope.row.status === 'current' ? '现任' : '历届' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remarks" label="备注" min-width="150" align="center" show-overflow-tooltip />
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script>
import { getMemberHistory } from '@/api/leadership'

export default {
  name: 'HistoryTimeline',
  props: {
    residentId: {
      type: [Number, String],
      default: null
    }
  },
  data() {
    return {
      loading: false,
      historyList: [],
      stats: {
        totalTerms: 0,
        currentTerms: 0,
        totalDays: 0,
        totalYears: 0
      }
    }
  },
  computed: {
    sortedHistoryList() {
      // 按开始日期降序排序，现任排在前面
      const list = [...this.historyList]
      return list.sort((a, b) => {
        // 现任排在前面
        if (a.status === 'current' && b.status !== 'current') return -1
        if (a.status !== 'current' && b.status === 'current') return 1
        // 都是非现任或都是现任，按开始日期降序
        return new Date(b.term_start_date) - new Date(a.term_start_date)
      })
    }
  },
  watch: {
    residentId: {
      immediate: true,
      handler(val) {
        console.log('HistoryTimeline: residentId 变化，新值:', val, '类型:', typeof val)
        console.log('HistoryTimeline: residentId 是否为空:', val === null || val === undefined || val === '')
        if (val) {
          this.loadHistory()
        } else {
          console.log('HistoryTimeline: residentId 为空，清空历史记录')
          this.historyList = []
          this.calculateStats()
        }
      }
    }
  },
  methods: {
    async loadHistory() {
      if (!this.residentId) return

      this.loading = true
      try {
        console.log('加载历史记录，居民ID:', this.residentId)
        const response = await getMemberHistory(this.residentId)
        console.log('========== 历史记录响应详情 ==========')
        console.log('response 对象:', response)
        console.log('response 类型:', typeof response)
        console.log('response 的所有属性:', Object.keys(response))
        console.log('response.data:', response.data)
        console.log('response.data 类型:', typeof response.data)
        console.log('response.data 长度:', response.data ? response.data.length : 'N/A')

        // 检查响应的完整结构
        console.log('response.code:', response.code)
        console.log('response.message:', response.message)
        console.log('=======================================')

        // 确保正确处理响应数据
        if (response && response.data) {
          this.historyList = Array.isArray(response.data) ? response.data : []
        } else {
          console.log('response.data 不存在或为空，使用空数组')
          this.historyList = []
        }

        console.log('历史记录列表:', this.historyList)
        this.calculateStats()
      } catch (error) {
        console.error('加载历史记录失败:', error)
        this.$message.error('加载历史记录失败')
      } finally {
        this.loading = false
      }
    },
    calculateStats() {
      this.stats = {
        totalTerms: this.historyList.length,
        totalYears: 0
      }

      let totalDays = 0
      const now = new Date()

      this.historyList.forEach(item => {
        const start = new Date(item.term_start_date)
        const end = item.term_end_date ? new Date(item.term_end_date) : now

        if (start <= end) {
          const diffTime = Math.abs(end - start)
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

          // 只计算超过6个月的记录
          if (diffDays >= 182.5) {
            totalDays += diffDays
          }
        }
      })

      // 计算总年数，四舍五入，不显示小数
      this.stats.totalYears = Math.round(totalDays / 365)
    },
    // 计算任职时长（用于表格显示）：只显示整数年数
    calculateServiceTime(startDateStr, endDateStr) {
      if (!startDateStr) return '-'

      const start = new Date(startDateStr)
      const end = endDateStr ? new Date(endDateStr) : new Date()

      if (start > end) return '-'

      const diffTime = Math.abs(end - start)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      // 只显示整数年数，四舍五入
      const years = Math.round(diffDays / 365)
      return `${years}年`
    },
    formatDate(dateStr) {
      if (!dateStr) return ''
      return dateStr
    },
    getOrgName(orgType) {
      const orgMap = {
        'branch_committee': '支部委员会',
        'village_committee': '村民委员会',
        'economic_council': '集体经济组织理事会',
        'economic_supervisor': '集体经济组织监事会',
        'supervisory_committee': '村务监督委员会',
        'group_leader': '村民小组长',
        'village_representative': '村民代表',
        'youth_women_org': '青年团妇组织'
      }
      return orgMap[orgType] || orgType
    }
  }
}
</script>

<style scoped>
.stats-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
}

.stat-card >>> .el-card__body {
  padding: 8px 16px !important;
}

.stat-content .stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 4px;
  line-height: 1.2;
}

.stat-content .stat-label {
  font-size: 16px;
  color: #606266;
  font-weight: 500;
  line-height: 1.4;
}

.stat-content .stat-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
  line-height: 1.3;
}

.table-card {
  margin-top: 0;
}

.empty-tip {
  text-align: center;
  color: #909399;
  font-size: 14px;
  padding: 40px 0;
  background: #f5f7fa;
  border-radius: 4px;
}

</style>
