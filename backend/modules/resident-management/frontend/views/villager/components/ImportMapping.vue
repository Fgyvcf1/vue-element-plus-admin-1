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
        ref="upload"
        class="upload-demo"
        drag
        action=""
        :auto-upload="false"
        :on-change="handleFileChange"
        accept=".xlsx,.xls"
      >
        <i class="el-icon-upload" />
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <div slot="tip" class="el-upload__tip">
          请上传Excel文件（.xlsx或.xls格式）
        </div>
      </el-upload>
      <div style="margin-top: 20px; text-align: center">
        <el-button type="primary" :disabled="!excelFile" @click="parseExcel">下一步</el-button>
      </div>
    </div>

    <!-- 步骤2: 字段映射 -->
    <div v-if="activeStep === 1">
      <el-card>
        <template slot="header">
          <div class="card-header">
            <span>字段映射</span>
            <el-button type="primary" size="small" @click="autoMap">自动映射</el-button>
          </div>
        </template>
        <el-table :data="mappingList" border style="width: 100%">
          <el-table-column prop="excelField" label="Excel字段" width="180" />
          <el-table-column label="映射到" width="200">
            <template slot-scope="scope">
              <el-select v-model="scope.row.dbField" placeholder="请选择" size="small">
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
        <template slot="header">
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
        <i class="el-icon-success" style="font-size: 64px; color: #67C23A; margin-bottom: 20px" />
        <h2 style="margin: 0 0 10px 0">导入成功</h2>
        <p style="color: #909399; margin: 0 0 30px 0">数据已成功导入系统</p>
        <el-button type="primary" @click="$emit('close')">关闭</el-button>
        <el-button @click="reset">再次导入</el-button>
      </div>
      <div v-else>
        <i class="el-icon-error" style="font-size: 64px; color: #F56C6C; margin-bottom: 20px" />
        <h2 style="margin: 0 0 10px 0">导入失败</h2>
        <p style="color: #909399; margin: 0 0 30px 0">数据导入过程中出现错误</p>
        <el-button type="primary" @click="$emit('close')">关闭</el-button>
        <el-button @click="reset">重新导入</el-button>
      </div>
      <div v-if="importError" style="margin-top: 20px; text-align: left">
        <el-alert
          :title="importError"
          type="error"
          show-icon
          :closable="false"
        />
      </div>
    </div>
  </div>
</template>

<script>
import XLSX from 'xlsx'
import request from '@/utils/request'

