<template>
  <div class="app-container">
    <el-card>
      <el-form ref="queryForm" :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="居民姓名">
          <el-autocomplete
            v-model="queryParams.name"
            placeholder="请输入居民姓名"
            clearable
            size="small"
            style="width: 200px"
            :fetch-suggestions="fetchResidentNameSuggestions"
            value-key="value"
            @select="handleQuery"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="身份证号">
          <el-input
            v-model="queryParams.idCard"
            placeholder="请输入身份证号"
            clearable
            size="small"
            style="width: 200px"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="户主姓名">
          <el-autocomplete
            v-model="queryParams.householdHeadName"
            placeholder="请输入户主姓名"
            clearable
            size="small"
            style="width: 200px"
            :fetch-suggestions="fetchHouseholdHeadNameSuggestions"
            value-key="value"
            @select="handleQuery"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="性别">
          <el-select
            v-model="queryParams.gender"
            placeholder="请选择性别"
            clearable
            size="small"
            style="width: 150px"
          >
            <el-option label="男" value="男" />
            <el-option label="女" value="女" />
          </el-select>
        </el-form-item>

        <el-form-item label="村组">
          <el-select
            v-model="queryParams.villageGroup"
            placeholder="请选择或输入村组"
            clearable
            size="small"
            style="width: 150px"
            filterable
            allow-create
            @change="handleQuery"
          >
            <el-option
              v-for="group in villageGroups"
              :key="group.value"
              :label="group.label"
              :value="group.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="出生年份">
          <el-select
            ref="birthYearSelect"
            v-model="queryParams.birthYear"
            placeholder="请选择或输入出生年份"
            clearable
            size="small"
            style="width: 150px"
            filterable
            allow-create
            @change="handleQuery"
            @visible-change="handleBirthYearVisibleChange"
          >
            <el-option
              v-for="year in birthYears"
              :key="year.value"
              :ref="year.value === '1980' ? 'year1980' : undefined"
              :label="year.label"
              :value="year.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input
            v-model="queryParams.phoneNumber"
            placeholder="请输入联系电话"
            clearable
            size="small"
            style="width: 200px"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择状态"
            clearable
            size="small"
            style="width: 150px"
          >
            <el-option label="正常" value="active" />
            <el-option label="迁出" value="migrated_out" />
            <el-option label="死亡" value="deceased" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" icon="el-icon-search" @click="handleQuery">搜索</el-button>
          <el-button size="small" icon="el-icon-refresh" @click="resetQuery">重置</el-button>
          <span style="margin-left: 20px; color: #409EFF; cursor: pointer;" @click="handleExport">导出</span>
        </el-form-item>
      </el-form>

      <!-- 查询结果统计 -->
      <div v-if="showResult" class="result-summary">
        查询结果：{{ householdCount }}户{{ personCount }}人
      </div>

      <el-table v-loading="loading" :data="showResult ? residentList : []" :row-style="{ height: '26px' }" size="small" class="custom-row-height-table" @row-click="handleRowClick" @row-contextmenu="(row, column, $event) => handleRowContextMenu(row, column, $event)">
        <el-table-column label="序号" type="index" width="60" align="center" />
        <el-table-column prop="name" label="居民姓名" align="center" width="90" />
        <el-table-column prop="idCard" label="身份证号" align="center" width="180" />
        <el-table-column prop="gender" label="性别" align="center" width="60" />
        <el-table-column prop="householdHeadName" label="户主姓名" align="center" width="90" />
        <el-table-column prop="relationship_to_head" label="与户主关系" align="center" width="100" />
        <el-table-column prop="dateOfBirth" label="出生日期" align="center" width="120" />
        <el-table-column prop="age" label="年龄" align="center" width="60" />
        <el-table-column prop="villageGroup" label="村组" align="center" width="90" />
        <el-table-column prop="address" label="家庭地址" align="center" width="200" />
        <el-table-column prop="phoneNumber" label="联系电话" align="center" width="120" />
        <el-table-column prop="bankCard" label="银行帐号" align="center" width="180" />
        <el-table-column label="股权数量" align="center" width="100">
          <template slot-scope="scope">
            {{ Number(scope.row.equity_shares || scope.row.equityShares || 0) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" align="center" width="80">
          <template slot-scope="scope">
            {{ scope.row.status === 'active' ? '正常' : scope.row.status === 'migrated_out' ? '迁出' : scope.row.status === 'deceased' ? '死亡' : scope.row.status }}
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total>0"
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </el-card>

    <!-- 居民详细信息模态框 -->
    <resident-detail-dialog
      v-model="dialogVisible"
      :resident-data="selectedResident"
      @refresh-list="getList"
    />

    <!-- 右键菜单 -->
    <div
      v-if="contextMenuVisible"
      class="context-menu"
      :style="{ left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px' }"
      @click.stop
    >
      <ul class="menu-list">
        <li class="menu-item" @click="handleAddDisabled">添加为残疾人</li>
        <li class="menu-item" @click="handleAddLowIncome">添加为低收入人群</li>
      </ul>
    </div>
  </div>
</template>

<script>
import Pagination from '@/components/Pagination' // secondary package based on el-pagination
import { getResidents, getSearchSuggestions } from '@/api/resident'
import dictionaryCache from '@/utils/dictionary-cache'
import ResidentDetailDialog from '@/components/ResidentDetailDialog' // 导入居民详细信息模态框组件
import { export_json_to_excel } from '@/vendor/Export2Excel'

export default {
  name: 'ResidentList',
  components: {
    Pagination,
    ResidentDetailDialog // 注册模态框组件
  },
  data() {
    return {
      loading: false,
      total: 0,
      totalHouseholds: 0, // 总条数：总户数
      totalPersons: 0, // 总人数
      showResult: false, // 控制是否显示查询结果
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        name: undefined,
        idCard: undefined,
        householdHeadName: undefined,
        gender: undefined,
        villageGroup: undefined,
        birthYear: undefined,
        phoneNumber: undefined,
        status: 'active'
      },
      residentList: [],
      villageGroups: [], // 从字典API获取的村组数据
      birthYears: [], // 生成的出生年份选项
      loadingDictionaries: false, // 字典加载状态
      dialogVisible: false, // 模态框显示状态
      selectedResident: {}, // 当前选中的居民数据
      // 右键菜单相关数据
      contextMenuVisible: false,
      contextMenuPosition: { x: 0, y: 0 },
      selectedRow: null
    }
  },
  computed: {
    // 计算查询结果中的户数
    householdCount() {
      return this.totalHouseholds
    },
    // 计算查询结果中的人数
    personCount() {
      return this.totalPersons
    }
  },
  created() {
    // 初始化时不加载数据，只加载村组字典
    this.loadVillageGroups()
    // 生成出生年份选项
    this.generateBirthYears()
    // 添加全局点击事件，关闭右键菜单
    document.addEventListener('click', this.closeContextMenu)
  },
  beforeDestroy() {
    // 移除全局点击事件
    document.removeEventListener('click', this.closeContextMenu)
  },
  methods: {
    getList() {
      this.loading = true
      // 确保显示查询结果
      this.showResult = true

      getResidents(this.queryParams).then(response => {
        // 安全地处理后端响应
        let residents = []
        let total = 0
        let totalHouseholds = 0
        let totalPersons = 0

        try {
          console.log('API Response:', response)

          // 检查响应格式是否正确
          if (response) {
            // 由于response interceptor已经处理过，response就是后端返回的{ code: 20000, data: residents, total: total }
            if (Array.isArray(response.data)) {
              // 处理字段名映射，确保前端能正确显示
              residents = response.data.map(item => ({
                ...item,
                // 处理驼峰命名和下划线命名的字段
                householdHeadName: item.household_head_name || item.householdHeadName,
                relationshipToHead: item.relationship_to_head || item.relationshipToHead,
                phoneNumber: item.phone_number || item.phoneNumber,
                equityShares: item.equity_shares || item.equityShares || 0,
                // 同时保留其他字段的原始值
                relationship_to_head: item.relationship_to_head || item.relationshipToHead,
                phone_number: item.phone_number || item.phoneNumber,
                equity_shares: item.equity_shares || item.equityShares || 0
              }))
            }

            // 获取总数
            if (response.total !== undefined) {
              // 确保total是数字类型
              total = parseInt(response.total) || 0
            } else if (Array.isArray(residents)) {
              total = residents.length
            }

            // 获取总户数
            if (response.totalHouseholds !== undefined) {
              totalHouseholds = parseInt(response.totalHouseholds) || 0
            }

            // 获取总人数
            if (response.totalPersons !== undefined) {
              totalPersons = parseInt(response.totalPersons) || 0
            } else {
              totalPersons = total
            }
          }
        } catch (error) {
          console.error('处理响应数据时出错:', error)
        }

        this.residentList = residents
        this.total = total
        this.totalHouseholds = totalHouseholds
        this.totalPersons = totalPersons
        this.loading = false
        console.log('获取到居民数据:', residents)
      }).catch(error => {
        console.error('获取居民数据失败:', error)
        this.loading = false
        this.$message.error('获取居民数据失败')
      })
    },
    // 加载村组字典数据
    async loadVillageGroups() {
      this.loadingDictionaries = true
      console.log('开始加载村组字典数据...')

      try {
        // 使用字典缓存服务获取村组数据
        const dictionaries = await dictionaryCache.getDictionary('村组')

        console.log('API响应:', dictionaries)
        console.log('原始字典数据:', dictionaries)

        // 过滤出有效的村组数据（category为"村组"且status为"active"）
        const validGroups = dictionaries
          .filter(item => item.category && item.category.includes('村组') && (item.status === 'active' || item.status === undefined))
          .map(item => ({
            label: item.value, // 使用字典中的value作为显示文本
            value: item.value // 使用字典中的value作为值
          }))

        console.log('过滤后有效的村组数据:', validGroups)
        this.villageGroups = validGroups

        if (validGroups.length === 0) {
          console.warn('未找到有效的村组数据，使用默认值')
          // 如果没有找到有效数据，使用默认值
          this.villageGroups = [
            { label: '一组', value: '一组' },
            { label: '二组', value: '二组' },
            { label: '三组', value: '三组' },
            { label: '四组', value: '四组' }
          ]
        }
      } catch (error) {
        console.error('加载村组字典失败:', error)
        // 如果API调用失败，使用默认值
        this.villageGroups = [
          { label: '一组', value: '一组' },
          { label: '二组', value: '二组' },
          { label: '三组', value: '三组' },
          { label: '四组', value: '四组' }
        ]
      } finally {
        this.loadingDictionaries = false
        console.log('村组字典数据加载完成，共', this.villageGroups.length, '项')
      }
    },
    // 生成出生年份选项
    generateBirthYears() {
      const currentYear = new Date().getFullYear()
      const startYear = currentYear - 100 // 生成最近100年的年份
      const years = []

      for (let year = startYear; year <= currentYear; year++) {
        years.push({
          label: year.toString(),
          value: year.toString()
        })
      }

      this.birthYears = years
    },
    // 处理出生年份下拉框展开事件，滚动到1980年位置
    handleBirthYearVisibleChange(visible) {
      if (visible) {
        this.$nextTick(() => {
          // 找到1980年的选项元素并滚动到可见区域
          const year1980El = this.$refs.year1980?.[0]?.$el
          if (year1980El) {
            year1980El.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        })
      }
    },
    // 获取居民姓名搜索建议
    fetchResidentNameSuggestions(queryString, callback) {
      if (!queryString || queryString.trim().length < 1) {
        callback([])
        return
      }

      getSearchSuggestions({ keyword: queryString, type: 'residentNames' }).then(response => {
        if (response && response.code === 20000) {
          callback(response.residentNames || [])
        } else {
          callback([])
        }
      }).catch(() => {
        callback([])
      })
    },
    // 获取户主姓名搜索建议
    fetchHouseholdHeadNameSuggestions(queryString, callback) {
      if (!queryString || queryString.trim().length < 1) {
        callback([])
        return
      }

      getSearchSuggestions({ keyword: queryString, type: 'householdHeadNames' }).then(response => {
        if (response && response.code === 20000) {
          callback(response.householdHeadNames || [])
        } else {
          callback([])
        }
      }).catch(() => {
        callback([])
      })
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.showResult = true // 显示查询结果
      this.getList()
    },
    resetQuery() {
      // 重置表单
      this.resetForm('queryForm')
      // 清空所有查询参数
      this.queryParams = {
        pageNum: 1,
        pageSize: 10,
        name: undefined,
        idCard: undefined,
        householdHeadName: undefined,
        gender: undefined,
        villageGroup: undefined,
        birthYear: undefined,
        phoneNumber: undefined,
        status: 'active'
      }
      // 隐藏查询结果
      this.showResult = false
      // 清空结果列表和统计数据
      this.residentList = []
      this.total = 0
      this.totalHouseholds = 0
      this.totalPersons = 0
    },
    handleUpdate(row) {
      this.$router.push({ path: `/resident/edit/${row.id}` })
    },
    handleDelete(row) {
      this.$confirm(`确定要删除居民【${row.name}】吗？`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 这里应该调用删除API，暂时使用模拟删除
        setTimeout(() => {
          // 从当前列表中移除该居民
          this.residentList = this.residentList.filter(item => item.id !== row.id)
          this.total = this.residentList.length
          this.$message.success('删除成功')
        }, 500)
      })
    },

    resetForm(formName) {
      this.$refs[formName]?.resetFields()
    },
    // 行点击事件处理函数
    handleRowClick(row) {
      // 设置当前选中的居民数据
      this.selectedResident = row
      // 打开模态框
      this.dialogVisible = true
    },

    // 右键菜单事件处理
    handleRowContextMenu(row, column, event) {
      // 获取原始DOM事件
      const originalEvent = event instanceof Event ? event : (event.event || event.$event || window.event)

      // 确保阻止默认右键菜单
      if (originalEvent) {
        originalEvent.preventDefault()
        originalEvent.stopPropagation()
      }

      this.selectedRow = row

      // 正确获取鼠标位置
      const x = originalEvent ? originalEvent.clientX : 0
      const y = originalEvent ? originalEvent.clientY : 0

      this.contextMenuPosition = {
        x: x,
        y: y
      }

      this.contextMenuVisible = true
    },

    // 关闭右键菜单
    closeContextMenu(event) {
      // 只有当点击事件不是来自右键菜单本身时才关闭菜单
      // 或者如果没有事件（直接调用时）
      if (!event || !event.target || !event.target.closest('.context-menu')) {
        this.contextMenuVisible = false
      }
    },

    // 添加为残疾人
    handleAddDisabled() {
      this.closeContextMenu()
      // 跳转到残疾人添加页面，传递居民ID
      this.$router.push({
        path: '/special-people/disabled/add',
        query: { residentId: this.selectedRow.id }
      })
    },

    // 添加为低收入人群
    handleAddLowIncome() {
      this.closeContextMenu()
      // 跳转到低收入人群添加页面，传递居民ID
      this.$router.push({
        path: '/special-people/low-income/add',
        query: { residentId: this.selectedRow.id }
      })
    },

    // 导出功能
    handleExport() {
      if (this.residentList.length === 0) {
        this.$message.warning('没有数据可导出')
        return
      }

      // 定义Excel表头
      const headers = ['序号', '居民姓名', '身份证号', '性别', '户主姓名', '与户主关系', '出生日期', '年龄', '村组', '家庭地址', '联系电话', '银行帐号', '状态']
      const textColumns = [2, 11] // 身份证号(索引2)、银行账号(索引11)设置为文本格式

      // 转换数据
      const data = this.residentList.map((item, index) => [
        index + 1,
        item.name || '',
        item.idCard || '',
        item.gender || '',
        item.householdHeadName || item.household_head_name || '',
        item.relationship_to_head || item.relationshipToHead || '',
        item.dateOfBirth || '',
        item.age || '',
        item.villageGroup || '',
        item.address || '',
        item.phoneNumber || item.phone_number || '',
        item.bankCard || '',
        item.status === 'active' ? '正常' : item.status === 'migrated_out' ? '迁出' : item.status === 'deceased' ? '死亡' : item.status || ''
      ])

      export_json_to_excel({
        header: headers,
        data: data,
        filename: `居民信息_${new Date().toISOString().slice(0, 10)}`,
        textColumns: textColumns,
        autoWidth: true,
        bookType: 'xlsx'
      })

      this.$message.success('导出成功')
    }
  }
}
</script>

<style scoped>
.result-summary {
  margin: 10px 0;
  font-weight: bold;
  color: #606266;
}

/* 减小查询表单行间距 */
.demo-form-inline .el-form-item {
  margin-bottom: 16px !important; /* 默认20px，缩小20%后为16px */
}

/* 自定义行高样式 */
.custom-row-height-table {
  .el-table__row {
    height: 26px !important;
  }
  .el-table__cell {
    padding: 4px 0 !important; /* 调整单元格内边距以匹配新行高 */
    line-height: 26px !important; /* 确保文本垂直居中 */
  }
}

/* 右键菜单样式 */
.context-menu {
  position: fixed;
  z-index: 10000;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  background-color: #fff;
  border-radius: 4px;
  overflow: hidden;
}

.menu-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.menu-item {
  padding: 10px 20px;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.menu-item:hover {
  background-color: #f5f7fa;
}
</style>

