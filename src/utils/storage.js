const STORAGE_KEY = 'pregnancy-album-entries'

export function loadEntries() {
  try {
    const entries = uni.getStorageSync(STORAGE_KEY)
    return Array.isArray(entries) ? entries : []
  } catch {
    return []
  }
}

export function saveEntries(entries) {
  uni.setStorageSync(STORAGE_KEY, entries)
}
