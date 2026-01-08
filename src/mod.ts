/**
 * @module @dreamer/video
 *
 * @fileoverview 视频处理库 - 服务端实现
 *
 * 提供视频处理、视频转换、视频压缩等功能。
 * 使用 FFmpeg 命令行工具进行视频处理。
 * 如果未安装 FFmpeg，会提示安装方法。
 */

// 导入 runtime-adapter 提供的 API
import {
  createCommand,
  IS_BUN,
  IS_DENO,
  makeTempDir,
  makeTempFile,
  remove,
  stat,
  writeFile,
  writeTextFile,
} from "@dreamer/runtime-adapter";

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
  /** 视频码率（bps） */
  bitrate: number;
  /** 音频码率（bps） */
  audioBitrate?: number;
  /** 音频采样率（Hz） */
  audioSampleRate?: number;
  /** 视频格式 */
  format: string;
  /** 视频编码 */
  codec: string;
  /** 音频编码 */
  audioCodec?: string;
  /** 文件大小（字节） */
  size: number;
  /** 视频流信息 */
  streams?: Array<{
    type: "video" | "audio" | "subtitle";
    codec: string;
    [key: string]: unknown;
  }>;
}

/**
 * 视频转换选项
 */
export interface ConvertOptions {
  /** 目标格式 */
  format?: "mp4" | "webm" | "avi" | "mov" | "mkv" | "flv" | "wmv";
  /** 视频编码 */
  codec?: "h264" | "h265" | "vp9" | "av1" | "vp8";
  /** 分辨率（如 "1920x1080"） */
  resolution?: string;
  /** 帧率 */
  fps?: number;
  /** 码率（bps） */
  bitrate?: number;
  /** 质量 */
  quality?: "low" | "medium" | "high";
  /** 输出文件路径 */
  output: string;
}

/**
 * 视频压缩选项
 */
export interface CompressOptions {
  /** 码率（bps） */
  bitrate?: number;
  /** 分辨率（如 "1280x720"） */
  resolution?: string;
  /** 质量 */
  quality?: "low" | "medium" | "high";
  /** 输出文件路径 */
  output: string;
}

/**
 * 视频裁剪选项
 */
export interface CropOptions {
  /** 开始时间（秒） */
  start: number;
  /** 持续时间（秒） */
  duration?: number;
  /** 结束时间（秒） */
  end?: number;
  /** 输出文件路径 */
  output: string;
}

/**
 * 视频合并选项
 */
export interface MergeOptions {
  /** 输出文件路径 */
  output: string;
}

/**
 * 水印选项
 */
export interface WatermarkOptions {
  /** 水印类型 */
  type: "text" | "image";
  /** 文字内容（当 type 为 "text" 时） */
  text?: string;
  /** 图片路径（当 type 为 "image" 时） */
  image?: string;
  /** 水印位置 */
  position?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "center";
  /** 字体大小（当 type 为 "text" 时） */
  fontSize?: number;
  /** 文字颜色（当 type 为 "text" 时） */
  color?: string;
  /** 透明度（0-1） */
  opacity?: number;
  /** 输出文件路径 */
  output: string;
}

/**
 * 缩略图选项
 */
export interface ThumbnailOptions {
  /** 时间点（秒） */
  time: number;
  /** 宽度 */
  width?: number;
  /** 高度 */
  height?: number;
  /** 输出文件路径 */
  output: string;
}

/**
 * 视频处理器接口
 */
export interface VideoProcessor {
  /**
   * 获取视频信息
   */
  getInfo(video: string | Uint8Array): Promise<VideoInfo>;

  /**
   * 转换视频格式
   */
  convert(video: string, options: ConvertOptions): Promise<void>;

  /**
   * 压缩视频
   */
  compress(video: string, options: CompressOptions): Promise<void>;

  /**
   * 裁剪视频
   */
  crop(video: string, options: CropOptions): Promise<void>;

  /**
   * 合并视频
   */
  merge(videos: string[], options: MergeOptions): Promise<void>;

  /**
   * 添加水印
   */
  addWatermark(video: string, options: WatermarkOptions): Promise<void>;

