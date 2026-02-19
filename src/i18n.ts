/**
 * @module @dreamer/video/i18n
 *
 * Video 包 i18n：FFmpeg 检测、安装提示、错误信息等文案的国际化。
 * 不挂全局，各模块通过 import $tr 使用。
 * 未传 lang 时从环境变量（LANGUAGE/LC_ALL/LANG）自动检测语言。
 */

import {
  createI18n,
  type I18n,
  type TranslationData,
  type TranslationParams,
} from "@dreamer/i18n";
import { getEnv } from "@dreamer/runtime-adapter";
import enUS from "./locales/en-US.json" with { type: "json" };
import zhCN from "./locales/zh-CN.json" with { type: "json" };

/** 支持的 locale */
export type Locale = "en-US" | "zh-CN";

/** 检测失败时使用的默认 locale */
export const DEFAULT_LOCALE: Locale = "en-US";

const VIDEO_LOCALES: Locale[] = ["en-US", "zh-CN"];

const LOCALE_DATA: Record<string, TranslationData> = {
  "en-US": enUS as TranslationData,
  "zh-CN": zhCN as TranslationData,
};

/** init 时创建的实例，不挂全局 */
let videoI18n: I18n | null = null;

/**
 * 检测当前语言：仅使用环境变量 LANGUAGE > LC_ALL > LANG（服务端不使用 navigator）。
 */
export function detectLocale(): Locale {
  const langEnv = getEnv("LANGUAGE") || getEnv("LC_ALL") || getEnv("LANG");
  if (!langEnv) return DEFAULT_LOCALE;
  const first = langEnv.split(/[:\s]/)[0]?.trim();
  if (!first) return DEFAULT_LOCALE;
  const match = first.match(/^([a-z]{2})[-_]([A-Z]{2})/i);
  if (match) {
    const normalized = `${match[1].toLowerCase()}-${
      match[2].toUpperCase()
    }` as Locale;
    if (VIDEO_LOCALES.includes(normalized)) return normalized;
  }
  const primary = first.substring(0, 2).toLowerCase();
  if (primary === "zh") return "zh-CN";
  if (primary === "en") return "en-US";
  return DEFAULT_LOCALE;
}

/** 内部初始化，导入 i18n 时自动执行，不导出 */
function initVideoI18n(): void {
  if (videoI18n) return;
  const i18n = createI18n({
    defaultLocale: DEFAULT_LOCALE,
    fallbackBehavior: "default",
    locales: [...VIDEO_LOCALES],
    translations: LOCALE_DATA as Record<string, TranslationData>,
  });
  i18n.setLocale(detectLocale());
  videoI18n = i18n;
}

initVideoI18n();

/**
 * 设置当前语言（供配置 options.lang 使用）。
 */
export function setVideoLocale(lang: Locale): void {
  initVideoI18n();
  if (videoI18n) videoI18n.setLocale(lang);
}

/**
 * 框架专用翻译。未传 lang 时使用当前 locale。
 */
export function $tr(
  key: string,
  params?: TranslationParams,
  lang?: Locale,
): string {
  if (!videoI18n) initVideoI18n();
  if (!videoI18n) return key;
  if (lang !== undefined) {
    const prev = videoI18n.getLocale();
    videoI18n.setLocale(lang);
    try {
      return videoI18n.t(key, params);
    } finally {
      videoI18n.setLocale(prev);
    }
  }
  return videoI18n.t(key, params);
}
