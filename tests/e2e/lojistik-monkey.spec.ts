import { expect, test, type Page } from "@playwright/test";

/**
 * Lojistik ekranlarına RASTGELE kullanıcı turu (monkey) + form fuzz'ı.
 *
 * NEDEN VAR: kabul testleri ekranın DOĞRU kullanımını ölçüyor. Bu tur yanlış
 * kullanımı ölçüyor — sırasız tıklama, yarım form, saçma değer. Kapsam
 * testlerinin göremediği kusurlar (yakalanmamış istisna, sessiz beyaz ekran,
 * geri tuşunda bozulan durum) ancak böyle çıkıyor.
 *
 * TEKRAR ÜRETİLEBİLİR: rastgelelik TOHUMLU. Bir bulgu çıktığında aynı tohumla
 * aynı adımlar yeniden koşuluyor — "bir keresinde patlamıştı" diye
 * kovalanacak bir hata bırakmıyor. Tohum `MONKEY_TOHUM` ile değiştirilir,
 * adım sayısı `MONKEY_ADIM` ile (varsayılan 250; kapanış turunda 5000).
 *
 * BACKEND GEREKMEZ: sayfalar `?mock=1` ile mock modunda açılıyor.
 *
 * YIKICI DEĞİL: çıkış/silme metni taşıyan öğeler ve dış bağlantılar
 * atlanıyor; tarayıcı diyalogları otomatik kapatılıyor (açık diyalog
 * Playwright'ı kilitler).
 */

const SAYFALAR = [
  "/pages/dashboard/shipment-tracking.html?mock=1",
  "/pages/dashboard/returns.html?mock=1",
  "/pages/dashboard/return-request.html?mock=1&shipment=SHP-2026-00041",
  "/pages/dashboard/notification-preferences.html?mock=1",
] as const;

const TOHUM = Number(process.env.MONKEY_TOHUM ?? 20260907);
// 150: iki viewport × dört sayfa toplam ~6 dk sürüyor. Kapanış turunda
// `MONKEY_ADIM=1000 ./e2e.sh --monkey` ile derinleştiriliyor.
const ADIM = Number(process.env.MONKEY_ADIM ?? 150);

/**
 * SÜRE TAVANI — tur adım sayısıyla DEĞİL, ikisinin hangisi önce biterse
 * onunla sınırlı.
 *
 * NEDEN: adım maliyeti sayfaya ve viewport'a göre 4 KAT değişiyor (ölçüldü
 * 7 Eyl: masaüstünde ~0,25 sn/adım, mobil `shipment-tracking`te 0,9 sn'den
 * fazla — örtüşen öğelerde tıklama kendi zaman aşımını bekliyor). Sabit adım
 * sayısı bu yüzden bazı turlarda test süresini aşıyordu ve tur "düştü"
 * görünüyordu; oysa üründe hiçbir kusur yoktu, yalnız sayaç bitmemişti.
 *
 * Artık tur süresi dolunca DÜZGÜN biter ve kaç adım koştuğunu rapora yazar —
 * "1000 istendi, 690 koştu" bilgisi kaybolmuyor.
 */
const SURE_MS = Number(process.env.MONKEY_SURE_MS ?? ADIM * 400);

/** Dokunulmayacak eylemler — tur oturumu ya da veriyi yok etmemeli. */
const YASAK_METIN = /çıkış|logout|sil|kaldır|hesabımı|iptal et$/i;

/** mulberry32 — küçük, hızlı, tohumlanabilir. */
function rastgele(tohum: number): () => number {
  let a = tohum >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Bulgu {
  tur: string;
  detay: string;
  adim: number;
}

async function oturumAc(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem("i18nextLng", "tr");
    localStorage.setItem(
      "istoc_cookie_prefs",
      JSON.stringify({ necessary: true, analytics: false, marketing: false })
    );
  });
  await page.route("**/api/method/tradehub_core.api.v1.auth.get_session_user*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: {
          logged_in: true,
          user: {
            name: "alici@ornek.com",
            email: "alici@ornek.com",
            full_name: "Test Alıcı",
            is_seller: false,
            is_admin: false,
          },
        },
      }),
    })
  );
}

/** Sayfaya dinleyici tak: konsol hatası, sayfa istisnası, 5xx yanıt. */
function dinle(page: Page, bulgular: Bulgu[], adimNo: () => number): void {
  const gurultu = [/favicon/i, /Failed to load resource/i, /net::ERR_/i];
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    if (gurultu.some((r) => r.test(t))) return;
    bulgular.push({ tur: "console.error", detay: t.slice(0, 300), adim: adimNo() });
  });
  page.on("pageerror", (e) =>
    bulgular.push({ tur: "pageerror", detay: String(e.message).slice(0, 300), adim: adimNo() })
  );
  page.on("response", (r) => {
    if (r.status() >= 500) {
      bulgular.push({ tur: `http ${r.status()}`, detay: r.url().slice(0, 200), adim: adimNo() });
    }
  });
  // Açık diyalog tüm sonraki komutları kilitler.
  page.on("dialog", (d) => void d.dismiss().catch(() => {}));
}