  /**
   * 提取缩略图
   */
  extractThumbnail(video: string, options: ThumbnailOptions): Promise<void>;
}

/**
 * 视频处理器配置
 */
export interface VideoProcessorOptions {
  /** FFmpeg 命令路径（默认：ffmpeg） */
  ffmpegPath?: string;
  /** 临时文件目录（默认：系统临时目录） */
  tempDir?: string;
  /** 是否自动尝试安装 FFmpeg（默认：true） */
  autoInstall?: boolean;
}

/**
 * 获取操作系统类型
 */
function getOS(): "macos" | "linux" | "windows" | "unknown" {
  if (IS_DENO) {
    // Deno 环境
    const os = (globalThis as any).Deno.build.os;
    if (os === "darwin") return "macos";
    if (os === "linux") return "linux";
    if (os === "windows") return "windows";
    return "unknown";
  } else if (IS_BUN) {
    // Bun 环境
    const platform = (globalThis as any).process?.platform;
    if (platform === "darwin") return "macos";
    if (platform === "linux") return "linux";
    if (platform === "win32") return "windows";
    return "unknown";
  }
  return "unknown";
}

/**
 * 生成安装提示信息
 */
async function getInstallHint(): Promise<string> {
  const os = getOS();

  let installCommand = "";
  let installUrl = "";

  switch (os) {
    case "macos":
      installCommand = "brew install ffmpeg";
      break;
    case "linux":
      try {
        const aptCheck = createCommand("apt-get", {
          args: ["--version"],
          stdout: "piped",
          stderr: "piped",
        });
        await aptCheck.output();
        installCommand = "sudo apt-get install -y ffmpeg";
      } catch {
        try {
          const yumCheck = createCommand("yum", {
            args: ["--version"],
            stdout: "piped",
            stderr: "piped",
          });
          await yumCheck.output();
          installCommand = "sudo yum install -y ffmpeg";
        } catch {
          installCommand = "请使用您的 Linux 发行版的包管理器安装 FFmpeg";
        }
      }
      break;
    case "windows":
      installUrl = "https://ffmpeg.org/download.html";
      installCommand = `请访问 ${installUrl} 下载并安装 FFmpeg`;
      break;
    default:
      installCommand = "请根据您的操作系统安装 FFmpeg";
  }

  let hint = "\n";
  hint += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
  hint += "  FFmpeg 未安装或未找到\n";
  hint += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

  if (os === "macos") {
    hint += "📦 自动安装（推荐）：\n";
    hint += `   ${installCommand}\n\n`;
    hint += "📝 手动安装：\n";
    hint += "   1. 确保已安装 Homebrew (https://brew.sh)\n";
    hint += `   2. 运行: ${installCommand}\n\n`;
  } else if (os === "linux") {
    hint += "📦 安装命令：\n";
    hint += `   ${installCommand}\n\n`;
    hint += "   或者使用其他包管理器：\n";
    hint += "   • Arch: sudo pacman -S ffmpeg\n";
    hint += "   • Fedora: sudo dnf install ffmpeg\n\n";
  } else if (os === "windows") {
    hint += "📦 安装步骤：\n";
    hint += `   1. 访问: ${installUrl}\n`;
    hint += "   2. 下载 Windows 构建版本\n";
    hint += "   3. 解压并添加到 PATH 环境变量\n";
    hint += "   4. 确保 ffmpeg.exe 在 PATH 中可用\n\n";
  } else {
    hint += `📦 安装命令：\n   ${installCommand}\n\n`;
  }

  hint += "💡 安装完成后，请重新运行程序。\n";
  hint += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

  return hint;
}

/**
 * 检查 FFmpeg 是否可用
 */
async function checkFFmpeg(ffmpegPath?: string): Promise<boolean> {
  const command = ffmpegPath || "ffmpeg";

  try {
    const checkCmd = createCommand(command, {
      args: ["-version"],
      stdout: "piped",
      stderr: "piped",
    });

    const { success } = await checkCmd.output();
    return success;
  } catch {
    return false;
  }
}

