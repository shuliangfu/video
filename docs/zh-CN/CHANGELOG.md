# 变更日志

@dreamer/video 的所有重要变更均记录于此。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [1.0.0] - 2026-02-20

### 新增

首个稳定版本。兼容 Deno 与 Bun 的视频处理库，提供基于 FFmpeg
的服务端处理与基于浏览器原生 API 的客户端能力。

#### 包结构

- **主入口**：`jsr:@dreamer/video` — 服务端视频处理（FFmpeg）。
- **客户端入口**：`jsr:@dreamer/video/client` — 浏览器端视频工具（功能受限）。
- **依赖**：`@dreamer/runtime-adapter`（文件、进程、路径），`@dreamer/i18n`（文案）。

#### 服务端（FFmpeg）

- **VideoProcessor 接口**与 **createVideoProcessor(options)**\
  选项：`ffmpegPath`、`tempDir`、`autoInstall`（默认 true）。延迟检测
  FFmpeg，macOS 可选自动安装。
- **getVideoInfo(video)**\
  `video` 可为文件路径或
  `Uint8Array`。返回：`duration`、`width`、`height`、`fps`、`bitrate`、`audioBitrate`、`audioSampleRate`、`format`、`codec`、`audioCodec`、`size`、`streams`。
- **convert(video, options)**\
  格式：mp4、webm、avi、mov、mkv、flv、wmv。编码：h264、h265、vp9、av1、vp8。选项：`resolution`、`fps`、`bitrate`、`quality`（low/medium/high）、`output`。
- **compress(video, options)**\
  选项：`bitrate`、`resolution`、`quality`、`output`。使用 libx264 + aac。
- **crop(video, options)**\
  选项：`start`、`duration` 或 `end`、`output`。流复制（不重新编码）。
- **merge(videos, options)**\
  多文件拼接；选项：`output`。使用 FFmpeg concat 解复用器。
- **addWatermark(video, options)**\
  类型：文字或图片。文字：`text`、`fontSize`、`color`、`opacity`。图片：`image`
  路径。通用：`position`（左上/右上/左下/右下/居中）、`output`。
- **extractThumbnail(video, options)**\
  选项：`time`、`width`、`height`、`output`。导出单帧。
- **FFmpeg 检测与安装提示**\
  `checkFFmpeg(ffmpegPath)`、`ensureFFmpeg(ffmpegPath, autoInstall)`。按系统给出安装命令（macOS：brew；Linux：apt-get/yum；Windows：下载页）。macOS：当
  `autoInstall` 为 true 时可选 **自动安装**（`brew install ffmpeg`）。
- **便捷 API**\
  顶层
  `getVideoInfo`、`convert`、`compress`、`crop`、`merge`、`addWatermark`、`extractThumbnail`
  使用共享的默认处理器（首次调用时创建）。

#### 客户端（浏览器）

- **getVideoInfo(video)**\
  `video`：`HTMLVideoElement` 或
  `File`。返回：`duration`、`width`、`height`、`fps`、`size`、`format`、`mimeType`。
- **播放控制**：`play(video)`、`pause(video)`、`seek(video, time)`、`getCurrentTime(video)`、`getDuration(video)`。
- **crop(video, options)**\
  通过 `MediaRecorder` + `captureStream`
  截取片段；选项：`start`、`duration`，可选 `width`/`height`。返回
  `Blob`（video/webm）。依赖 `HTMLVideoElement.captureStream` 支持。
- **applyFilter(video, options)**\
  基于 Canvas
  的滤镜；选项：`type`（brightness、contrast、saturation、preset），`value` 或
  `preset`（vintage、black-white、sepia、blur）。返回 `Blob`（video/webm）。

#### 国际化（i18n）

- **文案**\
  服务端：FFmpeg 未找到、处理失败、自动安装（已检测、请等待、成功、失败、无
  brew、Linux/Windows
  手动说明）、安装提示（标题、各系统步骤、安装后说明）。客户端：captureStream
  不支持、Canvas 2D 上下文失败、Canvas 流失败。
- **语言**\
  en-US 与 zh-CN，基于
  `@dreamer/i18n`。环境变量：`VIDEO_LOCALE`、`LANGUAGE`、`LC_ALL`、`LANG`。
- **导出**\
  从 `./i18n.ts` 导出
  `$tr(key, params?)`、`setVideoLocale(locale)`、`detectLocale()`（在使用的模块中再导出）。

#### 类型与选项

- **服务端类型**：`VideoInfo`、`ConvertOptions`、`CompressOptions`、`CropOptions`、`MergeOptions`、`WatermarkOptions`、`ThumbnailOptions`、`VideoProcessor`、`VideoProcessorOptions`。
- **客户端类型**：`VideoInfo`、`CropOptions`、`FilterOptions`（client 模块）。

#### 测试

- **27 个用例**（100% 通过）：客户端（2）、服务端 API/选项校验（9）、基于 FFmpeg
  的视频操作（13），以及框架清理。覆盖
  createVideoProcessor、getVideoInfo（路径与
  Uint8Array）、convert（WebM、AVI、AV1）、compress、crop、merge、addWatermark（文字/图片）、extractThumbnail，以及客户端
  getVideoInfo/VideoInfo 结构。

### 兼容性

- **运行时**：Deno 2.6+、Bun 1.3.5+。
- **服务端**：完整功能需安装 FFmpeg（检测、macOS
  可选自动安装、各系统安装说明）。
- **客户端**：仅浏览器；部分支持（MediaRecorder、captureStream、Canvas）；具体限制见客户端文档。
