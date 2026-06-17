<script setup>
import { ref } from 'vue'
import { chooseImages } from '@/utils/photo'

defineProps({
  label: {
    type: String,
    default: '上传照片',
  },
  hint: {
    type: String,
    default: '支持相册与拍照，单张不超过 2MB',
  },
})

const emit = defineEmits(['upload'])

const uploading = ref(false)
const errorMessage = ref('')

async function handleChoose() {
  if (uploading.value) return

  uploading.value = true
  errorMessage.value = ''

  try {
    const photos = await chooseImages(9)
    if (photos.length) {
      emit('upload', photos)
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : '图片选择失败，请重试'
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <view class="photo-uploader">
    <view class="dropzone" @click="handleChoose">
      <text class="dropzone-title">{{ uploading ? '正在处理图片...' : label }}</text>
      <text class="dropzone-hint">{{ hint }}</text>
      <button class="btn btn-secondary dropzone-button" @click.stop="handleChoose">
        选择图片
      </button>
    </view>
    <text v-if="errorMessage" class="upload-error">{{ errorMessage }}</text>
  </view>
</template>

<style scoped lang="scss">
.photo-uploader {
  display: grid;
  gap: 12rpx;
}

.dropzone {
  display: grid;
  gap: 12rpx;
  justify-items: center;
  padding: 48rpx 32rpx;
  border: 2px dashed #f0d9df;
  border-radius: 16rpx;
  background: rgba(255, 248, 245, 0.65);
}

.dropzone-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #2f2430;
}

.dropzone-hint {
  font-size: 24rpx;
  color: #8b7d84;
}

.dropzone-button {
  margin-top: 8rpx;
}

.upload-error {
  font-size: 24rpx;
  color: #c0392b;
}
</style>
