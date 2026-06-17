<script setup>
import { formatDate } from '@/utils/date'

defineProps({
  entry: {
    type: Object,
    required: true,
  },
})

function openDetail(id) {
  uni.navigateTo({
    url: `/pages/detail/detail?id=${id}`,
  })
}
</script>

<template>
  <view class="timeline-card" @click="openDetail(entry.id)">
    <view class="timeline-card-media">
      <image
        v-if="entry.photos.length"
        class="timeline-card-image"
        :src="entry.photos[0].path"
        mode="aspectFill"
      />
      <view v-else class="timeline-card-placeholder">暂无照片</view>
    </view>

    <view class="timeline-card-body">
      <view class="timeline-card-meta">
        <text class="timeline-week">第 {{ entry.week }} 周</text>
        <text class="timeline-date">{{ formatDate(entry.date) }}</text>
      </view>
      <text class="timeline-title">{{ entry.title }}</text>
      <text class="timeline-note">{{ entry.note }}</text>
      <text class="timeline-count">{{ entry.photos.length }} 张照片</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.timeline-card {
  display: flex;
  gap: 24rpx;
  padding: 24rpx;
  border-radius: 20rpx;
  background: rgba(255, 248, 245, 0.8);
  border: 1px solid #f0d9df;
}

.timeline-card-media,
.timeline-card-placeholder {
  width: 160rpx;
  height: 160rpx;
  border-radius: 16rpx;
  overflow: hidden;
  flex-shrink: 0;
  background: rgba(224, 122, 143, 0.08);
}

.timeline-card-image {
  width: 100%;
  height: 100%;
}

.timeline-card-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #8b7d84;
}

.timeline-card-body {
  flex: 1;
  min-width: 0;
}

.timeline-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  font-size: 24rpx;
}

.timeline-week {
  color: #c85f76;
  font-weight: 600;
}

.timeline-date,
.timeline-count,
.timeline-note {
  color: #8b7d84;
}

.timeline-title {
  display: block;
  margin-top: 12rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #2f2430;
}

.timeline-note {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  line-height: 1.6;
}

.timeline-count {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
}
</style>
