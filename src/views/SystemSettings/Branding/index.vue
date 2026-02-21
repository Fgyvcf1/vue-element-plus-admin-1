<template>
  <div class="app-container">
    <el-card>
      <div class="page-header">
        <div>
          <div class="page-title">界面设置</div>
          <div class="page-subtitle">管理系统标题、Logo 与浏览器图标</div>
        </div>
        <div class="page-actions">
          <el-button size="small" @click="handleReload">刷新</el-button>
          <el-button type="primary" size="small" :loading="saving" @click="handleSave">
            保存
          </el-button>
        </div>
      </div>

      <el-form :model="form" label-width="120px" class="brand-form">
        <el-form-item label="系统标题">
          <el-input v-model="form.title" placeholder="例如：朝阳区东风居委会" />
        </el-form-item>

        <el-form-item label="Logo 显示方式">
          <el-radio-group v-model="form.logoMode">
            <el-radio label="image">仅图片</el-radio>
            <el-radio label="text">仅文字</el-radio>
            <el-radio label="both">图片 + 文字</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="form.logoMode !== 'image'" label="Logo 文字">
          <el-input v-model="form.logoText" placeholder="例如：朝阳区东风居委会" />
          <div class="tip">为空时默认使用系统标题</div>
        </el-form-item>

        <el-form-item v-if="form.logoMode !== 'text'" label="Logo 图片">
          <div class="upload-row">
            <el-upload
              :show-file-list="false"
              :http-request="(options) => handleUpload(options, 'logo')"
              accept=".png,.jpg,.jpeg,.svg"
            >
              <el-button size="small">上传 Logo</el-button>
            </el-upload>
            <el-input v-model="form.logoUrl" placeholder="/logo.png 或 /uploads/branding/logo.png" />
          </div>
          <div class="preview" v-if="form.logoUrl">
            <img :src="form.logoUrl" alt="logo" />
          </div>
        </el-form-item>

        <el-form-item label="浏览器图标">
          <div class="upload-row">
            <el-upload
              :show-file-list="false"
              :http-request="(options) => handleUpload(options, 'favicon')"
              accept=".ico,.png,.jpg,.jpeg,.svg"
            >
              <el-button size="small">上传 Favicon</el-button>
            </el-upload>
            <el-input v-model="form.faviconUrl" placeholder="/favicon.ico 或 /uploads/branding/favicon.ico" />
          </div>
          <div class="tip">保存后可能需要刷新浏览器缓存（Ctrl+F5）</div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadRequestOptions } from 'element-plus'
import { getAppConfig, updateAppConfig, uploadAppAsset } from '@/api/appConfig'
import { useAppStore } from '@/store/modules/app'

const appStore = useAppStore()
const saving = ref(false)

const form = reactive({
  title: '',
  logoMode: 'image',
  logoText: '',
  logoUrl: '',
  faviconUrl: ''
})

type UploadAjaxError = Error & {
  status: number
  method: string
  url: string
}

const fetchConfig = async () => {
  try {
    const res = await getAppConfig()
    if (res?.code === 20000 && res.data) {
      Object.assign(form, res.data)
      appStore.setBranding(res.data)
    }
  } catch (error) {
    console.error('获取界面配置失败:', error)
    ElMessage.error('获取界面配置失败')
  }
}

const handleReload = () => {
  fetchConfig()
}

const handleUpload = async (options: UploadRequestOptions, type: 'logo' | 'favicon') => {
  const buildUploadError = (message: string): UploadAjaxError => {
    const uploadError = new Error(message) as UploadAjaxError
    uploadError.status = 500
    uploadError.method = 'POST'
    uploadError.url = ''
    return uploadError
  }

  try {
    const res = await uploadAppAsset(options.file as File, type)
    if (res?.code === 20000 && res.data?.url) {
      if (type === 'logo') {
        form.logoUrl = res.data.url
      } else {
        form.faviconUrl = res.data.url
      }
      options.onSuccess?.(res as any)
      ElMessage.success('上传成功')
    } else {
      options.onError?.(buildUploadError(res?.message || '上传失败'))
    }
  } catch (error: any) {
    const uploadError =
      typeof error?.status === 'number' ? (error as UploadAjaxError) : buildUploadError(error?.message || '上传失败')
    options.onError?.(uploadError)
    ElMessage.error(error?.message || '上传失败')
  }
}

const handleSave = async () => {
  saving.value = true
  try {
    const res = await updateAppConfig({
      title: form.title,
      logoMode: form.logoMode as 'image' | 'text' | 'both',
      logoText: form.logoText,
      logoUrl: form.logoUrl,
      faviconUrl: form.faviconUrl
    })
    if (res?.code === 20000) {
      ElMessage.success('保存成功')
      await fetchConfig()
    }
  } catch (error) {
    console.error('保存界面配置失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchConfig()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.page-subtitle {
  margin-top: 4px;
  color: #909399;
  font-size: 13px;
}

.page-actions {
  display: flex;
  gap: 8px;
}

.brand-form {
  max-width: 720px;
}

.upload-row {
  display: flex;
  gap: 12px;
  width: 100%;
}

.upload-row :deep(.el-input) {
  flex: 1;
}

.preview {
  margin-top: 8px;
}

.preview img {
  max-height: 48px;
}

.tip {
  margin-top: 6px;
  color: #909399;
  font-size: 12px;
}
</style>