/**
 * 尝试自动安装 FFmpeg
 */
async function tryAutoInstall(): Promise<boolean> {
  const os = getOS();

  try {
    if (os === "macos") {
      const brewCheck = createCommand("brew", {
        args: ["--version"],
        stdout: "piped",
        stderr: "piped",
      });

      const { success: brewExists } = await brewCheck.output();
      if (brewExists) {
        console.log("🔍 检测到 Homebrew，正在尝试安装 FFmpeg...");
        console.log("⏳ 这可能需要几分钟时间，请稍候...");

        const installCmd = createCommand("brew", {
          args: ["install", "ffmpeg"],
          stdout: "inherit",
          stderr: "inherit",
        });

        const { success, code } = await installCmd.output();
        if (success) {
          console.log("✅ FFmpeg 安装成功！");
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return true;
        } else {
          if (code === 1) {
            console.warn("⚠️  自动安装失败（可能已安装或需要权限）");
          } else {
            console.warn(`⚠️  自动安装失败（退出码: ${code}）`);
          }
        }
      } else {
        console.log("ℹ️  未检测到 Homebrew，无法自动安装");
      }
    } else if (os === "linux") {
      console.log("ℹ️  Linux 系统需要管理员权限，无法自动安装");
      console.log("💡 请手动运行安装命令（见下方提示）");
      return false;
    } else if (os === "windows") {
      console.log("ℹ️  Windows 系统需要手动下载安装程序");
      return false;
    }
  } catch (error) {
    console.warn(
      "⚠️  自动安装过程中出错:",
      error instanceof Error ? error.message : String(error),
    );
  }

  return false;
}

/**
 * 检查并确保 FFmpeg 可用
 */
async function ensureFFmpeg(
  ffmpegPath?: string,
  autoInstall: boolean = true,
): Promise<string> {
  const isAvailable = await checkFFmpeg(ffmpegPath);
  if (isAvailable) {
    return ffmpegPath || "ffmpeg";
  }

  if (autoInstall) {
    console.log("🔍 FFmpeg 未找到，尝试自动安装...");
    const installed = await tryAutoInstall();

    if (installed) {
      // 安装成功后，再次检查是否可用
      const isNowAvailable = await checkFFmpeg(ffmpegPath);
      if (isNowAvailable) {
        return ffmpegPath || "ffmpeg";
      } else {
        // 安装成功但检查时仍不可用，可能是 PATH 未刷新或需要重启终端
        console.warn(
          "⚠️  FFmpeg 已安装，但当前会话中仍不可用。",
        );
        console.warn(
          "💡 请尝试：1) 刷新 PATH 环境变量；2) 重启终端；3) 重新运行程序。",
        );
        // 继续抛出错误，提示用户手动处理
      }
    }
    // 如果 autoInstall 为 true 但安装失败，继续抛出错误
  }

  // 只有在 FFmpeg 不可用且（未启用自动安装 或 自动安装失败）时才抛出错误
  const hint = await getInstallHint();
  throw new Error(`FFmpeg 未找到。${hint}`);
}

/**
 * FFmpeg 视频处理器
 */
class FFmpegProcessor implements VideoProcessor {
  private ffmpegCommand: string;
  private tempDir?: string;

  constructor(ffmpegCommand: string, tempDir?: string) {
    this.ffmpegCommand = ffmpegCommand;
    this.tempDir = tempDir;
  }

  /**
   * 执行 FFmpeg 命令
   */
  private async executeFFmpeg(args: string[]): Promise<void> {
    const cmd = createCommand(this.ffmpegCommand, {
      args,
      stdout: "piped",
      stderr: "piped",
    });

    const { success, stderr } = await cmd.output();
    if (!success) {
      const error = new TextDecoder().decode(stderr);
      throw new Error(`FFmpeg 处理失败: ${error}`);
    }
  }

