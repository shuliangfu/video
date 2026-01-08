// 测试 FFmpeg 检测
import { createCommand } from "@dreamer/runtime-adapter";

const cmd = createCommand("ffmpeg", {
  args: ["-version"],
  stdout: "piped",
  stderr: "piped",
});
const { success, stderr } = await cmd.output();
console.log("FFmpeg 检测结果:", success);
if (!success) {
  const error = new TextDecoder().decode(stderr);
  console.log("错误信息:", error);
}
