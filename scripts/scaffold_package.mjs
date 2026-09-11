#!/usr/bin/env node
// 生成前端扩展包工作目录骨架：package.json / pnpm-workspace.yaml / build.mjs / src/entry.js / 校验打包脚本 / README。
// 不生成 lockfile：首次 pnpm install 时才生成 pnpm-lock.yaml，之后提交它以保证可复现。
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

// <SKILL_ROOT> 只出现在模板里双引号包裹的 JS 字符串字面量中。
// Windows 路径的反斜杠必须先转义，否则 \W \P \f 会被当成转义序列，把路径吃成 C:WorkFileProject...
const skillRootLiteral = skillRoot.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

const placeholderMap = {
  "__LIBRARY_ID__": id,
  "__GLOBAL_NAME__": globalName,
  "__VERSION__": version,
  "__DISPLAY_NAME__": displayName,
  "<SKILL_ROOT>": skillRootLiteral
};

function render(text) {
  return Object.entries(placeholderMap).reduce(
    (accumulated, [token, value]) => accumulated.split(token).join(value),
    text
  );
}

const files = [
  ["package.json", "package.json"],
  ["pnpm-workspace.yaml", "pnpm-workspace.yaml"],
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
    "在 package.json 里把 __LIBRARY_ID__ / __VERSION__ 依赖项改成目标类库的真实名称与固定版本",
    "pnpm install（首次会生成 pnpm-lock.yaml，请提交它）",
    "pnpm run build && pnpm run validate && pnpm run smoke && pnpm run pack"
  ]
}, null, 2));
