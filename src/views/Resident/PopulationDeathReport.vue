<template>
  <div class="population-death-report-page">
    <el-card class="toolbar-card" shadow="never">
      <el-form :inline="true" :model="form" size="small">
        <el-form-item label="年份">
          <el-date-picker
            v-model="form.year"
            type="year"
            value-format="YYYY"
            placeholder="选择年份"
            style="width: 120px"
          />
        </el-form-item>
        <el-form-item label="月份">
          <el-select v-model="form.month" placeholder="选择月份" style="width: 110px">
            <el-option
              v-for="month in monthOptions"
              :key="month"
              :label="`${month}月`"
              :value="month"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="填表时间">
          <el-date-picker
            v-model="form.fillDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            style="width: 140px"
          />
        </el-form-item>
        <el-form-item label="填报人">
          <el-autocomplete
            v-model="form.reporter"
            placeholder="可选居民或手工输入"
            clearable
            style="width: 180px"
            :fetch-suggestions="fetchReporterSuggestions"
            value-key="value"
            :trigger-on-focus="false"
            :debounce="300"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleQuery">查询</el-button>
          <el-button @click="handlePrint">打印</el-button>
          <el-button @click="goBack">返回</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="report-card" shadow="never">
      <div class="report-sheet">
        <div class="report-title">{{ reportTitle }}</div>
        <div class="report-meta">
          <span class="meta-item">填表单位：{{ usageUnitValue || '-' }}</span>
          <span class="meta-item meta-center">填表时间：{{ form.fillDate || '-' }}</span>
          <span class="meta-item meta-right">
            填报人：<span class="meta-value">{{ form.reporter || '-' }}</span>
          </span>
        </div>

        <table class="report-table">
          <colgroup>
            <col class="col-unit" />
            <col class="col-group" />
            <col class="col-name" />
            <col class="col-gender" />
            <col class="col-age" />
            <col class="col-ethnicity" />
            <col class="col-birth" />
            <col class="col-id-card" />
            <col class="col-death" />
            <col class="col-head" />
            <col class="col-relation" />
            <col class="col-remark" />
          </colgroup>
          <thead>
            <tr>
              <th>村、街道或单位</th>
              <th>组别</th>
              <th>死者姓名</th>
              <th>性别</th>
              <th>年龄</th>
              <th>民族</th>
              <th>出生年月日</th>
              <th>身份证号码</th>
              <th>死亡年月日</th>
              <th>死者户主姓名</th>
              <th>死者与户主关系</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in displayRows" :key="`${row.idCard || index}-${index}`">
              <td>{{ row.unitCode }}</td>
              <td>{{ row.villageGroup || '' }}</td>
              <td>{{ row.deceasedName || '' }}</td>
              <td>{{ row.gender || '' }}</td>
              <td>{{ row.age || '' }}</td>
              <td>{{ row.ethnicity || '' }}</td>
              <td>{{ row.birthDate || '' }}</td>
              <td>{{ row.idCard || '' }}</td>
              <td>{{ row.deathDate || '' }}</td>
              <td>{{ row.householdHeadName || '' }}</td>
              <td>{{ row.relationshipToHead || '' }}</td>
              <td>{{ row.remark || '' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getDictionaryByCategory, getDictionaryItems } from '@/api/dictionary'
import { getResidentDeathReport, getSearchSuggestions } from '@/api/resident'
import type { ResidentDeathReportItem } from '@/api/resident/types'

interface DisplayRow extends ResidentDeathReportItem {
  unitCode: string
}

const router = useRouter()
const loading = ref(false)
const hasQueried = ref(false)
const deathRows = ref<ResidentDeathReportItem[]>([])
const usageUnitCode = ref('')
const usageUnitValue = ref('')

const today = new Date()
const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1)
const MAX_PRINT_ROWS = 10

const form = reactive({
  year: String(today.getFullYear()),
  month: today.getMonth() + 1,
  fillDate: formatDate(today),
  reporter: ''
})

const reportTitle = computed(() => {
  const year = Number(form.year) || today.getFullYear()
  const month = Number(form.month) || today.getMonth() + 1
  return `${usageUnitCode.value}${year}年${month}月份人口死亡情况登记表`
})

const createBlankRow = (): DisplayRow => ({
  unitCode: '',
  villageGroup: '',
  deceasedName: '',
  gender: '',
  age: '',
  ethnicity: '',
  birthDate: '',
  idCard: '',
  deathDate: '',
  householdHeadName: '',
  relationshipToHead: '',
  remark: ''
})

const displayRows = computed<DisplayRow[]>(() => {
  if (!hasQueried.value) {
    return Array.from({ length: MAX_PRINT_ROWS }, () => createBlankRow())
  }

  const rows =
    deathRows.value.length === 0
      ? [
          {
            unitCode: usageUnitCode.value || '',
            villageGroup: '',
            deceasedName: '无',
            gender: '',
            age: '',
            ethnicity: '',
            birthDate: '',
            idCard: '',
            deathDate: '',
            householdHeadName: '',
            relationshipToHead: '',
            remark: ''
          }
        ]
      : deathRows.value.map((item) => ({
          ...item,
          unitCode: usageUnitCode.value || ''
        }))

  const normalizedRows = rows.slice(0, MAX_PRINT_ROWS)
  while (normalizedRows.length < MAX_PRINT_ROWS) {
    normalizedRows.push(createBlankRow())
  }
  return normalizedRows
})

