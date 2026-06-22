<script setup>
import { ref, computed } from 'vue'
import { useChecklistStore, SEASON_TIPS, HOSPITAL_TIPS } from '@/stores/checklist'

const store = useChecklistStore()

// ─── 模式切换 ────────────────────────────────────────────────
const switchMode = (mode) => {
  uni.showModal({
    title: '切换分娩方式',
    content: '切换后将重置为标准模板（自定义物品会清除），确认吗？',
    success: (res) => {
      if (res.confirm) store.switchMode(mode)
    },
  })
}

// ─── 自定义添加 ──────────────────────────────────────────────
const addingCatId = ref(null)
const newItemName = ref('')

function openAdd(catId) {
  addingCatId.value = catId
  newItemName.value = ''
}

function confirmAdd() {
  if (!newItemName.value.trim()) {
    addingCatId.value = null
    return
  }
  store.addCustomItem(addingCatId.value, newItemName.value)
  addingCatId.value = null
  newItemName.value = ''
}

function cancelAdd() {
  addingCatId.value = null
  newItemName.value = ''
}

// ─── 季节 ────────────────────────────────────────────────────
const seasons = ['spring', 'summer', 'autumn', 'winter']
const currentSeasonTip = computed(() => SEASON_TIPS[store.season])

// ─── 重置 ────────────────────────────────────────────────────
function resetAll() {
  uni.showModal({
    title: '重置清单',
    content: '将清空所有已勾选状态，确认吗？',
    success: (res) => {
      if (res.confirm) store.resetChecked()
    },
  })
}

// ─── 分享 ────────────────────────────────────────────────────
function shareList() {
  const text = store.buildShareText()
  // 小程序环境：复制到剪贴板并提示分享
  uni.setClipboardData({
    data: text,
    success: () => {
      uni.showToast({ title: '清单已复制，可粘贴分享给家人', icon: 'none', duration: 2500 })
    },
  })
}

// ─── 贴士折叠 ────────────────────────────────────────────────
const tipsExpanded = ref(false)
</script>

