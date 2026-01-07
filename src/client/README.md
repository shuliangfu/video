# @dreamer/video/client

视频处理库 - 客户端实现

使用浏览器原生 Video API 和 MediaRecorder API 实现视频处理功能，功能受限。

## 功能

客户端视频处理库，提供基本的视频操作功能。

## 特性

- **视频信息提取**：时长、分辨率、格式、文件大小
- **视频播放控制**：播放、暂停、跳转
- **视频裁剪**：提取视频片段（功能受限）

## 安装

```bash
deno add jsr:@dreamer/video
```

## 导入

```typescript
import {
  getVideoInfo,
  play,
  pause,
  seek,
  crop,
} from "jsr:@dreamer/video/client";
```

## 环境兼容性

- **浏览器**：✅ 支持所有现代浏览器
- **依赖**：无需额外依赖，使用浏览器原生 API
- **API 要求**：Video API、MediaRecorder API

## 使用示例

### 基本使用

```typescript
import {
  getVideoInfo,
  play,
  pause,
  seek,
  getCurrentTime,
  getDuration,
} from "jsr:@dreamer/video/client";

// 从文件获取视频信息
const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
const file = fileInput.files?.[0];
if (file) {
  const info = await getVideoInfo(file);
  console.log("视频信息:", info);
  // {
  //   duration: 120.5,
  //   width: 1920,
  //   height: 1080,
  //   fps: 0, // 浏览器无法直接获取
  //   size: 75432100,
  //   format: "mp4",
  //   mimeType: "video/mp4",
  // }
}

// 视频播放控制
const video = document.querySelector("video") as HTMLVideoElement;

// 播放
await play(video);

// 暂停
pause(video);

// 跳转到指定时间
seek(video, 10); // 跳转到第 10 秒

// 获取当前时间
const currentTime = getCurrentTime(video);
console.log("当前时间:", currentTime);

// 获取视频时长
const duration = getDuration(video);
console.log("视频时长:", duration);
```

### 视频裁剪

```typescript
import { crop } from "jsr:@dreamer/video/client";

// 从文件裁剪视频片段
const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
const file = fileInput.files?.[0];
if (file) {
  const croppedBlob = await crop(file, {
    start: 10, // 开始时间（秒）
    duration: 30, // 持续时间（秒）
  });

  // 创建预览 URL
  const previewUrl = URL.createObjectURL(croppedBlob);
  const video = document.createElement("video");
  video.src = previewUrl;
  document.body.appendChild(video);
}
```

## API 文档

### `getVideoInfo(video)`

获取视频信息。

**参数**：
- `video`: `HTMLVideoElement | File` - 视频元素或文件

**返回**：`Promise<VideoInfo>` - 视频信息

### `play(video)`

播放视频。

**参数**：
- `video`: `HTMLVideoElement` - 视频元素

**返回**：`Promise<void>`

### `pause(video)`

暂停视频。

**参数**：
- `video`: `HTMLVideoElement` - 视频元素

### `seek(video, time)`

跳转到指定时间。

**参数**：
- `video`: `HTMLVideoElement` - 视频元素
- `time`: `number` - 时间（秒）

### `getCurrentTime(video)`

获取当前播放时间。

**参数**：
- `video`: `HTMLVideoElement` - 视频元素

**返回**：`number` - 当前时间（秒）

### `getDuration(video)`

获取视频时长。

**参数**：
- `video`: `HTMLVideoElement` - 视频元素

**返回**：`number` - 时长（秒）

### `crop(video, options)`

裁剪视频（提取片段）。

**参数**：
- `video`: `HTMLVideoElement | File` - 视频元素或文件
- `options`: `CropOptions` - 裁剪选项
  - `start`: `number` - 开始时间（秒）
  - `duration`: `number` - 持续时间（秒）
  - `width`: `number` - 宽度（可选）
  - `height`: `number` - 高度（可选）

**返回**：`Promise<Blob>` - 裁剪后的视频 Blob

**注意**：客户端视频裁剪功能受限，仅能提取视频片段，无法进行精确裁剪。需要浏览器支持 `captureStream` API。

## 类型定义

```typescript
// 视频信息
interface VideoInfo {
  duration: number; // 时长（秒）
  width: number; // 宽度（像素）
  height: number; // 高度（像素）
  fps: number; // 帧率（浏览器无法直接获取，通常为 0）
  size: number; // 文件大小（字节）
  format: string; // 格式
  mimeType: string; // MIME 类型
}

// 裁剪选项
interface CropOptions {
  start: number; // 开始时间（秒）
  duration: number; // 持续时间（秒）
  width?: number; // 宽度（可选）
  height?: number; // 高度（可选）
}
```

## 功能限制

客户端视频处理功能受限，主要限制包括：

1. **格式转换**：不支持格式转换，浏览器原生 API 无法进行编码转换
2. **视频压缩**：不支持视频压缩，无法调整码率、分辨率等
3. **视频合并**：不支持视频合并
4. **水印添加**：不支持水印添加
5. **缩略图提取**：不支持缩略图提取
6. **视频裁剪**：仅支持简单的片段提取，需要浏览器支持 `captureStream` API

如需完整功能，请使用服务端 API。

## 浏览器兼容性

- **Video API**：所有现代浏览器支持
- **MediaRecorder API**：Chrome、Firefox、Safari 支持
- **captureStream**：Chrome、Firefox 支持，Safari 部分支持

## 注意事项

- **功能受限**：客户端功能受限，仅支持基本操作
- **浏览器兼容性**：某些功能需要特定浏览器支持
- **文件大小**：处理大文件时可能影响性能
- **内存占用**：处理大视频时注意内存占用
- **Blob URL**：使用 `URL.createObjectURL()` 创建的 URL 需要手动释放（`URL.revokeObjectURL()`）

## 更多信息

- [服务端文档](../README.md) - 服务端使用说明
