/**
 * Lojistik ekranları — WCAG KONTRAST DENETİMİ (21 yüzey + 8 sekme).
 *
 * ÇALIŞTIRMA (kök'ten):
 *   PANEL_PASS='<administrator_parolasi>' ./e2e.sh --panel
 *
 * NEDEN BU DOSYA VAR:
 *   Koyu temada ⋯ menüsünün hover'ı açık zemin + açık metin veriyordu:
 *   1.03:1 kontrast, yazı görünmüyordu. Build geçti, birim testler geçti,
 *   ekran testleri geçti — çünkü hiçbiri RENK ÖLÇMÜYOR.
 *
 *   Kullanıcının sözü: "hepsini tek tek bulamam". Doğru; kimse bulamaz.
 *   Bu yüzden gözle aramak yerine ölçüyoruz: her görünür metin için efektif
 *   zemin bulunup WCAG 2.1 kontrast oranı hesaplanıyor, iki temada da.
 *
 * EŞİKLER (WCAG 2.1 AA, 1.4.3):
 *   normal metin  ≥ 4.5:1
 *   büyük metin   ≥ 3:1   (≥24px, ya da ≥18.66px + kalın)
 *   Salt-dekoratif ve devre dışı öğeler muaf (1.4.3 istisnası).
 */
import { test, expect, request } from "@playwright/test";
// Yüzey listesi burada DEĞİL: `kontrast-tarama.mjs` aracı da aynı listeyi
// okuyor. Kopyalasaydık kapı ile röntgen sessizce ayrışırdı.
import { EKRANLAR, SEKMELER, SHP_CANLI, AZ_VERILI, MOD_YUZEYLERI } from "./kontrast-yuzeyler.mjs";
// Ölçüm kodu da ayrı modülde ve FONKSİYON: template literal hâlindeyken
// içindeki regex kaçışları bozuluyordu (ayrıntı `kontrast-olcum.mjs` başında).
import { olcumYap } from "./kontrast-olcum.mjs";

const BASE = process.env.PANEL_BASE ?? "http://tradehub.localhost";
const USER = process.env.PANEL_USER ?? "Administrator";
const PASS = process.env.PANEL_PASS ?? "";

test.use({ baseURL: BASE, viewport: { width: 1600, height: 1000 } });
test.describe.configure({ mode: "serial" });


