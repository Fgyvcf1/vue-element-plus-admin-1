<template>
  <div class="dashboard-editor-container">
    <div class="clearfix">
      <div class="info-container">
        <span class="display_name">{{ userStore.getUserInfo?.name || 'User' }}</span>
        <span style="font-size: 20px; padding-top: 20px; display: inline-block"
          >Editor's Dashboard</span
        >
      </div>
    </div>
    <div>
      <img :src="emptyGif" class="emptyGif" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()

const emptyGif = ref('https://wpimg.wallstcn.com/0e03b7da-db9e-4819-ba10-9016ddfdaed3')
</script>

<style lang="scss" scoped>
.emptyGif {
  display: block;
  width: 45%;
  margin: 0 auto;
}

.dashboard-editor-container {
  background-color: #e3e3e3;
  min-height: 100vh;
  padding: 50px 60px 0px;

  .info-container {
    position: relative;
    margin-left: 190px;
    height: 150px;
    line-height: 200px;

    .display_name {
      font-size: 48px;
      line-height: 48px;
      color: #212121;
      position: absolute;
      top: 25px;
    }
  }
}
</style>
