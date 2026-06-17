import { defineStore } from 'pinia'
import { createId } from '@/utils/id'
import { removeEntryPhotoFiles, removePhotoFile } from '@/utils/photo'
import { loadEntries, saveEntries } from '@/utils/storage'

const defaultEntries = [
  {
    id: 'seed-12',
    week: 12,
    title: '第一次听到心跳',
    note: '产检时医生放出了清晰的心跳声，那一刻特别激动。',
    date: '2026-03-01',
    photos: [],
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-03-01T10:00:00.000Z',
  },
  {
    id: 'seed-20',
    week: 20,
    title: '感受到第一次胎动',
    note: '晚上躺在床上，突然感觉到肚子里轻轻动了一下。',
    date: '2026-04-15',
    photos: [],
    createdAt: '2026-04-15T10:00:00.000Z',
    updatedAt: '2026-04-15T10:00:00.000Z',
  },
  {
    id: 'seed-28',
    week: 28,
    title: '拍下第一张孕肚照',
    note: '阳光很好，留下这个阶段的纪念。',
    date: '2026-05-20',
    photos: [],
    createdAt: '2026-05-20T10:00:00.000Z',
    updatedAt: '2026-05-20T10:00:00.000Z',
  },
]

function buildPhotos(photos, timestamp) {
  return (photos ?? []).map((photo) => ({
    id: photo.id ?? createId(),
    name: photo.name,
    path: photo.path,
    createdAt: photo.createdAt ?? timestamp,
  }))
}

function parseWeek(week) {
  const str = String(week)
  const [w, d = 0] = str.split('+').map(Number)
  return w * 7 + d
}

export const useAlbumStore = defineStore('album', {
  state: () => ({
    entries: [],
    ready: false,
    error: null,
  }),

  getters: {
    sortedEntries: (state) =>
      [...state.entries].sort((a, b) => {
        const diff = parseWeek(a.week) - parseWeek(b.week)
        if (diff !== 0) return diff
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      }),

    getEntryById: (state) => (id) => state.entries.find((entry) => entry.id === id),

    totalPhotos: (state) =>
      state.entries.reduce((count, entry) => count + entry.photos.length, 0),
  },

  actions: {
    init() {
      try {
        const entries = loadEntries()
        this.entries = entries.length ? entries : [...defaultEntries]
        if (!entries.length) {
          saveEntries(this.entries)
        }
        this.error = null
      } catch (error) {
        console.error(error)
        this.error = '本地数据加载失败，已使用默认数据'
        this.entries = [...defaultEntries]
      } finally {
        this.ready = true
      }
    },

    persist() {
      saveEntries(this.entries)
    },

    replaceEntryInState(entry) {
      const index = this.entries.findIndex((item) => item.id === entry.id)
      if (index === -1) {
        this.entries.unshift(entry)
        return
      }

      this.entries[index] = entry
    },

    createEntry(payload) {
      const now = new Date().toISOString()
      const entry = {
        id: createId(),
        week: payload.week,
        title: payload.title.trim(),
        note: payload.note.trim(),
        date: payload.date,
        photos: buildPhotos(payload.photos, now),
        createdAt: now,
        updatedAt: now,
      }

      this.entries.unshift(entry)
      this.persist()
      return entry
    },

    addPhotos(entryId, photos) {
      const entry = this.entries.find((item) => item.id === entryId)
      if (!entry || !photos.length) return null

      const now = new Date().toISOString()
      const nextEntry = {
        ...entry,
        photos: [...buildPhotos(photos, now), ...entry.photos],
        updatedAt: now,
      }

      this.replaceEntryInState(nextEntry)
      this.persist()
      return nextEntry
    },

    removePhoto(entryId, photoId) {
      const entry = this.entries.find((item) => item.id === entryId)
      if (!entry) return

      const removedPhoto = entry.photos.find((photo) => photo.id === photoId)
      const nextEntry = {
        ...entry,
        photos: entry.photos.filter((photo) => photo.id !== photoId),
        updatedAt: new Date().toISOString(),
      }

      removePhotoFile(removedPhoto)
      this.replaceEntryInState(nextEntry)
      this.persist()
    },

    deleteEntry(entryId) {
      const entry = this.entries.find((item) => item.id === entryId)
      if (!entry) return

      removeEntryPhotoFiles(entry)
      this.entries = this.entries.filter((item) => item.id !== entryId)
      this.persist()
    },
  },
})
