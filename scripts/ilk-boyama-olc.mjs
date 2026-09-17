/**
 * İLK BOYAMA ÖLÇERİ — dil/yön/başlık ne zaman doğruya dönüyor?
 *
 * NE ÖLÇER: `<html lang>`, `<html dir>` ve sekme başlığının hangi ms'te
 * değiştiğini, ve `first-paint` / `first-contentful-paint` anında ne
 * olduklarını. "Titreme" = ilk boyamadan SONRA değeri değişen bir yazım.
 *
 * NEDEN VAR: MOGEM-642 Faz 2'de (17 Eyl 2026) "ilk boyama her ziyaretçide
 * Türkçe" iddiası bu araçla ölçüldü ve KISMEN ÇÜRÜDÜ. Storefront'un 71
 * sayfasının gövdesi `<div id="app">` kabuğu olduğu için içerik zaten JS'ten
 * sonra boyanıyor; görünen metin titremesi hiç oluşmuyor. Ölçüm asıl kusuru
 * gösterdi: sekme başlığı 447 ms'te Türkçe yazılıyor ve 12.307 ms'e kadar öyle
 * kalıyordu (dist + nginx, 400 kbps / 4x CPU, `/?hl=ar`). Düzeltmeden sonra
 * aynı koşulda 471,8 ms.
 *
 * ⚠ AĞ KISITI OLMADAN ÖLÇMEYİN. Kısıtsız lokalde JS o kadar hızlı geliyor ki
 * ilk boyama zaten karardan sonra düşüyor ve araç "titreme yok" der — düzeltme
 * geri alınsa bile. Gerçek pencereyi görmek için `YAVAS=1` şart.
 *
 * KULLANIM:
 *   node scripts/ilk-boyama-olc.mjs <url> [etiket]
 *   YAVAS=1 node scripts/ilk-boyama-olc.mjs "http://localhost/?hl=ar" "ar turu"
 *
 * Üretim derlemesine karşı koşun (dev sunucusu gerçek koşulu temsil etmez):
 *   npm run build && <dist'i sunan ortamın adresi>
 */
import { chromium } from "playwright";

const url = process.argv[2];
const etiket = process.argv[3] || url;

const tarayici = await chromium.launch();
const baglam = await tarayici.newContext();

await baglam.addInitScript(() => {
  window.__olcum = {
    degisimler: [],
    baslikDegisimleri: [],
    ilkBoyamaBaslik: null,
    ilkBaslik: null,
    fcp: null,
    fp: null,
    ilkBoyamaLang: null,
    ilkBoyamaDir: null,
    ilkBoyamadaLang: null,
    ilkBoyamadaDir: null,
  };
  try {
    new MutationObserver((kayitlar) => {
      for (const k of kayitlar) {
        if (k.target !== document.documentElement) continue;
        window.__olcum.degisimler.push({
          nitelik: k.attributeName,
          eski: k.oldValue,
          yeni: document.documentElement.getAttribute(k.attributeName),
          t: Math.round(performance.now() * 10) / 10,
        });
      }
    }).observe(document, {
      attributes: true,
      subtree: true,
      attributeOldValue: true,
      attributeFilter: ["lang", "dir"],
    });
  } catch (e) {
    window.__olcum.gozlemciHatasi = String(e);
  }
  // <title> AYRI izlenir: sekme başlığı HTML ayrıştırılır ayrıştırılmaz
  // görünür — ziyaretçinin gördüğü ilk dil parçası odur.
  try {
    new MutationObserver(() => {
      window.__olcum.baslikDegisimleri.push({
        deger: document.title,
        t: Math.round(performance.now() * 10) / 10,
      });
    }).observe(document, { subtree: true, childList: true, characterData: true });
  } catch (e) {
    window.__olcum.baslikHatasi = String(e);
  }
  try {
    new PerformanceObserver((liste) => {
      for (const e of liste.getEntries()) {
        if (e.name === "first-paint" && window.__olcum.fp === null) {
          window.__olcum.fp = Math.round(e.startTime * 10) / 10;
          window.__olcum.ilkBoyamaLang = document.documentElement.lang;
          window.__olcum.ilkBoyamaDir = document.documentElement.dir || "(boş)";
          window.__olcum.ilkBoyamaBaslik = document.title;
        }
        if (e.name !== "first-contentful-paint" || window.__olcum.fcp !== null) continue;
        window.__olcum.fcp = Math.round(e.startTime * 10) / 10;
        window.__olcum.ilkBoyamadaLang = document.documentElement.lang;
        window.__olcum.ilkBoyamadaDir = document.documentElement.dir || "(boş)";
      }
    }).observe({ type: "paint", buffered: true });
  } catch (e) {
    window.__olcum.paintHatasi = String(e);
  }
});

