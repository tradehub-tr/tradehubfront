#!/usr/bin/env node
/**
 * Cross-file duplicate export bekçisi.
 *
 * ESLint dosya-bazlıdır; aynı ismin FARKLI dosyalarda export edilmesini yakalayamaz.
 * Bu script tüm src/**\/*.ts export'larını tarar, aynı isim >1 dosyada ise UYARIR.
 *
 * Amaç bir "kopya sanıp birleştirme" tuzağını önlemek DEĞİL — çakışmayı GÖRÜNÜR kılmak:
 * geliştirici (ve Claude) her yeni çakışmada "gerçekten aynı kod mu (→ ortaklaştır) yoksa
 * farklı kavram mı (→ ayrı isim ver: NavCategoryItem / FilterCategoryItem)" diye düşünsün.
 *
 * Kullanım:
 *   node scripts/check-duplicate-exports.mjs           # yeni çakışma varsa exit 1 (CI)
 *   node scripts/check-duplicate-exports.mjs --update  # mevcut çakışmaları allowlist'e yaz (baseline)
 *
 * Baseline (allowlist) mevcut bilinen çakışmaları içerir; yalnızca YENİ eklenen çakışma
 * CI'yı kırar. F4/F5 temizliği ilerledikçe `--update` ile allowlist küçülür.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "src");
const ALLOWLIST = join(__dirname, "duplicate-exports-allowlist.json");

// export interface|type|function|const|class|enum X
const EXPORT_RE =
  /^export\s+(?:default\s+)?(?:async\s+)?(?:abstract\s+)?(interface|type|function|const|class|enum)\s+([A-Za-z0-9_]+)/gm;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (entry.endsWith(".ts") && !entry.endsWith(".d.ts")) out.push(full);
  }
  return out;
}

const nameToFiles = new Map();
for (const file of walk(SRC)) {
  const code = readFileSync(file, "utf8");
  const rel = relative(ROOT, file).replaceAll("\\", "/");
  EXPORT_RE.lastIndex = 0;
  let m;
  while ((m = EXPORT_RE.exec(code))) {
    const name = m[2];
    if (!nameToFiles.has(name)) nameToFiles.set(name, new Set());
    nameToFiles.get(name).add(rel);
  }
}

const collisions = {};
for (const [name, files] of nameToFiles) {
  if (files.size > 1) collisions[name] = [...files].sort();
}

if (process.argv.includes("--update")) {
  writeFileSync(ALLOWLIST, JSON.stringify(collisions, null, 2) + "\n");
  console.log(`✓ Allowlist güncellendi: ${Object.keys(collisions).length} bilinen çakışma kaydedildi.`);
  process.exit(0);
}

let allowlist = {};
try {
  allowlist = JSON.parse(readFileSync(ALLOWLIST, "utf8"));
} catch {
  console.error("⚠ Allowlist yok — önce: npm run check:dup:update");
  process.exit(1);
}

const offenders = [];
for (const [name, files] of Object.entries(collisions)) {
  const known = new Set(allowlist[name] || []);
  const added = files.filter((f) => !known.has(f));
  if (!allowlist[name]) offenders.push({ name, files, reason: "yeni çakışan isim" });
  else if (added.length) offenders.push({ name, files, reason: `yeni dosya: ${added.join(", ")}` });
}

if (offenders.length) {
  console.error("❌ YENİ isim çakışması (aynı isim birden çok dosyada export ediliyor):\n");
  for (const o of offenders) {
    console.error(`  • ${o.name}  [${o.reason}]`);
    for (const f of o.files) console.error(`      ${f}`);
  }
  console.error(
    "\nNe yapmalı:\n" +
      "  1) Gerçekten AYNI kod mu? → ortak bir dosyaya taşıyıp import et (kopya kaldır).\n" +
      "  2) FARKLI kavram mı (aynı isim tesadüf)? → ayrı isim ver (ör. NavCategoryItem / FilterCategoryItem).\n" +
      "  3) Kaçınılmaz/kasıtlıysa: npm run check:dup:update ile allowlist'e ekle.\n"
  );
  process.exit(1);
}

console.log(`✓ Yeni isim çakışması yok (${Object.keys(collisions).length} bilinen çakışma allowlist'te).`);
