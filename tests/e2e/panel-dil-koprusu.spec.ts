/**
 * DİL ÇEREZ KÖPRÜSÜ — storefront ile panel aynı tercihi paylaşıyor mu?
 *
 * Çalıştırma:
 *   ./e2e.sh --panel   (parolayı .env.e2e'den okur)
 *
 * NEDEN: panel `localStorage.th-lang`, storefront `localStorage.i18nextLng`
 * kullanıyordu. İki depo birbirini görmüyor — ölçüldü (16 Eyl 2026, gerçek
 * tarayıcı): mağaza yüzünde Arapça seçen kullanıcı panele girince İngilizce
 * karşılanıyordu. MOGEM-642 Faz 1'de köprü ORTAK ÇEREZ oldu (`th-lang` +
 * `th-lang-source`), iki uygulama da onu okuyup yazıyor.
 *
 * `panel-dil-butunlugu.spec.ts` ÇEVİRİNİN varlığını ölçer (ekranda o dile ait
 * metin var mı); burası TERCİHİN TAŞINMASINI ölçer. İkisi ayrı kusur: çeviri
 * eksikse ekran İngilizceye düşer, köprü kopuksa doğru çeviri yanlış dilde
 * hiç istenmez.
 */
import { expect, request, test } from "@playwright/test";

const BASE = process.env.PANEL_BASE ?? "http://tradehub.localhost";
const USER = process.env.PANEL_USER ?? "Administrator";
const PASS = process.env.PANEL_PASS ?? "";

const TUR_ANAHTARLARI = JSON.stringify([
  "dashboard",
  "catalog",
  "commerce",
  "logistics",
  "sellers",
  "crm",
  "helpdesk",
  "system",
  "store",
  "products",
  "orders",
  "management",
  "messaging",
  // SAYFA turları ayrı biçimde işaretleniyor (`stores/tour.js`): yalnız bölüm
  // anahtarlarını yazmak yetmiyor, sayfa turu yine açılıp tıklamayı yutuyor.
  "page:category-showcase",
]);

test.use({ baseURL: BASE });
test.describe.configure({ mode: "serial" });

async function oturumAc(context: import("@playwright/test").BrowserContext) {
  const api = await request.newContext({ baseURL: BASE });
  const res = await api.post("/api/method/login", { form: { usr: USER, pwd: PASS } });
  expect(res.ok(), "Frappe login başarısız — kullanıcı/parola?").toBeTruthy();
  const { cookies } = await api.storageState();
  await context.addCookies(cookies);
  // Rehberli tur overlay'i tıklamayı yutuyor (`fixed inset-0 z-[9999]`).
  await context.addInitScript((anahtarlar) => {
    localStorage.setItem("panel_tour_seen_v5", anahtarlar);
  }, TUR_ANAHTARLARI);
}

async function dilDurumu(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const cerez = (ad: string) => {
      const p = document.cookie
        .split(";")
        .map((s) => s.trim())
        .find((s) => s.startsWith(`${ad}=`));
      return p ? decodeURIComponent(p.slice(ad.length + 1)) : null;
    };
    return {
      htmlLang: document.documentElement.lang,
      htmlDir: document.documentElement.dir,
      depo: localStorage.getItem("th-lang"),
      cerezDil: cerez("th-lang"),
      cerezKaynak: cerez("th-lang-source"),
      adres: location.href,
    };
  });
}

test.beforeEach(async () => {
  if (!PASS) test.skip(true, "PANEL_PASS env değişkeni gerekli.");
});

test("storefront'ta yazılan çerez paneli o dilde açar — localStorage BOŞKEN", async ({
  context,
  page,
}) => {
  // Kritik ayrıntı: `th-lang` localStorage anahtarı bilerek boş bırakılıyor.
  // Dolu olsaydı panel eski yoldan da doğru dili bulur, test köprüyü değil
  // kendi eski davranışını ölçerdi.
  await oturumAc(context);
  await context.addCookies([
    { name: "th-lang", value: "ar", url: BASE },
    { name: "th-lang-source", value: "manual", url: BASE },
  ]);

  await page.goto("/panel/dashboard");
  await page.waitForLoadState("networkidle");

  const durum = await dilDurumu(page);
  expect(durum.htmlLang).toBe("ar");
  expect(durum.htmlDir).toBe("rtl");
});

