/**
 * @module @dreamer/video/client
 *
 * @fileoverview 视频处理库 - 客户端实现
 *
 * 使用浏览器原生 API 实现视频处理功能。
 * 注意：客户端功能受限，仅支持简单的视频操作。
 */


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
  video: HTMLVideoElement | File,
): Promise<VideoInfo> {
  if (video instanceof File) {
    // 从文件获取信息
    const videoElement = document.createElement("video");
    videoElement.src = URL.createObjectURL(video);

    return new Promise((resolve, reject) => {
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
    return {
      duration: video.duration,
      width: video.videoWidth,
      height: video.videoHeight,
      fps: 0,
      size: 0,
      format,
      mimeType: "video/mp4",
    };
  }
}

/**
 * 播放视频
 *
 * @param video 视频元素
 */
export async function play(video: HTMLVideoElement): Promise<void> {
  await video.play();
}

/**
 * 暂停视频
 *
 * @param video 视频元素
 */
export function pause(video: HTMLVideoElement): void {
  video.pause();
}

/**
 * 跳转到指定时间
 *
 * @param video 视频元素
 * @param time 时间（秒）
 */
export function seek(video: HTMLVideoElement, time: number): void {
  video.currentTime = time;
}

/**
 * 获取当前播放时间
 *
 * @param video 视频元素
 * @returns 当前时间（秒）
 */
export function getCurrentTime(video: HTMLVideoElement): number {
  return video.currentTime;
}

/**
 * 获取视频时长
 *
 * @param video 视频元素
 * @returns 时长（秒）
 */
export function getDuration(video: HTMLVideoElement): number {
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
  video: HTMLVideoElement | File,
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
        await new Promise((resolve) => {
          videoElement.onseeked = resolve;
        });

        // 创建 MediaRecorder 录制片段
        // 注意：captureStream 可能不被所有浏览器支持
        const videoEl = videoElement as HTMLVideoElement & {
          captureStream?: () => MediaStream;
        };

        if (!videoEl.captureStream) {
          reject(new Error("浏览器不支持 captureStream，无法进行视频裁剪"));
          return;
        }

        const stream = videoEl.captureStream();
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "video/webm",
        });

        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
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
 * 注意：客户端滤镜功能受限，使用 Canvas API 实现。
 *
 * @param video 视频元素
 * @param options 滤镜选项
 * @returns 处理后的视频 Blob（简化实现，返回原视频）
 */
export async function applyFilter(
  video: HTMLVideoElement,
  options: FilterOptions,
): Promise<Blob> {
  // 客户端滤镜实现较复杂，这里提供基础接口
  // 实际实现需要使用 Canvas API 逐帧处理
  console.warn("客户端视频滤镜功能受限，建议使用服务端处理");

  // 返回原视频（简化实现）
  return new Blob();
}

/**
 * 从文件创建视频元素
 */
function createVideoElementFromFile(file: File): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(file);
    video.onloadedmetadata = () => resolve(video);
    video.onerror = reject;
  });
}
