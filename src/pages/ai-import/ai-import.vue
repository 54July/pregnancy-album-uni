<script setup>
import { ref, computed } from 'vue'
import { useChecklistStore } from '@/stores/checklist'

const store = useChecklistStore()

// ── 试用次数 ──────────────────────────────────────────
const MAX_USES = 3
const MAX_IMAGES = 5
const USES_KEY = 'ai-import-uses-v1'

function getUsedCount() {
  return uni.getStorageSync(USES_KEY) || 0
}
function incrementUsedCount() {
  uni.setStorageSync(USES_KEY, getUsedCount() + 1)
}

const usedCount = ref(getUsedCount())
const remainingUses = computed(() => Math.max(0, MAX_USES - usedCount.value))
const noUsesLeft = computed(() => remainingUses.value === 0)

// ── 状态 ──────────────────────────────────────────────
const images = ref([])          // [{ path, base64 }]
const status = ref('idle')      // idle | loading | done | error
const errorMsg = ref('')
const parsedResult = ref(null)  // { title, categories: [{name, icon, items:[string]}] }
const expandedCats = ref({})

// ── 计算 ──────────────────────────────────────────────
const canParse = computed(() => images.value.length > 0 && !noUsesLeft.value)
const totalItems = computed(() =>
  parsedResult.value?.categories.reduce((n, c) => n + c.items.length, 0) ?? 0,
)

// ── 图片选择 ──────────────────────────────────────────
function chooseImages() {
  const remain = MAX_IMAGES - images.value.length
  if (remain <= 0) return
  uni.chooseImage({
    count: remain,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success(res) {
      const paths = res.tempFilePaths
      // 逐张转 base64
      paths.forEach((path) => {
        uni.getFileSystemManager().readFile({
          filePath: path,
          encoding: 'base64',
          success(r) {
            images.value.push({ path, base64: r.data })
          },
          fail() {
            images.value.push({ path, base64: null })
          },
        })
      })
    },
  })
}

function removeImage(idx) {
  images.value.splice(idx, 1)
}

// ── 解析 ──────────────────────────────────────────────
function toggleCat(name) {
  expandedCats.value[name] = !expandedCats.value[name]
}
function isCatExpanded(name) {
  return expandedCats.value[name] !== false
}

async function parseDocument() {
  if (!canParse.value) return
  if (noUsesLeft.value) {
    uni.showToast({ title: '试用次数已用完', icon: 'none' })
    return
  }
  status.value = 'loading'
  errorMsg.value = ''
  parsedResult.value = null

  try {
    // #ifdef MP-WEIXIN
    const res = await new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'parseHospitalDoc',
        data: {
          images: images.value.map((img) => img.base64),
        },
        success: (r) => resolve(r.result),
        fail: (e) => reject(new Error(e.errMsg || '云函数调用失败')),
      })
    })
    // #endif

    // #ifndef MP-WEIXIN
    const res = await callDoubaoVision(images.value.map((img) => img.base64))
    // #endif

    if (res.code !== 200) throw new Error(res.message || '解析失败')

    // 成功才计入使用次数
    incrementUsedCount()
    usedCount.value = getUsedCount()

    parsedResult.value = res.data
    res.data.categories.forEach((c) => { expandedCats.value[c.name] = true })
    status.value = 'done'
  } catch (e) {
    status.value = 'error'
    errorMsg.value = e.message || '解析失败，请重试'
  }
}

