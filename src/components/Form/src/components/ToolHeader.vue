<template>
  <header class="tool-header">
    <div class="notification">
      <span>待办提醒:</span>
      <span class="count">{{ unreadCount }}</span>
    </div>
  </header>
</template>

<script>
import { request } from '@/service'

export default {
  data() {
    return {
      unreadCount: 0,
    };
  },
  async created() {
    try {
      const res = await request.get('/todo-reminders/unread-count');
      // 检查返回的数据是否有效
      if (res !== null && typeof res === 'number') {
        this.unreadCount = res;
      } else {
        this.unreadCount = 0;
      }
    } catch (error) {
      console.warn('获取待办提醒失败，使用默认值:', error.message);
      this.unreadCount = 0; // 默认值
    }
  }
};
</script>