/** Ekran gerçekten dolana kadar bekler — sabit `waitForTimeout` yetmiyor. */
async function hazirOl(page: any, url: string) {
  await page.goto(url);
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.locator("main h1").first().waitFor({ state: "visible", timeout: 15_000 });
  // İskelet (`aria-busy`) kalkana kadar: yükleniyor durumunda metin yok.
  await page.locator('main [aria-busy="true"]').first().waitFor({ state: "detached", timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(400);
}

async function oturumAc(context: any) {
  const api = await request.newContext({ baseURL: BASE });
  const res = await api.post("/api/method/login", { form: { usr: USER, pwd: PASS } });
  expect(res.ok(), "Frappe login başarısız").toBeTruthy();
  const { cookies } = await api.storageState();
  await context.addCookies(cookies);
}

test.beforeEach(async ({ context }) => {
  if (!PASS) test.skip(true, "PANEL_PASS env değişkeni gerekli (admin parolası).");
  await oturumAc(context);
});

// Global timeout 30 sn (playwright.config) — bu dosya ona sığmaz ve sığmamalı:
// kapsam 4 ekrandan 20 ekran + 8 sekmeye çıktı. Süreyi burada veriyoruz ki
// config'teki makul varsayılan diğer specler için bozulmasın.
const SURE_STATIK = 8 * 60_000;
// Hover ~20 ekran × 40 tıklanabilir öğe geziyor ve her hover'dan sonra tüm
// sayfayı yeniden ölçüyor. Pahalı ama vazgeçilmez: ⋯ menüsünün 1.03:1 hatası
// YALNIZ hover'da görünüyordu, duran ekran ölçümü onu bulamazdı.
const SURE_HOVER = 40 * 60_000;

for (const tema of ["light", "dark"] as const) {
  test(`${tema} tema — lojistik ekranlarında WCAG AA kontrastı`, async ({ page, context }) => {
    test.setTimeout(SURE_STATIK);
    await context.addInitScript((t) => {
      localStorage.setItem("th-lang", "tr");
      localStorage.setItem("th-theme", t);
      localStorage.setItem("panel_tour_seen_v5", JSON.stringify([
        "dashboard", "catalog", "commerce", "logistics", "sellers", "crm",
        "helpdesk", "system", "store", "products", "orders", "management", "messaging",
      ]));
    }, tema);

    const hepsi: string[] = [];
    let toplamTaranan = 0;
    const topla = (ad: string, bulgular: any[]) => {
      for (const b of bulgular)
        hepsi.push(`${ad}: "${b.metin}" ${b.oran}:1 (gereken ${b.esik}:1) · ${b.renk} / ${b.zemin} · ${b.yol}`);
    };

    for (const e of EKRANLAR) {
      await hazirOl(page, e.url);
      const { bulgular, taranan } = (await page.evaluate(olcumYap)) as any;
      // Yarı yüklenmiş ekran "temiz" görünür — alt sınır bunu yakalıyor.
      // `AZ_VERILI` ekranlar yerelde gerçekten boş (kayıt yok); onlarda sınır
      // 3'e iner, yoksa test veri eksikliğini kontrast hatası sanar.
      const altSinir = AZ_VERILI.has(e.key) ? 3 : 15;
      expect(taranan, `${tema}/${e.key} ${e.ad}: yalnız ${taranan} metin öğesi tarandı — ekran yüklenmemiş olabilir`)
        .toBeGreaterThan(altSinir);
      toplamTaranan += taranan;
      topla(`${e.key} ${e.ad}`, bulgular);
    }

    // GÖRÜNÜM MODLARI: aynı ekran, farklı render dalı. Tarama uzun süre
    // her ekranı yalnız VARSAYILAN modunda açıyordu; kart/pano/liste dalları
    // hiç ölçülmedi. Açıldıklarında üç ayrı ihlal çıktı — biri koyu temada
    // 1:1 (metin zeminle aynı renk, tamamen görünmez).
    for (const y of MOD_YUZEYLERI) {
      for (const mod of y.modlar) {
        await page.addInitScript(({ a, m }) => localStorage.setItem(`lv-mode:${a}`, m),
                                 { a: y.anahtar, m: mod });
        await hazirOl(page, y.url);
        const { bulgular, taranan } = (await page.evaluate(olcumYap)) as any;
        expect(taranan, `${tema}/${y.key} [${mod}]: yalnız ${taranan} öğe tarandı — dal çizilmemiş olabilir`)
          .toBeGreaterThan(15);
        toplamTaranan += taranan;
        topla(`${y.key} [${mod}] ${y.ad}`, bulgular);
      }
    }

    // SEKMELER: ayrı rotaları yok, detay ekranının içinde yaşıyorlar.
    // Sekme çubuğunun kendisi de ölçülüyor — pasif sekme etiketleri uzun
    // süre `text-gray-400` ile 2.6:1 veriyordu ve hiçbir ekran testi görmedi.
    await hazirOl(page, `/panel/lojistik/sevkiyatlar/${SHP_CANLI}`);
    const sekmeDugmeleri = page.locator('[role="tab"]');
    const sekmeAdedi = await sekmeDugmeleri.count();
    expect(sekmeAdedi, "sevkiyat detayı sekme çubuğu render edilmedi — detay yüklenememiş olabilir")
      .toBe(SEKMELER.length);
    for (let i = 0; i < sekmeAdedi; i++) {
      const meta = SEKMELER[i];
      await sekmeDugmeleri.nth(i).click();
      await page.waitForTimeout(600);
      const { bulgular, taranan } = (await page.evaluate(olcumYap)) as any;
      toplamTaranan += taranan;
      topla(`${meta.key} [sekme] ${meta.ad}`, bulgular);
    }

    console.log(`${tema}: ${toplamTaranan} metin öğesi ölçüldü (${EKRANLAR.length} ekran + ${sekmeAdedi} sekme + görünüm modları)`);
    expect(hepsi, `KONTRAST EKSİĞİ:\n  ${hepsi.join("\n  ")}`).toEqual([]);
  });

  test(`${tema} tema — hover durumlarında WCAG AA kontrastı`, async ({ page, context }) => {
    test.setTimeout(SURE_HOVER);
    // Hover ayrı test: ⋯ menüsü hatası YALNIZ hover'da ortaya çıkıyordu.
    // Duran ekranı ölçmek onu bulamazdı.
    await context.addInitScript((t) => {
      localStorage.setItem("th-lang", "tr");
      localStorage.setItem("th-theme", t);
      localStorage.setItem("panel_tour_seen_v5", JSON.stringify([
        "dashboard", "catalog", "commerce", "logistics", "sellers", "crm",
        "helpdesk", "system", "store", "products", "orders", "management", "messaging",
      ]));
    }, tema);

    // GEÇİŞLERİ KAPAT — yoksa ölçüm YANLIŞ. `hover` yapıp hemen ölçünce
    // `transition: color .15s` ortasındaki ARA renk okunuyor: hem oran
    // gerçek değerinden farklı çıkıyor, hem de aynı ihlal bir koşuda
    // görünüp diğerinde kayboluyor (ölçüldü 2026-08-21: A3'teki
    // `.status-pill:hover` bir koşuda 4.29:1 diye raporlandı, tek başına
    // koşturulunca hiç görünmedi; DURAĞAN değeri 3.82:1).
    await context.addInitScript(() => {
      const stil = document.createElement("style");
      stil.textContent =
        "*,*::before,*::after{transition:none !important;animation:none !important}";
      document.addEventListener("DOMContentLoaded", () => document.head.appendChild(stil));
    });

    const hepsi: string[] = [];
    for (const e of EKRANLAR) {
      const ad = `${e.key} ${e.ad}`;
      await hazirOl(page, e.url);

      // Açılır menüleri de kapsa: varsa aç.
      const menu = page.getByRole("button", { name: "Diğer koli işlemleri" }).first();
      if (await menu.count()) await menu.click();
      const filtre = page.getByRole("button", { name: /^Filtreler( \d+)?$/ });
      if (await filtre.count()) await filtre.click();

      const tiklanabilir = page.locator("main button:not([disabled]), main a[href], main [role='menuitem']");
      const n = Math.min(await tiklanabilir.count(), 40);
      for (let i = 0; i < n; i++) {
        const el = tiklanabilir.nth(i);
        if (!(await el.isVisible().catch(() => false))) continue;
        await el.hover({ timeout: 2000 }).catch(() => {});
        const { bulgular } = (await page.evaluate(olcumYap)) as any;
        for (const b of bulgular as any[]) {
          const satir = `${ad}: "${b.metin}" ${b.oran}:1 (gereken ${b.esik}:1) · ${b.renk} / ${b.zemin} · ${b.yol}`;
          if (!hepsi.includes(satir)) hepsi.push(satir);
        }
      }
    }
    expect(hepsi, `HOVER KONTRAST EKSİĞİ:\n  ${hepsi.join("\n  ")}`).toEqual([]);
  });
}
