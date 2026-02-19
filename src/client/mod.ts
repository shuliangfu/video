/**
 * @module @dreamer/video/client
 *
 * @fileoverview 视频处理库 - 客户端实现
 *
 * 使用浏览器原生 API 实现视频处理功能。
 * 注意：客户端功能受限，仅支持简单的视频操作。
 */

import { $tr } from "../i18n.ts";

/**
 * Canvas 接口（兼容 HTMLCanvasElement）
 */
interface CanvasElement {
  width: number;
  height: number;
  getContext(contextId: "2d"): CanvasRenderingContext2D | null;
}

/**
 * Canvas 2D 渲染上下文接口
 */
interface CanvasRenderingContext2D {
  drawImage(
    image: VideoElement | CanvasElement,
    dx: number,
    dy: number,
    dWidth?: number,
    dHeight?: number,
  ): void;
  getImageData(sx: number, sy: number, sw: number, sh: number): ImageData;
  putImageData(imageData: ImageData, dx: number, dy: number): void;
  globalAlpha: number;
  filter: string;
}

/**
 * 图像数据接口
 */
interface ImageData {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

/**
 * 视频元素接口（兼容 HTMLVideoElement）
 */
interface VideoElement {
  duration: number;
  videoWidth: number;
  videoHeight: number;
  currentTime: number;
  src: string;
  paused: boolean;
  ended: boolean;
  onloadedmetadata: ((this: VideoElement, ev: Event) => void) | null;
  onerror: ((this: VideoElement, error: Event) => void) | null;
  onseeked: ((this: VideoElement, ev: Event) => void) | null;
  play(): Promise<void>;
  pause(): void;
  captureStream?(): MediaStream;
}

/**
 * 媒体流接口（兼容 MediaStream）
 */
interface MediaStream {
  /** 媒体流的唯一标识符 */
  id: string;
  /** 是否处于活动状态 */
  active: boolean;
  /** 获取所有音频轨道 */
  getAudioTracks(): MediaStreamTrack[];
  /** 获取所有视频轨道 */
  getVideoTracks(): MediaStreamTrack[];
  /** 获取所有轨道 */
  getTracks(): MediaStreamTrack[];
  /** 根据轨道 ID 获取轨道 */
  getTrackById(trackId: string): MediaStreamTrack | null;
  /** 添加轨道 */
  addTrack(track: MediaStreamTrack): void;
  /** 移除轨道 */
  removeTrack(track: MediaStreamTrack): void;
  /** 克隆媒体流 */
  clone(): MediaStream;
}

/**
 * 媒体轨道接口（兼容 MediaStreamTrack）
 */
interface MediaStreamTrack {
  /** 轨道的唯一标识符 */
  id: string;
  /** 轨道类型（audio 或 video） */
  kind: "audio" | "video";
  /** 轨道标签 */
  label: string;
  /** 是否启用 */
  enabled: boolean;
  /** 是否静音 */
  muted: boolean;
  /** 轨道状态 */
  readyState: "live" | "ended";
  /** 停止轨道 */
  stop(): void;
}

/**
 * 媒体录制器接口（兼容 MediaRecorder）
 */
interface MediaRecorder {
  /** MIME 类型 */
  mimeType: string;
  /** 录制状态 */
  state: "inactive" | "recording" | "paused";
  /** 视频码率（bps） */
  videoBitsPerSecond: number;
  /** 音频码率（bps） */
  audioBitsPerSecond: number;
  /** 流对象 */
  stream: MediaStream;
  /** 数据可用事件 */
  ondataavailable: ((event: { data: Blob }) => void) | null;
  /** 停止事件 */
  onstop: (() => void) | null;
  /** 错误事件 */
  onerror: ((event: { error: Error }) => void) | null;
  /** 暂停事件 */
  onpause: (() => void) | null;
  /** 恢复事件 */
  onresume: (() => void) | null;
  /** 开始录制 */
  start(timeslice?: number): void;
  /** 停止录制 */
  stop(): void;
  /** 暂停录制 */
  pause(): void;
  /** 恢复录制 */
  resume(): void;
  /** 请求数据 */
  requestData(): void;
}

/**
 * 媒体录制器构造函数
 */
interface MediaRecorderConstructor {
  new (stream: MediaStream, options?: { mimeType?: string }): MediaRecorder;
}

/**
 * 视频信息接口
 */
export interface VideoInfo {
  /** 视频时长（秒） */
  duration: number;
  /** 视频宽度（像素） */
  width: number;
  /** 视频高度（像素） */
  height: number;
  /** 帧率（fps） */
  fps: number;
  /** 文件大小（字节） */
  size: number;
  /** 视频格式 */
  format: string;
  /** MIME 类型 */
  mimeType: string;
}

/**
 * 视频裁剪选项
 */
export interface CropOptions {
  /** 开始时间（秒） */
  start: number;
  /** 持续时间（秒） */
  duration: number;
  /** 宽度 */
  width?: number;
  /** 高度 */
  height?: number;
}

/**
 * 视频滤镜选项
 */
export interface FilterOptions {
  /** 滤镜类型 */
  type: "brightness" | "contrast" | "saturation" | "preset";
  /** 滤镜值（当 type 不为 "preset" 时） */
  value?: number;
  /** 预设滤镜（当 type 为 "preset" 时） */
  preset?: "vintage" | "black-white" | "sepia" | "blur";
}

/**
 * 获取视频信息
 *
 * @param video 视频元素或文件
 * @returns 视频信息
 */
export async function getVideoInfo(
  video: VideoElement | File,
): Promise<VideoInfo> {
  if (video instanceof File) {
    // 从文件获取信息
    const videoElement = (globalThis as unknown as {
      document: { createElement: (tag: string) => VideoElement };
    }).document.createElement("video") as VideoElement;
    videoElement.src = URL.createObjectURL(video);

    return await new Promise<VideoInfo>((resolve, reject) => {
      videoElement.onloadedmetadata = () => {
        const format = video.name.split(".").pop()?.toLowerCase() || "mp4";
        resolve({
          duration: videoElement.duration,
          width: videoElement.videoWidth,
          height: videoElement.videoHeight,
          fps: 0, // 浏览器无法直接获取帧率
          size: video.size,
          format,
          mimeType: video.type || `video/${format}`,
        });
        URL.revokeObjectURL(videoElement.src);
      };
      videoElement.onerror = reject;
    });
  } else {
    // 从视频元素获取信息
    const format = "mp4"; // 无法从元素获取格式
    return await Promise.resolve({
      duration: video.duration,
      width: video.videoWidth,
      height: video.videoHeight,
      fps: 0,
      size: 0,
      format,
      mimeType: "video/mp4",
    });
  }
}

/**
 * 播放视频
 *
 * @param video 视频元素
 */
export async function play(video: VideoElement): Promise<void> {
  await video.play();
}

/**
 * 暂停视频
 *
 * @param video 视频元素
 */
export function pause(video: VideoElement): void {
  video.pause();
}

/**
 * 跳转到指定时间
 *
 * @param video 视频元素
 * @param time 时间（秒）
 */
export function seek(video: VideoElement, time: number): void {
  video.currentTime = time;
}

/**
 * 获取当前播放时间
 *
 * @param video 视频元素
 * @returns 当前时间（秒）
 */
export function getCurrentTime(video: VideoElement): number {
  return video.currentTime;
}

/**
 * 获取视频时长
 *
 * @param video 视频元素
 * @returns 时长（秒）
 */
export function getDuration(video: VideoElement): number {
  return video.duration;
}

/**
 * 裁剪视频（提取片段）
 *
 * 注意：客户端视频裁剪功能受限，仅能提取视频片段，无法进行精确裁剪。
 *
 * @param video 视频元素或文件
 * @param options 裁剪选项
 * @returns 裁剪后的视频 Blob
 */
export async function crop(
  video: VideoElement | File,
  options: CropOptions,
): Promise<Blob> {
  const videoElement = video instanceof File
    ? await createVideoElementFromFile(video)
    : video;

  return new Promise((resolve, reject) => {
    videoElement.onloadedmetadata = async () => {
      try {
        // 设置开始时间
        videoElement.currentTime = options.start;

        // 等待视频跳转到指定时间
        await new Promise<void>((resolve) => {
          videoElement.onseeked = () => resolve();
        });

        // 创建 MediaRecorder 录制片段
        // 注意：captureStream 可能不被所有浏览器支持
        if (!videoElement.captureStream) {
          reject(new Error($tr("videoClient.captureStreamUnsupported")));
          return;
        }

        const stream = videoElement.captureStream();
        const MediaRecorderClass =
          (globalThis as unknown as { MediaRecorder: MediaRecorderConstructor })
            .MediaRecorder;
        const mediaRecorder = new MediaRecorderClass(stream, {
          mimeType: "video/webm",
        });

        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event: { data: Blob }) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: "video/webm" });
          resolve(blob);
        };

        mediaRecorder.start();

        // 等待指定时长后停止
        setTimeout(() => {
          mediaRecorder.stop();
        }, options.duration * 1000);
      } catch (error) {
        reject(error);
      }
    };

    videoElement.onerror = reject;
  });
}