/** H5 开发调试用，直接调豆包视觉接口 */
async function callDoubaoVision(base64List) {
  const prompt = `你是一个专业的待产包清单助手。请从以下医院文档截图中提取所有需要准备的物品，整理成结构化的分类清单。

要求：
1. 按照物品类型分类（如：入院准备、妈妈用品、宝宝用品、分娩用品等）
2. 每个分类给一个合适的 emoji 图标
3. 保留原文的物品名称，可以适当简化
4. 忽略文档中的注意事项、规定说明等非物品内容
5. 去除重复物品

请以如下 JSON 格式返回（只返回 JSON，不要有其他文字）：
{
  "title": "清单标题（如医院名称+待产包清单）",
  "categories": [
    {
      "name": "分类名称",
      "icon": "emoji",
      "items": ["物品1", "物品2", "物品3"]
    }
  ]
}`

  // 构建多图消息
  const content = [
    ...base64List.map((b64) => ({
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${b64}` },
    })),
    { type: 'text', text: prompt },
  ]

  const resp = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${uni.getStorageSync('doubao-api-key') || ''}`,
    },
    body: JSON.stringify({
      model: 'doubao-1-5-vision-pro-32k-250115',
      max_tokens: 2048,
      messages: [{ role: 'user', content }],
    }),
  })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const data = await resp.json()
  const text = data.choices?.[0]?.message?.content ?? ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('AI 返回格式有误')
  return { code: 200, data: JSON.parse(jsonMatch[0]) }
}

function importToChecklist() {
  if (!parsedResult.value) return
  store.mergeAiCategories(parsedResult.value.categories)
  uni.showModal({
    title: '导入成功',
    content: `已将 ${totalItems.value} 个物品添加到待产包清单（自动去重）`,
    showCancel: false,
    success() { uni.navigateBack() },
  })
}

function reset() {
  images.value = []
  parsedResult.value = null
  status.value = 'idle'
  errorMsg.value = ''
  expandedCats.value = {}
}
</script>

<template>
  <scroll-view class="page" scroll-y>

    <!-- 图片上传区 -->
    <view class="panel input-panel" v-if="status !== 'done'">
      <view class="input-header">
        <text class="input-icon">📷</text>
        <view>
          <text class="section-title">上传医院文档截图</text>
          <text class="lead">将医院提供的待产包清单截图上传，AI 将自动识别并整理（最多 5 张）</text>
        </view>
      </view>

      <!-- 次数提示 -->
      <view class="uses-bar" :class="{ 'uses-bar--empty': noUsesLeft }">
        <text class="uses-text" v-if="!noUsesLeft">剩余试用次数：{{ remainingUses }} / {{ MAX_USES }}</text>
        <text class="uses-text uses-text--empty" v-else">试用次数已用完</text>
      </view>

      <!-- 图片网格 -->
      <view class="image-grid">
        <view
          v-for="(img, idx) in images"
          :key="idx"
          class="image-thumb"
        >
          <image :src="img.path" mode="aspectFill" class="thumb-img" />
          <view class="thumb-delete" @click="removeImage(idx)">
            <text class="thumb-delete-icon">×</text>
          </view>
        </view>

        <!-- 添加按钮 -->
        <view
          v-if="images.length < MAX_IMAGES"
          class="image-add"
          @click="chooseImages"
        >
          <text class="add-icon">＋</text>
          <text class="add-label">添加图片</text>
        </view>
      </view>

      <view v-if="images.length > 0" class="image-count">
        <text class="count-text">已选 {{ images.length }} 张</text>
      </view>

      <button
        class="btn btn-primary parse-btn"
        :disabled="!canParse || status === 'loading'"
        @click="parseDocument"
      >
        <text v-if="status === 'loading'">AI 识别中...</text>
        <text v-else>✨ 智能识别</text>
      </button>
    </view>

    <!-- 加载中 -->
    <view v-if="status === 'loading'" class="loading-panel panel">
      <view class="loading-anim">
        <view class="dot dot1" />
        <view class="dot dot2" />
        <view class="dot dot3" />
      </view>
      <text class="loading-text">AI 正在识别图片内容，请稍候...</text>
    </view>

    <!-- 错误 -->
    <view v-if="status === 'error'" class="panel error-panel">
      <text class="error-icon">⚠️</text>
      <text class="error-msg">{{ errorMsg }}</text>
      <button class="btn btn-secondary" @click="reset">重新上传</button>
    </view>

    <!-- 解析结果 -->
    <view v-if="status === 'done' && parsedResult" class="result-area">

      <!-- 中心节点 -->
      <view class="mindmap-root panel">
        <text class="mindmap-root-icon">📦</text>
        <text class="mindmap-root-title">{{ parsedResult.title || '待产包清单' }}</text>
        <text class="mindmap-root-sub">共 {{ parsedResult.categories.length }} 个分类 · {{ totalItems }} 件物品</text>
      </view>

      <!-- 分类枝干 -->
      <view
        v-for="cat in parsedResult.categories"
        :key="cat.name"
        class="mindmap-branch"
      >
        <view class="branch-line">
          <view class="branch-dot" />
          <view class="branch-connector" />
        </view>

        <view class="branch-card panel" @click="toggleCat(cat.name)">
          <view class="branch-card-header">
            <text class="branch-icon">{{ cat.icon }}</text>
            <text class="branch-name">{{ cat.name }}</text>
            <view class="branch-count-badge">
              <text>{{ cat.items.length }}</text>
            </view>
            <text class="branch-toggle">{{ isCatExpanded(cat.name) ? '▾' : '▸' }}</text>
          </view>

          <view v-if="isCatExpanded(cat.name)" class="leaves">
            <view
              v-for="(item, itemIdx) in cat.items"
              :key="itemIdx"
              class="leaf"
              :style="{ animationDelay: (itemIdx * 40) + 'ms' }"
            >
              <view class="leaf-dot" />
              <text class="leaf-name">{{ item }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 导入操作 -->
      <view class="import-actions panel">
        <text class="import-hint">确认无误后一键导入到待产包清单</text>
        <button class="btn btn-primary import-btn" @click="importToChecklist">
          ✅ 导入到待产包
        </button>
        <button class="btn btn-secondary import-btn" @click="reset">重新上传</button>
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

// ── 图片上传 ─────────────────────────────────────────
.input-panel {
  margin-bottom: 24rpx;
}

.input-header {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.uses-bar {
  display: flex;
  align-items: center;
  background: rgba(224, 122, 143, 0.08);
  border-radius: 12rpx;
  padding: 12rpx 20rpx;
  margin-bottom: 20rpx;

  &--empty {
    background: rgba(180, 180, 180, 0.1);
  }
}

.uses-text {
  font-size: 24rpx;
  color: #c85f76;

  &--empty {
    color: #b0a0a8;
  }
}

.input-icon {
  font-size: 40rpx;
  flex-shrink: 0;
  margin-top: 4rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #2f2430;
  display: block;
  margin-bottom: 6rpx;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.image-thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 16rpx;
  overflow: hidden;
}

.thumb-img {
  width: 100%;
  height: 100%;
  display: block;
}

.thumb-delete {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb-delete-icon {
  color: #fff;
  font-size: 32rpx;
  line-height: 1;
  margin-top: -2rpx;
}

.image-add {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 16rpx;
  border: 2rpx dashed #f0d9df;
  background: #fff8f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.add-icon {
  font-size: 48rpx;
  color: #e07a8f;
  line-height: 1;
}

.add-label {
  font-size: 22rpx;
  color: #c4b5bc;
}

.image-count {
  text-align: right;
  margin-top: 12rpx;
}

.count-text {
  font-size: 22rpx;
  color: #c4b5bc;
}

.parse-btn {
  width: 100%;
  margin-top: 24rpx;
  height: 88rpx;
  line-height: 88rpx;
  font-size: 30rpx;

  &[disabled] {
    opacity: 0.5;
  }
}

// ── 加载动画 ─────────────────────────────────────────
.loading-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28rpx;
  padding: 60rpx 32rpx;
}

.loading-anim {
  display: flex;
  gap: 16rpx;
  align-items: center;
}

.dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #e07a8f, #c85f76);
  animation: bounce 1.2s infinite ease-in-out;
}

.dot2 { animation-delay: 0.2s; }
.dot3 { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

.loading-text {
  font-size: 28rpx;
  color: #8b7d84;
  text-align: center;
}

// ── 错误面板 ─────────────────────────────────────────
.error-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  padding: 48rpx 32rpx;
}

.error-icon { font-size: 64rpx; }

.error-msg {
  font-size: 26rpx;
  color: #8b7d84;
  text-align: center;
  line-height: 1.7;
}

// ── 思维导图结果 ─────────────────────────────────────
.mindmap-root {
  text-align: center;
  padding: 40rpx 32rpx;
  background: linear-gradient(135deg, rgba(224, 122, 143, 0.1), rgba(200, 95, 118, 0.15));
  border: 2rpx solid rgba(224, 122, 143, 0.3);
}

.mindmap-root-icon {
  display: block;
  font-size: 64rpx;
  margin-bottom: 12rpx;
}

.mindmap-root-title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #2f2430;
}

.mindmap-root-sub {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #c85f76;
}

.mindmap-branch {
  margin-top: 16rpx;
  display: flex;
  align-items: flex-start;
}

.branch-line {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 36rpx;
  width: 40rpx;
  flex-shrink: 0;
}

.branch-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #e07a8f, #c85f76);
  flex-shrink: 0;
}