<template>
  <scroll-view class="page" scroll-y>
    <!-- 顶部 Hero -->
    <view class="hero panel">
      <text class="eyebrow">Hospital Bag</text>
      <text class="hero-title">待产包清单</text>
      <text class="lead">勾选已备物品，离宝宝到来又近一步</text>

      <!-- 进度条 -->
      <view class="progress-wrap">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: store.progress + '%' }" />
        </view>
        <text class="progress-label">{{ store.checkedCount }}/{{ store.totalCount }} 已备齐</text>
      </view>

      <!-- 模式切换 -->
      <view class="mode-tabs">
        <view
          class="mode-tab"
          :class="{ active: store.mode === 'natural' }"
          @click="store.mode === 'natural' ? null : switchMode('natural')"
        >
          <text>🌸 顺产清单</text>
        </view>
        <view
          class="mode-tab"
          :class="{ active: store.mode === 'csection' }"
          @click="store.mode === 'csection' ? null : switchMode('csection')"
        >
          <text>⚕️ 剖宫产清单</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="hero-actions">
        <button class="btn btn-primary" @click="shareList">分享给家人</button>
        <button class="btn btn-secondary" @click="resetAll">重置勾选</button>
      </view>
    </view>

    <!-- 分类清单 -->
    <view
      v-for="cat in store.categories"
      :key="cat.id"
      class="cat-panel panel"
    >
      <view class="cat-header">
        <text class="cat-icon">{{ cat.icon }}</text>
        <text class="cat-name">{{ cat.name }}</text>
        <text class="cat-count">
          {{ cat.items.filter(i => i.checked).length + cat.customItems.filter(i => i.checked).length }}/{{ cat.items.length + cat.customItems.length }}
        </text>
      </view>

      <!-- 标准物品 -->
      <view
        v-for="item in cat.items"
        :key="item.id"
        class="item-row"
        :class="{ checked: item.checked }"
        @click="store.toggleItem(cat.id, item.id, false)"
      >
        <view class="checkbox" :class="{ 'checkbox-checked': item.checked }">
          <text v-if="item.checked" class="check-icon">✓</text>
        </view>
        <text class="item-name">{{ item.name }}</text>
        <view v-if="item.required" class="required-badge">必备</view>
      </view>

      <!-- 自定义物品 -->
      <view
        v-for="item in cat.customItems"
        :key="item.id"
        class="item-row custom-item"
        :class="{ checked: item.checked }"
      >
        <view
          class="checkbox"
          :class="{ 'checkbox-checked': item.checked }"
          @click="store.toggleItem(cat.id, item.id, true)"
        >
          <text v-if="item.checked" class="check-icon">✓</text>
        </view>
        <text
          class="item-name"
          @click="store.toggleItem(cat.id, item.id, true)"
        >{{ item.name }}</text>
        <view class="custom-badge">自定义</view>
        <view class="del-btn" @click.stop="store.removeCustomItem(cat.id, item.id)">
          <text>×</text>
        </view>
      </view>

      <!-- 添加输入框 -->
      <view v-if="addingCatId === cat.id" class="add-input-row">
        <input
          class="add-input"
          v-model="newItemName"
          placeholder="输入物品名称"
          :focus="true"
          @confirm="confirmAdd"
        />
        <button class="btn-icon btn-confirm" @click="confirmAdd">✓</button>
        <button class="btn-icon btn-cancel" @click="cancelAdd">×</button>
      </view>

      <!-- 添加按钮 -->
      <view v-else class="add-row" @click="openAdd(cat.id)">
        <text class="add-text">+ 添加自定义物品</text>
      </view>
    </view>

    <!-- 季节贴士 -->
    <view class="panel tips-panel">
      <view class="tips-header" @click="tipsExpanded = !tipsExpanded">
        <text class="section-title">季节贴士</text>
        <text class="tips-toggle">{{ tipsExpanded ? '收起' : '展开' }}</text>
      </view>

      <!-- 季节选择 -->
      <view class="season-tabs">
        <view
          v-for="s in seasons"
          :key="s"
          class="season-tab"
          :class="{ active: store.season === s }"
          @click="store.setSeason(s)"
        >
          <text>{{ SEASON_TIPS[s].icon }} {{ SEASON_TIPS[s].label }}</text>
        </view>
      </view>

      <!-- 贴士内容 -->
      <view v-if="tipsExpanded || true" class="tip-list">
        <view
          v-for="(tip, i) in currentSeasonTip.tips"
          :key="i"
          class="tip-item"
        >
          <text class="tip-dot">·</text>
          <text class="tip-text">{{ tip }}</text>
        </view>
      </view>
    </view>

    <!-- 医院精简贴士 -->
    <view class="panel tips-panel hospital-tips">
      <text class="section-title">就医小贴士</text>
      <view class="tip-list">
        <view
          v-for="(t, i) in HOSPITAL_TIPS"
          :key="i"
          class="hospital-tip-item"
        >
          <text class="hospital-tip-icon">{{ t.icon }}</text>
          <text class="tip-text">{{ t.tip }}</text>
        </view>
      </view>
    </view>

    <view class="bottom-spacer" />
  </scroll-view>
</template>

<style scoped lang="scss">
.page {
  height: 100vh;
  padding: 32rpx 24rpx 0;
  background:
    radial-gradient(circle at top, rgba(255, 214, 223, 0.45), transparent 32%),
    #fff8f5;
}

// ─── Hero ────────────────────────────────────────────────────
.hero {
  text-align: center;
}

.hero-title {
  display: block;
  margin-top: 8rpx;
  font-size: 44rpx;
  font-weight: 600;
  color: #2f2430;
}

.progress-wrap {
  margin-top: 28rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.progress-bar {
  flex: 1;
  height: 14rpx;
  border-radius: 999rpx;
  background: #f0d9df;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #e07a8f, #c85f76);
  transition: width 0.3s ease;
}

.progress-label {
  font-size: 24rpx;
  color: #c85f76;
  font-weight: 600;
  white-space: nowrap;
}

// ─── 模式标签 ────────────────────────────────────────────────
.mode-tabs {
  display: flex;
  gap: 16rpx;
  margin-top: 28rpx;
}

.mode-tab {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  text-align: center;
  border-radius: 16rpx;
  font-size: 28rpx;
  background: rgba(224, 122, 143, 0.08);
  color: #8b7d84;
  border: 2rpx solid transparent;
  transition: all 0.2s;

  &.active {
    background: rgba(224, 122, 143, 0.15);
    color: #c85f76;
    border-color: #e07a8f;
    font-weight: 600;
  }
}

.hero-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 28rpx;
  justify-content: center;
}

