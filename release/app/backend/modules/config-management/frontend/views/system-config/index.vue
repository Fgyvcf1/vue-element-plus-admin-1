<template>
  <div class="system-config-container">
    <div class="app-container">
      <el-card class="box-card">
        <div slot="header" class="clearfix">
          <span>系统配置管理</span>
        </div>

        <!-- 筛选区域 -->
        <el-form :inline="true" :model="queryParams" class="demo-form-inline">
          <el-form-item label="配置组">
            <el-select
              v-model="queryParams.group"
              placeholder="全部"
              clearable
              @change="handleQuery"
            >
              <el-option
                v-for="item in groupOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="关键字">
            <el-input
              v-model="queryParams.keyword"
              placeholder="配置名称/键/描述"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">查询</el-button>
            <el-button @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <!-- 操作按钮 -->
        <el-row style="margin-bottom: 20px">
          <el-col :span="12">
            <el-button type="primary" icon="el-icon-plus" @click="handleAdd">新增配置</el-button>
            <el-button
              type="success"
              icon="el-icon-check"
              :disabled="selectedConfigs.length === 0"
              @click="handleBatchSave"
            >
              批量保存
            </el-button>
          </el-col>
          <el-col :span="12" style="text-align: right">
            <el-tag type="info">共 {{ total }} 条配置</el-tag>
          </el-col>
        </el-row>

        <!-- 配置列表 -->
        <el-table
          v-loading="loading"
          :data="configList"
          border
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="config_name" label="配置名称" width="200" />
          <el-table-column prop="config_key" label="配置键" width="200">
            <template slot-scope="scope">
              <el-tag size="small">{{ scope.row.config_key }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="config_group" label="配置组" width="120">
            <template slot-scope="scope">
              <el-tag
                :type="
                  scope.row.config_group === 'notification'
                    ? 'warning'
                    : scope.row.config_group === 'system'
                      ? 'primary'
                      : 'info'
                "
                size="small"
              >
                {{
                  scope.row.config_group === 'notification'
                    ? '通知配置'
                    : scope.row.config_group === 'system'
                      ? '系统配置'
                      : scope.row.config_group === 'dictionary'
                        ? '字典配置'
                        : scope.row.config_group
                }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="配置值" min-width="200">
            <template slot-scope="scope">
              <el-input
                v-if="scope.row.value_type === 'string'"
                v-model="scope.row.config_value"
                placeholder="请输入配置值"
                @change="handleConfigChange(scope.row)"
              />
              <el-input-number
                v-else-if="scope.row.value_type === 'number'"
                v-model="scope.row.config_value"
                :min="0"
                @change="handleConfigChange(scope.row)"
              />
              <el-switch
                v-else-if="scope.row.value_type === 'boolean'"
                v-model="scope.row.config_value"
                :active-value="'1'"
                :inactive-value="'0'"
                @change="handleConfigChange(scope.row)"
              />
              <el-time-picker
                v-else-if="scope.row.value_type === 'time'"
                v-model="scope.row.config_value"
                value-format="HH:mm:ss"
                @change="handleConfigChange(scope.row)"
              />
              <el-input
                v-else
                v-model="scope.row.config_value"
                placeholder="请输入配置值"
                @change="handleConfigChange(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
          <el-table-column prop="is_system" label="系统配置" width="100">
            <template slot-scope="scope">
              <el-tag :type="scope.row.is_system === 1 ? 'danger' : 'success'" size="small">
                {{ scope.row.is_system === 1 ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="handleSave(scope.row)">保存</el-button>
              <el-button
                v-if="scope.row.is_system !== 1"
                type="text"
                size="small"
                style="color: #f56c6c"
                @click="handleDelete(scope.row)"
                >删除</el-button
              >
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <el-pagination
          :current-page="queryParams.page"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="queryParams.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          style="margin-top: 20px; text-align: right"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </el-card>

      <!-- 新增/编辑对话框 -->
      <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="600px">
        <el-form ref="configForm" :model="configForm" :rules="configRules" label-width="100px">
          <el-form-item label="配置名称" prop="config_name">
            <el-input v-model="configForm.config_name" placeholder="请输入配置名称" />
          </el-form-item>
          <el-form-item label="配置键" prop="config_key">
            <el-input v-model="configForm.config_key" placeholder="请输入配置键（英文）" />
          </el-form-item>
          <el-form-item label="配置组" prop="config_group">
            <el-select
              v-model="configForm.config_group"
              placeholder="请选择配置组"
              style="width: 100%"
            >
              <el-option label="通知配置" value="notification" />
              <el-option label="系统配置" value="system" />
              <el-option label="字典配置" value="dictionary" />
            </el-select>
          </el-form-item>
          <el-form-item label="值类型" prop="value_type">
            <el-select
              v-model="configForm.value_type"
              placeholder="请选择值类型"
              style="width: 100%"
            >
              <el-option label="字符串" value="string" />
              <el-option label="数字" value="number" />
              <el-option label="布尔值" value="boolean" />
              <el-option label="时间" value="time" />
            </el-select>
          </el-form-item>
          <el-form-item label="配置值" prop="config_value">
            <el-input v-model="configForm.config_value" placeholder="请输入配置值" />
          </el-form-item>
          <el-form-item label="描述" prop="description">
            <el-input
              v-model="configForm.description"
              type="textarea"
              :rows="3"
              placeholder="请输入描述"
            />
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="handleSubmit">确 定</el-button>
        </div>
      </el-dialog>
    </div>
  </div>
</template>

<script>
import {
  getConfigList,
  createConfig,
  updateConfig,
  deleteConfig,
  getConfigGroups
} from '../../api/config'

export default {
  name: 'SystemConfig',
  data() {
    return {
      // 加载状态
      loading: false,
      // 查询参数
      queryParams: {
        page: 1,
        pageSize: 20,
        group: '',
        keyword: ''
      },
      // 配置列表
      configList: [],
      // 总数
      total: 0,
      // 配置组选项
      groupOptions: [],
      // 选中的配置
      selectedConfigs: [],
      // 对话框
      dialogVisible: false,
      dialogTitle: '新增配置',
      // 表单
      configForm: {
        config_name: '',
        config_key: '',
        config_group: '',
        value_type: 'string',
        config_value: '',
        description: ''
      },
      // 表单验证规则
      configRules: {
        config_name: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
        config_key: [
          { required: true, message: '请输入配置键', trigger: 'blur' },
          {
            pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
            message: '配置键只能包含字母、数字和下划线，且不能以数字开头',
            trigger: 'blur'
          }
        ],
        config_group: [{ required: true, message: '请选择配置组', trigger: 'change' }],
        value_type: [{ required: true, message: '请选择值类型', trigger: 'change' }],
        config_value: [{ required: true, message: '请输入配置值', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.fetchConfigGroups()
    this.fetchConfigList()
  },
  methods: {
    // 获取配置组
    async fetchConfigGroups() {
      try {
        const res = await getConfigGroups()
        if (res.success) {
          this.groupOptions = res.data
        }
      } catch (error) {
        console.error('获取配置组失败:', error)
      }
    },
    // 获取配置列表
    async fetchConfigList() {
      this.loading = true
      try {
        const res = await getConfigList(this.queryParams)
        if (res.success) {
          this.configList = res.data.list
          this.total = res.data.total
        }
      } catch (error) {
        console.error('获取配置列表失败:', error)
        this.$message.error('获取配置列表失败')
      } finally {
        this.loading = false
      }
    },
    // 查询
    handleQuery() {
      this.queryParams.page = 1
      this.fetchConfigList()
    },
    // 重置
    resetQuery() {
      this.queryParams = {
        page: 1,
        pageSize: 20,
        group: '',
        keyword: ''
      }
      this.fetchConfigList()
    },
    // 分页大小改变
    handleSizeChange(val) {
      this.queryParams.pageSize = val
      this.fetchConfigList()
    },
    // 当前页改变
    handleCurrentChange(val) {
      this.queryParams.page = val
      this.fetchConfigList()
    },
    // 选择改变
    handleSelectionChange(val) {
      this.selectedConfigs = val
    },
    // 配置值改变
    handleConfigChange(row) {
      row.changed = true
    },
    // 保存单个配置
    async handleSave(row) {
      try {
        const res = await updateConfig(row.config_key, row.config_value)
        if (res.success) {
          this.$message.success('保存成功')
          row.changed = false
        }
      } catch (error) {
        console.error('保存配置失败:', error)
        this.$message.error('保存配置失败')
      }
    },
    // 批量保存
    async handleBatchSave() {
      const changedConfigs = this.selectedConfigs.filter((item) => item.changed)
      if (changedConfigs.length === 0) {
        this.$message.warning('没有需要保存的配置')
        return
      }

      try {
        const configs = changedConfigs.map((item) => ({
          key: item.config_key,
          value: item.config_value
        }))
        const res = await updateConfigsBatch(configs)
        if (res.success) {
          this.$message.success(`成功保存 ${res.data.updated} 条配置`)
          this.fetchConfigList()
        }
      } catch (error) {
        console.error('批量保存失败:', error)
        this.$message.error('批量保存失败')
      }
    },
    // 新增
    handleAdd() {
      this.dialogTitle = '新增配置'
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.configForm && this.$refs.configForm.resetFields()
      })
    },
    // 提交表单
    handleSubmit() {
      this.$refs.configForm.validate(async (valid) => {
        if (valid) {
          try {
            const res = await createConfig({
              key: this.configForm.config_key,
              value: this.configForm.config_value,
              name: this.configForm.config_name,
              group: this.configForm.config_group,
              type: this.configForm.value_type,
              description: this.configForm.description
            })
            if (res.success) {
              this.$message.success('创建成功')
              this.dialogVisible = false
              this.fetchConfigList()
            }
          } catch (error) {
            console.error('创建配置失败:', error)
            this.$message.error('创建配置失败')
          }
        }
      })
    },
    // 删除
    handleDelete(row) {
      this.$confirm('确认删除该配置吗？', '提示', {
        type: 'warning'
      })
        .then(async () => {
          try {
            const res = await deleteConfig(row.config_key)
            if (res.success) {
              this.$message.success('删除成功')
              this.fetchConfigList()
            }
          } catch (error) {
            console.error('删除配置失败:', error)
            this.$message.error('删除配置失败')
          }
        })
        .catch(() => {})
    }
  }
}
</script>

<style scoped>
.system-config-container {
  padding: 20px;
}

.clearfix:before,
.clearfix:after {
  display: table;
  content: '';
}

.clearfix:after {
  clear: both;
}

.el-tag {
  margin-right: 5px;
}
</style>
