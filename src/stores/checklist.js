import { defineStore } from 'pinia'
import { createId } from '@/utils/id'

const STORAGE_KEY = 'pregnancy-checklist-v1'

// ─── 模板数据 ───────────────────────────────────────────────
const BASE_TEMPLATES = {
  natural: [
    {
      id: 'cat-n1',
      name: '入院基础准备',
      icon: '🏥',
      items: [
        { id: 'n1-1', name: '身份证（本人）', required: true },
        { id: 'n1-2', name: '医保卡 / 社保卡', required: true },
        { id: 'n1-3', name: '孕产妇保健手册 / 产检档案', required: true },
        { id: 'n1-4', name: '现金及银行卡', required: true },
        { id: 'n1-5', name: '手机 + 充电器 + 充电宝', required: true },
        { id: 'n1-6', name: '陪护家属身份证', required: true },
        { id: 'n1-7', name: '住院押金收据', required: false },
        { id: 'n1-8', name: '换洗衣物（妈妈）3套以上', required: false },
        { id: 'n1-9', name: '一次性内裤 10条以上', required: false },
        { id: 'n1-10', name: '哺乳内衣 2件', required: false },
        { id: 'n1-11', name: '月子帽 / 发带', required: false },
        { id: 'n1-12', name: '防滑拖鞋（妈妈）', required: false },
        { id: 'n1-13', name: '洗漱用品（牙刷、牙膏、毛巾）', required: false },
        { id: 'n1-14', name: '产后束腹带', required: false },
        { id: 'n1-15', name: '吸管杯 / 弯管', required: false },
      ],
    },
    {
      id: 'cat-n2',
      name: '宝宝用品',
      icon: '👶',
      items: [
        { id: 'n2-1', name: '新生儿连体衣 3套', required: true },
        { id: 'n2-2', name: '新生儿抱被 / 包被', required: true },
        { id: 'n2-3', name: '纸尿裤 NB码 20片以上', required: true },
        { id: 'n2-4', name: '湿纸巾', required: true },
        { id: 'n2-5', name: '宝宝帽子', required: false },
        { id: 'n2-6', name: '新生儿袜子 2双', required: false },
        { id: 'n2-7', name: '奶瓶（备用）', required: false },
        { id: 'n2-8', name: '配方奶粉（备用）', required: false },
        { id: 'n2-9', name: '婴儿毛巾 2条', required: false },
        { id: 'n2-10', name: '安抚奶嘴（备用）', required: false },
      ],
    },
    {
      id: 'cat-n3',
      name: '分娩专用',
      icon: '🌸',
      items: [
        { id: 'n3-1', name: '产褥垫 10片以上', required: true },
        { id: 'n3-2', name: '卫生巾（夜用加长型）', required: true },
        { id: 'n3-3', name: '会阴冷敷垫（推荐）', required: false },
        { id: 'n3-4', name: '分娩球（部分医院提供）', required: false },
        { id: 'n3-5', name: '导乐棒 / 按摩球', required: false },
        { id: 'n3-6', name: '蜂蜜棒 / 巧克力补充体力', required: false },
        { id: 'n3-7', name: '运动饮料 / 功能饮料', required: false },
        { id: 'n3-8', name: '暖宝宝（冬季）', required: false },
      ],
    },
  ],
  csection: [
    {
      id: 'cat-c1',
      name: '入院基础准备',
      icon: '🏥',
      items: [
        { id: 'c1-1', name: '身份证（本人）', required: true },
        { id: 'c1-2', name: '医保卡 / 社保卡', required: true },
        { id: 'c1-3', name: '孕产妇保健手册 / 产检档案', required: true },
        { id: 'c1-4', name: '现金及银行卡', required: true },
        { id: 'c1-5', name: '手机 + 充电器 + 充电宝', required: true },
        { id: 'c1-6', name: '陪护家属身份证', required: true },
        { id: 'c1-7', name: '住院押金收据', required: false },
        { id: 'c1-8', name: '换洗衣物（妈妈）5套以上', required: false },
        { id: 'c1-9', name: '一次性内裤 15条以上', required: false },
        { id: 'c1-10', name: '哺乳内衣 2件', required: false },
        { id: 'c1-11', name: '防滑拖鞋（妈妈）', required: false },
        { id: 'c1-12', name: '洗漱用品（牙刷、牙膏、毛巾）', required: false },
        { id: 'c1-13', name: '吸管杯 / 弯管（术后平躺用）', required: true },
        { id: 'c1-14', name: '腹带（剖宫产专用）', required: true },
      ],
    },
    {
      id: 'cat-c2',
      name: '宝宝用品',
      icon: '👶',
      items: [
        { id: 'c2-1', name: '新生儿连体衣 3套', required: true },
        { id: 'c2-2', name: '新生儿抱被 / 包被', required: true },
        { id: 'c2-3', name: '纸尿裤 NB码 20片以上', required: true },
        { id: 'c2-4', name: '湿纸巾', required: true },
        { id: 'c2-5', name: '宝宝帽子', required: false },
        { id: 'c2-6', name: '新生儿袜子 2双', required: false },
        { id: 'c2-7', name: '奶瓶 2个（剖后初期可能母乳不足）', required: true },
        { id: 'c2-8', name: '配方奶粉', required: false },
        { id: 'c2-9', name: '婴儿毛巾 2条', required: false },
      ],
    },
    {
      id: 'cat-c3',
      name: '分娩专用',
      icon: '⚕️',
      items: [
        { id: 'c3-1', name: '产褥垫 15片以上', required: true },
        { id: 'c3-2', name: '卫生巾（夜用加长型）大量', required: true },
        { id: 'c3-3', name: '剖宫产专用防粘连敷贴（遵医嘱）', required: false },
        { id: 'c3-4', name: '通气贴 / 去疤硅胶贴', required: false },
        { id: 'c3-5', name: '导尿管护理用品（医院通常备有）', required: false },
        { id: 'c3-6', name: '防血栓弹力袜', required: false },
        { id: 'c3-7', name: '术前禁食期间润唇膏', required: false },
        { id: 'c3-8', name: '软质吸管（术后平躺喝水）', required: true },
      ],
    },
  ],
}

