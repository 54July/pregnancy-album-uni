<script setup>
import { computed, ref } from 'vue'
import { useChecklistStore, SEASON_TIPS, HOSPITAL_TIPS } from '@/stores/checklist'

const store = useChecklistStore()

// 分类视图数据
const categories = computed(() => store.categories)
const progress = computed(() => store.progress)
const checkedCount = computed(() => store.checkedCount)
const totalCount = computed(() => store.totalCount)

// 顺/剖模式
const isNatural = computed(() => store.mode === 'natural')
const isCsection = computed(() => store.mode === 'csection')

// 季节贴士
const seasons = computed(() =>
  Object.entries(SEASON_TIPS).map(([key, val]) => ({
    key,
    ...val,
    active: store.season === key,
  })),
)
const currentSeasonTips = computed(() => SEASON_TIPS[store.season]?.tips ?? [])
const showTips = ref(true)

// 每个分类的输入框状态
const addingCatId = ref(null)
const inputValues = ref({})

function toggleItem(catId, itemId, isCustom = false) {
  store.toggleItem(catId, itemId, isCustom)
}

function startAdd(catId) {
  addingCatId.value = catId
  inputValues.value[catId] = ''
}

function cancelAdd(catId) {
  addingCatId.value = null
  inputValues.value[catId] = ''
}

function confirmAdd(catId) {
  const name = inputValues.value[catId]?.trim()
  if (name) store.addCustomItem(catId, name)
  cancelAdd(catId)
}

function handleInputChange(catId, e) {
  inputValues.value[catId] = e.detail.value
}

function removeCustom(catId, itemId) {
  store.removeCustomItem(catId, itemId)
}

function share() {
  const text = store.buildShareText()
  uni.setClipboardData({
    data: text,
    success() {
      uni.showToast({ title: '已复制到剪贴板', icon: 'success' })
    },
  })
}

function reset() {
  uni.showModal({
    title: '重置勾选',
    content: '确定将所有物品标记为未备齐？',
    confirmColor: '#e0304a',
    success(res) {
      if (res.confirm) store.resetChecked()
    },
  })
}

function goAiImport() {
  uni.navigateTo({ url: '/pages/ai-import/ai-import' })
}
</script>

<template>
  <scroll-view class="page" scroll-y>
    <!-- 顶部 Hero -->
    <view class="hero panel">
      <text class="eyebrow">Hospital Bag</text>
      <text class="hero-title">待产包清单</text>
      <text class="lead">勾选已备物品，离宝宝到来又近一步</text>

      <view class="progress-wrap">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progress + '%' }" />
        </view>
        <text class="progress-label">{{ checkedCount }}/{{ totalCount }} 已备齐</text>
      </view>

      <view class="mode-tabs">
        <view :class="['mode-tab', isNatural && 'active']" @click="store.switchMode('natural')">
          <text>🌸 顺产清单</text>
        </view>
        <view :class="['mode-tab', isCsection && 'active']" @click="store.switchMode('csection')">
          <text>⚕️ 剖宫产清单</text>
        </view>
      </view>

      <view class="hero-actions">
        <button class="btn btn-primary" @click="share">分享给家人</button>
        <button class="btn btn-secondary" @click="reset">重置勾选</button>
      </view>

      <!-- AI 智能导入入口 -->
      <view class="ai-entry" @click="goAiImport">
        <text class="ai-entry-icon">✨</text>
        <view class="ai-entry-text">
          <text class="ai-entry-title">智能导入</text>
          <text class="ai-entry-desc">粘贴医院文档，AI 自动生成清单</text>
        </view>
        <text class="ai-entry-arrow">›</text>
      </view>
    </view>

    <!-- 分类列表 -->
    <view
      v-for="cat in categories"
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
        :class="['item-row', item.checked && 'checked']"
        @click="toggleItem(cat.id, item.id)"
      >
        <view :class="['checkbox', item.checked && 'checkbox-checked']">
          <text v-if="item.checked" class="check-icon">✓</text>
        </view>
        <text class="item-name">{{ item.name }}</text>
        <view v-if="item.required" class="required-badge">必备</view>
      </view>

      <!-- 自定义物品 -->
      <view
        v-for="item in cat.customItems"
        :key="item.id"
        :class="['item-row', 'custom-item', item.checked && 'checked']"
      >
        <view
          :class="['checkbox', item.checked && 'checkbox-checked']"
          @click="toggleItem(cat.id, item.id, true)"
        >
          <text v-if="item.checked" class="check-icon">✓</text>
        </view>
        <text class="item-name" @click="toggleItem(cat.id, item.id, true)">{{ item.name }}</text>
        <view class="custom-badge">自定义</view>
        <view class="del-btn" @click.stop="removeCustom(cat.id, item.id)">
          <text>×</text>
        </view>
      </view>

      <!-- 输入框（添加自定义） -->
      <view v-if="addingCatId === cat.id" class="add-input-row">
        <input
          class="add-input"
          placeholder="输入物品名称"
          :focus="true"
          :value="inputValues[cat.id]"
          @input="handleInputChange(cat.id, $event)"
          @confirm="confirmAdd(cat.id)"
        />
        <button class="btn-icon btn-confirm" @click="confirmAdd(cat.id)">✓</button>
        <button class="btn-icon btn-cancel" @click="cancelAdd(cat.id)">×</button>
      </view>
      <view v-else class="add-row" @click="startAdd(cat.id)">
        <text class="add-text">+ 添加自定义物品</text>
      </view>
    </view>

    <!-- 季节贴士 -->
    <view class="panel tips-panel">
      <view class="tips-header" @click="showTips = !showTips">
        <text class="section-title">季节贴士</text>
        <text class="tips-toggle">{{ showTips ? '收起' : '展开' }}</text>
      </view>
      <view class="season-tabs">
        <view
          v-for="s in seasons"
          :key="s.key"
          :class="['season-tab', s.active && 'active']"
          @click="store.setSeason(s.key)"
        >
          <text>{{ s.icon }} {{ s.label }}</text>
        </view>
      </view>
      <view v-if="showTips" class="tip-list">
        <view v-for="(tip, idx) in currentSeasonTips" :key="idx" class="tip-item">
          <text class="tip-dot">·</text>
          <text class="tip-text">{{ tip }}</text>
        </view>
      </view>
    </view>

    <!-- 就医小贴士 -->
    <view class="panel tips-panel hospital-tips">
      <text class="section-title">就医小贴士</text>
      <view class="tip-list">
        <view v-for="(t, idx) in HOSPITAL_TIPS" :key="idx" class="hospital-tip-item">
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
}

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

// AI 导入入口
.ai-entry {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 24rpx;
  padding: 20rpx 24rpx;
  background: linear-gradient(135deg, rgba(224, 122, 143, 0.08), rgba(200, 95, 118, 0.12));
  border-radius: 16rpx;
  border: 1rpx solid rgba(224, 122, 143, 0.25);
}

.ai-entry-icon {
  font-size: 40rpx;
  flex-shrink: 0;
}

.ai-entry-text {
  flex: 1;
  text-align: left;
}

.ai-entry-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #c85f76;
}

.ai-entry-desc {
  display: block;
  font-size: 22rpx;
  color: #8b7d84;
  margin-top: 4rpx;
}

.ai-entry-arrow {
  font-size: 40rpx;
  color: #c85f76;
  font-weight: 300;
}

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