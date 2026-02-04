<template>
  <div class="dashboard-container">
    <component :is="currentDashboard" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/modules/user'
import AdminDashboard from './admin/index.vue'
import EditorDashboard from './editor/index.vue'

const userStore = useUserStore()

// Vue 3 动态组件需要绑定组件对象，不是字符串
const currentDashboard = ref(AdminDashboard)

// 根据用户角色决定显示哪个 Dashboard
onMounted(() => {
  const roles = userStore.getUserInfo?.roles || []
  if (!roles.includes('admin')) {
    currentDashboard.value = EditorDashboard
  }
})
</script>

<style lang="scss" scoped>
.dashboard-container {
  min-height: 100%;
}
</style>