function formatDate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const fetchUsageUnit = async () => {
  try {
    const pickVillageCode = (rawCode: string, rawValue: string) => {
      if (rawCode) return rawCode
      const match = rawValue.match(/[\u4e00-\u9fa5A-Za-z0-9]+村/)
      if (match && match[0]) return match[0]
      return rawValue
    }

    const res: any = await getDictionaryByCategory('使用单位')
    let list = Array.isArray(res?.data) ? res.data : []
    if (list.length === 0) {
      const allRes: any = await getDictionaryItems({
        category: '使用单位',
        include_all: 1
      })
      list = Array.isArray(allRes?.data) ? allRes.data : []
    }
    const first = list[0] || {}
    const rawCode = first.code || ''
    const rawValue = first.value || first.label || ''
    usageUnitCode.value = pickVillageCode(rawCode, rawValue)
    usageUnitValue.value = rawValue || usageUnitCode.value
  } catch (error) {
    console.error('获取使用单位失败:', error)
  }
}

const fetchReporterSuggestions = (
  queryString: string,
  callback: (items: Array<{ value: string; label?: string }>) => void
) => {
  if (!queryString || queryString.trim().length < 1) {
    callback([])
    return
  }

  getSearchSuggestions({
    keyword: queryString.trim(),
    type: 'residentNames'
  })
    .then((res) => {
      callback(res.residentNames || [])
    })
    .catch((error) => {
      console.error('获取填报人建议失败:', error)
      callback([])
    })
}

const handleQuery = async () => {
  const year = Number(form.year)
  const month = Number(form.month)
  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    ElMessage.warning('请先选择年份和月份')
    return
  }

  loading.value = true
  try {
    const res = await getResidentDeathReport({ year, month })
    deathRows.value = Array.isArray(res?.data) ? res.data : []
    hasQueried.value = true
    if (deathRows.value.length > MAX_PRINT_ROWS) {
      ElMessage.warning(`当前查询到 ${deathRows.value.length} 条，打印仅显示前10条`)
    }
  } catch (error) {
    console.error('查询死亡人口报表失败:', error)
    ElMessage.error('查询死亡人口报表失败')
  } finally {
    loading.value = false
  }
}

const handlePrint = () => {
  window.print()
}

const goBack = () => {
  router.push('/resident/query')
}

onMounted(async () => {
  await fetchUsageUnit()
  await handleQuery()
})
</script>

<style scoped lang="scss">
.population-death-report-page {
  padding: 20px;

  .toolbar-card {
    margin-bottom: 12px;
  }

  .report-card {
    overflow-x: auto;
  }

  .report-sheet {
    min-width: 0;
    color: #000;
    font-size: 14px;
    font-weight: 400;
    display: flex;
    flex-direction: column;
    align-items: center;

    .report-title {
      font-size: 22px;
      font-weight: 400;
      text-align: center;
      margin-bottom: 18px;
    }

    .report-meta {
      display: grid;
      grid-template-columns: 1.5fr 1fr 1fr;
      column-gap: 12px;
      align-items: center;
      width: min(128ch, 100%);
      margin-bottom: 8px;
      font-size: 14px;

      .meta-item {
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .meta-center {
        text-align: center;
      }

      .meta-right {
        text-align: right;
      }

      .meta-value {
        display: inline-block;
        max-width: 180px;
        vertical-align: bottom;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .report-table {
      width: min(128ch, 100%);
      border-collapse: collapse;
      table-layout: fixed;
      border: 1px solid #000;
      margin: 0 auto;

      .col-unit {
        width: 14ch;
      }

      .col-group {
        width: 8ch;
      }

      .col-name {
        width: 10ch;
      }

      .col-gender {
        width: 6ch;
      }

      .col-age {
        width: 6ch;
      }

      .col-ethnicity {
        width: 8ch;
      }

      .col-birth {
        width: 12ch;
      }

      .col-id-card {
        width: 22ch;
      }

      .col-death {
        width: 12ch;
      }

      .col-head {
        width: 12ch;
      }

      .col-relation {
        width: 12ch;
      }

      .col-remark {
        width: 10ch;
      }

      th,
      td {
        border: 1px solid #000;
        padding: 6px 4px;
        text-align: center;
        word-break: break-all;
        line-height: 1.4;
      }

      tbody tr {
        height: 34px;
      }

      th {
        font-weight: 400;
      }
    }
  }
}

@media print {
  @page {
    size: A4 landscape;
    margin: 12mm 10mm 10mm 10mm;
  }

  :global(html),
  :global(body) {
    margin: 0 !important;
    padding: 0 !important;
  }

  :global(body *) {
    visibility: hidden !important;
  }

  :global(.population-death-report-page),
  :global(.population-death-report-page *) {
    visibility: visible !important;
  }

  :global(.population-death-report-page) {
    position: fixed !important;
    inset: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    transform: none !important;
    background: #fff !important;
  }

  .toolbar-card {
    display: none !important;
  }

  :global(.population-death-report-page .report-card) {
    border: none !important;
    box-shadow: none !important;
    margin: 0 !important;
  }

  :global(.population-death-report-page .el-card__body) {
    padding: 0 !important;
  }

  :global(.population-death-report-page .report-sheet) {
    position: static !important;
    width: 100% !important;
    min-width: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  :global(.population-death-report-page .report-meta) {
    width: min(128ch, 100%) !important;
    grid-template-columns: 1.6fr 1fr 1fr;
    font-size: 12px;
  }

  :global(.population-death-report-page .meta-right) {
    padding-right: 10ch;
  }

  :global(.population-death-report-page .meta-value) {
    max-width: 120px;
  }
}
</style>
