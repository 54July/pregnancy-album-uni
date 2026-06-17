<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import PhotoGallery from '@/components/PhotoGallery.vue'
import PhotoUploader from '@/components/PhotoUploader.vue'
import { useAlbumStore } from '@/stores/album'
import { formatDate } from '@/utils/date'

const albumStore = useAlbumStore()
const entryId = ref('')

onLoad((query) => {
  entryId.value = query.id || ''
})

const entry = computed(() => albumStore.getEntryById(entryId.value))

function handleUpload(photos) {
  if (!entry.value) return
  albumStore.addPhotos(entry.value.id, photos)
}

function handleRemovePhoto(photoId) {
  if (!entry.value) return
  albumStore.removePhoto(entry.value.id, photoId)
}

function handleDeleteEntry() {
  if (!entry.value) return

  uni.showModal({
    title: '删除记录',
    content: '确定删除这条记录吗？照片也会一并移除。',
    success: (res) => {
      if (!res.confirm || !entry.value) return

      albumStore.deleteEntry(entry.value.id)
      uni.navigateBack({
        fail: () => {
          uni.reLaunch({ url: '/pages/index/index' })
        },
      })
    },
  })
}

function goHome() {
  uni.reLaunch({ url: '/pages/index/index' })
}
</script>

<template>
  <view class="page">
    <view v-if="entry" class="panel detail-panel">
      <view class="detail-header">
        <view>
          <text class="eyebrow">第 {{ entry.week }} 周</text>
          <text class="detail-title">{{ entry.title }}</text>
          <text class="detail-date">{{ formatDate(entry.date) }}</text>
        </view>
        <button class="btn btn-danger detail-action" @click="handleDeleteEntry">
          删除记录
        </button>
      </view>

      <text class="detail-note">{{ entry.note }}</text>

      <view class="detail-section">
        <text class="section-title">相册</text>
        <text class="lead">共 {{ entry.photos.length }} 张照片</text>
        <PhotoGallery :photos="entry.photos" editable @remove="handleRemovePhoto" />
      </view>

      <view class="detail-section">
        <text class="section-title">继续上传</text>
        <text class="lead">为这条记录补充更多照片。</text>
        <PhotoUploader label="添加更多照片" @upload="handleUpload" />
      </view>
    </view>

    <view v-else class="panel empty-state">
      <text class="detail-title">记录不存在</text>
      <text class="lead">这条时间轴可能已被删除，或链接已失效。</text>
      <button class="btn btn-primary" @click="goHome">
        回到首页
      </button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page {
  padding: 32rpx 24rpx 48rpx;
}

.detail-panel {
  display: grid;
  gap: 24rpx;
}

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.detail-title {
  display: block;
  margin-top: 12rpx;
  font-size: 44rpx;
  font-weight: 600;
  color: #2f2430;
}

.detail-date {
  display: block;
  margin-top: 12rpx;
  color: #8b7d84;
  font-size: 26rpx;
}

.detail-note {
  line-height: 1.8;
  font-size: 30rpx;
}

.detail-section,
.empty-state {
  display: grid;
  gap: 16rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #2f2430;
}

.detail-action {
  flex-shrink: 0;
}

.empty-state {
  text-align: center;
}
</style>
