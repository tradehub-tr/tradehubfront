#!/usr/bin/env node
/**
 * Derleme çıktısında sahte (mock) veri izi var mı? — MOGEM-685 F-03.
 *
 * KURAL (29 Eyl 2026, ürün kararı): Alpha, Beta ve RC'de sahte veri OLABİLİR, PROD'da HİÇ
 * olmamalı. PROD sunucudaki ayrı Dockerfile ile `VITE_LOGISTICS_MOCK` verilmeden derleniyor
 * (Jenkins rc-to-prod #47'de ölçüldü); bu betik aynı varsayılan derlemeyi tarar. İz bulunursa çıkış 1.
 *
 * ÖLÇÜLDÜ (29 Eyl): anahtardan önce PROD'un kendi dosyalarında `dedupe_key` ve sahte
 * `YK-…` takip numaraları vardı (shipmentService-*.js). Kural yazılıydı, denetleyen yoktu.
 *
 *   node scripts/check-no-mock-in-build.mjs [dist]
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const kok = process.argv[2] ?? "dist";

/** Sahte veriye özgü içerik izleri — gerçek kodda geçmeyen, mock JSON'unun alanları/değerleri. */
const ICERIK_IZLERI = [
  { ad: "sevkiyat mock alanı dedupe_key", re: /dedupe_key/ },
  { ad: "sahte kargo takip numarası (YK-…)", re: /"YK-[0-9A-Z]{6,}/ },
  { ad: "sahte kargo takip numarası (AK-…)", re: /"AK-[0-9]{5,}/ },
];
/** Mock/tohum modüllerinden üretilen parça adları (Vite: <modül>-<özet>.js). */
const PARCA_IZI = /(?:^|\/)[A-Za-z]*(?:Mock|Seed|mock|seed)[A-Za-z]*-[\w-]{8}\.js$/;

function* dosyalar(dizin) {
  for (const ad of readdirSync(dizin)) {
    const yol = join(dizin, ad);
    if (statSync(yol).isDirectory()) yield* dosyalar(yol);
    else if (/\.(js|html|json)$/.test(ad)) yield yol;
  }
}

const bulgular = [];
let taranan = 0;
for (const yol of dosyalar(kok)) {
  taranan++;
  const goreli = relative(kok, yol);
  if (PARCA_IZI.test(goreli)) bulgular.push(`${goreli} — mock/tohum parçası`);
  const icerik = readFileSync(yol, "utf8");
  for (const { ad, re } of ICERIK_IZLERI) if (re.test(icerik)) bulgular.push(`${goreli} — ${ad}`);
}

if (taranan === 0) {
  console.error(`✗ ${kok} içinde taranacak dosya yok — derleme alınmamış olabilir.`);
  process.exit(2);
}
if (bulgular.length) {
  console.error(
    `✗ Derleme çıktısında sahte veri izi (${bulgular.length}) — ${taranan} dosya tarandı:`
  );
  for (const b of bulgular) console.error(`  - ${b}`);
  console.error(
    "PROD derlemesinde sahte veri olmamalı. Mock dalını `__LOJISTIK_MOCK__ && isMockMode()` kapısının arkasına alın (bkz. src/services/logisticsMock.ts başlığı)."
  );
  process.exit(1);
}
console.log(`✓ Sahte veri izi yok — ${taranan} dosya tarandı.`);