  /**
   * 获取视频信息
   */
  async getInfo(video: string | Uint8Array): Promise<VideoInfo> {
    const videoPath = typeof video === "string"
      ? video
      : await this.createTempFile(video);

    try {
      const args = [
        "-i",
        videoPath,
        "-hide_banner",
        "-f",
        "null",
        "-",
      ];

      const cmd = createCommand(this.ffmpegCommand, {
        args,
        stdout: "piped",
        stderr: "piped",
      });

      const { stderr } = await cmd.output();
      const output = new TextDecoder().decode(stderr);

      // 解析 FFmpeg 输出
      const durationMatch = output.match(
        /Duration: (\d{2}):(\d{2}):(\d{2}\.\d+)/,
      );
      const videoMatch = output.match(
        /Video:.*?(\d+)x(\d+).*?(\d+(?:\.\d+)?)\s*fps/,
      );
      const bitrateMatch = output.match(/bitrate:\s*(\d+)\s*kb\/s/i);
      const codecMatch = output.match(
        /Video:.*?([hx]264|hevc|h265|vp9|av1|vp8)/i,
      );
      const audioCodecMatch = output.match(
        /Audio:.*?([aac|mp3|opus|vorbis]+)/i,
      );
      const audioBitrateMatch = output.match(/Audio:.*?(\d+)\s*kb\/s/i);
      const audioSampleRateMatch = output.match(/Audio:.*?(\d+)\s*Hz/i);

      let duration = 0;
      if (durationMatch) {
        const hours = parseInt(durationMatch[1], 10);
        const minutes = parseInt(durationMatch[2], 10);
        const seconds = parseFloat(durationMatch[3]);
        duration = hours * 3600 + minutes * 60 + seconds;
      }

      const width = videoMatch ? parseInt(videoMatch[1], 10) : 0;
      const height = videoMatch ? parseInt(videoMatch[2], 10) : 0;
      const fps = videoMatch ? parseFloat(videoMatch[3]) : 0;
      const bitrate = bitrateMatch ? parseInt(bitrateMatch[1], 10) * 1000 : 0;
      const codec = codecMatch ? codecMatch[1].toLowerCase() : "unknown";
      const audioCodec = audioCodecMatch
        ? audioCodecMatch[1].toLowerCase()
        : undefined;
      const audioBitrate = audioBitrateMatch
        ? parseInt(audioBitrateMatch[1], 10) * 1000
        : undefined;
      const audioSampleRate = audioSampleRateMatch
        ? parseInt(audioSampleRateMatch[1], 10)
        : undefined;

      // 获取文件大小
      const size = typeof video === "string"
        ? (await stat(videoPath)).size
        : video.length;

      // 检测格式
      const format = this.detectFormat(videoPath);

      return {
        duration,
        width,
        height,
        fps,
        bitrate,
        audioBitrate,
        audioSampleRate,
        format,
        codec,
        audioCodec,
        size,
      };
    } finally {
      if (typeof video !== "string") {
        try {
          await remove(videoPath);
        } catch {
          // 忽略删除错误
        }
      }
    }
  }

  /**
   * 转换视频格式
   */
  async convert(video: string, options: ConvertOptions): Promise<void> {
    const args: string[] = ["-i", video];

    // 视频编码（转小写比较以确保兼容性）
    const codecLower = options.codec?.toLowerCase();
    if (options.codec) {
      const codecMap: Record<string, string> = {
        h264: "libx264",
        h265: "libx265",
        hevc: "libx265",
        vp9: "libvpx-vp9",
        av1: "libaom-av1",
        vp8: "libvpx",
      };
      const codec = codecMap[codecLower || options.codec] || options.codec;
      args.push("-c:v", codec);

      // AV1 编码需要特殊参数
      if (codecLower === "av1") {
        // AV1 编码器参数
        if (options.quality === "low") {
          args.push("-cpu-used", "8"); // 最快速度
        } else if (options.quality === "medium") {
          args.push("-cpu-used", "4"); // 平衡
        } else if (options.quality === "high") {
          args.push("-cpu-used", "1"); // 最高质量
        } else {
          args.push("-cpu-used", "4"); // 默认平衡
        }
        // AV1 通常需要指定 CRF（恒定质量因子）
        if (!options.bitrate) {
          args.push("-crf", "30"); // 默认质量（0-63，值越小质量越高）
        }
      }
    }

    // 分辨率
    if (options.resolution) {
      args.push("-s", options.resolution);
    }

    // 帧率
    if (options.fps) {
      args.push("-r", String(options.fps));
    }

    // 码率
    if (options.bitrate) {
      args.push("-b:v", String(options.bitrate));
    }

    // 质量预设（非 AV1 编码器使用）
    if (options.quality && codecLower !== "av1") {
      const qualityMap: Record<string, string> = {
        low: "fast",
        medium: "medium",
        high: "slow",
      };
      args.push("-preset", qualityMap[options.quality] || "medium");
    }

    // 音频编码
    // AV1 通常使用 WebM 容器，音频编码使用 opus
    if (codecLower === "av1") {
      args.push("-c:a", "libopus");
    } else {
      args.push("-c:a", "aac");
    }

    args.push("-y", options.output);

    await this.executeFFmpeg(args);
  }

