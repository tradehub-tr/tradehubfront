/**
 * Alıcı ödeme + kupon akışı — GERÇEK backend E2E (MOGEM-685).
 *
 * ÇALIŞTIRMA (kökten): ./e2e.sh --alici
 * Gerekli: docker stack ayakta (tradehub.localhost), storefront dist güncel,
 * kökteki `./seed-e2e-hesaplari.sh` koşulmuş (sentetik alıcı + E2E-SATICI ürünü).
 * .env.e2e: BUYER_PASS, PANEL_PASS (kupon kurmak için Administrator), E2E_TEST_TCKN
 * (bireysel fatura alanı — kimlik numarası testte uydurulmaz, dosyadan okunur).
 *
 * Kapsam:
 *  - Sepette kupon mesajları: süresi dolmuş · kullanım sınırı dolmuş · geçerli.
 *  - Kod normalizasyonu: küçük harf + baştaki boşluk doğru kupona çözülür.
 *  - Tenant'ı olmayan alıcı sipariş verebilir (cost center kapısı, 28 Eyl düzeltmesi).
 *  - Siparişe yazılan indirim/toplam ekranda gösterilenle aynı.
 *
 * Veri: her koşum kendi benzersiz kuponlarını açar; sipariş alıcı gibi iptal
 * edilir (stok rezervasyonu geri bırakılır), sonra kupon ve sipariş silinir.
 * REST silmesinin artıkları (Deleted Document, silme yorumu, iptal bildirimi,
 * ReBAC'sız ortamda arka plan Error Log'u) yerel koşucunun derin temizliğiyle
 * silinir: `./e2e.sh --alici` bloktan önce ve sonra
 * `./seed-e2e-hesaplari.sh --temizle` çağırır.
 */
import { test, expect, request, type APIRequestContext } from "@playwright/test";

const BASE = process.env.PANEL_BASE ?? "http://tradehub.localhost";
const BUYER = process.env.BUYER_USER ?? "e2e-alici@istoc.local";
const BUYER_PASS = process.env.BUYER_PASS ?? "";
const ADMIN_PASS = process.env.PANEL_PASS ?? "";
const TCKN = process.env.E2E_TEST_TCKN ?? "";
const URUN_SKU = "E2E-URUN-1";

const EK = Date.now().toString(36).toUpperCase();
const KUPON = {
  gecerli: `E2EV${EK}`,
  eski: `E2EE${EK}`,
  bitti: `E2EB${EK}`,
  yaris: `E2EY${EK}`,
  kargo: `E2EK${EK}`,
  pano: `E2EP${EK}`,
};

let admin: APIRequestContext;
let alici: APIRequestContext;
let urun = "";
let adres = "";
// Koşum başında alıcının kullanabileceği kupon sayısı (pano testi kıyaslar).
let panoIlk = -1;
let siparis = "";

test.use({ baseURL: BASE });
test.describe.configure({ mode: "serial" });

async function giris(usr: string, pwd: string): Promise<APIRequestContext> {
  const ctx = await request.newContext({ baseURL: BASE });
  const res = await ctx.post("/api/method/login", { form: { usr, pwd } });
  expect(res.ok(), `Frappe login başarısız — ${usr}`).toBeTruthy();
  return ctx;
}

async function metot(ctx: APIRequestContext, ad: string, form: Record<string, string> = {}) {
  const res = await ctx.post(`/api/method/${ad}`, { form });
  expect(res.ok(), `${ad} → ${res.status()} ${await res.text()}`).toBeTruthy();
  return (await res.json()).message;
}

