<template>
  <div class="import-mapping">
    <!-- 步骤指示器 -->
    <el-steps :active="activeStep" finish-status="success" style="margin-bottom: 20px">
      <el-step title="上传文件" />
      <el-step title="字段映射" />
      <el-step title="数据预览" />
      <el-step title="导入完成" />
    </el-steps>

    <!-- 步骤1: 文件上传 -->
    <div v-if="activeStep === 0">
      <el-upload
        ref="uploadRef"
        class="upload-demo"
        drag
        action=""
        :auto-upload="false"
        :on-change="handleFileChange"
        accept=".xlsx,.xls"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">请上传Excel文件（.xlsx或.xls格式）</div>
        </template>
      </el-upload>
      <div style="margin-top: 20px; text-align: center">
        <el-button type="primary" :disabled="!excelFile" @click="parseExcel">下一步</el-button>
      </div>
    </div>

    <!-- 步骤2: 字段映射 -->
    <div v-if="activeStep === 1">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>字段映射</span>
            <el-button type="primary" size="small" @click="autoMap">自动映射</el-button>
          </div>
        </template>
        <el-table :data="mappingList" border style="width: 100%">
          <el-table-column prop="excelField" label="Excel字段" width="180" />
          <el-table-column label="映射到" width="220">
            <template #default="{ row }">
              <el-select v-model="row.dbField" placeholder="请选择" size="small">
                <el-option label="- 跳过此字段 -" value="" />
                <el-option label="=== 户主表字段 ===" value="" disabled />
                <el-option v-for="field in householdFields" :key="field.value" :label="field.label" :value="field.value" />
                <el-option label="=== 居民表字段 ===" value="" disabled />
                <el-option v-for="field in residentFields" :key="field.value" :label="field.label" :value="field.value" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="preview" label="预览数据" min-width="200" show-overflow-tooltip />
        </el-table>
      </el-card>
      <div style="margin-top: 20px; text-align: right">
        <el-button @click="activeStep = 0">上一步</el-button>
        <el-button type="primary" @click="generatePreviewData">下一步</el-button>
      </div>
    </div>

    <!-- 步骤3: 数据预览 -->
    <div v-if="activeStep === 2">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>数据预览</span>
            <el-tag size="small" type="info">{{ totalRows }} 条记录</el-tag>
          </div>
        </template>
        <el-table :data="previewData" border style="width: 100%">
          <el-table-column v-for="column in previewColumns" :key="column.prop" :prop="column.prop" :label="column.label" />
        </el-table>
      </el-card>
      <div style="margin-top: 20px; text-align: right">
        <el-button @click="activeStep = 1">上一步</el-button>
        <el-button type="primary" :loading="importLoading" @click="importData">开始导入</el-button>
      </div>
    </div>

    <!-- 步骤4: 导入完成 -->
    <div v-if="activeStep === 3" style="text-align: center; padding: 40px">
      <div v-if="importSuccess">
        <el-icon style="font-size: 64px; color: #67C23A; margin-bottom: 20px"><circle-check /></el-icon>
        <h2 style="margin: 0 0 10px 0">导入成功</h2>
        <p style="color: #909399; margin: 0 0 30px 0">数据已成功导入系统</p>
        <el-button type="primary" @click="$emit('close')">关闭</el-button>
        <el-button @click="reset">再次导入</el-button>
      </div>
      <div v-else>
        <el-icon style="font-size: 64px; color: #F56C6C; margin-bottom: 20px"><circle-close /></el-icon>
        <h2 style="margin: 0 0 10px 0">导入失败</h2>
        <p style="color: #909399; margin: 0 0 30px 0">数据导入过程中出现错误</p>
        <el-button type="primary" @click="$emit('close')">关闭</el-button>
        <el-button @click="reset">重新导入</el-button>
      </div>
      <div v-if="importError" style="margin-top: 20px; text-align: left">
        <el-alert :title="'错误详情'" :description="importError" type="error" show-icon :closable="false" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElSteps, ElStep, ElUpload, ElButton, ElCard, ElTable, ElTableColumn, ElSelect, ElOption, ElTag, ElIcon, ElAlert } from 'element-plus'
import { UploadFilled, CircleCheck, CircleClose } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import { importResidents } from '@/api/resident'

const emit = defineEmits<{
  close: []
  'import-success': []
}>()