const sayfa = await baglam.newPage();
// Yavaş ağ + yavaş CPU: gerçek ziyaretçi koşulu. Titreme penceresi ancak
// JS geç geldiğinde görünür hâle gelir; hızlı lokalde ölçüm yanıltıcıdır.
if (process.env.YAVAS === "1") {
  const cdp = await baglam.newCDPSession(sayfa);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 400,
    downloadThroughput: (400 * 1024) / 8,
    uploadThroughput: (400 * 1024) / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
}
await sayfa.goto(url, { waitUntil: "networkidle" });
await sayfa.waitForTimeout(2500);

const olcum = await sayfa.evaluate(() => ({
  ...window.__olcum,
  sonLang: document.documentElement.lang,
  sonDir: document.documentElement.dir || "(boş)",
  sonBaslik: document.title,
}));

// Yalnız GERÇEK değişim sayılır: modül zinciri aynı değeri yeniden yazınca
// (ar → ar) ziyaretçi hiçbir şey görmez; bunu titreme saymak yanlış olurdu.
const gercek = olcum.degisimler.filter((d) => d.eski !== d.yeni);
const fcpSonrasi = gercek.filter((d) => olcum.fcp !== null && d.t > olcum.fcp);

console.log(`\n═══ ${etiket}`);
console.log(`first-paint: ${olcum.fp} ms (lang=${olcum.ilkBoyamaLang} dir=${olcum.ilkBoyamaDir})`);
console.log(`FCP: ${olcum.fcp} ms`);
console.log(`İlk boyamada  : lang=${olcum.ilkBoyamadaLang} dir=${olcum.ilkBoyamadaDir}`);
console.log(`Son durum     : lang=${olcum.sonLang} dir=${olcum.sonDir}`);
console.log(`İlk boyamada başlık: ${JSON.stringify(olcum.ilkBoyamaBaslik)}`);
console.log(`Son başlık          : ${JSON.stringify(olcum.sonBaslik)}`);
const bd = olcum.baslikDegisimleri.filter((d, i, a) => i === 0 || a[i - 1].deger !== d.deger);
for (const d of bd)
  console.log(`  ${String(d.t).padStart(8)} ms  başlık → ${JSON.stringify(d.deger)}`);
console.log(`Nitelik değişimleri (${olcum.degisimler.length}):`);
for (const d of olcum.degisimler) {
  const isaret =
    d.eski === d.yeni
      ? "  (etkisiz tekrar)"
      : olcum.fcp !== null && d.t > olcum.fcp
        ? "  ⚠ FCP SONRASI"
        : "";
  console.log(`  ${String(d.t).padStart(8)} ms  ${d.nitelik}: ${d.eski} → ${d.yeni}${isaret}`);
}
console.log(
  fcpSonrasi.length === 0 &&
    olcum.ilkBoyamadaLang === olcum.sonLang &&
    olcum.ilkBoyamadaDir === olcum.sonDir
    ? "SONUÇ: TİTREME YOK"
    : `SONUÇ: TİTREME VAR (FCP sonrası ${fcpSonrasi.length} değişim)`
);

await tarayici.close();