// ─── 分类面板 ────────────────────────────────────────────────
.cat-panel {
  margin-top: 24rpx;
}

.cat-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.cat-icon {
  font-size: 36rpx;
}

.cat-name {
  flex: 1;
  font-size: 32rpx;
  font-weight: 600;
  color: #2f2430;
}

.cat-count {
  font-size: 24rpx;
  color: #c85f76;
  font-weight: 600;
}

// ─── 物品行 ──────────────────────────────────────────────────
.item-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 18rpx 8rpx;
  border-bottom: 1rpx solid #f8eef1;

  &:last-of-type {
    border-bottom: none;
  }

  &.checked .item-name {
    color: #c4b5bc;
    text-decoration: line-through;
  }
}

.checkbox {
  width: 44rpx;
  height: 44rpx;
  border-radius: 10rpx;
  border: 2rpx solid #e0c4cc;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;

  &.checkbox-checked {
    background: linear-gradient(135deg, #e07a8f, #c85f76);
    border-color: transparent;
  }
}

.check-icon {
  color: #fff;
  font-size: 28rpx;
  font-weight: 700;
  line-height: 1;
}

.item-name {
  flex: 1;
  font-size: 28rpx;
  color: #4a3f45;
  line-height: 1.5;
}

.required-badge {
  font-size: 20rpx;
  color: #e07a8f;
  background: rgba(224, 122, 143, 0.12);
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  flex-shrink: 0;
}

.custom-badge {
  font-size: 20rpx;
  color: #9b8ea6;
  background: rgba(155, 142, 166, 0.12);
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  flex-shrink: 0;
}

.custom-item .del-btn {
  width: 44rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c4b5bc;
  font-size: 36rpx;
  flex-shrink: 0;
}

// ─── 添加行 ──────────────────────────────────────────────────
.add-row {
  display: flex;
  align-items: center;
  padding: 18rpx 8rpx;
  margin-top: 8rpx;
}

.add-text {
  font-size: 26rpx;
  color: #c85f76;
}

.add-input-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 12rpx 8rpx;
  margin-top: 8rpx;
}

.add-input {
  flex: 1;
  height: 64rpx;
  padding: 0 20rpx;
  border: 2rpx solid #e07a8f;
  border-radius: 12rpx;
  font-size: 28rpx;
  background: #fff;
  color: #4a3f45;
}

.btn-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 12rpx;
  border: none;
  font-size: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  line-height: 64rpx;
}

.btn-confirm {
  background: linear-gradient(135deg, #e07a8f, #c85f76);
  color: #fff;
}

.btn-cancel {
  background: rgba(224, 122, 143, 0.12);
  color: #c85f76;
}

// ─── 贴士面板 ────────────────────────────────────────────────
.tips-panel {
  margin-top: 24rpx;
}

.tips-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #2f2430;
}

.tips-toggle {
  font-size: 24rpx;
  color: #c85f76;
}

.season-tabs {
  display: flex;
  gap: 12rpx;
  margin-bottom: 20rpx;
  flex-wrap: wrap;
}

.season-tab {
  height: 60rpx;
  line-height: 60rpx;
  padding: 0 20rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  background: rgba(224, 122, 143, 0.08);
  color: #8b7d84;
  border: 2rpx solid transparent;

  &.active {
    background: rgba(224, 122, 143, 0.15);
    color: #c85f76;
    border-color: #e07a8f;
  }
}

.tip-list {
  display: grid;
  gap: 16rpx;
}

.tip-item {
  display: flex;
  gap: 12rpx;
  align-items: flex-start;
}

.tip-dot {
  color: #e07a8f;
  font-size: 32rpx;
  line-height: 1.4;
  flex-shrink: 0;
}

.tip-text {
  font-size: 26rpx;
  color: #8b7d84;
  line-height: 1.7;
}

// ─── 医院贴士 ────────────────────────────────────────────────
.hospital-tips {
  .section-title {
    margin-bottom: 20rpx;
    display: block;
  }
}

.hospital-tip-item {
  display: flex;
  gap: 16rpx;
  align-items: flex-start;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f8eef1;

  &:last-child {
    border-bottom: none;
  }
}

.hospital-tip-icon {
  font-size: 32rpx;
  flex-shrink: 0;
  line-height: 1.4;
}

.bottom-spacer {
  height: 60rpx;
}
</style>