test("otomatik çerez de miras alınır — ülke kararı panele taşınır", async ({ context, page }) => {
  // Faz 5'te ülke tespiti storefront'ta "auto" çerezi yazacak; panelin onu
  // okuduğu bu satırla kilitleniyor.
  await oturumAc(context);
  await context.addCookies([
    { name: "th-lang", value: "ru", url: BASE },
    { name: "th-lang-source", value: "auto", url: BASE },
  ]);

  await page.goto("/panel/dashboard");
  await page.waitForLoadState("networkidle");

  expect((await dilDurumu(page)).htmlLang).toBe("ru");
});

test("panelde ELLE seçim çereze yazılır — storefront'un okuyacağı yer", async ({
  context,
  page,
}, testInfo) => {
  // Panelde İKİ dil seçici var ve ikisi AYNI ANDA görünmüyor
  // (`AppHeader.vue:85` — "V-E: <1280 gizlenir, dil ⋯ menüsüne taşınır"):
  //   ≥1280 → başlıktaki küre düğmesi (`LanguageSwitcher.vue`)
  //   <1280 → ⋯ taşma menüsündeki liste (`AppHeader.vue:215`)
  // Bu test geniş ekran yolunu ölçer; dar ekran yolu bir alttaki testte.
  // İkisi ayrı ayrı ölçülmeli: aynı `setLanguage()`i çağırsalar da farklı
  // bileşenler, biri bozulunca diğeri haber vermez.
  //
  // NE ÖLÇÜLDÜĞÜ — sınırı: bu test "seçimden SONRA çerez doğru" der, çerezi
  // hangi satırın yazdığını ayırt ETMEZ. Her iki seçici de seçimden sonra
  // `window.location.reload()` çağırıyor; yeniden yüklemede `readManualLang()`
  // localStorage'daki seçimi bulup çereze taşıyor. Ölçüldü (16 Eyl 2026):
  // `setLanguage` içindeki `writeLangCookie` çağrısı silindiğinde bu test ve
  // mobil eşi YEŞİL kaldı — reload yolu mutasyonu maskeledi. O çağrının kendi
  // etkisi birim testiyle kilitli: `admin-panel .../initializeI18n.test.js` →
  // "setLanguage: localStorage yazılamıyorsa bile çerez yazılır" (maskenin
  // kalktığı tek durum, gizli sekme).
  const genislik = testInfo.project.use.viewport?.width ?? 1280;
  test.skip(genislik < 1280, "Bu genişlikte küre düğmesi gizli; dar ekran yolu ayrı testte.");

  await oturumAc(context);
  // Dashboard DEĞİL: "Platform Overview — live data" bloğu sürekli yeniden
  // çiziliyor ve Playwright başlıktaki düğmeyi hiç "stable" saymıyor —
  // 56 denemede zaman aşımı (ölçüldü 16 Eyl 2026). Düğme ekranda görünür
  // durumda, yani kusur sayfanın canlılığında, dil seçicide değil. Sakin bir
  // ekranda ölçmek testin konusunu (çerez yazımı) değiştirmiyor.
  await page.goto("/panel/category-showcase");
  await page.waitForLoadState("networkidle");

  // Dil seçici: başlıktaki küre düğmesi (`LanguageSwitcher.vue`, `.hdr-icon-btn`
  // + kısa dil kodu). `:visible` ZORUNLU — panel başlığı dar ve geniş ekran
  // için iki kopya çiziyor, biri her zaman gizli; `:visible` olmadan tıklama
  // gizli kopyaya düşüp zaman aşımına uğruyor ("element not stable", ölçüldü
  // 16 Eyl 2026). Aynı tuzak `panel-dil-butunlugu.spec.ts`'te sekme şeridi
  // için belgeli.
  const kure = page
    .locator("button.hdr-icon-btn:visible")
    .filter({ hasText: /^(EN|TR|AR|RU)$/i })
    .first();
  await kure.click();
  await page.locator("button:visible", { hasText: "Русский" }).first().click();
  await page.waitForTimeout(1200);

  const durum = await dilDurumu(page);
  expect(durum.cerezDil).toBe("ru");
  expect(durum.cerezKaynak).toBe("manual");
  expect(durum.htmlLang).toBe("ru");
});

