#!/usr/bin/env node
/**
 * Derleme bütçesi — MOGEM-638 §8 "Ölçüm hattı": `vite build` sonrası dist'i
 * ölçer ve eşiği aşan değerde 1 ile çıkar. CI'da `npm run build && npm run
 * test:perf:dist`. Eşikler 2026-09-12 ölçümünden (öncesi → sonrası):
 *   SW ön-belleği 7,95 → 4,66 MB · ana sayfa modulepreload 44 → 33 / 1.006 → 736 KB
 *   sepet/ürün parçası ana sayfa preload'ında 9 → 0
 * Bütçe "bugünkü değer + küçük pay"dır; iyileşince eşiği de indir.
 */
import { readFileSync, statSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const dist = process.argv[2] || "dist";
const BUDGET = {
  precacheMB: 4.8,
  precacheLocaleChunks: 0,
  precacheHeavyVendors: 0,
  pages: {
    "index.html": { preload: 36, preloadKB: 800, cartChunks: 0 },
    "pages/products.html": { preload: 38, preloadKB: 720, cartChunks: 0 },
    "pages/top-deals.html": { preload: 36, preloadKB: 720, cartChunks: 0 },
  },
};
const CART_RE = /Cart|OptionsSheet|product-|ListingCartDrawer|WriteReviewModal|Dropzone|uploader/i;
let fail = 0;
const kontrol = (ad, deger, esik, birim = "") => {
  const ok = deger <= esik;
  if (!ok) fail++;
  console.log(`${ok ? "✓" : "✗"} ${ad}: ${deger}${birim} (eşik ${esik}${birim})`);
};

const sw = readFileSync(join(dist, "sw.js"), "utf8");
const urls = [...sw.matchAll(/url:"([^"]+)"/g)].map((m) => m[1]);
let bytes = 0;
for (const u of urls) {
  try {
    bytes += statSync(join(dist, u.replace(/^\.?\//, "").split("?")[0])).size;
  } catch {
    /* manifest dışı */
  }
}
kontrol("SW ön-belleği", Number((bytes / 1048576).toFixed(2)), BUDGET.precacheMB, " MB");
kontrol(
  "SW ön-belleğinde dil chunk'ı",
  urls.filter((u) => /assets\/(ar|en|ru|tr)-[A-Za-z0-9_-]{8}\.js$/.test(u)).length,
  BUDGET.precacheLocaleChunks
);
kontrol(
  "SW ön-belleğinde ağır vendor",
  urls.filter((u) => /vendor-(hls|echarts|mediabunny)-/.test(u)).length,
  BUDGET.precacheHeavyVendors
);

for (const [html, b] of Object.entries(BUDGET.pages)) {
  const p = join(dist, html);
  if (!existsSync(p)) {
    console.log(`✗ ${html} yok`);
    fail++;
    continue;
  }
  const src = readFileSync(p, "utf8");
  const pre = [...src.matchAll(/rel="modulepreload"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
  let pb = 0;
  for (const u of pre) {
    try {
      pb += statSync(join(dist, u.replace(/^\//, ""))).size;
    } catch {
      /* yok */
    }
  }
  kontrol(`${html} modulepreload sayısı`, pre.length, b.preload);
  kontrol(`${html} modulepreload boyutu`, Math.round(pb / 1024), b.preloadKB, " KB");
  const cart = pre.filter((u) => CART_RE.test(basename(u)));
  kontrol(`${html} preload'ında sepet/ürün parçası`, cart.length, b.cartChunks);
  if (cart.length) console.log("   ", cart.map((u) => basename(u)).join(", "));
}
if (fail) {
  console.error(`\n${fail} bütçe aşımı`);
  process.exit(1);
}
console.log("\nBütçe içinde.");
