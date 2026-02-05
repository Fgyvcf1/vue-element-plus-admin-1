<template>
  <div class="app-container">
    <el-card>
      <div slot="header" class="clearfix">
        <span>{{ title }}</span>
      </div>

      <el-form ref="disabledForm" :model="formData" label-width="120px" size="small" class="demo-form">
        <!-- 居民基本信息（只读，自动填充） -->
        <el-card shadow="hover" class="info-card">
          <div slot="header" class="clearfix">
            <span>居民基本信息</span>
          </div>
          <el-form-item label="居民姓名">
            <el-input v-model="formData.name" disabled />
          </el-form-item>
          <el-form-item label="身份证号">
            <el-input v-model="formData.idCard" disabled />
          </el-form-item>
          <el-form-item label="性别">
            <el-input v-model="formData.gender" disabled />
          </el-form-item>
          <el-form-item label="出生日期">
            <el-input v-model="formData.dateOfBirth" disabled />
          </el-form-item>
          <el-form-item label="年龄">
            <el-input v-model="formData.age" disabled />
          </el-form-item>
          <el-form-item label="联系电话">
            <el-input v-model="formData.phoneNumber" disabled />
          </el-form-item>
        </el-card>

        <!-- 残疾人信息 -->
        <el-card shadow="hover" class="info-card">
          <div slot="header" class="clearfix">
            <span>残疾人信息</span>
          </div>
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item label="残疾类型" prop="disabilityType">
                <el-select
                  v-model="formData.disabilityType"
                  placeholder="请选择残疾类型"
                  size="small"
                >
                  <el-option
                    v-for="item in disabilityTypeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="残疾等级" prop="disabilityLevel">
                <el-select
                  v-model="formData.disabilityLevel"
                  placeholder="请选择残疾等级"
                  size="small"
                >
                  <el-option
                    v-for="item in disabilityLevelOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="残疾证号" prop="certificateNumber">
                <el-input
                  v-model="formData.certificateNumber"
                  placeholder="请输入残疾证号"
                  size="small"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="初次发证日期" prop="issueDate">
                <el-date-picker
                  v-model="formData.issueDate"
                  type="date"
                  placeholder="选择初次发证日期"
                  value-format="yyyy-MM-dd"
                  size="small"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="有效期至" prop="validityPeriod">
                <el-date-picker
                  v-model="formData.validityPeriod"
                  type="date"
                  placeholder="选择有效期至"
                  value-format="yyyy-MM-dd"
                  size="small"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="持证状态" prop="certificateStatus">
                <el-select
                  v-model="formData.certificateStatus"
                  placeholder="请选择持证状态"
                  size="small"
                >
                  <el-option
                    v-for="item in certificateStatusOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="监护人姓名" prop="guardianName">
                <el-input
                  v-model="formData.guardianName"
                  placeholder="请输入监护人姓名"
                  size="small"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="监护人电话" prop="guardianPhone">
                <el-input
                  v-model="formData.guardianPhone"
                  placeholder="请输入监护人电话"
                  size="small"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <div class="form-actions">
          <el-button type="primary" size="small" :loading="loading" @click="handleSave">保存</el-button>
          <el-button size="small" @click="handleCancel">取消</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { getResident } from '@/api/resident'
import { addDisabledPerson, updateDisabledPerson } from '@/api/special-people'
import dictionaryCache from '@/utils/dictionary-cache'

