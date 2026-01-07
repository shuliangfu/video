import { getVideoInfo } from "../src/mod.ts";

const info = await getVideoInfo("tests/data/风景.mp4");
console.log(JSON.stringify(info, null, 2));
