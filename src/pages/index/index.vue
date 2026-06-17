<script setup>
import { computed } from 'vue'
import TimelineCard from '@/components/TimelineCard.vue'
import { useAlbumStore } from '@/stores/album'

const albumStore = useAlbumStore()

const entries = computed(() => albumStore.sortedEntries)
const totalPhotos = computed(() => albumStore.totalPhotos)

function goUpload() {
  uni.navigateTo({ url: '/pages/upload/upload' })
}
</script>

<template>
  <view class="page">
    <view class="hero panel">
      <text class="eyebrow">Pregnancy Album</text>
      <text class="hero-title">欢迎来到孕忆相册</text>
      <text class="lead">
        记录产检、孕肚变化与日常点滴。当前共有 {{ entries.length }} 条记录、{{ totalPhotos }} 张照片。
      </text>
      <view class="actions">
        <button class="btn btn-primary" @click="goUpload">开始记录</button>
      </view>
    </view>

    <view class="panel timeline-panel">
      <view class="panel-header">
        <view>
          <text class="section-title">时间轴</text>
          <text class="lead">点击任意记录查看详情，或在详情页继续上传照片。</text>
        </view>
        <button class="btn btn-secondary panel-action" @click="goUpload">新建记录</button>
      </view>

      <view v-if="entries.length" class="timeline-list">
        <TimelineCard v-for="entry in entries" :key="entry.id" :entry="entry" />
      </view>

      <view v-else class="empty-state">
        <text class="lead">还没有任何记录，先创建第一条吧。</text>
        <button class="btn btn-primary" @click="goUpload">立即创建</button>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page {
  padding: 32rpx 24rpx 48rpx;
}

.hero {
  text-align: center;
}

.hero-title {
  display: block;
  margin-top: 12rpx;
  font-size: 48rpx;
  font-weight: 600;
  color: #2f2430;
}

.actions {
  margin-top: 32rpx;
}

.timeline-panel {
  margin-top: 24rpx;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.section-title {
  display: block;
  font-size: 34rpx;
  font-weight: 600;
  color: #2f2430;
}

.panel-action {
  flex-shrink: 0;
}

.timeline-list {
  display: grid;
  gap: 20rpx;
  margin-top: 24rpx;
}

.empty-state {
  display: grid;
  gap: 20rpx;
  justify-items: center;
  margin-top: 24rpx;
}
</style>
