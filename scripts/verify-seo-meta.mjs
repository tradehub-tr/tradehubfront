#!/usr/bin/env node
/**
 * verify-seo-meta.mjs — FE-3 dist doğrulaması (preload'lu FINAL dist üzerinde koşulur).
 *
 * Kullanım: npm run build && node scripts/verify-seo-meta.mjs
 *
 * Assert'ler:
 *  1. NOINDEX listesindeki her dist HTML'de robots=noindex var (404: noindex,follow)
 *  2. İndexlenecek sayfalarda robots=noindex YOK; prettyPath'li olanlarda canonical VAR
 *  3. Her HTML'de tam 1 <title> ve lang="tr" (font-preload satırları yanlış pozitif sayılmaz —
 *     yalnız <title>/<link rel="canonical"> etiketleri sayılır)
 *  4. Hiçbir dist HTML'de "TradeHub" markası kalmadı
 *  5. dist'te docs/, mockups/, style-test.html yok
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const DIST = join(ROOT, "dist");

// staticMeta.ts'i TS olarak import edemeyiz (node) — regex ile parse ediyoruz.
const staticMetaSrc = readFileSync(join(ROOT, "src/seo/staticMeta.ts"), "utf8");
const noindexFiles = [...staticMetaSrc.matchAll(/^\s+"([^"]+\.html)",$/gm)].map((m) => m[1]);
const indexableEntries = [...staticMetaSrc.matchAll(/"([^"]+\.html)":\s*\{\s*prettyPath:\s*("([^"]*)"|null)/g)]
	.map((m) => ({ file: m[1], prettyPath: m[3] ?? null }));

let pass = 0, fail = 0;
const ok = (msg) => { pass++; };
const bad = (msg) => { fail++; console.error(`  FAIL ${msg}`); };

function walk(dir) {
	return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
		const p = join(dir, e.name);
		return e.isDirectory() ? walk(p) : [p];
	});
}

if (!existsSync(DIST)) {
	console.error("dist/ yok — önce npm run build");
	process.exit(1);
}

const htmlFiles = walk(DIST).filter((f) => f.endsWith(".html"));

// 1-2. robots / canonical
for (const file of noindexFiles) {
	const p = join(DIST, file);
	if (!existsSync(p)) { bad(`${file} dist'te yok`); continue; }
	const html = readFileSync(p, "utf8");
	const expected = file === "404.html" ? "noindex, follow" : "noindex, nofollow";
	html.includes(`<meta name="robots" content="${expected}"`)
		? ok(file) : bad(`${file} → robots "${expected}" yok`);
}
for (const { file, prettyPath } of indexableEntries) {
	const p = join(DIST, file);
	if (!existsSync(p)) { bad(`${file} dist'te yok`); continue; }
	const html = readFileSync(p, "utf8");
	if (/name="robots"\s+content="noindex/i.test(html)) bad(`${file} → indexlenecek sayfada noindex!`);
	else ok(file);
	if (prettyPath) {
		html.includes('rel="canonical"') ? ok(file) : bad(`${file} → canonical yok (prettyPath=${prettyPath})`);
	} else if (html.includes('rel="canonical"')) {
		bad(`${file} → dinamik şablonda STATİK canonical olmamalı`);
	}
}

// 3. tek title + lang=tr
for (const f of htmlFiles) {
	const rel = relative(DIST, f);
	const html = readFileSync(f, "utf8");
	const titles = (html.match(/<title[^>]*>/gi) || []).length;
	titles === 1 ? ok(rel) : bad(`${rel} → ${titles} adet <title>`);
	/<html[^>]*lang="tr"/i.test(html) ? ok(rel) : bad(`${rel} → lang="tr" değil`);
}

// 4. TradeHub kalıntısı
for (const f of htmlFiles) {
	const rel = relative(DIST, f);
	if (readFileSync(f, "utf8").includes("TradeHub")) bad(`${rel} → "TradeHub" kalıntısı`);
}

// 5. dist hijyeni
for (const orphan of ["docs", "mockups", "style-test.html", "perf-reports"]) {
	existsSync(join(DIST, orphan)) ? bad(`dist/${orphan} build'e sızmış`) : ok(orphan);
}

console.log(`\nverify-seo-meta: ${pass} PASS / ${fail} FAIL  (noindex=${noindexFiles.length}, indexable=${indexableEntries.length})`);
process.exit(fail === 0 ? 0 : 1);
