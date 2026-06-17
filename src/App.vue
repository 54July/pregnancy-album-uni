<script setup>
import { onLaunch } from '@dcloudio/uni-app'
import { useAlbumStore } from '@/stores/album'

onLaunch(() => {
  // #ifdef MP-WEIXIN
  wx.cloud.init({
    env: 'cloudbase-d8ghxjjlta88aff4a',
    traceUser: true,
  })
  // #endif
  useAlbumStore().init()
})
</script>

<style lang="scss">
page {
  min-height: 100%;
  font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  color: #4a3f45;
  background:
    radial-gradient(circle at top, rgba(255, 214, 223, 0.45), transparent 32%),
    #fff8f5;
}

view,
text,
button,
input,
textarea {
  box-sizing: border-box;
}

.btn {
  margin: 0;
  padding: 0 44rpx;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 999rpx;
  font-size: 28rpx;
  border: none;
}

.btn-primary {
  color: #fff;
  background: linear-gradient(135deg, #e07a8f, #c85f76);
}

.btn-secondary {
  color: #c85f76;
  background: rgba(224, 122, 143, 0.12);
}

.btn-danger {
  color: #fff;
  background: #d9534f;
}

.panel {
  padding: 32rpx;
  border-radius: 24rpx;
  background: #fff;
  border: 1px solid #f0d9df;
  box-shadow: 0 16rpx 40rpx rgba(224, 122, 143, 0.12);
}

.eyebrow {
  font-size: 24rpx;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #e07a8f;
}

.lead {
  margin-top: 16rpx;
  line-height: 1.7;
  color: #8b7d84;
  font-size: 28rpx;
}
</style>
