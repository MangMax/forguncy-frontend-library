#!/usr/bin/env node
// 生成前端扩展包工作目录骨架：package.json / package-lock 占位说明 / build.mjs / src/entry.js / scripts / README。
// 骨架里的 ID、版本、全局名都是占位值，必须按目标类库改成真实分析结果后再构建。
// 用法: node scaffold_package.mjs --dir <package-workdir> --id vendor-library --global VendorLibrary --version 1.2.3 [--name "<显示名>"]
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
function argValue(name, fallback) {
  const index = argv.indexOf(name);
  return index >= 0 && argv[index + 1] ? argv[index + 1] : fallback;
}

const dir = path.resolve(argValue("--dir", ""));
if (!dir || dir === path.resolve(".")) {
  console.error("需要 --dir <package-workdir>");
  process.exit(2);
}
const id = argValue("--id", "");
const globalName = argValue("--global", "");
const version = argValue("--version", "");
const displayName = argValue("--name", id + " for ReactCellType");
for (const [label, value] of [["--id", id], ["--global", globalName], ["--version", version]]) {
  if (!value) {
    console.error("缺少必填参数 " + label);
    process.exit(2);
  }
}
if (!/^[A-Za-z][A-Za-z0-9._-]{0,63}$/.test(id) || id.endsWith(".")) {
  console.error("id 非法: " + id);
  process.exit(2);
}
if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(globalName)) {
  console.error("globalName 必须是单个合法标识符: " + globalName);
  process.exit(2);
}
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error("version 必须是 SemVer: " + version);
  process.exit(2);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.dirname(here);
const scaffoldDir = path.join(skillRoot, "assets", "package-template");

const placeholderMap = {
  "__LIBRARY_ID__": id,
  "__GLOBAL_NAME__": globalName,
  "__VERSION__": version,
  "__DISPLAY_NAME__": displayName,
  "<SKILL_ROOT>": skillRoot
};

function render(text) {
  return Object.entries(placeholderMap).reduce(
    (accumulated, [token, value]) => accumulated.split(token).join(value),
    text
  );
}

const files = [
  ["package.json", "package.json"],
  ["build.mjs", "build.mjs"],
  ["src/entry.js", path.join("src", "entry.js")],
  ["validate.mjs", "validate.mjs"],
  ["pack.mjs", "pack.mjs"],
  ["smoke.mjs", "smoke.mjs"],
  ["README.md", "README.md"]
];

const written = [];
for (const [templateName, relative] of files) {
  const template = await readFile(path.join(scaffoldDir, templateName), "utf8");
  const target = path.join(dir, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, render(template), "utf8");
  written.push(relative);
}

console.log(JSON.stringify({
  ok: true,
  workdir: dir,
  written,
  next: [
    "按类库真实分析结果改写 src/entry.js 与 build.mjs 里的 manifest 配置",
    "node build.mjs && node validate.mjs && node smoke.mjs && node pack.mjs"
  ]
}, null, 2));
