import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const IGNORE_DIRS = new Set(["node_modules",".git","dist","build",".next","out","coverage","uploads","public","attached_assets"]);
const EXTS = new Set([".js",".mjs",".cjs",".ts",".tsx",".jsx"]);
const ALIAS_PREFIXES = ["@shared","@/","#/","~@","$lib"]; // add more if you use them
const NODE_BUILTINS = new Set(["assert","buffer","child_process","cluster","console","constants","crypto","dgram","dns","domain","events","fs","http","http2","https","module","net","os","path","perf_hooks","process","punycode","querystring","readline","repl","stream","string_decoder","timers","tls","tty","url","util","v8","vm","worker_threads","zlib"]);

function isAlias(spec) {
  return ALIAS_PREFIXES.some(p => spec === p || spec.startsWith(p + "/"));
}
function isBuiltin(spec) {
  return NODE_BUILTINS.has(spec) || spec.startsWith("node:") || spec.startsWith("data:");
}
function toPkg(spec) {
  if (!spec) return null;
  if (spec.startsWith(".") || spec.startsWith("/")) return null;
  if (isAlias(spec) || isBuiltin(spec)) return null;
  // lodash/get -> lodash ; @scope/pkg/sub -> @scope/pkg
  if (spec.startsWith("@")) {
    const parts = spec.split("/");
    return parts.length >= 2 ? parts.slice(0,2).join("/") : null;
  }
  return spec.split("/")[0];
}

function walk(dir, acc=[]) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (EXTS.has(path.extname(ent.name))) acc.push(p);
  }
  return acc;
}

function extractSpecs(txt) {
  const out = new Set();
  const regs = [
    /import\s+[^'"]*from\s+['"]([^'"]+)['"]/g,   // import x from 'spec'
    /export\s+[^'"]*from\s+['"]([^'"]+)['"]/g,   // export * from 'spec'
    /require\(\s*['"]([^'"]+)['"]\s*\)/g,        // require('spec')
    /import\(\s*['"]([^'"]+)['"]\s*\)/g,         // import('spec')
    /import\s+['"]([^'"]+)['"]/g                 // side-effect import 'spec'
  ];
  for (const re of regs) {
    let m;
    while ((m = re.exec(txt))) out.add(m[1]);
  }
  return out;
}

// gather wanted packages from all source files
const files = walk(ROOT);
const wanted = new Set();
for (const f of files) {
  try {
    const txt = fs.readFileSync(f, "utf8");
    for (const spec of extractSpecs(txt)) {
      const pkg = toPkg(spec);
      if (pkg) wanted.add(pkg);
    }
  } catch {}
}

// read current deps
let pkgJson = {};
try {
  pkgJson = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
} catch {}
const have = new Set([
  ...Object.keys(pkgJson.dependencies || {}),
  ...Object.keys(pkgJson.devDependencies || {})
]);

const missing = [...wanted].filter(p => !have.has(p));
if (missing.length === 0) {
  console.log("✅ No missing packages detected.");
  process.exit(0);
}

console.log("📦 Missing:", missing.join(", "));

// install missing app deps
try {
  execSync(`npm i ${missing.join(" ")}`, { stdio: "inherit" });
} catch (e) {
  console.error("npm i failed for app deps:", e?.message || e);
}

// try @types for unscoped packages only, and only if they exist
const typeCandidates = [];
for (const name of missing) {
  if (name.startsWith("@")) continue; // scoped packages usually ship types
  try {
    const v = execSync(`npm view @types/${name} version`, { stdio: "pipe" }).toString().trim();
    if (v) typeCandidates.push(`@types/${name}`);
  } catch {}
}
if (typeCandidates.length) {
  console.log("📚 Installing types:", typeCandidates.join(", "));
  try {
    execSync(`npm i -D ${typeCandidates.join(" ")}`, { stdio: "inherit" });
  } catch (e) {
    console.error("npm i failed for types:", e?.message || e);
  }
}

console.log("✅ Done. Re-run dev servers.");