.branch-connector {
  width: 2rpx;
  flex: 1;
  min-height: 40rpx;
  background: linear-gradient(to bottom, #e07a8f, transparent);
  margin-top: 4rpx;
}

.branch-card {
  flex: 1;
  padding: 24rpx;
  border-left: 4rpx solid rgba(224, 122, 143, 0.4);
}

.branch-card-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.branch-icon {
  font-size: 36rpx;
  flex-shrink: 0;
}

.branch-name {
  flex: 1;
  font-size: 30rpx;
  font-weight: 600;
  color: #2f2430;
}

.branch-count-badge {
  background: rgba(224, 122, 143, 0.15);
  border-radius: 999rpx;
  padding: 4rpx 16rpx;

  text {
    font-size: 22rpx;
    color: #c85f76;
    font-weight: 600;
  }
}

.branch-toggle {
  font-size: 28rpx;
  color: #c85f76;
  flex-shrink: 0;
}

.leaves {
  margin-top: 16rpx;
  display: grid;
}

.leaf {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 14rpx 8rpx;
  border-bottom: 1rpx solid #f8eef1;
  animation: fadeIn 0.3s ease both;

  &:last-child { border-bottom: none; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-8rpx); }
  to { opacity: 1; transform: translateX(0); }
}

.leaf-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: #e07a8f;
  flex-shrink: 0;
  margin-left: 8rpx;
}

.leaf-name {
  font-size: 26rpx;
  color: #4a3f45;
  line-height: 1.5;
}

// ── 导入操作 ─────────────────────────────────────────
.import-actions {
  margin-top: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  align-items: center;
}

.import-hint {
  font-size: 26rpx;
  color: #8b7d84;
  text-align: center;
}

.import-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  font-size: 30rpx;
}

.bottom-spacer {
  height: 80rpx;
}
</style>