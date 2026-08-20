/**
 * Lojistik ekranları — KONTRAST TARAMA ARACI (test değil, rapor aracı).
 *
 * ÇALIŞTIRMA (tradehubfront/ içinden):
 *   PANEL_PASS='<parola>' node tests/e2e/kontrast-tarama.mjs
 *   PANEL_PASS='…' node tests/e2e/kontrast-tarama.mjs --json rapor.json
 *
 * NEDEN AYRI DOSYA — ve neden `panel-lojistik-kontrast.spec.ts` yetmiyor:
 *   Spec bir KAPI: kırılır, CI'ı durdurur, kapsamı dar tutulur. Bu araç bir
 *   RÖNTGEN: 29 yüzeyi tarar, kırılmaz, ihlalleri sahibine göre gruplayıp
 *   rapor üretir. İkisi aynı dosyada olsaydı biri diğerini bozardı.
 *
 * ÖLÇÜM KODU BURADA DEĞİL:
 *   `kontrast-olcum.mjs`'ten import ediliyor — spec ile BİREBİR aynı fonksiyon.
 *   İlk sürüm bu bloğu spec dosyasından metin olarak ayıklıyordu; o yolda
 *   regex kaçışları iki tarafta farklı çözülüyordu (ayrıntı o dosyanın
 *   başında). Aynı fonksiyonu import etmek tek kaynağı gerçekten tek yapıyor.
 *
 * BİR KEZ KAYBOLDU:
 *   Bu aracın ilk sürümü `scratchpad/` altındaydı ve makine kapanınca silindi;
 *   A3 maddesi bu yüzden "raporu yenile"den "aracı yeniden yaz"a döndü.
 *   Repoda duruyor olmasının sebebi bu.
 */
import { chromium, request } from "@playwright/test";
import fs from "node:fs";
import { EKRANLAR, SEKMELER, SHP_CANLI, MOD_YUZEYLERI } from "./kontrast-yuzeyler.mjs";
import { olcumYap } from "./kontrast-olcum.mjs";

const BASE = process.env.PANEL_BASE ?? "http://tradehub.localhost";
const USER = process.env.PANEL_USER ?? "Administrator";
const PASS = process.env.PANEL_PASS ?? "";


async function hazirOl(page, url) {
  await page.goto(BASE + url, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.locator("main h1").first().waitFor({ state:"visible", timeout:15000 }).catch(() => {});
  await page.locator('main [aria-busy="true"]').first().waitFor({ state:"detached", timeout:12000 }).catch(() => {});
  // Rehberli tur overlay'i içeriği karartıp ölçümü zehirliyor. Tur, sayfa
  // oturduktan SONRA açılıyor — bu yüzden önce bekle, sonra kapat.
  await page.waitForTimeout(800);
  for (let i = 0; i < 6; i++) {
    const atla = page.getByText(/Turu atla/).first();
    if (!(await atla.isVisible().catch(() => false))) break;
    await atla.click().catch(() => page.keyboard.press("Escape"));
    await page.waitForTimeout(300);
  }
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
}

const jsonYolu = process.argv.includes("--json")
  ? process.argv[process.argv.indexOf("--json") + 1] : null;

if (!PASS) { console.error("PANEL_PASS gerekli."); process.exit(2); }

const api = await request.newContext({ baseURL: BASE });
const giris = await api.post("/api/method/login", { form:{ usr:USER, pwd:PASS } });
if (!giris.ok()) { console.error("Frappe login başarısız:", giris.status()); process.exit(2); }
const { cookies } = await api.storageState();

const browser = await chromium.launch();
const sonuc = [];

for (const tema of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport:{ width:1600, height:1000 } });
  await ctx.addCookies(cookies);
  await ctx.addInitScript((t) => {
    localStorage.setItem("th-lang", "tr");
    localStorage.setItem("th-theme", t);
  }, tema);
  const page = await ctx.newPage();

  for (const e of EKRANLAR) {
    try {
      await hazirOl(page, e.url);
      const { bulgular, taranan } = await page.evaluate(olcumYap);
      sonuc.push({ ...e, tip:"ekran", tema, taranan, bulgular });
      const im = taranan <= 15 ? " ⚠ EKRAN YÜKLENMEMİŞ OLABİLİR" : "";
      console.log(`${tema} · ${e.key} ${e.ad}: ${bulgular.length} ihlal / ${taranan} öğe${im}`);
    } catch (err) {
      sonuc.push({ ...e, tip:"ekran", tema, hata:String(err).slice(0,160) });
      console.log(`${tema} · ${e.key} ${e.ad}: HATA — ${String(err).slice(0,90)}`);
    }
  }

  // GÖRÜNÜM MODLARI: aynı ekran, farklı render dalı. Mod localStorage'a
  // yazılıp ekran yeniden açılıyor — toggle'a tıklamak yerine bu yol, dalın
  // ilk yüklemede de doğru çizildiğini sınıyor.
  for (const y of MOD_YUZEYLERI) {
    for (const mod of y.modlar) {
      try {
        await page.addInitScript(({ a, m }) => localStorage.setItem(`lv-mode:${a}`, m),
                                 { a: y.anahtar, m: mod });
        await hazirOl(page, y.url);
        const { bulgular, taranan } = await page.evaluate(olcumYap);
        sonuc.push({ ...y, tip:`mod:${mod}`, tema, taranan, bulgular });
        console.log(`${tema} · ${y.key} [${mod}] ${y.ad}: ${bulgular.length} ihlal / ${taranan} öğe`);
      } catch (err) {
        sonuc.push({ ...y, tip:`mod:${mod}`, tema, hata:String(err).slice(0,160) });
        console.log(`${tema} · ${y.key} [${mod}] ${y.ad}: HATA`);
      }
    }
  }

  // Sekmeler: detay ekranını bir kez aç, sekme sekme gez.
  await hazirOl(page, `/panel/lojistik/sevkiyatlar/${SHP_CANLI}`);
  const dugmeler = page.locator('[role="tab"]');
  const adet = await dugmeler.count();
  for (let i = 0; i < adet; i++) {
    const meta = SEKMELER[i] ?? { key:`?${i}`, ad:`sekme ${i}`, sahip:"?" };
    try {
      await dugmeler.nth(i).click();
      await page.waitForTimeout(700);
      const { bulgular, taranan } = await page.evaluate(olcumYap);
      sonuc.push({ ...meta, tip:"sekme", tema, taranan, bulgular });
      console.log(`${tema} · ${meta.key} [sekme] ${meta.ad}: ${bulgular.length} ihlal / ${taranan} öğe`);
    } catch (err) {
      sonuc.push({ ...meta, tip:"sekme", tema, hata:String(err).slice(0,160) });
      console.log(`${tema} · ${meta.key} [sekme] ${meta.ad}: HATA`);
    }
  }
  if (adet !== SEKMELER.length)
    console.log(`   ⚠ sekme sayısı beklenenden farklı: DOM'da ${adet}, listede ${SEKMELER.length}`);

  await ctx.close();
}
await browser.close();

const toplam = sonuc.reduce((n, s) => n + (s.bulgular?.length ?? 0), 0);
console.log(`\nTOPLAM ${toplam} ihlal · ${sonuc.length} yüzey-ölçümü`);
if (jsonYolu) { fs.writeFileSync(jsonYolu, JSON.stringify(sonuc, null, 1)); console.log("JSON:", jsonYolu); }