const uploadRef = ref()
const activeStep = ref(0)
const excelFile = ref<File | null>(null)
const excelData = ref<any[][]>([])
const headerRow = ref<string[]>([])
const mappingList = ref<{ excelField: string; dbField: string; preview: string }[]>([])
const previewData = ref<any[]>([])
const previewColumns = ref<{ prop: string; label: string }[]>([])
const totalRows = ref(0)
const importLoading = ref(false)
const importSuccess = ref(false)
const importError = ref('')

// 户主表字段
const householdFields = [
  { label: '户主姓名', value: 'household_head_name' },
  { label: '组别(户主)', value: 'household_village_group' },
  { label: '家庭地址', value: 'household_address' },
  { label: '联系电话(户主)', value: 'household_phone_number' },
  { label: '民族(户主)', value: 'household_ethnicity' },
  { label: '性别(户主)', value: 'household_gender' },
  { label: '户主身份证号', value: 'household_head_id_card' },
  { label: '户口类型', value: 'householdType' },
  { label: '住房类型', value: 'housingType' }
]

// 居民表字段
const residentFields = [
  { label: '姓名', value: 'name' },
  { label: '与户主关系', value: 'relationship_to_head' },
  { label: '性别', value: 'gender' },
  { label: '民族', value: 'ethnicity' },
  { label: '出生日期', value: 'date_of_birth' },
  { label: '身份证号码', value: 'id_card' },
  { label: '组别', value: 'village_group' },
  { label: '联系电话', value: 'phone_number' },
  { label: '文化程度', value: 'education_level' },
  { label: '婚姻状况', value: 'marital_status' },
  { label: '兵役状况', value: 'military_service' },
  { label: '政治面貌', value: 'political_status' },
  { label: '开户银行', value: 'bank_name' },
  { label: '银行账号', value: 'bank_card' },
  { label: '股权数量', value: 'equity_shares' },
  { label: '职业', value: 'occupation' },
  { label: '健康状况', value: 'health_status' },
  { label: '家庭地址', value: 'Home_address' }
]

// 文件选择
const handleFileChange = (file: any) => {
  excelFile.value = file.raw
}

// 解析Excel
const parseExcel = () => {
  if (!excelFile.value) {
    ElMessage.error('请先上传Excel文件')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]

      // 获取表头
      const range = XLSX.utils.decode_range(worksheet['!ref'])
      const rawHeaders: string[] = []

      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = worksheet[XLSX.utils.encode_cell({ c: C, r: range.s.r })]
        let hdr = 'UNKNOWN ' + C
        if (cell && cell.t) hdr = XLSX.utils.format_cell(cell)
        rawHeaders.push(hdr.replace(/[\r\n]/g, '').trim())
      }
      headerRow.value = rawHeaders

      // 读取数据
      const parsedData: any[][] = []
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const rowData: any[] = []
        let hasData = false
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ c: C, r: R })
          const cell = worksheet[cellAddress]
          let value = ''

          if (cell) {
            switch (cell.t) {
              case 's':
                value = cell.v || ''
                break
              case 'n':
                if (cell.v > 30000 && cell.v < 50000) {
                  const date = new Date((cell.v - 25569) * 86400 * 1000)
                  value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                } else {
                  value = Number.isInteger(cell.v) ? cell.v.toString() : cell.v.toLocaleString()
                }
                break
              case 'b':
                value = cell.v ? '是' : '否'
                break
              case 'd':
                value = cell.v ? new Date(cell.v).toLocaleDateString() : ''
                break
              default:
                value = XLSX.utils.format_cell(cell)
            }
            if (typeof value === 'string') {
              value = value.replace(/[\r\n]/g, ' ').trim()
            }
          }
          rowData.push(value)
          if (value && value !== '' && value !== '0' && value !== '否') {
            hasData = true
          }
        }
        if (hasData) {
          parsedData.push(rowData)
        }
      }

      if (parsedData.length < 1) {
        ElMessage.error('Excel文件至少需要包含一条数据')
        return
      }

      excelData.value = parsedData
      totalRows.value = parsedData.length

      // 生成映射列表
      mappingList.value = headerRow.value.map((header, index) => {
        let preview = ''
        if (parsedData.length > 0 && index < parsedData[0].length) {
          preview = parsedData[0][index] || ''
        }
        return {
          excelField: header,
          dbField: getRecommendedMapping(header),
          preview: String(preview)
        }
      })

      activeStep.value = 1
    } catch (error) {
      console.error('解析Excel失败:', error)
      ElMessage.error('解析Excel文件失败，请检查文件格式')
    }
  }
  reader.readAsArrayBuffer(excelFile.value)
}