// Playwright ilk argümanda nesne deseni ister; fixture kullanılmıyor.
// eslint-disable-next-line no-empty-pattern
test.beforeAll(async ({}, testInfo) => {
  // Yalnız masaüstü: validate_coupon kullanıcı başına 10 çağrı / 5 dk ile sınırlı
  // (rate_limit, per_user). İki profil aynı sentetik alıcıyı paylaşınca sınır
  // dolup kupon mesajı hiç gelmiyordu (ölçüldü 28 Eyl). Koşum başına 4 çağrı.
  test.skip(testInfo.project.name !== "chromium-desktop", "hız sınırı — yalnız masaüstü profili");
  test.skip(
    !BUYER_PASS || !ADMIN_PASS || !TCKN,
    "BUYER_PASS, PANEL_PASS ve E2E_TEST_TCKN gerekli."
  );
  admin = await giris("Administrator", ADMIN_PASS);
  alici = await giris(BUYER, BUYER_PASS);

  const liste = await admin.get("/api/resource/Listing", {
    params: { filters: JSON.stringify([["seller_sku", "=", URUN_SKU]]), fields: '["name"]' },
  });
  urun = (await liste.json()).data?.[0]?.name ?? "";
  expect(urun, "E2E ürünü yok — önce ./seed-e2e-hesaplari.sh").not.toBe("");

  const ortak = { is_active: 1, min_order: 0, description: "E2E — otomatik silinir" };
  for (const [code, alan] of [
    [KUPON.gecerli, { coupon_type: "percent", value: 10, max_uses: 5, used_count: 0 }],
    [
      KUPON.eski,
      { coupon_type: "fixed", value: 50, max_uses: 0, used_count: 0, expires_at: "2000-01-01" },
    ],
    [KUPON.bitti, { coupon_type: "fixed", value: 50, max_uses: 1, used_count: 1 }],
    [KUPON.yaris, { coupon_type: "fixed", value: 50, max_uses: 1, used_count: 0 }],
    // value=50 bilerek: eskiden shipping kuponu değeri sabit indirim sayıyordu.
    [KUPON.kargo, { coupon_type: "shipping", value: 50, max_uses: 5, used_count: 0 }],
  ] as const) {
    const res = await admin.post("/api/resource/Coupon", { data: { code, ...ortak, ...alan } });
    expect(res.ok(), `kupon ${code} açılamadı: ${await res.text()}`).toBeTruthy();
  }

  const adresler = await admin.get("/api/resource/Addresses", {
    params: { filters: JSON.stringify([["user", "=", BUYER]]), fields: '["name"]' },
  });
  adres = (await adresler.json()).data?.[0]?.name ?? "";
  expect(adres, "sentetik alıcının adresi yok — önce ./seed-e2e-hesaplari.sh").not.toBe("");

  await metot(alici, "tradehub_core.api.cart.clear_cart");
  await metot(alici, "tradehub_core.api.cart.add_to_cart", { listing: urun, quantity: "1" });
  panoIlk = (await metot(alici, "tradehub_core.api.cart.get_buyer_coupons")).available;
});

test.afterAll(async () => {
  if (!admin) return;
  // Siparişler sayfa adresinden DEĞİL kupon koduyla bulunur: test sipariş verildikten
  // sonra hangi adımda düşerse düşsün temizlik çalışsın (28 Eyl: numara okunmadan
  // düşen koşum siparişi ve stok rezervasyonunu bırakmıştı).
  const liste = await admin.get("/api/resource/Order", {
    params: {
      filters: JSON.stringify([["coupon_code", "in", Object.values(KUPON)]]),
      fields: '["name"]',
    },
  });
  for (const { name } of (await liste.json()).data ?? []) {
    await alici.post("/api/method/tradehub_core.api.order.cancel_order", {
      form: { order_number: name, reason: "E2E temizlik" },
    });
    await admin.delete(`/api/resource/Order/${name}`);
  }
  for (const code of Object.values(KUPON)) await admin.delete(`/api/resource/Coupon/${code}`);
  await alici.post("/api/method/tradehub_core.api.cart.clear_cart");
  // REST silmesi Deleted Document / yorum / bildirim artığı bırakır; iz bırakmayan
  // derin temizlik yerel koşucuda: `./e2e.sh --alici` → `./seed-e2e-hesaplari.sh --temizle`.
});

test.beforeEach(async ({ context }) => {
  await context.addCookies((await alici.storageState()).cookies);
  await context.addInitScript(() => {
    localStorage.setItem("i18nextLng", "tr");
    localStorage.setItem("th-lang-source", "manual");
    // Temiz profilde para birimi ülke tespitine düşüyor (USD) — tutarlar TRY bekleniyor.
    localStorage.setItem("tradehub-currency", "TRY");
  });
});

async function kuponUygula(page: import("@playwright/test").Page, kod: string) {
  const alan = page.getByPlaceholder("Kupon kodunu girin");
  await alan.fill(kod);
  await page.getByRole("button", { name: "Uygula" }).click();
}

test("ödeme sayfası açılır, sentetik teslimat adresi hazır", async ({ page }) => {
  await page.goto("/pages/order/checkout.html");
  await expect(page.getByText("E2E Test Sokak No:1").first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByPlaceholder("Kupon kodunu girin")).toBeVisible();
});

test("süresi dolmuş kupon — mesaj, indirim yok", async ({ page }) => {
  await page.goto("/pages/order/checkout.html");
  await kuponUygula(page, KUPON.eski);
  await expect(page.getByText("Bu kuponun süresi dolmuş")).toBeVisible();
  await expect(page.getByText("Kupon indirimi")).toHaveCount(0);
});

test("kullanım sınırı dolmuş kupon — mesaj, indirim yok", async ({ page }) => {
  await page.goto("/pages/order/checkout.html");
  await kuponUygula(page, KUPON.bitti);
  await expect(page.getByText("Bu kupon maksimum kullanım sayısına ulaştı")).toBeVisible();
  await expect(page.getByText("Kupon indirimi")).toHaveCount(0);
});

