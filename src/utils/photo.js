import { createId } from '@/utils/id'

const CLOUD_PATH_PREFIX = 'pregnancy-album'

function compressImage(src) {
  return new Promise((resolve) => {
    wx.compressImage({
      src,
      quality: 80,
      success: (res) => resolve(res.tempFilePath),
      fail: () => resolve(src), // 压缩失败时直接用原图
    })
  })
}

function uploadToCloud(tempFilePath, cloudPath) {
  return new Promise((resolve, reject) => {
    wx.cloud.uploadFile({
      cloudPath,
      filePath: tempFilePath,
      success: (res) => resolve(res.fileID),
      fail: (err) => reject(new Error(err.errMsg || '上传云存储失败')),
    })
  })
}

function deleteFromCloud(fileID) {
  if (!fileID || !fileID.startsWith('cloud://')) return
  wx.cloud.deleteFile({
    fileList: [fileID],
    fail: () => {},
  })
}

export function removePhotoFile(photo) {
  deleteFromCloud(photo?.path)
}

export function removeEntryPhotoFiles(entry) {
  ;(entry?.photos ?? []).forEach(removePhotoFile)
}

export async function persistPhoto(tempFilePath, name) {
  const id = createId()
  const ext = (name || 'photo.jpg').split('.').pop()
  const cloudPath = `${CLOUD_PATH_PREFIX}/${id}.${ext}`

  // #ifdef MP-WEIXIN
  tempFilePath = await compressImage(tempFilePath)
  // #endif

  const path = await uploadToCloud(tempFilePath, cloudPath)

  return {
    id,
    name: name || 'photo.jpg',
    path,
    createdAt: new Date().toISOString(),
  }
}

export function chooseImages(count = 9) {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        try {
          const photos = []

          for (let index = 0; index < res.tempFilePaths.length; index += 1) {
            const tempFilePath = res.tempFilePaths[index]
            photos.push(
              await persistPhoto(tempFilePath, `photo-${index + 1}.jpg`),
            )
          }

          resolve(photos)
        } catch (error) {
          reject(error)
        }
      },
      fail: (error) => {
        if (error?.errMsg?.includes('cancel')) {
          resolve([])
          return
        }

        reject(error)
      },
    })
  })
}