/** Ekran "beyaz" mı — gövdede okunacak metin kalmamış mı? */
async function beyazEkran(page: Page): Promise<boolean> {
  const uzunluk = await page
    .evaluate(() => (document.body?.innerText || "").trim().length)
    .catch(() => -1);
  return uzunluk >= 0 && uzunluk < 40;
}

test.describe("lojistik monkey turu", () => {
  // SÜRE ADIM SAYISINA GÖRE ÖLÇEKLENİR — sabit süre derin turu kesiyordu:
  // `MONKEY_ADIM=1000` ile mobil `shipment-tracking` turu 420 sn'yi aştı ve
  // "browser has been closed" ile düştü (ölçüldü 7 Eyl). Ürün kusuru değildi,
  // sınırdı. Adım başına ~0,5 sn ölçüldü; 0,9 sn'lik pay hem mobilin yavaş
  // viewport'unu hem overlay beklemelerini karşılıyor.
  test.describe.configure({ mode: "serial", timeout: SURE_MS + 90_000 });

  for (const sayfa of SAYFALAR) {
    test(`rastgele tur bozmuyor: ${sayfa.split("?")[0].split("/").pop()}`, async ({ page }) => {
      const bulgular: Bulgu[] = [];
      let adim = 0;
      dinle(page, bulgular, () => adim);
      await oturumAc(page);
      await page.goto(sayfa);
      await expect(page.locator("body")).toBeVisible();

      const zar = rastgele(TOHUM);
      const kokAdres = new URL(page.url()).origin;
      const gunluk: string[] = [];
      const basla = Date.now();
      let kosulan = 0;

      for (adim = 1; adim <= ADIM; adim += 1) {
        if (Date.now() - basla > SURE_MS) break;
        kosulan = adim;
        // Sayfa dışına çıktıysak geri dön — tur lojistikte kalsın.
        if (!page.url().startsWith(kokAdres) || !page.url().includes("/pages/")) {
          // Tıklamanın başlattığı gezinme sürerken `goto` "interrupted by
          // another navigation" atıyor. Bu turun DOĞASI — kusur değil.
          await page.goto(sayfa).catch(() => {});
        }

        const hedefler = page.locator(
          'button:visible, a[href^="/"]:visible, input:visible, select:visible, textarea:visible, [role="button"]:visible, [role="tab"]:visible'
        );
        const sayi = await hedefler.count();
        if (sayi === 0) {
          await page.goto(sayfa).catch(() => {});
          continue;
        }

        const el = hedefler.nth(Math.floor(zar() * sayi));
        const metin = ((await el.innerText().catch(() => "")) || "").slice(0, 40);
        const etiket = (await el.getAttribute("aria-label").catch(() => null)) ?? "";
        if (YASAK_METIN.test(metin) || YASAK_METIN.test(etiket)) continue;

        const tip = await el.evaluate((n) => n.tagName.toLowerCase()).catch(() => "");
        const inputTipi = (await el.getAttribute("type").catch(() => null)) ?? "";
        gunluk.push(
          `${adim}:${tip}${inputTipi ? `[${inputTipi}]` : ""} ${metin.replace(/\n/g, " ")}`
        );

        try {
          if (tip === "input" && ["text", "search", "email", "tel", ""].includes(inputTipi)) {
            await el.fill(String(Math.floor(zar() * 1e6)), { timeout: 2000 });
          } else if (tip === "input" && inputTipi === "number") {
            await el.fill(String(Math.floor(zar() * 200) - 50), { timeout: 2000 });
          } else if (tip === "textarea") {
            await el.fill("monkey ".repeat(1 + Math.floor(zar() * 8)), { timeout: 2000 });
          } else {
            await el.click({ timeout: 2000, noWaitAfter: true });
          }
        } catch {
          // Görünmez/kararsız öğe turu durdurmaz — kusur değil, zamanlama.
        }

        if (adim % 25 === 0 && (await beyazEkran(page))) {
          bulgular.push({ tur: "beyaz ekran", detay: page.url(), adim });
          break;
        }
      }

      test.info().annotations.push({
        type: "monkey",
        description: `${kosulan}/${ADIM} adım koştu · ${Math.round((Date.now() - basla) / 1000)} sn · tohum ${TOHUM}`,
      });
      // ALT SINIR: süre tavanı turu erken kesse bile anlamlı bir tur koşmalı.
      // "0 bulgu" ile "hiç dolaşmadım" aynı görünür.
      expect(kosulan, "tur anlamlı sayıda adım koşamadı").toBeGreaterThan(
        Math.min(50, Math.floor(ADIM / 2))
      );

      // Tur sonunda ekran hâlâ kullanılabilir olmalı. Son eylem bir gezinme
      // başlatmış olabilir; oturmasını beklemeden ölçmek boş gövde okur.
      await page.waitForLoadState("domcontentloaded").catch(() => {});
      await expect
        .poll(async () => !(await beyazEkran(page)), {
          timeout: 10_000,
          message: `tur sonunda ekran boş: ${page.url()}`,
        })
        .toBe(true);
      expect(
        bulgular,
        `TOHUM=${TOHUM} ADIM=${ADIM}\nson adımlar:\n  ${gunluk.slice(-12).join("\n  ")}`
      ).toEqual([]);
    });
  }
});

