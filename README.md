# pregnancy-album-uni

基于 **uni-app + Vue 3 + Pinia** 的孕期相册项目，可编译为：

- 微信小程序
- H5
- 其他 uni-app 支持的平台

## 功能

- 时间轴记录（孕周、标题、内容、日期）
- 相册上传（相册选择 / 拍照）
- 记录详情页（查看、追加、删除照片）
- 本地持久化（`uni.setStorage` + `uni.saveFile`）

## 项目结构

```text
pregnancy-album-uni/
├── src/
│   ├── components/      # 通用组件
│   ├── pages/           # 页面（index / upload / detail）
│   ├── stores/          # Pinia 状态
│   ├── utils/           # 工具与存储封装
│   ├── App.vue
│   ├── main.js
│   ├── pages.json
│   └── manifest.json
└── package.json
```

## 开发

### H5 预览

```bash
npm install --legacy-peer-deps
npm run dev:h5
```

### 微信小程序

1. 在 `src/manifest.json` → `mp-weixin.appid` 填入你的小程序 AppID
2. 运行：

```bash
npm run dev:mp-weixin
```

3. 用 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) 打开目录：

```text
dist/dev/mp-weixin
```

## 构建发布

```bash
# 微信小程序
npm run build:mp-weixin

# H5
npm run build:h5
```

微信小程序构建产物在 `dist/build/mp-weixin`，可在微信开发者工具中上传审核。

## 与 Web 版差异

| Web 版 | uni-app 版 |
|--------|-----------|
| Vite H5 | uni-app 多平台构建 |
| vue-router | pages.json 页面路由 |
| IndexedDB + Blob | uni.storage + saveFile |
| 拖拽上传 | chooseImage / 拍照 |

原 Web 项目保留在 `../pregnancy-album`。
