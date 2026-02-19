# @dreamer/video

> 📖 English | [中文文档](./docs/zh-CN/README.md)

> A video processing library compatible with Deno and Bun, providing video
> processing, conversion, compression, and related features.

[![JSR](https://jsr.io/badges/@dreamer/video)](https://jsr.io/@dreamer/video)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)

---

## Features

A video processing library for video processing, conversion, compression, and
related scenarios, supporting both server and client.

## Capabilities

- **Video info extraction**: duration, resolution, frame rate, bitrate, codec
  format, etc.
- **Video conversion**: format conversion, codec conversion, resolution
  conversion, frame rate conversion, bitrate control
- **Video compression**: lossy compression, quality control, file size
  optimization
- **Video editing**: cropping, concatenation, watermarking, thumbnail extraction
- **Server and client support**:
  - Server: uses FFmpeg command-line tools
  - Client: uses browser native APIs (with limited features)

## Use cases

- Video upload and processing (user uploads, transcoding)
- Video format conversion (unified format, compatibility)
- Video compression and optimization (smaller files, faster loading)
- Video editing (crop, concatenate, add watermarks)
- Video preview generation (thumbnails, preview clips)

## Installation

```bash
deno add jsr:@dreamer/video
```

## Environment compatibility

- **Runtime**: Deno 2.6+ or Bun 1.3.5
- **Server**: ✅ Supported (Deno and Bun, uses FFmpeg)
  - Uses FFmpeg command-line tools
  - Full video processing features
  - Auto-detect and install FFmpeg (macOS)
  - Requires file system access
- **Client**: ⚠️ Partial (browser, uses native APIs)
  - Uses browser native APIs (Video API, MediaRecorder)
  - Video playback and simple cropping
  - Limited features; see [client docs](./src/client/README.md)

## Server usage

### Prerequisites

The server needs FFmpeg installed. The library will detect and try to install it
(macOS); if auto-install is not possible, installation instructions are shown.

**macOS**:

```bash
brew install ffmpeg
```

**Linux (Ubuntu/Debian)**:

```bash
sudo apt-get install -y ffmpeg
```

**Linux (CentOS/RHEL)**:

```bash
sudo yum install -y ffmpeg
```

**Windows**: Visit [FFmpeg downloads](https://ffmpeg.org/download.html) to
download and install.

### Basic usage

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

// Option 1: Convenience functions (recommended)
// The library auto-detects and installs FFmpeg if needed

// Get video info
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

// Format conversion
await convert("./input.mp4", {
  format: "webm",
  codec: "vp9",
  quality: "high",
  output: "./output.webm",
});

// Video compression
await compress("./input.mp4", {
  bitrate: 2000000,
  resolution: "1280x720",
  quality: "medium",
  output: "./compressed.mp4",
});

// Crop video
await crop("./input.mp4", {
  start: 10,
  duration: 30,
  output: "./cropped.mp4",
});

// Merge videos
await merge(
  ["./video1.mp4", "./video2.mp4"],
  { output: "./merged.mp4" },
);

// Add text watermark
await addWatermark("./input.mp4", {
  type: "text",
  text: "© 2024",
  position: "bottom-right",
  fontSize: 24,
  color: "#FFFFFF",
  opacity: 0.8,
  output: "./watermarked.mp4",
});

// Add image watermark
await addWatermark("./input.mp4", {
  type: "image",
  image: "./logo.png",
  position: "top-right",
  opacity: 0.7,
  output: "./watermarked.mp4",
});

// Extract thumbnail
await extractThumbnail("./input.mp4", {
  time: 5,
  width: 320,
  height: 180,
  output: "./thumbnail.jpg",
});
```

### Advanced configuration

```typescript
import { createVideoProcessor } from "jsr:@dreamer/video";

// Option 2: Create a processor instance (custom config)
const processor = await createVideoProcessor({
  // FFmpeg path (optional, auto-detected by default)
  ffmpegPath: "/usr/local/bin/ffmpeg",

  // Temp directory (optional, default system temp)
  tempDir: "./temp",

  // Auto-install FFmpeg (default: true)
  autoInstall: true,
});

// Use the processor
const info = await processor.getInfo("./input.mp4");
await processor.convert("./input.mp4", {
  format: "webm",
  output: "./output.webm",
});
```

## Client usage

The client uses browser native APIs with limited features. See
[client docs](./src/client/README.md).

```typescript
import {
  crop,
  getVideoInfo,
  pause,
  play,
  seek,
} from "jsr:@dreamer/video/client";

// Get video info from file
const fileInput = document.querySelector(
  'input[type="file"]',
) as HTMLInputElement;
const file = fileInput.files?.[0];
if (file) {
  const info = await getVideoInfo(file);
  console.log("Video info:", info);
}

// Playback control
const video = document.querySelector("video") as HTMLVideoElement;
await play(video);
pause(video);
seek(video, 10); // Seek to 10 seconds
```

## API reference

### Server API

#### `getVideoInfo(video)`

Get video information.

**Parameters**:

- `video`: `string | Uint8Array` — Path or data of the video file

**Returns**: `Promise<VideoInfo>` — Video information

#### `convert(video, options)`

Convert video format.

**Parameters**:

- `video`: `string` — Video file path
- `options`: `ConvertOptions` — Conversion options
  - `format`: `"mp4" | "webm" | "avi" | "mov" | "mkv" | "flv" | "wmv"` — Target
    format
  - `codec`: `"h264" | "h265" | "vp9" | "av1" | "vp8"` — Video codec
  - `resolution`: `string` — Resolution (e.g. "1920x1080")
  - `fps`: `number` — Frame rate
  - `bitrate`: `number` — Bitrate (bps)
  - `quality`: `"low" | "medium" | "high"` — Quality
  - `output`: `string` — Output file path

#### `compress(video, options)`

Compress video.

**Parameters**:

- `video`: `string` — Video file path
- `options`: `CompressOptions` — Compression options
  - `bitrate`: `number` — Bitrate (bps)
  - `resolution`: `string` — Resolution
  - `quality`: `"low" | "medium" | "high"` — Quality
  - `output`: `string` — Output file path

#### `crop(video, options)`

Crop video.

**Parameters**:

- `video`: `string` — Video file path
- `options`: `CropOptions` — Crop options
  - `start`: `number` — Start time (seconds)
  - `duration`: `number` — Duration (seconds)
  - `end`: `number` — End time (seconds, alternative to duration)
  - `output`: `string` — Output file path

#### `merge(videos, options)`

Merge videos.

**Parameters**:

- `videos`: `string[]` — Array of video file paths
- `options`: `MergeOptions` — Merge options
  - `output`: `string` — Output file path

#### `addWatermark(video, options)`

Add watermark.

**Parameters**:

- `video`: `string` — Video file path
- `options`: `WatermarkOptions` — Watermark options
  - `type`: `"text" | "image"` — Watermark type
  - `text`: `string` — Text content (when type is "text")
  - `image`: `string` — Image path (when type is "image")
  - `position`:
    `"top-left" | "top-right" | "bottom-left" | "bottom-right" | "center"` —
    Position
  - `fontSize`: `number` — Font size (when type is "text")
  - `color`: `string` — Text color (when type is "text")
  - `opacity`: `number` — Opacity (0–1)
  - `output`: `string` — Output file path

#### `extractThumbnail(video, options)`

Extract thumbnail.

**Parameters**:

- `video`: `string` — Video file path
- `options`: `ThumbnailOptions` — Thumbnail options
  - `time`: `number` — Time (seconds)
  - `width`: `number` — Width (optional)
  - `height`: `number` — Height (optional)
  - `output`: `string` — Output file path

### Client API

See [client docs](./src/client/README.md).

## Supported formats

- **Input**: MP4, WebM, AVI, MOV, MKV, FLV, WMV, etc. (depending on FFmpeg)
- **Output**: MP4, WebM, AVI, MOV, MKV, FLV, WMV, etc.

## Auto-install FFmpeg

The library detects whether FFmpeg is installed:

- **macOS**: If Homebrew is present, it will try to install FFmpeg
- **Linux/Windows**: Shows installation instructions and commands

If auto-install fails or is not available, clear instructions are shown,
including:

- OS-specific install commands
- Step-by-step instructions
- Download links (Windows)

## Performance

- **Server**: Uses FFmpeg CLI; high performance
- **Client**: Uses browser native APIs; suitable for simple operations
- **Temp files**: Managed automatically; cleaned after processing
- **Memory**: Handles large files with automatic memory management

## Notes

- **Server**: FFmpeg is required; the library detects and can try to install it
- **Client**: Uses browser native APIs; feature set is limited
- **File size**: Be aware of memory usage for large videos
- **Formats**: Support may vary by format
- **Duration**: Processing can take time; use async handling

## More

- [Client docs](./src/client/README.md) — Client usage
- [FFmpeg](https://ffmpeg.org/) — FFmpeg documentation

---

## Remarks

- **Server vs client**: The `/client` subpath clearly separates server and
  client code
- **Unified API**: Same API surface on server and client for easier learning
- **Types**: Full TypeScript types
- **Dependencies**: Server needs FFmpeg (optional); client uses browser APIs
  only

---

## Changelog

**[1.0.0]** - 2026-02-20

- **Added**: First stable release. Server: FFmpeg-based getVideoInfo, convert,
  compress, crop, merge, addWatermark, extractThumbnail; auto-detect/install
  FFmpeg (macOS). Client: getVideoInfo, play/pause/seek, crop (segment),
  applyFilter. i18n (en-US, zh-CN). 27 tests.
- Full history: [CHANGELOG](./docs/en-US/CHANGELOG.md)

---

## Contributing

Issues and Pull Requests are welcome.

---

## License

Apache License 2.0 — see [LICENSE](./LICENSE)

---

<div align="center">

**Made with ❤️ by Dreamer Team**

</div>