/**
 * 应用滤镜
 *
 * 使用 Canvas API 实现视频滤镜效果。
 *
 * @param video 视频元素
 * @param options 滤镜选项
 * @returns 处理后的视频 Blob
 */
export function applyFilter(
  video: VideoElement,
  options: FilterOptions,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // 等待视频元数据加载
    if (video.duration === 0 || isNaN(video.duration)) {
      const onLoaded = () => {
        video.onloadedmetadata = null;
        processVideo();
      };
      video.onloadedmetadata = onLoaded;
      return;
    }

    processVideo();

    function processVideo() {
      try {
        // 创建 Canvas 元素
        const canvas = (globalThis as unknown as {
          document: { createElement: (tag: string) => CanvasElement };
        }).document.createElement("canvas") as CanvasElement;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error($tr("videoClient.canvas2dContextFailed")));
          return;
        }

        // 应用滤镜效果
        applyFilterToContext(ctx, options);

        // 创建 MediaStream 用于录制
        // 注意：滤镜效果已经通过 applyFilterToContext 应用到 ctx 上
        // Canvas.captureStream() 会自动捕获 Canvas 上绘制的内容（包括滤镜效果）
        const canvasWithStream = canvas as CanvasElement & {
          captureStream?: () => MediaStream;
        };
        const stream = canvasWithStream.captureStream
          ? canvasWithStream.captureStream()
          : createCanvasStream(canvas, video);

        if (!stream) {
          reject(new Error($tr("videoClient.canvasStreamFailed")));
          return;
        }

        // 创建 MediaRecorder
        const MediaRecorderClass =
          (globalThis as unknown as { MediaRecorder: MediaRecorderConstructor })
            .MediaRecorder;
        const mediaRecorder = new MediaRecorderClass(stream, {
          mimeType: "video/webm",
        });

        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event: { data: Blob }) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: "video/webm" });
          resolve(blob);
        };

        mediaRecorder.onerror = (event: { error: Error }) => {
          reject(event.error);
        };

        // 开始录制
        mediaRecorder.start();

        // 记录原始时间
        const originalTime = video.currentTime;

        // 获取 requestAnimationFrame
        const raf = (globalThis as unknown as {
          requestAnimationFrame: (callback: () => void) => number;
        }).requestAnimationFrame;

        // 播放视频并开始绘制
        video.play().then(() => {
          // 绘制视频帧到 Canvas
          const drawFrame = () => {
            if (video.ended || video.paused) {
              mediaRecorder.stop();
              return;
            }

            // 绘制当前帧（ctx 已经检查过不为 null）
            ctx!.drawImage(video, 0, 0, canvas.width, canvas.height);

            // 继续下一帧
            raf(drawFrame);
          };

          drawFrame();

          // 录制整个视频时长
          setTimeout(() => {
            video.pause();
            video.currentTime = originalTime;
            mediaRecorder.stop();
          }, video.duration * 1000);
        }).catch(reject);
      } catch (error) {
        reject(error);
      }
    }
  });
}