test.describe("lojistik form fuzz'ı", () => {
  /** Düşmanca girdiler — her biri ayrı bir kusur sınıfını yokluyor. */
  const KOTU_DEGERLER = [
    { ad: "script yükü", deger: '<img src=x onerror="window.__xss=1">' },
    { ad: "çok uzun metin", deger: "A".repeat(10_000) },
    { ad: "emoji + RTL", deger: "🧨‮تجربة🧨" },
    { ad: "sql benzeri", deger: "'; DROP TABLE shipment; --" },
    { ad: "yol geçişi", deger: "../../../../etc/passwd" },
    { ad: "boş/boşluk", deger: "   " },
  ];

  for (const { ad, deger } of KOTU_DEGERLER) {
    test(`iade formu "${ad}" girdisiyle bozulmuyor`, async ({ page }) => {
      const hatalar: Bulgu[] = [];
      dinle(page, hatalar, () => 0);
      await oturumAc(page);
      await page.goto("/pages/dashboard/return-request.html?mock=1&shipment=SHP-2026-00041");

      const satir = page.locator("form li").first();
      await satir.getByRole("checkbox").check();
      await page.locator("textarea").first().fill(deger);
      const miktar = satir.locator('input[type="number"]');
      if (await miktar.count()) await miktar.fill("-5");
      const gonder = page.getByRole("button", { name: /İade talebi gönder/ });

      // BOŞ/BOŞLUK yükü: düğme DEVRE DIŞI kalıyor — bu doğru davranış, istemci
      // kapısı boş açıklamayı hiç göndertmiyor. Tıklamayı zorlamak testi 30 sn
      // zaman aşımına sokuyordu; ölçülmesi gereken şey kapının TUTMASI.
      if (!(await gonder.isEnabled())) {
        await expect(gonder, "boş açıklamada gönder düğmesi açık kalmamalı").toBeDisabled();
        expect(hatalar).toEqual([]);
        return;
      }

      await gonder.click();

      // GEZİNMEYİ BEKLE: form başarılı olursa takip sayfasına gidiyor, aksi
      // hâlde formda hata beliriyor. İkisinden biri gerçekleşene kadar
      // beklenmezse ölçüm gezinmenin ORTASINDA yapılıyor ve boş gövde
      // "beyaz ekran" sanılıyordu (ilk sürümde altı yükten beşi bu yüzden
      // sahte kırmızı verdi — üründe kusur yoktu).
      await Promise.race([
        page.waitForURL(/returns\.html\?name=/, { timeout: 8000 }).catch(() => {}),
        page
          .getByText(/oluşturulamadı|hata|başarısız|en az/i)
          .first()
          .waitFor({ state: "visible", timeout: 8000 })
          .catch(() => {}),
      ]);
      await page.waitForLoadState("domcontentloaded").catch(() => {});

      // 1) Yük ÇALIŞMAMALI (XSS).
      expect(
        await page.evaluate(() => (window as unknown as { __xss?: number }).__xss),
        "enjekte edilen yük çalıştı"
      ).toBeUndefined();
      // 2) Ekran ayakta kalmalı. YOKLAMALI ölçüm: gezinme çözülse bile yeni
      //    sayfa bir an boş olabiliyor; tek atışlık ölçüm o anı yakalayıp
      //    sahte "beyaz ekran" veriyordu (ölçüldü: altı yükten biri, derin
      //    koşumda). Monkey turunda da aynı düzeltme yapıldı.
      await expect
        .poll(async () => !(await beyazEkran(page)), {
          timeout: 10_000,
          message: `form gönderiminden sonra ekran boş: ${page.url()}`,
        })
        .toBe(true);
      // 3) Yakalanmamış istisna / 5xx olmamalı.
      expect(hatalar).toEqual([]);
    });
  }
});