export default {
  name: 'ImportMapping',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      activeStep: 0,
      excelFile: null,
      excelData: [],
      headerRow: [],
      mappingList: [],
      previewData: [],
      previewColumns: [],
      totalRows: 0,
      importLoading: false,
      importSuccess: false,
      importError: '',
      householdFields: [
        { label: '户主姓名', value: 'household_head_name' },
        { label: '组别', value: 'household_village_group' },
        { label: '家庭地址', value: 'household_address' },
        { label: '联系电话', value: 'household_phone_number' },
        { label: '民族', value: 'household_ethnicity' },
        { label: '性别', value: 'household_gender' },
        { label: '户口类型', value: 'householdType' },
        { label: '住房类型', value: 'housingType' },
        { label: '户主身份证号', value: 'household_head_id_card' }
      ],
      residentFields: [
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
        { label: '户籍状态', value: 'household_registration_status' },
        { label: '迁入日期', value: 'migration_in_date' },
        { label: '迁出日期', value: 'migration_out_date' },
        { label: '死亡日期', value: 'death_date' },
        { label: '注销日期', value: 'account_cancellation_date' },
        { label: '家庭地址', value: 'Home_address' },
        { label: '户主ID', value: 'household_head_id' }
      ]
    }
  },
  methods: {
    handleFileChange(file) {
      this.excelFile = file.raw
    },
    parseExcel() {
      if (!this.excelFile) {
        this.$message.error('请先上传Excel文件')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]

          // 获取完整的表头信息，包括空列
          const range = XLSX.utils.decode_range(worksheet['!ref'])
          const rawHeaders = []
          
          // 读取表头行
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell = worksheet[XLSX.utils.encode_cell({ c: C, r: range.s.r })]
            let hdr = 'UNKNOWN ' + C
            if (cell && cell.t) hdr = XLSX.utils.format_cell(cell)
            rawHeaders.push(hdr.replace(/[\r\n]/g, '').trim())
          }
          this.headerRow = rawHeaders
          
          // 直接读取所有数据行，不依赖sheet_to_json，确保所有列都被读取
          const excelData = []
          // 从第二行开始读取数据（range.s.r + 1）
          for (let R = range.s.r + 1; R <= range.e.r; ++R) {
            const rowData = []
            for (let C = range.s.c; C <= range.e.c; ++C) {
              const cellAddress = XLSX.utils.encode_cell({ c: C, r: R })
              const cell = worksheet[cellAddress]
              let value = ''
              
              if (cell) {
                // 确保正确处理所有类型的单元格
                switch (cell.t) {
                  case 's': // 字符串
                    value = cell.v || ''
                    break
                  case 'n': // 数字
                    value = cell.v || 0
                    // 转换为字符串，避免科学计数法
                    if (Number.isInteger(value)) {
                      value = value.toString()
                    } else {
                      value = value.toLocaleString()
                    }
                    break
                  case 'b': // 布尔值
                    value = cell.v ? '是' : '否'
                    break
                  case 'd': // 日期
                    value = cell.v ? new Date(cell.v).toLocaleDateString() : ''
                    break
                  default:
                    // 其他类型直接格式化
                    value = XLSX.utils.format_cell(cell)
                }
                
                if (typeof value === 'string') {
                  value = value.replace(/[\r\n]/g, ' ').trim()
                }
              }
              
              rowData.push(value)
            }
            excelData.push(rowData)
          }
          
          if (excelData.length < 1) {
            this.$message.error('Excel文件至少需要包含一条数据')
            return
          }
          
          this.excelData = excelData

          this.totalRows = this.excelData.length

          // 生成映射列表
          this.mappingList = this.headerRow.map((header, index) => {
            // 确保预览值正确获取，处理可能的数据行长度不匹配问题
            let preview = ''
            if (this.excelData.length > 0) {
              const firstDataRow = this.excelData[0]
              if (firstDataRow && index < firstDataRow.length) {
                preview = firstDataRow[index]
                // 确保预览值不为undefined或null
                if (preview === undefined || preview === null) {
                  preview = ''
                }
              }
            }
            
            return {
              excelField: header,
              dbField: this.getRecommendedMapping(header),
              preview: String(preview || '')
            }
          })

          this.activeStep = 1
        } catch (error) {
          console.error('解析Excel文件失败:', error)
          this.$message.error('解析Excel文件失败: ' + error.message)
        }
      }
      reader.readAsArrayBuffer(this.excelFile)
    },
    getRecommendedMapping(excelField) {
      // 保留原始字段名，同时准备多种清理后的字段名版本
      const originalField = excelField
      const cleanedField = excelField.replace(/[\r\n\s\t]/g, '').trim() // 移除所有空白字符
      const spaceCleanedField = excelField.replace(/[\r\n\t]/g, '').trim() // 仅移除换行符和制表符，保留空格
      const simplifiedField = excelField.replace(/[\r\n\t]/g, '').replace(/\s+/g, ' ').trim() // 合并多个空格为一个

      const mappings = {
        '姓名': 'name',
        '户主姓名': 'household_head_name',
        '与户主关系': 'relationship_to_head',
        '与户主 关系': 'relationship_to_head', // 带空格的版本
        '与户主': 'relationship_to_head',
        '关系': 'relationship_to_head',
        '性别': 'gender',
        '民族': 'ethnicity',
        '组别': 'village_group',
        '村组': 'village_group',
        '户籍详细地址': 'address',
        '地址': 'address',
        '家庭地址': 'address',
        '出生日期': 'date_of_birth',
        '身份证号码': 'id_card',
        '年龄': '', // 年龄可以从出生日期计算，不需要单独导入
        '联系电话': 'phone_number',
        '电话': 'phone_number',
        '联系方式': 'phone_number',
        '联系': 'phone_number',
        '方式': 'phone_number',
        '文化程度': 'education_level',
        '文化': 'education_level',
        '程度': 'education_level',
        '婚姻状况': 'marital_status',
        '兵役状况': 'military_service',
        '兵役': 'military_service',
        '状况': 'military_service',
        '政治面貌': 'political_status',
        '政治': 'political_status',
        '面貌': 'political_status',
        '开户银行': 'bank_name',
        '银行账号': 'bank_card',
        '拥有权数': 'equity_shares',
        '股权数量': 'equity_shares',
        '户口类型': 'householdType',
        '住房类型': 'housingType'
      }

      // 1. 尝试精确匹配多种清理版本
      if (mappings[cleanedField]) {
        return mappings[cleanedField]
      }
      if (mappings[spaceCleanedField]) {
        return mappings[spaceCleanedField]
      }
      if (mappings[simplifiedField]) {
        return mappings[simplifiedField]
      }

      // 2. 尝试精确匹配原始字段名
      if (mappings[originalField]) {
        return mappings[originalField]
      }

      // 3. 特殊处理：匹配包含"与户主"和"关系"的任意组合
      if ((originalField.includes('与户主') || cleanedField.includes('与户主') || spaceCleanedField.includes('与户主') || simplifiedField.includes('与户主')) &&
          (originalField.includes('关系') || cleanedField.includes('关系') || spaceCleanedField.includes('关系') || simplifiedField.includes('关系'))) {
        return 'relationship_to_head'
      }

      // 4. 尝试包含匹配（例如："与户主关系"可能包含"关系"）
      for (const [key, value] of Object.entries(mappings)) {
        if (cleanedField.includes(key) || key.includes(cleanedField) ||
            originalField.includes(key) || key.includes(originalField) ||
            spaceCleanedField.includes(key) || key.includes(spaceCleanedField) ||
            simplifiedField.includes(key) || key.includes(simplifiedField)) {
          return value
        }
      }

      return ''
    },
    autoMap() {
      this.mappingList.forEach(item => {
        const recommendedField = this.getRecommendedMapping(item.excelField)
        item.dbField = recommendedField
      })
    },
    generatePreviewData() {
      // 生成预览数据 - 显示所有Excel列，无论是否映射
      const columns = []
      const data = []

      // 为所有Excel列创建预览列配置
      this.mappingList.forEach((item, index) => {
        let label = item.excelField
        // 如果已映射，添加映射信息
        if (item.dbField) {
          label += ' → ' + this.getFieldLabel(item.dbField)
        } else {
          label += ' → 未映射'
        }

        columns.push({
          label: label,
          prop: `col_${index}` // 使用索引作为属性名，确保唯一
        })
      })

      // 生成前5条数据预览
      this.excelData.slice(0, 5).forEach((row, rowIndex) => {
        const previewRow = {}
        // 填充所有列的数据
        row.forEach((value, colIndex) => {
          previewRow[`col_${colIndex}`] = value !== undefined ? value : ''
        })
        data.push(previewRow)
      })

      this.previewColumns = columns
      this.previewData = data
      this.activeStep = 2
    },
    getFieldLabel(dbField) {
      // 处理带前缀的字段
      const fieldMap = {
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
        'household_registration_status': '户籍状态',
        'migration_in_date': '迁入日期',
        'migration_out_date': '迁出日期',
        'death_date': '死亡日期',
        'account_cancellation_date': '注销日期',
        'Home_address': '家庭地址',
        'household_head_id': '户主ID'
      }

      return fieldMap[dbField] || dbField
    },
    async importData() {
      this.importLoading = true
      this.importSuccess = false
      this.importError = ''

      try {
        // 准备导入数据 - 保留完整的字段名用于后端映射
        const importData = {
          headers: this.headerRow,
          data: this.excelData, // 这里已经是数组的数组格式，后端会处理
          mapping: this.mappingList.map(item => ({
            excelField: item.excelField,
            dbField: item.dbField
          }))
        }

        // 调用导入API
        const response = await request.post('/import-residents', importData)

        if (response && response.code === 20000) {
          this.importSuccess = true
          this.activeStep = 3
          this.$emit('import-success')
        } else {
          this.importError = response?.message || response?.data?.message || '导入失败'
          this.activeStep = 3
        }
      } catch (error) {
        console.error('导入失败:', error)
        const errorMessage = error.response?.data?.message || error.message || '导入失败'
        this.importError = errorMessage
        this.activeStep = 3
      } finally {
        this.importLoading = false
      }
    },
    reset() {
      this.activeStep = 0
      this.excelFile = null
      this.excelData = []
      this.headerRow = []
      this.mappingList = []
      this.previewData = []
      this.previewColumns = []
      this.totalRows = 0
      this.importLoading = false
      this.importSuccess = false
      this.importError = ''
    }
  }
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
