<template>
  <div class="guide-wrapper">
    <iframe class="guide-frame" :src="guideUrl" title="operation-guide" />
  </div>
</template>

<script setup lang="ts">
const base = import.meta.env.BASE_URL || '/'
const guideUrl = base.endsWith('/') ? `${base}operation-guide.html` : `${base}/operation-guide.html`
</script>

<style scoped>
.guide-wrapper {
  height: calc(100vh - 88px);
  padding: 12px;
  background: #f5f7fa;
}

.guide-frame {
  width: 100%;
  height: 100%;
  border: 0;
  border-radius: 8px;
  background: #fff;
}
</style>