// ─── 季节贴士 ───────────────────────────────────────────────
export const SEASON_TIPS = {
  spring: {
    label: '春季',
    icon: '🌷',
    tips: [
      '春季气温多变，多备一件薄外套和保暖袜',
      '花粉过敏季节，可备口罩',
      '宝宝衣物建议薄厚各备，避免过热出汗',
    ],
  },
  summer: {
    label: '夏季',
    icon: '☀️',
    tips: [
      '汗多，多备换洗衣物，浴巾可多带一条',
      '病房有空调，带一件薄长袖防着凉',
      '宝宝勿穿太多，以手摸后颈不出汗为宜',
      '冰袋 / 会阴冷敷垫更有效，可多备',
    ],
  },
  autumn: {
    label: '秋季',
    icon: '🍂',
    tips: [
      '早晚温差大，建议备薄绒外套',
      '干燥季节多准备护肤品、润唇膏',
      '宝宝帽子和薄毯必备',
    ],
  },
  winter: {
    label: '冬季',
    icon: '❄️',
    tips: [
      '保暖是重点：月子帽、厚袜子、暖手宝',
      '暖宝宝可贴于腰部缓解产后寒意（避免直接贴皮肤）',
      '宝宝要备厚包被、棉衣，出院时用加厚抱被',
      '注意病房干燥，可带小型加湿器',
    ],
  },
}

// ─── 医院精简贴士 ────────────────────────────────────────────
export const HOSPITAL_TIPS = [
  { icon: '🏨', tip: '提前咨询医院是否提供新生儿衣物、尿布，可减少携带' },
  { icon: '📋', tip: '部分医院要求自带卫生巾和产褥垫，务必提前确认' },
  { icon: '🍼', tip: '三甲医院通常有母乳喂养指导，奶瓶可少备' },
  { icon: '🛏️', tip: '月子中心待产可减少物品，由中心统一配备' },
  { icon: '🚗', tip: '备好安全座椅，出院时宝宝必须坐安全座椅' },
]