export default {
  name: 'DisabledForm',
  data() {
    return {
      loading: false,
      title: '新增残疾人',
      // 字典选项
      disabilityTypeOptions: [], // 残疾类型选项
      disabilityLevelOptions: [], // 残疾等级选项
      certificateStatusOptions: [ // 持证状态选项
        { label: '在持', value: '在持' },
        { label: '注销', value: '注销' }
      ],
      formData: {
        id: null,
        residentId: null,
        name: '',
        idCard: '',
        gender: '',
        dateOfBirth: '',
        age: '',
        phoneNumber: '',
        disabilityType: '',
        disabilityLevel: '',
        certificateNumber: '',
        issueDate: '',
        validityPeriod: '',
        guardianName: '',
        guardianPhone: '',
        certificateStatus: '在持'
      }
    }
  },
  created() {
    // 加载字典数据
    this.loadDictionaries()

    // 从路由参数获取居民ID
    const residentId = this.$route.query.residentId
    if (residentId) {
      this.formData.residentId = residentId
      this.loadResidentInfo(residentId)
    }

    // 从路由参数获取编辑ID
    const editId = this.$route.params.id
    if (editId) {
      this.title = '编辑残疾人'
      // 这里应该调用API获取编辑数据
      // this.loadEditData(editId)
    }
  },
  methods: {
    // 加载居民信息
    async loadResidentInfo(residentId) {
      try {
        this.loading = true
        // 使用获取单个居民信息的API
        const response = await getResident(residentId)
        if (response && response.code === 20000 && response.data) {
          const resident = response.data
          // 自动填充居民基本信息
          this.formData = {
            ...this.formData,
            name: resident.name || resident.Name || '',
            idCard: resident.idCard || resident.id_card || '',
            gender: resident.gender || '',
            dateOfBirth: resident.dateOfBirth || resident.date_of_birth || '',
            age: resident.age || '',
            phoneNumber: resident.phoneNumber || resident.phone_number || ''
          }
        }
      } catch (error) {
        console.error('获取居民信息失败:', error)
        this.$message.error('获取居民信息失败')
      } finally {
        this.loading = false
      }
    },

    // 加载编辑数据
    loadEditData(id) {
      // 这里应该调用API获取编辑数据
      this.loading = true
      setTimeout(() => {
        // 模拟数据
        this.formData = {
          id: id,
          residentId: 1,
          name: '赵六',
          idCard: '110101198501011234',
          gender: '男',
          dateOfBirth: '1985-01-01',
          age: 40,
          phoneNumber: '13800138000',
          disabilityType: '视力残疾',
          disabilityLevel: '1',
          certificateNumber: '11010119850101123411',
          issueDate: '2022-01-01',
          validityPeriod: '2027-12-31'
        }
        this.loading = false
      }, 500)
    },

    // 表单验证
    validateForm() {
      return new Promise((resolve) => {
        this.$refs.disabledForm.validate((valid) => {
          resolve(valid)
        })
      })
    },

    // 保存数据
    async handleSave() {
      const isValid = await this.validateForm()
      if (!isValid) {
        return
      }

      this.loading = true
      try {
        // 准备保存数据
        const saveData = {
          resident_id: this.formData.residentId,
          disability_type: this.formData.disabilityType,
          disability_level: this.formData.disabilityLevel,
          certificate_number: this.formData.certificateNumber,
          issue_date: this.formData.issueDate,
          validity_period: this.formData.validityPeriod,
          guardian_name: this.formData.guardianName,
          guardian_phone: this.formData.guardianPhone,
          certificate_status: this.formData.certificateStatus || '在持'
        }

        if (this.formData.id) {
          // 更新操作
          await updateDisabledPerson(this.formData.id, saveData)
          this.$message.success('更新残疾人信息成功')
        } else {
          // 新增操作
          await addDisabledPerson(saveData)
          this.$message.success('新增残疾人成功')
        }

        this.loading = false
        this.$router.push('/special-people/disabled-list')
      } catch (error) {
        console.error('保存残疾人信息失败:', error)
        this.$message.error('保存残疾人信息失败')
        this.loading = false
      }
    },

    // 取消操作
    handleCancel() {
      this.$router.push('/special-people/disabled-list')
    },

    // 加载字典数据
    async loadDictionaries() {
      try {
        // 加载残疾类型字典
        const disabilityTypeData = await dictionaryCache.getDictionary('残疾类型')
        if (Array.isArray(disabilityTypeData)) {
          this.disabilityTypeOptions = disabilityTypeData.map(item => ({
            label: item.value,
            value: item.value
          }))
        }

        // 加载残疾等级字典
        const disabilityLevelData = await dictionaryCache.getDictionary('残疾等级')
        if (Array.isArray(disabilityLevelData)) {
          this.disabilityLevelOptions = disabilityLevelData.map(item => ({
            label: item.value,
            value: item.value
          }))
        }

        // 如果没有从字典获取到数据，使用默认值
        if (this.disabilityTypeOptions.length === 0) {
          this.disabilityTypeOptions = [
            { label: '视力残疾', value: '视力残疾' },
            { label: '听力残疾', value: '听力残疾' },
            { label: '言语残疾', value: '言语残疾' },
            { label: '肢体残疾', value: '肢体残疾' },
            { label: '智力残疾', value: '智力残疾' },
            { label: '精神残疾', value: '精神残疾' },
            { label: '多重残疾', value: '多重残疾' }
          ]
        }

        if (this.disabilityLevelOptions.length === 0) {
          this.disabilityLevelOptions = [
            { label: '一级', value: '一级' },
            { label: '二级', value: '二级' },
            { label: '三级', value: '三级' },
            { label: '四级', value: '四级' }
          ]
        }
      } catch (error) {
        console.error('加载字典数据失败:', error)
        // 使用默认值
        this.disabilityTypeOptions = [
          { label: '视力残疾', value: '视力残疾' },
          { label: '听力残疾', value: '听力残疾' },
          { label: '言语残疾', value: '言语残疾' },
          { label: '肢体残疾', value: '肢体残疾' },
          { label: '智力残疾', value: '智力残疾' },
          { label: '精神残疾', value: '精神残疾' },
          { label: '多重残疾', value: '多重残疾' }
        ]
        this.disabilityLevelOptions = [
          { label: '一级', value: '一级' },
          { label: '二级', value: '二级' },
          { label: '三级', value: '三级' },
          { label: '四级', value: '四级' }
        ]
      }
    }
  }
}
</script>

<style scoped>
.info-card {
  margin-bottom: 16px;
}

.demo-form {
  margin-top: 16px;
}

.form-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}
</style>
