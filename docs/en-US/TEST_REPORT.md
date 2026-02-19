# @dreamer/video Test Report

English | [中文 (Chinese)](../zh-CN/TEST_REPORT.md)

## Test Overview

- **Package Version**: @dreamer/video@1.0.0
- **Test Library Version**: @dreamer/test@^1.0.9
- **Test Framework**: @dreamer/test (compatible with Deno and Bun)
- **Test Date**: 2026-02-19
- **Test Environment**:
  - Deno 2.6+
  - Bun (when running `bun test`)
  - FFmpeg required for video-operations tests (server-side and real file
    operations)

## Test Results

### Overall Statistics

- **Total Tests**: 27
- **Passed**: 27 ✅
- **Failed**: 0
- **Pass Rate**: 100% ✅
- **Execution Time**: ~1m32s (Deno environment, depends on FFmpeg and disk I/O)

### Test File Statistics

| Test File                  | Tests | Status      | Description                                                                                                                     |
| -------------------------- | ----- | ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `client.test.ts`           | 2     | ✅ All pass | Video client: getVideoInfo from File, VideoInfo structure                                                                       |
| `mod.test.ts`              | 9     | ✅ All pass | Server API: createVideoProcessor, getVideoInfo, option validation for convert/compress/crop/merge/addWatermark/extractThumbnail |
| `video-operations.test.ts` | 13    | ✅ All pass | Real operations with FFmpeg: getVideoInfo, convert (WebM/AVI/AV1), compress, crop, extractThumbnail, addWatermark, merge        |
| @dreamer/test cleanup      | 3     | ✅ All pass | Browser/resource cleanup (one per test file run)                                                                                |

## Functional Test Details

### 1. Video Client (client.test.ts) - 2 tests

| Test Scenario                                                                                    | Status |
| ------------------------------------------------------------------------------------------------ | ------ |
| ✅ getVideoInfo from File object                                                                 | Pass   |
| ✅ Validate VideoInfo interface structure (duration, width, height, fps, size, format, mimeType) | Pass   |

**Implementation Highlights**:

- Client module and VideoInfo type are covered.
- File-based getVideoInfo interface is validated (environment may limit full
  DOM/File behavior).

### 2. Video Server API (mod.test.ts) - 9 tests

| Test Scenario                                                            | Status |
| ------------------------------------------------------------------------ | ------ |
| ✅ createVideoProcessor throws when FFmpeg path is invalid (nonexistent) | Pass   |
| ✅ getVideoInfo throws when file does not exist                          | Pass   |
| ✅ convert option parameters validation                                  | Pass   |
| ✅ compress option parameters validation                                 | Pass   |
| ✅ crop option parameters validation                                     | Pass   |
| ✅ merge option parameters validation                                    | Pass   |
| ✅ addWatermark text options validation                                  | Pass   |
| ✅ addWatermark image options validation                                 | Pass   |
| ✅ extractThumbnail option parameters validation                         | Pass   |

**Implementation Highlights**:

- Server entry: createVideoProcessor, getVideoInfo.
- All operation options (convert, compress, crop, merge, addWatermark,
  extractThumbnail) are validated.
- Error behavior when FFmpeg is missing or file is missing is tested.

### 3. Video Operations (video-operations.test.ts) - 13 tests

| Test Scenario                        | Status |
| ------------------------------------ | ------ |
| ✅ Check FFmpeg availability         | Pass   |
| ✅ getVideoInfo from file path       | Pass   |
| ✅ getVideoInfo from Uint8Array      | Pass   |
| ✅ convert to WebM format            | Pass   |
| ✅ convert to AVI format             | Pass   |
| ✅ convert to AV1 (WebM) format      | Pass   |
| ✅ compress (medium quality)         | Pass   |
| ✅ compress (low quality)            | Pass   |
| ✅ crop video segment                | Pass   |
| ✅ extractThumbnail                  | Pass   |
| ✅ addWatermark (text)               | Pass   |
| ✅ merge multiple videos             | Pass   |
| ✅ Output files kept in tests/output | Pass   |

**Implementation Highlights**:

- Uses real video files under `tests/data` and writes to `tests/output`.
- Requires FFmpeg installed; tests skip or log warnings when FFmpeg is
  unavailable or when an operation fails (e.g. text watermark font on some
  systems).
- Covers getVideoInfo (file and Uint8Array), convert (WebM, AVI, AV1), compress
  (medium/low), crop, extractThumbnail, addWatermark, merge.

## Test Coverage Analysis

### API Coverage

| API / Area            | Coverage                                                                |
| --------------------- | ----------------------------------------------------------------------- |
| Client getVideoInfo   | ✅ From File, VideoInfo shape                                           |
| createVideoProcessor  | ✅ Invalid FFmpeg path error                                            |
| getVideoInfo (server) | ✅ File not found error; real file and Uint8Array in video-operations   |
| convert               | ✅ Option validation; real WebM/AVI/AV1 conversion                      |
| compress              | ✅ Option validation; real medium/low compression                       |
| crop                  | ✅ Option validation; real crop                                         |
| merge                 | ✅ Option validation; real merge                                        |
| addWatermark          | ✅ Text/image option validation; real text watermark (may warn on font) |
| extractThumbnail      | ✅ Option validation; real extraction                                   |

### Edge / Environment

| Scenario              | Status                                                        |
| --------------------- | ------------------------------------------------------------- |
| FFmpeg unavailable    | ✅ createVideoProcessor throws; video-operations skip or warn |
| File not found        | ✅ getVideoInfo throws                                        |
| Real file I/O         | ✅ video-operations with tests/data and tests/output          |
| Text watermark (font) | ✅ Test runs; may log warning on some systems                 |

## Required Services

| Test Suite               | Requirement                                   |
| ------------------------ | --------------------------------------------- |
| client.test.ts           | None (interface only)                         |
| mod.test.ts              | None (mocks / invalid paths)                  |
| video-operations.test.ts | FFmpeg installed; video files in `tests/data` |

## Strengths

1. ✅ **Client and server**: Client VideoInfo and server
   createVideoProcessor/getVideoInfo and all operation APIs are tested.
2. ✅ **Option validation**: All operation options are validated in mod.test.ts.
3. ✅ **Real operations**: video-operations.test.ts runs real FFmpeg-based
   conversions, compression, crop, thumbnail, watermark, merge when FFmpeg and
   test data are available.
4. ✅ **Error handling**: FFmpeg missing and file-not-found behavior are
   covered.
5. ✅ **100% pass rate**: 27 tests, 0 failed.

## Conclusion

@dreamer/video is tested with 27 tests passing (100% pass rate). Client
interface, server API, option validation, and real video operations
(getVideoInfo, convert, compress, crop, extractThumbnail, addWatermark, merge)
are covered. Tests depend on FFmpeg and test data for full video-operations
coverage; otherwise they skip or assert errors appropriately.

**Total tests**: 27 (24 from test files + 3 framework cleanup).