  /**
   * 压缩视频
   */
  async compress(video: string, options: CompressOptions): Promise<void> {
    const args: string[] = ["-i", video];

    // 码率
    if (options.bitrate) {
      args.push("-b:v", String(options.bitrate));
    }

    // 分辨率
    if (options.resolution) {
      args.push("-s", options.resolution);
    }

    // 质量预设
    if (options.quality) {
      const qualityMap: Record<string, string> = {
        low: "fast",
        medium: "medium",
        high: "slow",
      };
      args.push("-preset", qualityMap[options.quality] || "medium");
    }

    // 使用 H.264 编码
    args.push("-c:v", "libx264");
    args.push("-c:a", "aac");

    args.push("-y", options.output);

    await this.executeFFmpeg(args);
  }

  /**
   * 裁剪视频
   */
  async crop(video: string, options: CropOptions): Promise<void> {
    const args: string[] = ["-i", video];

    // 开始时间
    args.push("-ss", String(options.start));

    // 持续时间或结束时间
    if (options.duration) {
      args.push("-t", String(options.duration));
    } else if (options.end) {
      args.push("-t", String(options.end - options.start));
    }

    // 复制编码（不重新编码，更快）
    args.push("-c", "copy");

    args.push("-y", options.output);

    await this.executeFFmpeg(args);
  }

  /**
   * 合并视频
   */
  async merge(videos: string[], options: MergeOptions): Promise<void> {
    // 创建文件列表
    const listFile = await makeTempFile({ suffix: ".txt" });
    const listContent = videos.map((v) => `file '${v}'`).join("\n");
    await writeTextFile(listFile, listContent);

    try {
      const args = [
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        listFile,
        "-c",
        "copy",
        "-y",
        options.output,
      ];

      await this.executeFFmpeg(args);
    } finally {
      try {
        await remove(listFile);
      } catch {
        // 忽略删除错误
      }
    }
  }

  /**
   * 添加水印
   */
  async addWatermark(video: string, options: WatermarkOptions): Promise<void> {
    const args: string[] = ["-i", video];

    if (options.type === "text" && options.text) {
      // 文字水印
      const fontSize = options.fontSize || 24;
      const color = options.color || "white";
      const opacity = options.opacity || 1;

      // 计算位置
      let position = "10:10"; // 默认左上
      if (options.position === "top-right") {
        position = "main_w-text_w-10:10";
      } else if (options.position === "bottom-left") {
        position = "10:main_h-text_h-10";
      } else if (options.position === "bottom-right") {
        position = "main_w-text_w-10:main_h-text_h-10";
      } else if (options.position === "center") {
        position = "(main_w-text_w)/2:(main_h-text_h)/2";
      }

      args.push(
        "-vf",
        `drawtext=text='${options.text}':fontsize=${fontSize}:fontcolor=${color}@${opacity}:x=${position}`,
      );
    } else if (options.type === "image" && options.image) {
      // 图片水印
      const opacity = options.opacity || 1;

      // 计算位置
      let position = "10:10"; // 默认左上
      if (options.position === "top-right") {
        position = "main_w-overlay_w-10:10";
      } else if (options.position === "bottom-left") {
        position = "10:main_h-overlay_h-10";
      } else if (options.position === "bottom-right") {
        position = "main_w-overlay_w-10:main_h-overlay_h-10";
      } else if (options.position === "center") {
        position = "(main_w-overlay_w)/2:(main_h-overlay_h)/2";
      }

      args.push("-i", options.image);
      args.push(
        "-filter_complex",
        `[1:v]scale=iw*${opacity}:ih*${opacity}[overlay];[0:v][overlay]overlay=${position}`,
      );
    }

    args.push("-y", options.output);

    await this.executeFFmpeg(args);
  }

