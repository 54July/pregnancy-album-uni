<script setup>
import { reactive, ref } from 'vue'
import PhotoUploader from '@/components/PhotoUploader.vue'
import { useAlbumStore } from '@/stores/album'
import { todayISO } from '@/utils/date'

const albumStore = useAlbumStore()

const form = reactive({
  week: '',
  title: '',
  note: '',
  date: todayISO(),
})

const pendingPhotos = ref([])
const formError = ref('')

function handleUpload(photos) {
  pendingPhotos.value.push(...photos)
}

function removePendingPhoto(index) {
  pendingPhotos.value.splice(index, 1)
}

function validateForm() {
  if (!form.week || !/^\d+(\+[0-6])?$/.test(form.week.trim())) {
    return '请填写有效的孕周，如 20 或 34+3'
  }

  if (!form.title.trim()) {
    return '请填写标题'
  }

  if (!form.note.trim()) {
    return '请填写记录内容'
  }

  if (!form.date) {
    return '请选择日期'
  }

  return ''
}

function handleSubmit() {
  formError.value = validateForm()
  if (formError.value) return

  const entry = albumStore.createEntry({
    week: form.week.trim(),
    title: form.title,
    note: form.note,
    date: form.date,
    photos: pendingPhotos.value,
  })

  pendingPhotos.value = []

  uni.redirectTo({
    url: `/pages/detail/detail?id=${entry.id}`,
  })
}
</script>

<template>
  <view class="page">
    <view class="page-header">
      <text class="page-title">新建记录</text>
      <text class="lead">记录这一周的孕期瞬间，并上传对应的照片。</text>
    </view>

    <view class="panel form-panel">
      <view class="form-grid">
        <view class="form-field">
          <text class="form-label">孕周</text>
          <input
            v-model="form.week"
            class="form-input"
            type="text"
            placeholder="例如 20 或 34+3"
          />
        </view>

        <view class="form-field">
          <text class="form-label">日期</text>
          <picker mode="date" :value="form.date" @change="(event) => (form.date = event.detail.value)">
            <view class="form-input picker-value">{{ form.date || '请选择日期' }}</view>
          </picker>
        </view>
      </view>

      <view class="form-field">
        <text class="form-label">标题</text>
        <input v-model="form.title" class="form-input" placeholder="例如 第一次胎动" />
      </view>

      <view class="form-field">
        <text class="form-label">记录内容</text>
        <textarea
          v-model="form.note"
          class="form-textarea"
          placeholder="写下这一刻的感受、产检结果或想对宝宝说的话..."
        />
      </view>

      <view class="form-section">
        <text class="section-title">相册照片</text>
        <text class="lead">可先上传照片，保存后会一起写入这条时间轴记录。</text>
        <PhotoUploader @upload="handleUpload" />

        <view v-if="pendingPhotos.length" class="pending-photos">
          <view
            v-for="(photo, index) in pendingPhotos"
            :key="photo.id"
            class="photo-item"
          >
            <image class="photo-image" :src="photo.path" mode="aspectFill" />
            <text class="photo-name">{{ photo.name }}</text>
            <view class="photo-remove" @click="removePendingPhoto(index)">×</view>
          </view>
        </view>
      </view>

      <text v-if="formError" class="form-error">{{ formError }}</text>

      <view class="form-actions">
        <button class="btn btn-primary" @click="handleSubmit">保存记录</button>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page {
  padding: 32rpx 24rpx 48rpx;
}

.page-title {
  display: block;
  font-size: 44rpx;
  font-weight: 600;
  color: #2f2430;
}

.form-panel {
  margin-top: 24rpx;
  display: grid;
  gap: 24rpx;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20rpx;
}

.form-field {
  display: grid;
  gap: 12rpx;
}

.form-label,
.section-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #2f2430;
}

.form-input,
.form-textarea,
.picker-value {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  padding: 0 24rpx;
  border-radius: 16rpx;
  border: 1px solid #f0d9df;
  background: #fff;
  font-size: 28rpx;
}

.form-textarea {
  height: auto;
  line-height: 1.6;
  padding: 20rpx 24rpx;
}

.form-textarea {
  min-height: 180rpx;
}

.form-section {
  display: grid;
  gap: 16rpx;
}

.pending-photos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20rpx;
}

.photo-item {
  position: relative;
  overflow: hidden;
  border-radius: 16rpx;
  border: 1px solid #f0d9df;
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
}

.form-error {
  color: #c0392b;
  font-size: 26rpx;
}

.form-actions {
  display: grid;
  gap: 16rpx;
}
</style>