/**
 * 应用滤镜效果到 Canvas 上下文
 */
function applyFilterToContext(
  ctx: CanvasRenderingContext2D,
  options: FilterOptions,
): void {
  if (options.type === "preset") {
    // 预设滤镜
    switch (options.preset) {
      case "vintage":
        ctx.filter = "sepia(1) contrast(1.1) brightness(0.9)";
        break;
      case "black-white":
        ctx.filter = "grayscale(1)";
        break;
      case "sepia":
        ctx.filter = "sepia(1)";
        break;
      case "blur":
        ctx.filter = "blur(2px)";
        break;
      default:
        ctx.filter = "none";
    }
  } else {
    // 自定义滤镜
    const filters: string[] = [];

    if (options.type === "brightness" && options.value !== undefined) {
      filters.push(`brightness(${options.value})`);
    } else if (options.type === "contrast" && options.value !== undefined) {
      filters.push(`contrast(${options.value})`);
    } else if (options.type === "saturation" && options.value !== undefined) {
      filters.push(`saturate(${options.value})`);
    }

    ctx.filter = filters.length > 0 ? filters.join(" ") : "none";
  }
}

/**
 * 创建 Canvas 媒体流（兼容性处理）
 *
 * 优先使用 Canvas.captureStream()，如果不支持则回退到视频元素的 captureStream()
 * 注意：滤镜效果已经通过 applyFilterToContext 应用到 Canvas 上下文上，
 * Canvas.captureStream() 会自动捕获 Canvas 上绘制的内容（包括滤镜效果）
 */
function createCanvasStream(
  canvas: CanvasElement,
  video: VideoElement,
): MediaStream | null {
  // 如果 Canvas 有 captureStream 方法，直接使用（最优先）
  // 这会自动捕获 Canvas 上绘制的内容，包括已应用的滤镜效果
  const canvasWithStream = canvas as CanvasElement & {
    captureStream?: () => MediaStream;
  };
  if (canvasWithStream.captureStream) {
    return canvasWithStream.captureStream();
  }

  // 如果 Canvas 不支持 captureStream，但视频元素支持，使用视频元素的
  // 注意：这种情况下滤镜效果可能无法应用，因为直接使用视频流
  if (video.captureStream) {
    console.warn(
      "Canvas.captureStream 不支持，使用视频元素流（滤镜效果可能无法应用）",
    );
    return video.captureStream();
  }

  return null;
}

/**
 * 从文件创建视频元素
 */
function createVideoElementFromFile(file: File): Promise<VideoElement> {
  return new Promise((resolve, reject) => {
    const video = (globalThis as unknown as {
      document: { createElement: (tag: string) => VideoElement };
    }).document.createElement("video") as VideoElement;
    video.src = URL.createObjectURL(file);
    video.onloadedmetadata = () => resolve(video);
    video.onerror = reject;
  });
}