  /**
   * 提取缩略图
   */
  async extractThumbnail(
    video: string,
    options: ThumbnailOptions,
  ): Promise<void> {
    const args: string[] = [
      "-i",
      video,
      "-ss",
      String(options.time),
      "-vframes",
      "1",
    ];

    if (options.width && options.height) {
      args.push("-s", `${options.width}x${options.height}`);
    } else if (options.width) {
      args.push("-vf", `scale=${options.width}:-1`);
    } else if (options.height) {
      args.push("-vf", `scale=-1:${options.height}`);
    }

    args.push("-y", options.output);

    await this.executeFFmpeg(args);
  }

  /**
   * 创建临时文件
   */
  private async createTempFile(data: Uint8Array): Promise<string> {
    const dir = this.tempDir || await makeTempDir();
    const tempFile = `${dir}/temp_${Date.now()}_${
      Math.random().toString(36).substring(7)
    }.mp4`;
    await writeFile(tempFile, data);
    return tempFile;
  }

  /**
   * 检测视频格式
   */
  private detectFormat(videoPath: string): string {
    const ext = videoPath.split(".").pop()?.toLowerCase() || "mp4";
    return ext;
  }
}

/**
 * 创建视频处理器
 *
 * 使用 FFmpeg 命令行工具进行视频处理。
 * 如果未安装 FFmpeg，会尝试自动安装（如果启用），否则会抛出错误并提示安装方法。
 *
 * @param options 处理器配置
 * @returns 视频处理器实例
 */
export async function createVideoProcessor(
  options: VideoProcessorOptions = {},
): Promise<VideoProcessor> {
  const autoInstall = options.autoInstall !== false;

  const ffmpegCommand = await ensureFFmpeg(options.ffmpegPath, autoInstall);

  return new FFmpegProcessor(ffmpegCommand, options.tempDir);
}

// 导出便捷函数（同步创建处理器，首次调用时检查）
let defaultProcessor: VideoProcessor | null = null;

async function getDefaultProcessor(): Promise<VideoProcessor> {
  if (!defaultProcessor) {
    defaultProcessor = await createVideoProcessor();
  }
  return defaultProcessor;
}

export const getVideoInfo = async (
  video: string | Uint8Array,
): Promise<VideoInfo> => {
  const processor = await getDefaultProcessor();
  return processor.getInfo(video);
};

export const convert = async (
  video: string,
  options: ConvertOptions,
): Promise<void> => {
  const processor = await getDefaultProcessor();
  return processor.convert(video, options);
};

export const compress = async (
  video: string,
  options: CompressOptions,
): Promise<void> => {
  const processor = await getDefaultProcessor();
  return processor.compress(video, options);
};

export const crop = async (
  video: string,
  options: CropOptions,
): Promise<void> => {
  const processor = await getDefaultProcessor();
  return processor.crop(video, options);
};

export const merge = async (
  videos: string[],
  options: MergeOptions,
): Promise<void> => {
  const processor = await getDefaultProcessor();
  return processor.merge(videos, options);
};

export const addWatermark = async (
  video: string,
  options: WatermarkOptions,
): Promise<void> => {
  const processor = await getDefaultProcessor();
  return processor.addWatermark(video, options);
};

export const extractThumbnail = async (
  video: string,
  options: ThumbnailOptions,
): Promise<void> => {
  const processor = await getDefaultProcessor();
  return processor.extractThumbnail(video, options);
};
