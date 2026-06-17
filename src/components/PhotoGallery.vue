<script setup>
defineProps({
  photos: {
    type: Array,
    default: () => [],
  },
  editable: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['remove'])
</script>

<template>
  <view v-if="photos.length" class="photo-gallery">
    <view v-for="photo in photos" :key="photo.id" class="photo-item">
      <image class="photo-image" :src="photo.path" mode="aspectFill" />
      <text class="photo-name">{{ photo.name }}</text>
      <view
        v-if="editable"
        class="photo-remove"
        @click.stop="emit('remove', photo.id)"
      >
        ×
      </view>
    </view>
  </view>
  <view v-else class="empty-gallery">还没有照片，上传第一张纪念照吧。</view>
</template>

<style scoped lang="scss">
.photo-gallery {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20rpx;
}

.photo-item {
  position: relative;
  overflow: hidden;
  border-radius: 16rpx;
  border: 1px solid #f0d9df;
  background: #fff;
}

.photo-image {
  width: 100%;
  height: 220rpx;
}

.photo-name {
  display: block;
  padding: 12rpx 16rpx;
  font-size: 22rpx;
  color: #8b7d84;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.photo-remove {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: rgba(47, 36, 48, 0.72);
  color: #fff;
  text-align: center;
  line-height: 40rpx;
  font-size: 32rpx;
}

.empty-gallery {
  padding: 40rpx 24rpx;
  text-align: center;
  border-radius: 16rpx;
  background: rgba(255, 248, 245, 0.8);
  color: #8b7d84;
  font-size: 26rpx;
}
</style>