// 获取推荐映射
const getRecommendedMapping = (excelField: string) => {
  const mapping: Record<string, string> = {
    '姓名': 'name',
    '户主姓名': 'household_head_name',
    '与户主关系': 'relationship_to_head',
    '性别': 'gender',
    '民族': 'ethnicity',
    '组别': 'village_group',
    '户籍详细地址': 'Home_address',
    '出生日期': 'date_of_birth',
    '身份证号码': 'id_card',
    '联系方式': 'phone_number',
    '文化程度': 'education_level',
    '婚姻状况': 'marital_status',
    '兵役状况': 'military_service',
    '政治面貌': 'political_status',
    '开户银行': 'bank_name',
    '银行账号': 'bank_card',
    '股权数量': 'equity_shares',
    '住址': 'Home_address',
    '地址': 'Home_address',
    '电话': 'phone_number',
    '联系电话': 'phone_number'
  }
  return mapping[excelField] || ''
}

// 自动映射
const autoMap = () => {
  mappingList.value = mappingList.value.map(item => ({
    ...item,
    dbField: getRecommendedMapping(item.excelField)
  }))
}

// 生成预览数据
const generatePreviewData = () => {
  const columns: { prop: string; label: string }[] = []
  const data: any[] = []

  mappingList.value.forEach((item, index) => {
    let label = item.excelField
    if (item.dbField) {
      label += ' → ' + getFieldLabel(item.dbField)
    } else {
      label += ' → 未映射'
    }
    columns.push({ label, prop: `col_${index}` })
  })

  excelData.value.slice(0, 5).forEach((row) => {
    const previewRow: any = {}
    row.forEach((value, colIndex) => {
      previewRow[`col_${colIndex}`] = value !== undefined ? value : ''
    })
    data.push(previewRow)
  })

  previewColumns.value = columns
  previewData.value = data
  activeStep.value = 2
}

// 获取字段标签
const getFieldLabel = (dbField: string) => {
  const fieldMap: Record<string, string> = {
    'household_head_name': '户主姓名',
    'household_village_group': '组别(户主)',
    'household_address': '家庭地址',
    'household_phone_number': '联系电话(户主)',
    'household_ethnicity': '民族(户主)',
    'household_gender': '性别(户主)',
    'household_head_id_card': '户主身份证号',
    'householdType': '户口类型',
    'housingType': '住房类型',
    'name': '姓名',
    'relationship_to_head': '与户主关系',
    'gender': '性别',
    'ethnicity': '民族',
    'date_of_birth': '出生日期',
    'id_card': '身份证号码',
    'village_group': '组别',
    'phone_number': '联系电话',
    'education_level': '文化程度',
    'marital_status': '婚姻状况',
    'military_service': '兵役状况',
    'political_status': '政治面貌',
    'bank_name': '开户银行',
    'bank_card': '银行账号',
    'equity_shares': '股权数量',
    'occupation': '职业',
    'health_status': '健康状况',
    'Home_address': '家庭地址'
  }
  return fieldMap[dbField] || dbField
}

// 导入数据
const importData = async () => {
  importLoading.value = true
  importSuccess.value = false
  importError.value = ''

  try {
    const importData = {
      headers: headerRow.value,
      data: excelData.value,
      mapping: mappingList.value.map(item => ({
        excelField: item.excelField,
        dbField: item.dbField
      }))
    }

    const res = await importResidents(importData)
    if (res.code === 200) {
      importSuccess.value = true
      activeStep.value = 3
      emit('import-success')
    } else {
      importError.value = res.message || '导入失败'
      activeStep.value = 3
    }
  } catch (error: any) {
    console.error('导入失败:', error)
    importError.value = error.response?.data?.message || error.message || '导入失败'
    activeStep.value = 3
  } finally {
    importLoading.value = false
  }
}

// 重置
const reset = () => {
  activeStep.value = 0
  excelFile.value = null
  excelData.value = []
  headerRow.value = []
  mappingList.value = []
  previewData.value = []
  previewColumns.value = []
  totalRows.value = 0
  importLoading.value = false
  importSuccess.value = false
  importError.value = ''
}
</script>

<style scoped>
.import-mapping {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
