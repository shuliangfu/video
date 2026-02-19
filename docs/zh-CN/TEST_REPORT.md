# @dreamer/video 测试报告

[English](../en-US/TEST_REPORT.md) | 中文 (Chinese)

## 测试概览

- **包版本**：@dreamer/video@1.0.0
- **测试库版本**：@dreamer/test@^1.0.9
- **测试框架**：@dreamer/test（兼容 Deno 与 Bun）
- **测试日期**：2026-02-19
- **测试环境**：
  - Deno 2.6+
  - Bun（运行 `bun test` 时）
  - 视频实际操作测试需安装 FFmpeg（服务端与真实文件操作）

## 测试结果

### 总体统计

- **总测试数**：27
- **通过**：27 ✅
- **失败**：0
- **通过率**：100% ✅
- **执行时间**：约 1m32s（Deno 环境，视 FFmpeg 与磁盘 I/O 而定）

### 测试文件统计

| 测试文件                   | 测试数 | 状态        | 说明                                                                                                               |
| -------------------------- | ------ | ----------- | ------------------------------------------------------------------------------------------------------------------ |
| `client.test.ts`           | 2      | ✅ 全部通过 | 客户端：从 File 获取 getVideoInfo、VideoInfo 结构校验                                                              |
| `mod.test.ts`              | 9      | ✅ 全部通过 | 服务端 API：createVideoProcessor、getVideoInfo、convert/compress/crop/merge/addWatermark/extractThumbnail 选项校验 |
| `video-operations.test.ts` | 13     | ✅ 全部通过 | 依赖 FFmpeg 的真实操作：getVideoInfo、convert(WebM/AVI/AV1)、compress、crop、extractThumbnail、addWatermark、merge |
| @dreamer/test cleanup      | 3      | ✅ 全部通过 | 浏览器/资源清理（每个测试文件运行一次）                                                                            |

## 功能测试详情

### 1. Video 客户端 (client.test.ts) - 2 个测试

| 测试场景                                                                           | 状态 |
| ---------------------------------------------------------------------------------- | ---- |
| ✅ 从 File 对象获取 getVideoInfo                                                   | 通过 |
| ✅ 验证 VideoInfo 接口结构（duration、width、height、fps、size、format、mimeType） | 通过 |

**实现要点**：

- 客户端模块与 VideoInfo 类型有覆盖。
- 基于 File 的 getVideoInfo 接口已校验（环境可能限制完整 DOM/File 行为）。

### 2. Video 服务端 API (mod.test.ts) - 9 个测试

| 测试场景                                             | 状态 |
| ---------------------------------------------------- | ---- |
| ✅ createVideoProcessor 在 FFmpeg 路径无效时抛出错误 | 通过 |
| ✅ getVideoInfo 在文件不存在时抛出错误               | 通过 |
| ✅ convert 选项参数校验                              | 通过 |
| ✅ compress 选项参数校验                             | 通过 |
| ✅ crop 选项参数校验                                 | 通过 |
| ✅ merge 选项参数校验                                | 通过 |
| ✅ addWatermark 文字水印选项校验                     | 通过 |
| ✅ addWatermark 图片水印选项校验                     | 通过 |
| ✅ extractThumbnail 选项参数校验                     | 通过 |

**实现要点**：

- 服务端入口：createVideoProcessor、getVideoInfo。
- 各操作选项（convert、compress、crop、merge、addWatermark、extractThumbnail）均有校验。
- FFmpeg 缺失或文件不存在时的错误行为有测试。

### 3. 视频实际操作 (video-operations.test.ts) - 13 个测试

| 测试场景                       | 状态 |
| ------------------------------ | ---- |
| ✅ 检查 FFmpeg 是否可用        | 通过 |
| ✅ 从文件路径 getVideoInfo     | 通过 |
| ✅ 从 Uint8Array getVideoInfo  | 通过 |
| ✅ 转换为 WebM 格式            | 通过 |
| ✅ 转换为 AVI 格式             | 通过 |
| ✅ 转换为 AV1（WebM）格式      | 通过 |
| ✅ 压缩（中等质量）            | 通过 |
| ✅ 压缩（低质量）              | 通过 |
| ✅ 裁剪视频片段                | 通过 |
| ✅ 提取缩略图                  | 通过 |
| ✅ 添加文字水印                | 通过 |
| ✅ 合并多个视频                | 通过 |
| ✅ 输出文件保留在 tests/output | 通过 |

**实现要点**：

- 使用 `tests/data` 下真实视频文件，输出到 `tests/output`。
- 需安装 FFmpeg；不可用或某操作失败（如部分系统文字水印字体）时会跳过或打日志。
- 覆盖 getVideoInfo（文件与
  Uint8Array）、convert（WebM/AVI/AV1）、compress（中/低）、crop、extractThumbnail、addWatermark、merge。

## 测试覆盖分析

### API 覆盖

| API / 模块             | 覆盖情况                                           |
| ---------------------- | -------------------------------------------------- |
| 客户端 getVideoInfo    | ✅ 从 File、VideoInfo 结构                         |
| createVideoProcessor   | ✅ FFmpeg 路径无效时报错                           |
| getVideoInfo（服务端） | ✅ 文件不存在报错；实际操作中文件与 Uint8Array     |
| convert                | ✅ 选项校验；真实 WebM/AVI/AV1 转换                |
| compress               | ✅ 选项校验；真实中/低质量压缩                     |
| crop                   | ✅ 选项校验；真实裁剪                              |
| merge                  | ✅ 选项校验；真实合并                              |
| addWatermark           | ✅ 文字/图片选项校验；真实文字水印（字体可能告警） |
| extractThumbnail       | ✅ 选项校验；真实提取                              |

### 边界 / 环境

| 场景             | 状态                                             |
| ---------------- | ------------------------------------------------ |
| FFmpeg 不可用    | ✅ createVideoProcessor 抛错；实际操作跳过或告警 |
| 文件不存在       | ✅ getVideoInfo 抛错                             |
| 真实文件 I/O     | ✅ 使用 tests/data 与 tests/output               |
| 文字水印（字体） | ✅ 测试执行；部分环境可能打印告警                |

## 必需服务

| 测试套件                 | 依赖说明                                 |
| ------------------------ | ---------------------------------------- |
| client.test.ts           | 无（仅接口）                             |
| mod.test.ts              | 无（mock / 无效路径）                    |
| video-operations.test.ts | 需安装 FFmpeg；`tests/data` 下有视频文件 |

## 优点

1. ✅ **客户端与服务端**：客户端 VideoInfo 与服务端
   createVideoProcessor/getVideoInfo 及全部操作 API 均有测试。
2. ✅ **选项校验**：各操作选项在 mod.test.ts 中统一校验。
3. ✅ **实际操作**：video-operations.test.ts 在具备 FFmpeg
   与测试数据时执行真实转换、压缩、裁剪、缩略图、水印、合并。
4. ✅ **错误处理**：FFmpeg 缺失与文件不存在等行为有覆盖。
5. ✅ **100% 通过率**：27 个测试，0 失败。

## 结论

@dreamer/video 共 27 个测试全部通过（100% 通过率）。客户端接口、服务端
API、选项校验及真实视频操作（getVideoInfo、convert、compress、crop、extractThumbnail、addWatermark、merge）均已覆盖。完整视频操作依赖
FFmpeg 与测试数据；否则测试会跳过或正确断言错误。

**总测试数**：27（24 个来自测试文件 + 3 个框架清理）。