test("geçerli kupon küçük harf + baştaki boşlukla uygulanır, sipariş aynı tutarla oluşur", async ({
  page,
}) => {
  await page.goto("/pages/order/checkout.html");
  await kuponUygula(page, `  ${KUPON.gecerli.toLowerCase()}`);
  await expect(page.getByText("Kupon indirimi")).toBeVisible();
  await expect(page.getByText("- ₺100,00")).toBeVisible();
  // Ürün 1.000 + kargo 30 (seed) − %10 ÜRÜN indirimi 100 = 930. Taban ürün+kargo
  // olsaydı indirim 103 olurdu (MOGEM-685 Adım 3).
  await expect(page.getByText("₺930,00").first()).toBeVisible();

  // Bireysel fatura — TCKN .env.e2e'den (kimlik no testte uydurulmaz).
  await page.getByText("TCKN ile fatura").click();
  await page.getByPlaceholder("12345678901").fill(TCKN);
  await page.getByText("okudum, kabul ediyorum").click();
  await page.getByRole("button", { name: "Siparişi ver" }).click();
  // Sipariş isteğinin yanıtı ölçülür: düşerse sunucunun mesajı rapora düşsün
  // (bildirim birkaç saniyede kaybolduğu için ekran görüntüsü sebebi göstermiyor).
  const yanit = page.waitForResponse((r) => r.url().includes("cart.create_order"));
  await page.getByRole("button", { name: /siparişini onayla/ }).click();
  const siparisYaniti = await yanit;
  // Gövde yalnız hatada okunur: başarıda sayfa hemen ayrılıyor ve gövde düşüyor.
  if (siparisYaniti.status() !== 200) {
    expect(siparisYaniti.status(), await siparisYaniti.text()).toBe(200);
  }

  await expect(page).toHaveURL(/order-success\.html.*orderNumbers=ORD-/, { timeout: 20_000 });
  siparis = new URL(page.url()).searchParams.get("orderNumbers") ?? "";
  expect(siparis).toMatch(/^ORD-/);

  // Tenant'ı olmayan alıcı: "cost center zorunlu" ile REDDEDİLMEDİ (sipariş oluştu).
  const kayit = (await (await admin.get(`/api/resource/Order/${siparis}`)).json()).data;
  expect(kayit.buyer).toBe(BUYER);
  expect(Number(kayit.coupon_discount)).toBe(100);
  expect(Number(kayit.total)).toBe(930); // ekranda gösterilen toplam
});

test("kullanılmış kupon tekrar uygulanınca sepette 'daha önce kullandınız' görünür", async ({
  page,
}) => {
  // F-02 kararı: kişi başı kural önizlemede de uygulanır — alıcı sepette "geçerli"
  // görüp siparişte reddedilmez. (Önceki test aynı kuponla sipariş verdi.)
  await metot(alici, "tradehub_core.api.cart.add_to_cart", { listing: urun, quantity: "1" });
  await page.goto("/pages/order/checkout.html");
  await kuponUygula(page, KUPON.gecerli);
  await expect(page.getByText("Bu kuponu daha önce kullandınız")).toBeVisible();
  await expect(page.getByText("Kupon indirimi")).toHaveCount(0);
});

test("F-02 — tarayıcıdan aynı anda iki sipariş: tek kullanımlık kupon bir kez geçer", async ({
  page,
}) => {
  // Alıcının kendi tarayıcı oturumundan (çerez + CSRF) iki create_order aynı anda.
  // Düzeltme öncesi ikisi de 200 dönüp ikisi de indirim alıyordu (used_count 0→2).
  await page.goto("/pages/order/checkout.html");
  const siparisler = JSON.stringify([
    {
      seller_id: "E2E-SATICI",
      shipping_fee: 0,
      currency: "TRY",
      products: [{ listing: urun, quantity: 1 }],
    },
  ]);
  const durumlar = await page.evaluate(
    async ({ siparisler, adres, kod }) => {
      const oturum = await fetch("/api/method/tradehub_core.api.v1.auth.get_session_user");
      const csrf = (await oturum.json()).message.csrf_token as string;
      const istek = () =>
        fetch("/api/method/tradehub_core.api.cart.create_order", {
          method: "POST",
          headers: { "X-Frappe-CSRF-Token": csrf },
          body: new URLSearchParams({
            orders_json: siparisler,
            shipping_address: adres,
            payment_method: "bank_transfer",
            coupon_code: kod,
          }),
        }).then(async (r) => ({ durum: r.status, govde: await r.text() }));
      return Promise.all([istek(), istek()]);
    },
    { siparisler, adres, kod: KUPON.yaris }
  );

  const kodlar = durumlar.map((d) => d.durum).sort();
  expect(kodlar, JSON.stringify(durumlar)).toEqual([200, 417]);
  // Frappe hata mesajı iç içe JSON: gövde → _server_messages (JSON dizi) → mesaj (JSON).
  const govde = JSON.parse(durumlar.find((d) => d.durum === 417)?.govde ?? "{}");
  const mesaj = JSON.parse(JSON.parse(govde._server_messages ?? '["{}"]')[0]).message ?? "";
  expect(mesaj).toContain("maksimum kullanım");
  expect(mesaj).toContain("sipariş oluşturulmadı");

  const kupon = (await (await admin.get(`/api/resource/Coupon/${KUPON.yaris}`)).json()).data;
  expect(Number(kupon.used_count)).toBe(1);
  const olusan = await admin.get("/api/resource/Order", {
    params: { filters: JSON.stringify([["coupon_code", "=", KUPON.yaris]]), fields: '["name"]' },
  });
  expect((await olusan.json()).data).toHaveLength(1);
});

