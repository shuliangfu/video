# Changelog

All notable changes to @dreamer/video are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [1.0.0] - 2026-02-20

### Added

First stable release. A video processing library compatible with Deno and Bun,
providing server-side FFmpeg-based processing and client-side browser-native
APIs.

#### Package structure

- **Main entry**: `jsr:@dreamer/video` — server-side video processing (FFmpeg).
- **Client entry**: `jsr:@dreamer/video/client` — browser video utilities
  (limited features).
- **Dependencies**: `@dreamer/runtime-adapter` (file, process, path),
  `@dreamer/i18n` (messages).

#### Server-side (FFmpeg)

- **VideoProcessor** interface and **createVideoProcessor(options)**\
  Options: `ffmpegPath`, `tempDir`, `autoInstall` (default true). Lazy FFmpeg
  check and optional auto-install on macOS.
- **getVideoInfo(video)**\
  `video` can be file path or `Uint8Array`. Returns: `duration`, `width`,
  `height`, `fps`, `bitrate`, `audioBitrate`, `audioSampleRate`, `format`,
  `codec`, `audioCodec`, `size`, `streams`.
- **convert(video, options)**\
  Format: mp4, webm, avi, mov, mkv, flv, wmv. Codec: h264, h265, vp9, av1, vp8.
  Options: `resolution`, `fps`, `bitrate`, `quality` (low/medium/high),
  `output`.
- **compress(video, options)**\
  Options: `bitrate`, `resolution`, `quality`, `output`. Uses libx264 + aac.
- **crop(video, options)**\
  Options: `start`, `duration` or `end`, `output`. Stream copy (no re-encode).
- **merge(videos, options)**\
  Concat list of files; options: `output`. Uses FFmpeg concat demuxer.
- **addWatermark(video, options)**\
  Type: text or image. Text: `text`, `fontSize`, `color`, `opacity`. Image:
  `image` path. Common: `position` (top-left, top-right, bottom-left,
  bottom-right, center), `output`.
- **extractThumbnail(video, options)**\
  Options: `time`, `width`, `height`, `output`. Single frame export.
- **FFmpeg detection and install hints**\
  `checkFFmpeg(ffmpegPath)`, `ensureFFmpeg(ffmpegPath, autoInstall)`. Per-OS
  install hints (macOS: brew; Linux: apt-get/yum; Windows: download page).
  macOS: optional **auto-install** via `brew install ffmpeg` when `autoInstall`
  is true.
- **Convenience API**\
  Top-level `getVideoInfo`, `convert`, `compress`, `crop`, `merge`,
  `addWatermark`, `extractThumbnail` use a shared default processor (created on
  first use).

#### Client-side (browser)

- **getVideoInfo(video)**\
  `video`: `HTMLVideoElement` or `File`. Returns: `duration`, `width`, `height`,
  `fps`, `size`, `format`, `mimeType`.
- **Playback helpers**: `play(video)`, `pause(video)`, `seek(video, time)`,
  `getCurrentTime(video)`, `getDuration(video)`.
- **crop(video, options)**\
  Extract segment via `MediaRecorder` + `captureStream`; options: `start`,
  `duration`, optional `width`/`height`. Returns `Blob` (video/webm). Requires
  `HTMLVideoElement.captureStream` support.
- **applyFilter(video, options)**\
  Canvas-based filter; options: `type` (brightness, contrast, saturation,
  preset), `value` or `preset` (vintage, black-white, sepia, blur). Returns
  `Blob` (video/webm).

#### Internationalization (i18n)

- **Messages**\
  Server: FFmpeg not found, process failed, auto-install (detected, please wait,
  success, failed, no brew, linux/windows manual), install hints (title,
  macOS/Linux/Windows steps, after install). Client: captureStream unsupported,
  canvas 2d context failed, canvas stream failed.
- **Locales**\
  en-US and zh-CN under `@dreamer/i18n`. Locale from env: `VIDEO_LOCALE`,
  `LANGUAGE`, `LC_ALL`, `LANG`.
- **Exports**\
  `$tr(key, params?)`, `setVideoLocale(locale)`, `detectLocale()` from
  `./i18n.ts` (re-exported where used).

#### Types and options

- **Server types**: `VideoInfo`, `ConvertOptions`, `CompressOptions`,
  `CropOptions`, `MergeOptions`, `WatermarkOptions`, `ThumbnailOptions`,
  `VideoProcessor`, `VideoProcessorOptions`.
- **Client types**: `VideoInfo`, `CropOptions`, `FilterOptions` (client module).

#### Tests

- **27 tests** (100% pass): client (2), server API / option validation (9),
  video-operations with FFmpeg (13), plus framework cleanup. Covers
  createVideoProcessor, getVideoInfo (path + Uint8Array), convert (WebM, AVI,
  AV1), compress, crop, merge, addWatermark (text/image), extractThumbnail, and
  client getVideoInfo/VideoInfo shape.

### Compatibility

- **Runtime**: Deno 2.6+, Bun 1.3.5+.
- **Server**: Full features require FFmpeg (detection, optional macOS
  auto-install, per-OS install instructions).
- **Client**: Browser only; partial support (MediaRecorder, captureStream,
  Canvas); see client docs for limits.
