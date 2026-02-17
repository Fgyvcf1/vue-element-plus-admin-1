<template>
  <div class="app-container">
    <el-card>
      <el-form ref="queryForm" :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="居民姓名">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入居民姓名"
            clearable
            size="small"
            style="width: 200px"
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
        <el-form-item label="残疾类型">
          <el-select
            v-model="queryParams.disabilityType"
            placeholder="请选择残疾类型"
            clearable
            size="small"
            style="width: 200px"
            @change="handleQuery"
          >
            <el-option
              v-for="option in disabilityTypeOptions"
              :key="option.value"
              :label="option.value"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="残疾等级">
          <el-select
            v-model="queryParams.disabilityLevel"
            placeholder="请选择残疾等级"
            clearable
            size="small"
            style="width: 150px"
            @change="handleQuery"
          >
            <el-option label="一级" value="一级" />
            <el-option label="二级" value="二级" />
            <el-option label="三级" value="三级" />
            <el-option label="四级" value="四级" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" icon="el-icon-search" @click="handleQuery"
            >搜索</el-button
          >
          <el-button size="small" icon="el-icon-refresh" @click="resetQuery">重置</el-button>
          <el-button type="success" size="small" icon="el-icon-plus" @click="handleAdd"
            >新增残疾人</el-button
          >
          <span style="margin-left: 20px; color: #409eff; cursor: pointer" @click="handleExport"
            >导出</span
          >
        </el-form-item>
      </el-form>

      <el-table
        v-loading="loading"
        :data="disabledList"
        size="small"
        style="width: 100%"
        @row-click="handleRowClick"
      >
        <el-table-column type="index" width="50" align="center" />
        <el-table-column prop="name" label="居民姓名" align="center" width="100" />
        <el-table-column prop="gender" label="性别" align="center" width="60" />
        <el-table-column prop="age" label="年龄" align="center" width="60" />
        <el-table-column prop="disabilityType" label="残疾类型" align="center" width="100" />
        <el-table-column prop="disabilityLevel" label="残疾等级" align="center" width="80">
          <template slot-scope="scope">
            <span>{{ scope.row.disabilityLevel }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="certificateNumber" label="残疾证号" align="center" width="180" />
        <el-table-column prop="issueDate" label="初次发证日期" align="center" width="110" />
        <el-table-column prop="certificateStatus" label="持证状态" align="center" width="80">
          <template slot-scope="scope">
            <el-tag :type="scope.row.certificateStatus === '在持' ? 'success' : 'info'" size="mini">
              {{ scope.row.certificateStatus }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="guardianName" label="监护人姓名" align="center" width="100" />
        <el-table-column prop="guardianPhone" label="监护人电话" align="center" width="120" />
        <el-table-column
          prop="guardianRelationship"
          label="与残疾人关系"
          align="center"
          width="120"
        />
        <el-table-column prop="address" label="家庭住址" align="center" min-width="200" />
      </el-table>

      <pagination
        v-show="total > 0"
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </el-card>

    <!-- 残疾人信息详情模态框 -->
    <disabled-person-modal
      :visible="modalVisible"
      :disabled-person-id="selectedDisabledPersonId"
      @update:visible="handleModalClose"
      @refresh-list="getList"
    />
  </div>
</template>

<script>
import Pagination from '@/components/Pagination' // secondary package based on el-pagination
import DisabledPersonModal from '@/components/DisabledPersonModal'
import { getDisabledPersons } from '@/api/special-people'
import dictionaryCache from '@/utils/dictionary-cache'
import { export_json_to_excel } from '@/vendor/Export2Excel'

export default {
  name: 'DisabledList',
  components: {
    Pagination,
    DisabledPersonModal
  },
  data() {
    return {
      loading: false,
      total: 0,
      disabledList: [],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        name: undefined,
        idCard: undefined,
        disabilityType: undefined,
        disabilityLevel: undefined
      },
      // 残疾类型选项
      disabilityTypeOptions: [],
      // 模态框相关
      modalVisible: false,
      selectedDisabledPersonId: null
    }
  },
  created() {
    // 默认不自动加载数据，只在点击搜索后加载
    this.loadDisabilityTypeOptions()
  },
  methods: {
    // 加载残疾类型选项
    async loadDisabilityTypeOptions() {
      try {
        const disabilityTypes = await dictionaryCache.getDictionary('残疾类型')
        this.disabilityTypeOptions = disabilityTypes
      } catch (error) {
        console.error('加载残疾类型选项失败:', error)
      }
    },

    getList() {
      this.loading = true
      getDisabledPersons(this.queryParams)
        .then((response) => {
          if (response && response.data && Array.isArray(response.data)) {
            // 将API返回的数据转换为组件需要的格式
            this.disabledList = response.data.map((item) => ({
              id: item.id,
              name: item.name || '',
              idCard: item.idCard || '',
              gender: item.gender || '',
              age: item.age || '',
              disabilityType: item.disability_type,
              disabilityLevel: item.disability_level,
              certificateNumber: item.certificate_number,
              issueDate: item.issue_date,
              certificateStatus: item.certificate_status || '在持',
              guardianName: item.guardian_name || '',
              guardianPhone: item.guardian_phone || '',
              guardianRelationship: item.guardian_relationship || '',
              address:
                item.household_address ||
                item.resident_address ||
                item.address ||
                item.residence_address ||
                ''
            }))
            this.total = response.data.length
          } else {
            // 没有数据时显示空数组
            this.disabledList = []
            this.total = 0
          }
          this.loading = false
        })
        .catch((error) => {
          console.error('获取残疾人数据失败:', error)
          this.disabledList = []
          this.total = 0
          this.loading = false
          this.$message.error('获取残疾人数据失败')
        })
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.$refs.queryForm?.resetFields()
      this.queryParams = {
        pageNum: 1,
        pageSize: 10,
        name: undefined,
        idCard: undefined,
        disabilityType: undefined,
        disabilityLevel: undefined
      }
      // 清空查询结果，而不是重新加载数据
      this.disabledList = []
      this.total = 0
    },
    handleAdd() {
      this.$router.push('/special-people/disabled/add')
    },
    // 编辑和删除功能已移到模态框中

    handleRowClick(row) {
      // 点击行显示详情模态框
      // 即使点击同一个人，也要先重置状态再打开
      this.modalVisible = false
      this.selectedDisabledPersonId = null

      // 使用 nextTick 确保状态更新后再打开模态框
      this.$nextTick(() => {
        this.selectedDisabledPersonId = row.id
        this.modalVisible = true
      })
    },

    // 处理模态框关闭
    handleModalClose(val) {
      this.modalVisible = val
      if (!val) {
        // 模态框关闭时重置数据
        this.selectedDisabledPersonId = null
      }
    },

    // 导出功能
    handleExport() {
      if (this.disabledList.length === 0) {
        this.$message.warning('没有数据可导出')
        return
      }

      // 定义Excel表头
      const headers = [
        '序号',
        '居民姓名',
        '性别',
        '年龄',
        '残疾类型',
        '残疾等级',
        '残疾证号',
        '初次发证日期',
        '持证状态',
        '监护人姓名',
        '监护人电话',
        '与残疾人关系',
        '家庭住址'
      ]
      const textColumns = [2, 6, 10] // 身份证号(索引2)、残疾证号(索引6)、监护人电话(索引10)设置为文本格式

      // 转换数据
      const data = this.disabledList.map((item, index) => [
        index + 1,
        item.name || '',
        item.gender || '',
        item.age || '',
        item.disabilityType || '',
        item.disabilityLevel || '',
        item.certificateNumber || '',
        item.issueDate || '',
        item.certificateStatus || '在持',
        item.guardianName || '',
        item.guardianPhone || '',
        item.guardianRelationship || '',
        item.address || ''
      ])

      export_json_to_excel({
        header: headers,
        data: data,
        filename: `残疾人信息_${new Date().toISOString().slice(0, 10)}`,
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
.demo-form-inline .el-form-item {
  margin-bottom: 16px;
}
</style>