test("ücretsiz kargo kuponu: ekranda kargo kadar indirim, sipariş aynı tutarla", async ({
  page,
}) => {
  // Adım 3: shipping kuponu kargo ücretini düşer (değeri 50 olsa da). Eskiden ekran
  // 1.000 gösterirken sunucu 980 tahsil ediyordu (değeri sabit indirim sayıyordu).
  await metot(alici, "tradehub_core.api.cart.add_to_cart", { listing: urun, quantity: "1" });
  await page.goto("/pages/order/checkout.html");
  await kuponUygula(page, KUPON.kargo);
  await expect(page.getByText("- ₺30,00")).toBeVisible();
  await expect(page.getByText("₺1.000,00").last()).toBeVisible();

  await page.getByText("TCKN ile fatura").click();
  await page.getByPlaceholder("12345678901").fill(TCKN);
  await page.getByText("okudum, kabul ediyorum").click();
  await page.getByRole("button", { name: "Siparişi ver" }).click();
  const yanit = page.waitForResponse((r) => r.url().includes("cart.create_order"));
  await page.getByRole("button", { name: /siparişini onayla/ }).click();
  const siparisYaniti = await yanit;
  if (siparisYaniti.status() !== 200) {
    expect(siparisYaniti.status(), await siparisYaniti.text()).toBe(200);
  }
  await expect(page).toHaveURL(/order-success\.html.*orderNumbers=ORD-/, { timeout: 20_000 });
  const no = new URL(page.url()).searchParams.get("orderNumbers") ?? "";
  const kayit = (await (await admin.get(`/api/resource/Order/${no}`)).json()).data;
  expect(Number(kayit.shipping_fee)).toBe(30);
  expect(Number(kayit.coupon_discount)).toBe(30);
  expect(Number(kayit.total)).toBe(1000); // ekranda gösterilen toplam
});

test("pano kupon sayacı: kod sızmaz, kullanılan kupon sayılmaz, yeni kupon +1", async ({
  page,
}) => {
  // MOGEM-685 Adım 4: get_buyer_coupons eskiden tüm aktif kupon KODLARINI döndürüyor
  // ve alıcının kullandığı kuponu da "kullanılabilir" sayıyordu. Önceki testler
  // KUPON.gecerli ve KUPON.kargo'yu kullandı; ikisi de sayılmamalı.
  // Sıra bilinçli: önce yanıt biçimi + kod sızıntısı (asıl güvenlik iddiası), sonra
  // panodaki sayı — eski uçta ilk kırılan sızıntı iddiası olsun (karşı kanıt, 28 Eyl).
  const oku = async () => {
    await page.goto("/pages/dashboard/buyer-dashboard.html");
    const yanit = await page.evaluate(async () => {
      const r = await fetch("/api/method/tradehub_core.api.cart.get_buyer_coupons");
      const govde = await r.text();
      return { govde, veri: JSON.parse(govde).message };
    });
    for (const kod of Object.values(KUPON)) expect(yanit.govde).not.toContain(kod);
    expect(Object.keys(yanit.veri)).toEqual(["available"]);
    await expect(page.locator('[x-text="statsCoupons"]')).toHaveText(String(yanit.veri.available));
    return yanit;
  };

  const once = await oku();
  // Başta sayılan gecerli/yaris/kargo düştü: ikisini bu alıcı kullandı, yaris sınırına
  // ulaştı (eski/bitti baştan sayılmıyordu).
  expect(once.veri.available).toBe(panoIlk - 3);

  const res = await admin.post("/api/resource/Coupon", {
    data: {
      code: KUPON.pano,
      coupon_type: "fixed",
      value: 10,
      is_active: 1,
      min_order: 0,
      max_uses: 5,
      used_count: 0,
      description: "E2E — otomatik silinir",
    },
  });
  expect(res.ok(), await res.text()).toBeTruthy();

  const sonra = await oku();
  expect(sonra.veri.available).toBe(once.veri.available + 1);
  expect(sonra.govde).not.toContain(KUPON.pano);
});