// ─── helpers ─────────────────────────────────────────────────
function buildState(mode, template) {
  return {
    mode, // 'natural' | 'csection'
    categories: template.map((cat) => ({
      ...cat,
      items: cat.items.map((item) => ({ ...item, checked: false })),
      customItems: [],
    })),
    season: 'summer', // 当前季节
  }
}

function loadState() {
  try {
    const data = uni.getStorageSync(STORAGE_KEY)
    return data && typeof data === 'object' ? data : null
  } catch {
    return null
  }
}

function saveState(state) {
  try {
    uni.setStorageSync(STORAGE_KEY, {
      mode: state.mode,
      categories: state.categories,
      season: state.season,
    })
  } catch {
    // ignore
  }
}

// ─── Store ────────────────────────────────────────────────────
export const useChecklistStore = defineStore('checklist', {
  state: () => {
    const saved = loadState()
    if (saved) return saved
    return buildState('natural', BASE_TEMPLATES.natural)
  },

  getters: {
    allItems(state) {
      return state.categories.flatMap((cat) => [
        ...cat.items,
        ...cat.customItems,
      ])
    },
    checkedCount(state) {
      return state.categories.reduce(
        (sum, cat) =>
          sum +
          cat.items.filter((i) => i.checked).length +
          cat.customItems.filter((i) => i.checked).length,
        0,
      )
    },
    totalCount(state) {
      return state.categories.reduce(
        (sum, cat) => sum + cat.items.length + cat.customItems.length,
        0,
      )
    },
    progress(state) {
      const total = state.categories.reduce(
        (sum, cat) => sum + cat.items.length + cat.customItems.length,
        0,
      )
      if (!total) return 0
      const checked = state.categories.reduce(
        (sum, cat) =>
          sum +
          cat.items.filter((i) => i.checked).length +
          cat.customItems.filter((i) => i.checked).length,
        0,
      )
      return Math.round((checked / total) * 100)
    },
  },

  actions: {
    switchMode(mode) {
      if (mode === this.mode) return
      const template = BASE_TEMPLATES[mode]
      if (!template) return
      const next = buildState(mode, template)
      this.mode = next.mode
      this.categories = next.categories
      saveState(this)
    },

    toggleItem(catId, itemId, isCustom = false) {
      const cat = this.categories.find((c) => c.id === catId)
      if (!cat) return
      const list = isCustom ? cat.customItems : cat.items
      const item = list.find((i) => i.id === itemId)
      if (item) {
        item.checked = !item.checked
        saveState(this)
      }
    },

    addCustomItem(catId, name) {
      const trimmed = name.trim()
      if (!trimmed) return
      const cat = this.categories.find((c) => c.id === catId)
      if (!cat) return
      cat.customItems.push({ id: createId(), name: trimmed, checked: false })
      saveState(this)
    },

    removeCustomItem(catId, itemId) {
      const cat = this.categories.find((c) => c.id === catId)
      if (!cat) return
      cat.customItems = cat.customItems.filter((i) => i.id !== itemId)
      saveState(this)
    },

    setSeason(season) {
      this.season = season
      saveState(this)
    },

    resetChecked() {
      this.categories.forEach((cat) => {
        cat.items.forEach((i) => { i.checked = false })
        cat.customItems.forEach((i) => { i.checked = false })
      })
      saveState(this)
    },

    /** 生成可分享的纯文本清单 */
    buildShareText() {
      const modeLabel = this.mode === 'natural' ? '顺产' : '剖宫产'
      const lines = [`📦 待产包清单（${modeLabel}）`, '']
      this.categories.forEach((cat) => {
        lines.push(`${cat.icon} ${cat.name}`)
        const all = [...cat.items, ...cat.customItems]
        all.forEach((item) => {
          lines.push(`${item.checked ? '✅' : '⬜'} ${item.name}`)
        })
        lines.push('')
      })
      lines.push(`进度：${this.checkedCount}/${this.totalCount} 已备齐`)
      return lines.join('\n')
    },
  },
})