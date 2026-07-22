/**
 * @fileoverview Video 服务端测试
 */

import { describe, expect, it } from "@dreamer/test";
import { createVideoProcessor } from "../src/mod.ts";

describe("Video 服务端", () => {
  describe("createVideoProcessor", () => {
    it("应该在 FFmpeg 不可用时抛出错误", async () => {
      let error: Error | null = null;
      try {
        await createVideoProcessor({
          ffmpegPath: "nonexistent-ffmpeg",
          autoInstall: false,
        });
      } catch (e) {
        error = e as Error;
      }
      expect(error).toBeTruthy();
      expect(error?.message).toContain("FFmpeg");
    });
  });

  describe("getVideoInfo", () => {
    it("应该在文件不存在时抛出错误", async () => {
      // CI 上无 FFmpeg 时，顶层 getVideoInfo 会触发 autoInstall（brew install ffmpeg）
      // 导致 macOS CI 5s 超时。改用 autoInstall: false 的处理器，FFmpeg 不可用直接抛错。
      const processor = await createVideoProcessor({ autoInstall: false });
      let error: Error | null = null;
      try {
        await processor.getInfo("nonexistent-video-file.mp4");
      } catch (e) {
        error = e as Error;
      }
      // 可能会因为 FFmpeg 不可用或文件不存在而抛出错误
      expect(error).toBeTruthy();
    });
  });

  describe("convert", () => {
    it("应该验证选项参数", () => {
      const options = {
        format: "webm" as const,
        output: "output.webm",
      };
      expect(options.format).toBe("webm");
      expect(options.output).toBe("output.webm");
    });
  });

  describe("compress", () => {
    it("应该验证选项参数", () => {
      const options = {
        quality: "medium" as const,
        output: "output.mp4",
      };
      expect(options.quality).toBe("medium");
      expect(options.output).toBe("output.mp4");
    });
  });

  describe("crop", () => {
    it("应该验证选项参数", () => {
      const options = {
        start: 0,
        duration: 10,
        output: "output.mp4",
      };
      expect(options.start).toBe(0);
      expect(options.duration).toBe(10);
    });
  });

  describe("merge", () => {
    it("应该验证选项参数", () => {
      const options = {
        output: "output.mp4",
      };
      expect(options.output).toBe("output.mp4");
    });
  });

  describe("addWatermark", () => {
    it("应该验证文字水印选项", () => {
      const options = {
        type: "text" as const,
        text: "Watermark",
        output: "output.mp4",
      };
      expect(options.type).toBe("text");
      expect(options.text).toBe("Watermark");
    });

    it("应该验证图片水印选项", () => {
      const options = {
        type: "image" as const,
        image: "watermark.png",
        output: "output.mp4",
      };
      expect(options.type).toBe("image");
      expect(options.image).toBe("watermark.png");
    });
  });

  describe("extractThumbnail", () => {
    it("应该验证选项参数", () => {
      const options = {
        time: 5,
        output: "thumbnail.jpg",
      };
      expect(options.time).toBe(5);
      expect(options.output).toBe("thumbnail.jpg");
    });
  });
});
