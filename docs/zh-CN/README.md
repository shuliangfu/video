# @dreamer/video

> 一个兼容 Deno 和 Bun 的视频处理库，提供视频处理、视频转换、视频压缩等功能

[![JSR](https://jsr.io/badges/@dreamer/video)](https://jsr.io/@dreamer/video)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](../../LICENSE)

---

## 🎯 功能

视频处理库，用于视频处理、视频转换、视频压缩等场景，支持服务端和客户端。

## 特性

- **视频信息提取**：时长、分辨率、帧率、码率、编码格式等
- **视频转换**：格式转换、编码转换、分辨率转换、帧率转换、码率控制
- **视频压缩**：有损压缩、质量控制、文件大小优化
- **视频编辑**：视频裁剪、视频拼接、水印添加、缩略图提取
- **服务端和客户端支持**：
  - 服务端：使用 FFmpeg 命令行工具
  - 客户端：使用浏览器原生 API（功能受限）

## 使用场景

- 视频上传和处理（用户上传视频、视频转码）
- 视频格式转换（统一视频格式、兼容性处理）
- 视频压缩优化（减少文件大小、提升加载速度）
- 视频编辑（视频裁剪、拼接、水印添加）
- 视频预览生成（缩略图、预览片段）

## 安装

```bash
deno add jsr:@dreamer/video
```

## 环境兼容性

- **运行时要求**：Deno 2.6+ 或 Bun 1.3.5
- **服务端**：✅ 支持（兼容 Deno 和 Bun 运行时，使用 FFmpeg）
  - 使用 FFmpeg 命令行工具
  - 支持所有视频处理功能
  - 自动检测和安装 FFmpeg（macOS）
  - 需要文件系统访问权限
- **客户端**：⚠️ 部分支持（浏览器环境，使用浏览器原生 API）
  - 使用浏览器原生 API（Video API、MediaRecorder）
  - 支持视频播放、简单裁剪
  - 功能受限，详见 [客户端文档](../../src/client/README.md)

## 服务端使用

### 前置要求

服务端需要安装
FFmpeg。库会自动检测并尝试安装（macOS），如果无法自动安装会显示安装提示。

**macOS**：

```bash
brew install ffmpeg
```

**Linux (Ubuntu/Debian)**：

```bash
sudo apt-get install -y ffmpeg
```

**Linux (CentOS/RHEL)**：

```bash
sudo yum install -y ffmpeg
```

**Windows**： 访问 [FFmpeg 官网](https://ffmpeg.org/download.html) 下载并安装。

### 基本使用

```typescript
import {
  addWatermark,
  compress,
  convert,
  createVideoProcessor,
  crop,
  extractThumbnail,
  getVideoInfo,
  merge,
} from "jsr:@dreamer/video";

// 方式1：使用便捷函数（推荐）
// 库会自动检测并安装 FFmpeg（如果未安装）

// 获取视频信息
const info = await getVideoInfo("./input.mp4");
console.log(info);
// {
//   duration: 120.5,
//   width: 1920,
//   height: 1080,
//   fps: 30,
//   bitrate: 5000000,
//   format: "mp4",
//   codec: "h264",
//   audioCodec: "aac",
//   size: 75432100,
// }

// 格式转换
await convert("./input.mp4", {
  format: "webm",
  codec: "vp9",
  quality: "high",
  output: "./output.webm",
});

// 视频压缩
await compress("./input.mp4", {
  bitrate: 2000000,
  resolution: "1280x720",
  quality: "medium",
  output: "./compressed.mp4",
});

// 视频裁剪
await crop("./input.mp4", {
  start: 10,
  duration: 30,
  output: "./cropped.mp4",
});

// 视频拼接
await merge(
  ["./video1.mp4", "./video2.mp4"],
  { output: "./merged.mp4" },
);

// 添加文字水印
await addWatermark("./input.mp4", {
  type: "text",
  text: "© 2024",
  position: "bottom-right",
  fontSize: 24,
  color: "#FFFFFF",
  opacity: 0.8,
  output: "./watermarked.mp4",
});

// 添加图片水印
await addWatermark("./input.mp4", {
  type: "image",
  image: "./logo.png",
  position: "top-right",
  opacity: 0.7,
  output: "./watermarked.mp4",
});

// 提取缩略图
await extractThumbnail("./input.mp4", {
  time: 5,
  width: 320,
  height: 180,
  output: "./thumbnail.jpg",
});
```

### 高级配置

```typescript
import { createVideoProcessor } from "jsr:@dreamer/video";

// 方式2：创建处理器实例（支持自定义配置）
const processor = await createVideoProcessor({
  // FFmpeg 命令路径（可选，默认自动检测）
  ffmpegPath: "/usr/local/bin/ffmpeg",

  // 临时文件目录（可选，默认系统临时目录）
  tempDir: "./temp",

  // 是否自动安装 FFmpeg（默认：true）
  autoInstall: true,
});

// 使用处理器
const info = await processor.getInfo("./input.mp4");
await processor.convert("./input.mp4", {
  format: "webm",
  output: "./output.webm",
});
```

## 客户端使用

客户端使用浏览器原生 API，功能受限。详见
[客户端文档](../../src/client/README.md)。

```typescript
import {
  crop,
  getVideoInfo,
  pause,
  play,
  seek,
} from "jsr:@dreamer/video/client";

// 从文件获取视频信息
const fileInput = document.querySelector(
  'input[type="file"]',
) as HTMLInputElement;
const file = fileInput.files?.[0];
if (file) {
  const info = await getVideoInfo(file);
  console.log("视频信息:", info);
}

// 视频播放控制
const video = document.querySelector("video") as HTMLVideoElement;
await play(video);
pause(video);
seek(video, 10); // 跳转到第 10 秒
```

## API 文档

### 服务端 API

#### `getVideoInfo(video)`

获取视频信息。

**参数**：

- `video`: `string | Uint8Array` - 视频文件路径或数据

**返回**：`Promise<VideoInfo>` - 视频信息

#### `convert(video, options)`

转换视频格式。

**参数**：

- `video`: `string` - 视频文件路径
- `options`: `ConvertOptions` - 转换选项
  - `format`: `"mp4" | "webm" | "avi" | "mov" | "mkv" | "flv" | "wmv"` -
    目标格式
  - `codec`: `"h264" | "h265" | "vp9" | "av1" | "vp8"` - 视频编码
  - `resolution`: `string` - 分辨率（如 "1920x1080"）
  - `fps`: `number` - 帧率
  - `bitrate`: `number` - 码率（bps）
  - `quality`: `"low" | "medium" | "high"` - 质量
  - `output`: `string` - 输出文件路径

#### `compress(video, options)`

压缩视频。

**参数**：

- `video`: `string` - 视频文件路径
- `options`: `CompressOptions` - 压缩选项
  - `bitrate`: `number` - 码率（bps）
  - `resolution`: `string` - 分辨率
  - `quality`: `"low" | "medium" | "high"` - 质量
  - `output`: `string` - 输出文件路径

#### `crop(video, options)`

裁剪视频。

**参数**：

- `video`: `string` - 视频文件路径
- `options`: `CropOptions` - 裁剪选项
  - `start`: `number` - 开始时间（秒）
  - `duration`: `number` - 持续时间（秒）
  - `end`: `number` - 结束时间（秒，与 duration 二选一）
  - `output`: `string` - 输出文件路径

#### `merge(videos, options)`

合并视频。

**参数**：

- `videos`: `string[]` - 视频文件路径数组
- `options`: `MergeOptions` - 合并选项
  - `output`: `string` - 输出文件路径

#### `addWatermark(video, options)`

添加水印。

**参数**：

- `video`: `string` - 视频文件路径
- `options`: `WatermarkOptions` - 水印选项
  - `type`: `"text" | "image"` - 水印类型
  - `text`: `string` - 文字内容（当 type 为 "text" 时）
  - `image`: `string` - 图片路径（当 type 为 "image" 时）
  - `position`:
    `"top-left" | "top-right" | "bottom-left" | "bottom-right" | "center"` -
    位置
  - `fontSize`: `number` - 字体大小（当 type 为 "text" 时）
  - `color`: `string` - 文字颜色（当 type 为 "text" 时）
  - `opacity`: `number` - 透明度（0-1）
  - `output`: `string` - 输出文件路径

#### `extractThumbnail(video, options)`

提取缩略图。

**参数**：

- `video`: `string` - 视频文件路径
- `options`: `ThumbnailOptions` - 缩略图选项
  - `time`: `number` - 时间点（秒）
  - `width`: `number` - 宽度（可选）
  - `height`: `number` - 高度（可选）
  - `output`: `string` - 输出文件路径

### 客户端 API

详见 [客户端文档](../../src/client/README.md)。

## 支持的视频格式

- **输入格式**：MP4、WebM、AVI、MOV、MKV、FLV、WMV 等（取决于 FFmpeg 支持）
- **输出格式**：MP4、WebM、AVI、MOV、MKV、FLV、WMV 等

## 自动安装 FFmpeg

库会自动检测 FFmpeg 是否已安装：

- **macOS**：如果检测到 Homebrew，会自动尝试安装 FFmpeg
- **Linux/Windows**：显示详细的安装提示和命令

如果自动安装失败或无法自动安装，会显示清晰的安装提示，包括：

- 操作系统特定的安装命令
- 安装步骤说明
- 下载链接（Windows）

## 性能优化

- **服务端**：使用 FFmpeg 命令行工具，性能优秀
- **客户端**：使用浏览器原生 API，适合简单操作
- **临时文件**：自动管理临时文件，处理完成后自动清理
- **内存优化**：支持大文件处理，自动管理内存

## 注意事项

- **服务端**：需要安装 FFmpeg，库会自动检测并尝试安装
- **客户端**：使用浏览器原生 API，功能受限
- **文件大小**：处理大视频文件时注意内存占用
- **格式支持**：不同格式的功能支持可能不同
- **处理时间**：视频处理可能需要较长时间，建议异步处理

## 更多信息

- [客户端文档](../../src/client/README.md) - 客户端使用说明
- [FFmpeg 官网](https://ffmpeg.org/) - FFmpeg 官方文档

---

## 📝 备注

- **服务端和客户端分离**：通过 `/client` 子路径明确区分服务端和客户端代码
- **统一接口**：服务端和客户端使用相同的 API 接口，降低学习成本
- **类型安全**：完整的 TypeScript 类型支持
- **依赖**：服务端需要 FFmpeg（可选），客户端使用浏览器原生 API

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 变更日志

**[1.0.0]** - 2026-02-20

- **新增**：首个稳定版。服务端：基于 FFmpeg 的
  getVideoInfo、convert、compress、crop、merge、addWatermark、extractThumbnail；自动检测/安装
  FFmpeg（macOS）。客户端：getVideoInfo、播放控制、crop（片段）、applyFilter。i18n（en-US、zh-CN）。27
  个测试。
- 完整历史：[CHANGELOG](./CHANGELOG.md)

---

## 📄 许可证

Apache License 2.0 - 详见 [LICENSE](../../LICENSE)

---

<div align="center">

**Made with ❤️ by Dreamer Team**

</div>
