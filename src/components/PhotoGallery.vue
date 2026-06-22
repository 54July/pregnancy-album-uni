<script setup>
import { ref } from 'vue'

const props = defineProps({
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

const selectedId = ref(null)

function handleTap(photo) {
  if (!props.editable) {
    previewPhoto(photo)
    return
  }
  if (selectedId.value === photo.id) {
    // 再次点击取消选中，然后预览
    selectedId.value = null
    previewPhoto(photo)
  } else {
    selectedId.value = photo.id
  }
}

function previewPhoto(photo) {
  uni.previewImage({
    current: photo.path,
    urls: props.photos.map((p) => p.path),
  })
}

function handleRemove(photoId) {
  selectedId.value = null
  emit('remove', photoId)
}
</script>

<template>
  <view v-if="photos.length" class="photo-gallery">
    <view
      v-for="photo in photos"
      :key="photo.id"
      class="photo-item"
      @click="handleTap(photo)"
    >
      <image
        class="photo-image"
        :class="{ 'photo-selected': editable && selectedId === photo.id }"
        :src="photo.path"
        mode="aspectFill"
      />
      <text class="photo-name">{{ photo.name }}</text>
      <view
        v-if="editable && selectedId === photo.id"
        class="photo-remove"
        @click.stop="handleRemove(photo.id)"
      >
        <text class="photo-remove-icon">－</text>
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
  transition: opacity 0.15s;
}

.photo-selected {
  opacity: 0.75;
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
  top: -16rpx;
  left: -16rpx;
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  background: #e0304a;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 8rpx rgba(224, 48, 74, 0.4);
}

.photo-remove-icon {
  color: #fff;
  font-size: 36rpx;
  line-height: 1;
  font-weight: 300;
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
