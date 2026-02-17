<template>
  <div class="app-container">
    <el-card class="overview-card">
      <div class="overview-header">
        <div>
          <div class="overview-title">系统设置</div>
          <div class="overview-subtitle">集中管理通知提醒与字典数据</div>
        </div>
      </div>
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12">
          <el-card class="entry-card" shadow="hover" @click="goTo('notification')">
            <div class="entry-title">通知配置</div>
            <div class="entry-desc">配置生日提醒等通知参数</div>
            <div class="entry-action">
              <el-button type="primary" link>进入</el-button>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-card class="entry-card" shadow="hover" @click="goTo('dictionary')">
            <div class="entry-title">字典管理</div>
            <div class="entry-desc">维护基础字典分类与字典值</div>
            <div class="entry-action">
              <el-button type="primary" link>进入</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goTo = (target: 'notification' | 'dictionary') => {
  router.push(`/system/${target}`)
}
</script>

<style scoped>
.overview-card {
  padding: 8px;
}

.overview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.overview-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.overview-subtitle {
  margin-top: 4px;
  color: #909399;
  font-size: 13px;
}

.entry-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.entry-card:hover {
  transform: translateY(-2px);
}

.entry-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;
}

.entry-desc {
  color: #909399;
  font-size: 13px;
  min-height: 32px;
}

.entry-action {
  margin-top: 8px;
}
</style>