test("DAR EKRANDA ⋯ menüsünden seçim de çereze yazılır", async ({ context, page }, testInfo) => {
  // Mobil yol Faz 1 teslimine kadar tarayıcıda HİÇ tıklanmamıştı; yalnız
  // kaynak denetimi (`setLanguage()` çağrılıyor mu) kapsıyordu. O denetim
  // çağrının VARLIĞINI görür, sonucunu değil — ⋯ menüsü hiç açılmıyor olsa
  // da yeşil kalırdı. Bu test menünün gerçekten açıldığını ve seçimin işe
  // yaradığını ölçer. Sınırı üstteki testinkiyle aynı: reload yolu, çerezi
  // hangi satırın yazdığını maskeliyor.
  const genislik = testInfo.project.use.viewport?.width ?? 1280;
  test.skip(genislik >= 1280, "Bu genişlikte ⋯ menüsü gizli; geniş ekran yolu üstteki testte.");

  await oturumAc(context);
  await page.goto("/panel/category-showcase");
  await page.waitForLoadState("networkidle");

  // ⋯ düğmesi: `.hdr-more-wrap` içindeki tek `.hdr-icon-btn`. `:visible`
  // zorunlu — başlık dar/geniş için iki kopya çiziyor (bkz. üstteki test).
  await page.locator(".hdr-more-wrap button.hdr-icon-btn:visible").first().click();
  await page
    .locator(".hdr-more-menu:visible .hdr-more-item", { hasText: "Русский" })
    .first()
    .click();

  // `selectLang()` seçimden sonra `window.location.reload()` çağırıyor
  // (backend'in Accept-Language ile gönderdiği metadata yenilensin diye).
  await page.waitForLoadState("networkidle");

  const durum = await dilDurumu(page);
  expect(durum.cerezDil).toBe("ru");
  expect(durum.cerezKaynak).toBe("manual");
  expect(durum.htmlLang).toBe("ru");
});

test("?hl= panelde de çalışır ve adresten DÜŞER, diğer sorgu korunur", async ({
  context,
  page,
}) => {
  // Adres temizliği `history.replaceState` ile denendi ve parametre geri
  // beliriyordu: router modül yükleme anında kirli konumu kaydedip ilk
  // navigasyonda geri yazıyor. Temizlik `main.js`'te `router.isReady()`
  // sonrasına taşındı — bu test o düzeltmeyi kilitliyor.
  await oturumAc(context);
  await page.goto("/panel/lojistik/sevkiyatlar?hl=ar&durum=acik");
  await page.waitForLoadState("networkidle");

  const durum = await dilDurumu(page);
  expect(durum.htmlLang).toBe("ar");
  expect(durum.cerezDil).toBe("ar");
  expect(durum.cerezKaynak).toBe("manual");
  expect(durum.adres).not.toContain("hl=");
  expect(durum.adres).toContain("durum=acik");
});

test("panelin ESKİ localStorage seçimi çereze taşınır — tercih kaybolmaz", async ({
  context,
  page,
}) => {
  // Bu özellik yayına çıktığında dilini çoktan seçmiş panel kullanıcıları
  // tercihlerini kaybetmemeli. Çerez YOK, yalnız eski anahtar var.
  await oturumAc(context);
  await context.addInitScript(() => localStorage.setItem("th-lang", "ru"));

  await page.goto("/panel/dashboard");
  await page.waitForLoadState("networkidle");

  const durum = await dilDurumu(page);
  expect(durum.htmlLang).toBe("ru");
  expect(durum.cerezDil).toBe("ru");
  expect(durum.cerezKaynak).toBe("manual");
});
