/**
 * Fiyatlandırma (20-FE) — kabul senaryoları · ADMIN oturumu.
 *
 * ÇALIŞTIRMA (kök'ten):
 *   PANEL_PASS='<parola>' ./e2e.sh --panel
 * veya tek dosya (tradehubfront kökünden):
 *   PANEL_PASS='…' npx playwright test tests/e2e/panel-lojistik-fiyatlandirma.spec.ts
 *
 * NEDEN VAR:
 *   Birim testi "fonksiyon doğru mu" der, "ekran kullanılabiliyor mu" DEMEZ.
 *   13-FE'de kaçan dokuz eksiğin altısı ancak tarayıcıda görülebiliyordu
 *   (görev tamamlama sözleşmesi §3). Ölçülen şey render değil, İŞİN KAPANMASI.
 *
 *   Her test analiz raporundaki bir KABUL SENARYOSUNUN karşılığı
 *   (`docs/lojistik/20-FE-fiyatlandirma-ANALIZ.md` §5) — senaryo numarası
 *   testin başlığında.
 *
 * KAPSAM: Administrator oturumu. Satıcı rolü AYRI dosyada
 *   (`panel-lojistik-satici.spec.ts`) — iki kimliği aynı dosyada kullanmak
 *   `sid` çerezini test sırasına bağımlı kılıyor (ölçülmüş flaky sebebi).
 */
import { readFileSync } from "node:fs";

import { test, expect, request } from "@playwright/test";

const BASE = process.env.PANEL_BASE ?? "http://tradehub.localhost";
const USER = process.env.PANEL_USER ?? "Administrator";
const PASS = process.env.PANEL_PASS ?? "";

const TARIFELER = "/panel/lojistik/tarifeler";
const KURALLAR = "/panel/lojistik/fiyat-kurallari";
const SIMULASYON = "/panel/lojistik/fiyat-simulasyonu";

/** Platformun İç Anadolu tarifesi — çakışma senaryosunun bir ucu. */
const PLATFORM_KURAL = "Standart Kargo · İç Anadolu";
/** Satıcının kendi Aras anlaşması — kullanımda olduğu için silinemiyor. */
const SATICI_KURAL = "Doğu Anadolu · Aras anlaşmam";

test.use({ baseURL: BASE });
test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ context }) => {
  if (!PASS) test.skip(true, "PANEL_PASS env değişkeni gerekli.");

  const api = await request.newContext({ baseURL: BASE });
  const res = await api.post("/api/method/login", { form: { usr: USER, pwd: PASS } });
  expect(res.ok(), "Frappe login başarısız — kullanıcı/parola?").toBeTruthy();
  const { cookies } = await api.storageState();
  await context.addCookies(cookies);

  await context.addInitScript(() => {
    localStorage.setItem("th-lang", "tr");
    // Mock durumu testler ARASINDA taşınmasın ama test İÇİNDE korunsun.
    // `addInitScript` HER navigasyonda çalışıyor; guard olmadan kaydedilen
    // kural, listeye dönmek için yapılan `goto` sırasında siliniyor ve
    // "kayıt durmadı" hatası aslında verinin silinmesi oluyordu (14-FE ölçümü).
    if (!sessionStorage.getItem("__e2e_pricing_reset")) {
      localStorage.removeItem("logistics.mock.pricing.v1");
      sessionStorage.removeItem("logistics.mock.pricing.fault");
      sessionStorage.setItem("__e2e_pricing_reset", "1");
    }
    // Rehberli tur overlay'i tıklamayı yutuyor — hiç başlatma.
    localStorage.setItem(
      "panel_tour_seen_v5",
      JSON.stringify([
        "dashboard", "catalog", "commerce", "logistics", "sellers", "crm",
        "helpdesk", "system", "store", "products", "orders", "management", "messaging",
      ])
    );
  });
});

// ── Menü ve erişim ───────────────────────────────────────────────────

test("lojistik menüsünde FİYATLANDIRMA grubu ve üç kalem var", async ({ page }) => {
  await page.goto(TARIFELER);
  // Menü SPA ile çiziliyor: başlık görünmeden DOM'u okumak boş dizi döndürür.
  await expect(page.getByRole("heading", { name: /Kargo tarifeleri/i }).first()).toBeVisible();

  const links = await page.evaluate(() =>
    [...document.querySelectorAll('a[href*="/lojistik/"]')].map((a) => a.getAttribute("href"))
  );
  for (const yol of [TARIFELER, KURALLAR, SIMULASYON]) {
    expect(links, `menüde yok: ${yol}`).toContain(yol);
  }

  // Kural FORMU menüde OLMAMALI — parametreli detay rotası listeden açılıyor.
  expect(links.some((h) => h?.includes("/fiyat-kurallari/"))).toBeFalsy();
});

// ── S1 · Kural oluşturma ve KALICILIK ────────────────────────────────

test("S1 · fiyat yöneticisi yeni tarife tanımlayıp kaydedebiliyor; kayıt YENİLEMEDE duruyor", async ({ page }) => {
  await page.goto(KURALLAR);
  await page.getByRole("button", { name: /Yeni kural/i }).click();

  // Boş formdan başlatma YOK — önce şablon (CLAUDE.md §4.14b).
  await expect(page.getByText(/Nasıl bir kural kuracaksın/i)).toBeVisible();
  await page.getByText(/Desi tarifesi/i).first().click();

  // `input[type=text]` KULLANILAMAZ: panelin global arama kutusu da öyle ve
  // ilk sırada duruyor (ölçüldü — kural adı hiç dolmuyor, kayıt adsız gidiyordu).
  const ad = `E2E · Ege bölgesi ${Date.now()}`;
  await page.getByLabel(/Kural adı/).fill(ad);

  // Kademeler şablondan geldi; ilk kademeye satış fiyatı gir.
  const satisSutunu = page.locator("table").first().locator("tbody tr").first().locator("input");
  await satisSutunu.nth(3).fill("150");

  await page.getByRole("button", { name: /^Kaydet$/i }).click();

  // Liste dönüşü: kayıt görünmeli.
  await expect(page.getByText(ad).first()).toBeVisible({ timeout: 10_000 });

  // KALICILIK: yenile, hâlâ dursun. Mock localStorage'da tutuyor; guard
  // sayesinde `goto` onu silmiyor.
  await page.reload();
  await expect(page.getByText(ad).first()).toBeVisible({ timeout: 10_000 });
});

// ── S2 · Çakışma görünür ve DÜZELTİLEBİLİR ───────────────────────────

test("S2 · aynı önceliği paylaşan iki kural KIRMIZI uyarı veriyor", async ({ page }) => {
  await page.goto(KURALLAR);
  await expect(page.getByRole("heading", { name: /Fiyatlandırma kuralları/i })).toBeVisible();

  // Tohumda BİLEREK var: PR-STD-YK ile PR-STD-YK-ESKI aynı katmanda #10.
  const uyari = page.getByText(/önceliğini başka bir kuralla paylaşıyor/i);
  await expect(uyari.first()).toBeVisible();

  // Uyarı SEBEBİ söylüyor, "hata var" demiyor: hangi öncelik çakışıyor yazılı.
  await expect(uyari.first()).toContainText("#10");
});

test("S2c · öncelik SÜRÜKLEYEREK değişiyor ve yenilemede duruyor", async ({ page }) => {
  // Kabul senaryosu S2'nin ikinci yarısı: "önceliği sürükleyerek
  // düzeltebilmeli" (CLAUDE.md §4.14e — göreli değer yazdırılmaz, taşınır).
  // Kırmızı uyarıyı görmek yeterli değil; DÜZELTME yolu da çalışmalı.
  //
  // Bu test yazılırken sürüklemenin HİÇ kaydedilmediği bulundu: liste yükü
  // alt tabloları taşımadığı için tüm belgeyi geri gönderen kayıt isteği
  // "En az bir kademe gerekli" ile reddediliyordu. Ayrı sıralama ucu açıldı.
  await page.goto(KURALLAR);
  await expect(page.getByRole("heading", { name: /Fiyatlandırma kuralları/i })).toBeVisible();

  // Katmanlar SABİT sırada çiziliyor (S2b bunu ayrıca doğruluyor): zorunlu ·
  // satıcı · platform. Üçüncüsü admin'in sürükleyebildiği katman — satıcı
  // katmanında tutamak YOK, admin başkasının kuralını sıralayamaz.
  const katman = page.locator("section").nth(2);
  await expect(katman).toContainText("Platform kuralları");

  const kartlar = katman.locator("article");
  await expect(kartlar.nth(1)).toBeVisible({ timeout: 10_000 });
  // Kartın ilk satırları SIRA ROZETİ ("1", "2"…) — sürükleme sonrası zaten
  // değişiyorlar. Karşılaştırma KURAL ADIna bakmalı: harf içeren ilk satır.
  const ad = (metin: string) =>
    metin.split("\n").find((satir) => /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(satir)) ?? metin;
  const once = (await kartlar.allInnerTexts()).map(ad);
  expect(once.length, "platform katmanında iki karttan az var").toBeGreaterThan(1);

  // GÖRÜŞ ALANINA AL: `boundingBox()` sayfa koordinatı veriyor, `page.mouse`
  // ise görüş alanı koordinatı bekliyor. Kart aşağıdayken fare olayları
  // pencerenin dışına düşüyor ve sürükleme HİÇ başlamıyor (ölçüldü).
  await kartlar.nth(1).scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  // SortableJS HTML5 DnD kullanmıyor — `dragTo` işe yaramıyor, fare
  // olaylarını elle üretmek gerekiyor.
  const tutamak = kartlar.nth(1).locator(".rule-grip");
  await expect(tutamak).toBeVisible();
  const kaynak = await tutamak.boundingBox();
  const hedef = await kartlar.nth(0).boundingBox();
  await page.mouse.move(kaynak!.x + kaynak!.width / 2, kaynak!.y + kaynak!.height / 2);
  await page.mouse.down();
  await page.mouse.move(kaynak!.x + kaynak!.width / 2, kaynak!.y + kaynak!.height / 2 - 8, {
    steps: 4,
  });
  await page.mouse.move(hedef!.x + hedef!.width / 2, hedef!.y + hedef!.height / 3, { steps: 15 });
  await page.mouse.up();

  // Sıra DEĞİŞTİ ve KAYDEDİLDİ — yenilemeden sonra da yeni sırada.
  await expect
    .poll(async () => (await kartlar.allInnerTexts()).map(ad)[0], { timeout: 10_000 })
    .not.toBe(once[0]);
  await page.reload();
  await expect(kartlar.nth(1)).toBeVisible({ timeout: 10_000 });
  const sonra = (await kartlar.allInnerTexts()).map(ad);
  expect(sonra[0], "sürükleme yenilemede kaybolmuş").toBe(once[1]);
  expect(sonra[1], "yer değiştiren kural ikinci sıraya inmemiş").toBe(once[0]);
});

test("S2b · üç KATMAN ayrı başlıklarla çiziliyor", async ({ page }) => {
  await page.goto(KURALLAR);
  for (const baslik of [/Zorunlu platform kuralları/i, /Satıcı kuralları/i, /Platform kuralları/i]) {
    await expect(page.getByText(baslik).first()).toBeVisible();
  }
  // Katman sırası ANLAMLI — zorunlu en üstte olmalı.
  const sira = await page.evaluate(() => {
    const metin = document.body.innerText;
    return [
      metin.indexOf("Zorunlu platform kuralları"),
      metin.indexOf("Satıcı kuralları"),
      metin.indexOf("Platform kuralları"),
    ];
  });
  expect(sira[0], "zorunlu katman en üstte değil").toBeLessThan(sira[1]);
  expect(sira[1], "satıcı katmanı platformdan sonra").toBeLessThan(sira[2]);
});

// ── S3 · Negatif marj — YÖNE BAĞLI ───────────────────────────────────

test("S3 · satıcının ZARARI admin'e gösterilmiyor (maskeleme yönü)", async ({ page }) => {
  await page.goto(TARIFELER);
  await expect(page.getByRole("heading", { name: /Kargo tarifeleri/i })).toBeVisible();

  // Tohumda "İstanbul içi · kendi aracım" zararda (alış 80, satış 0) — ama bu
  // SATICININ kuralı ve maliyeti platforma kapalı (sözleşme §7.2). Rozet
  // marjdan türetildiği için o da görünmemeli.
  //
  // Bu testin ilk hâli rozetin GÖRÜNMESİNİ bekliyordu ve düştü; ölçüm
  // ekranın doğru, testin yanlış olduğunu gösterdi. Pozitif hâli satıcı
  // oturumunda (`panel-lojistik-satici.spec.ts` · S3b).
  await expect(page.getByText(/zararda/i), "satıcının zararı admin'e sızıyor").toHaveCount(0);

  // Maskeleme SESSİZ değil: kapalı alan gerekçesini söylüyor.
  await expect(page.locator('[title*="platforma kapalı"]').first()).toBeVisible();
});

// ── S5 · Formda CANLI HESAP ──────────────────────────────────────────

test("S5 · kural formu kaydetmeden fiyatı hesaplıyor", async ({ page }) => {
  await page.goto(KURALLAR);
  // Satır TIKLANABİLİR DEĞİL: açma eylemi düğmede. Admin satıcı kuralında
  // "İncele" görüyor (düzenleyemiyor), platform kuralında "Düzenle".
  await page
    .locator("article")
    .filter({ hasText: SATICI_KURAL })
    .first()
    .getByRole("button", { name: /İncele|Düzenle/ })
    .click();

  await expect(page.getByText(/Bu kuralla ne olur/i)).toBeVisible({ timeout: 10_000 });
  // Canlı panel: alıcının ödeyeceği tutar KAYDETMEDEN görünüyor.
  await expect(page.getByText(/Alıcı öder/i)).toBeVisible();
  const tutar = await page.getByText(/Alıcı öder/i).locator("xpath=following::*[1]").innerText();
  expect(tutar, "canlı hesap tutar üretmiyor").toMatch(/\d/);
});

// ── S4 · ZORUNLU kural satıcı kuralını EZİYOR ────────────────────────

test("S4 · zorunlu platform kuralı simülasyonda satıcı kuralını eziyor ve iz bunu SÖYLÜYOR", async ({ page }) => {
  await page.goto(SIMULASYON);
  await expect(page.getByRole("heading", { name: /Fiyat simülasyonu/i })).toBeVisible();

  // Sipariş tutarını eşiğin ÜSTÜNE çıkar → ücretsiz kargo kampanyası devreye girer.
  await page.getByLabel(/Sipariş tutarı/i).fill("6000");
  await page.getByRole("button", { name: /Hesapla/i }).click();

  const iz = page.getByText(/Neden bu fiyat çıktı/i);
  await expect(iz).toBeVisible({ timeout: 10_000 });

  // Ezilen kural izde DURUYOR — sessizce kaybolmuyor.
  await expect(page.getByText("OVERRIDDEN_BY_MANDATORY").first()).toBeVisible();
});

// ── S10 · GERÇEK SİPARİŞTEN gerekçe ──────────────────────────────────

test("S10 · destek gerçek siparişi seçince değerler OTOMATİK doluyor", async ({ page }) => {
  await page.goto(SIMULASYON);
  await page.getByRole("button", { name: /Gerçek sipariş/i }).click();
  await page.getByRole("button", { name: /Hesapla/i }).click();

  // Sunucunun DOLDURDUĞU değerler ekranda; kullanıcı elle girmedi.
  await expect(page.getByText(/otomatik doldu/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/desi/i).first()).toBeVisible();

  // Her elenen kuralın SEBEBİ var — "eşleşmedi" tek başına yetmiyor.
  const kodlar = await page.evaluate(() =>
    [...document.querySelectorAll("code")].map((c) => c.textContent?.trim()).filter(Boolean)
  );
  expect(kodlar.some((k) => /^[A-Z_]+$/.test(k ?? "")), "gerekçe KODU hiç yok").toBeTruthy();
});

// ── Taşıyıcı karşılaştırma ───────────────────────────────────────────

test("kullanılamayan taşıyıcı listeden DÜŞMÜYOR, sebebiyle duruyor", async ({ page }) => {
  await page.goto(SIMULASYON);
  await page.getByRole("button", { name: /Hesapla/i }).click();
  await expect(page.getByText(/Taşıyıcı seçenekleri/i)).toBeVisible({ timeout: 10_000 });

  // Boş liste "PTT neden yok?" sorusunu cevaplayamaz.
  await expect(page.getByText("NO_RULE_MATCHED").first()).toBeVisible();
});

// ── S11 · Kullanımdaki kural SİLİNMİYOR ──────────────────────────────

test("S11 · kullanımdaki kural silinemiyor, PASİFLEŞTİRME öneriliyor", async ({ page }) => {
  await page.goto(KURALLAR);
  // Satıcı kuralı admin'e salt-okunur; silme akışını PLATFORM kuralında dene.
  const satir = page.locator("article").filter({ hasText: PLATFORM_KURAL }).first();
  await satir.getByRole("button", { name: /^Sil$/i }).click();

  await expect(page.getByText(/Bu kuralı silmek istiyor musun/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Pasifleştir/i })).toBeVisible();
});

// ── S12 · Hata ekranları TETİKLENEBİLİR ──────────────────────────────

test("S12 · DEMO panelinden yetki hatası tetiklenip ekranda görülebiliyor", async ({ page }) => {
  await page.goto(TARIFELER);
  await page.getByText(/Demo verisi ve hata senaryoları/i).click();
  await page.getByRole("button", { name: /^Yetki yok$/i }).click();

  await page.reload();
  // Hata YUTULMUYOR: kullanıcı yetkisi mi yok, veri mi yok anlayabiliyor.
  await expect(page.getByText(/yetkiniz yok/i).first()).toBeVisible({ timeout: 10_000 });

  // Tetikleyiciyi kapat — sıradaki testler temiz başlasın.
  await page.evaluate(() => sessionStorage.removeItem("logistics.mock.pricing.fault"));
});

// ── Boş durum KENDİ NEDENİNİ anlatıyor ───────────────────────────────

test("filtreyle boşalan liste 'bu filtrede yok' diyor, 'kayıt yok' demiyor", async ({ page }) => {
  await page.goto(TARIFELER);
  // Panelin GLOBAL arama kutusu da `/ara/i` ile eşleşiyor — ekranın kendi
  // kutusu tam metniyle seçiliyor.
  await page.getByPlaceholder(/Kural adı veya taşıyıcı/i).fill("kesinlikle-olmayan-kural-xyz");
  await expect(page.getByText(/filtre/i).first()).toBeVisible({ timeout: 10_000 });
});

// ── Gerçek çıktı: simülasyon CSV'si ──────────────────────────────────
//
// `FE-MOCK-DISIPLINI.md` §2.3: mock "üretilen belge" iddiasında bulunuyorsa
// belge GERÇEKTEN inmeli. `#yer-tutucu` bağlantı yasak — bu test onun kapısı.

test("S14 · simülasyon sonucu CSV olarak İNİYOR ve içi dolu", async ({ page }) => {
  await page.goto(SIMULASYON);
  await expect(page.getByRole("heading", { name: /Fiyat simülasyonu/i })).toBeVisible();

  await page.getByRole("button", { name: /Hesapla/i }).click();
  await expect(page.getByText(/Neden bu fiyat çıktı/i)).toBeVisible({ timeout: 10_000 });

  const inecek = page.waitForEvent("download", { timeout: 15_000 });
  await page.getByRole("button", { name: /CSV/i }).click();
  const dosya = await inecek;

  expect(dosya.suggestedFilename(), "dosya adı tarihli olmalı").toMatch(
    /fiyat-simulasyonu-\d{4}-\d{2}-\d{2}\.csv/
  );

  // "İndi" yetmez — İÇİ de dolu olmalı. Boş bir CSV de sorunsuz iner.
  const yol = await dosya.path();
  const icerik = readFileSync(yol!, "utf8");
  const satirlar = icerik.trim().split("\n");
  expect(satirlar.length, "CSV'de başlık dışında satır yok").toBeGreaterThan(1);
  // Ekranda görünen taşıyıcılar dosyada da olmalı — ekran ile belge ayrışmasın.
  expect(icerik).toMatch(/Kargo|Yurtiçi|MNG|Aras|PTT/);
});



// ── Görsel regresyon bekçileri ───────────────────────────────────────
//
// Üçü de kullanıcı tarafından ekranda görülüp bildirildi (21 Ağustos 2026).
// Hiçbiri build'i, birim testi ya da kontrast taramasını kırmıyordu —
// "render oluyor" ile "doğru duruyor" farkının somut örnekleri.

test("R1 · başlık bandı KOYU temada gri bant bırakmıyor", async ({ page }) => {
  // Tuzak: `base.scss:154` global `header { background-color: $d-bg-card
  // !important }`. Başlığı `<header>` ile sarmak koyu temada sayfa zemininden
  // ayrı bir bant üretiyor. Aynı tuzağa `LabelPrintView` de düşmüştü.
  await page.context().addInitScript(() => localStorage.setItem("th-theme", "dark"));
  await page.goto(TARIFELER);
  await expect(page.getByRole("heading", { name: "Kargo tarifeleri" })).toBeVisible();

  const bant = await page.evaluate(() => {
    const sarmal = document.querySelector("main h1")!.closest("div.flex")!;
    return { etiket: sarmal.tagName, bg: getComputedStyle(sarmal).backgroundColor };
  });
  expect(bant.etiket, "başlık yeniden <header> oldu — global kural bandı geri getirir").toBe("DIV");
  expect(["rgba(0, 0, 0, 0)", "transparent"]).toContain(bant.bg);
});

test("R2 · arama ikonu kutunun İÇİNDE duruyor", async ({ page }) => {
  // `inset-inline-start-3` diye bir Tailwind sınıfı YOK; sessizce düşüyor ve
  // `position:absolute` ikonu sol kenara yapıştırıyordu. Doğrusu `start-3`.
  await page.goto(TARIFELER);
  await expect(page.getByPlaceholder(/Kural adı veya taşıyıcı/i)).toBeVisible();

  const o = await page.evaluate(() => {
    const inp = document.querySelector('input[type="search"]')!;
    const sarmal = inp.parentElement!;
    return {
      bosluk: sarmal.querySelector("svg")!.getBoundingClientRect().x - sarmal.getBoundingClientRect().x,
      ps: parseFloat(getComputedStyle(inp).paddingInlineStart),
    };
  });
  expect(o.bosluk, "ikon kutunun sol kenarına yapışık").toBeGreaterThan(6);
  expect(o.bosluk, "ikon metin alanına taşıyor").toBeLessThan(o.ps);
});

test("R3 · şablon seçim kartı ortalanmış", async ({ page }) => {
  await page.goto(`${KURALLAR}/yeni`);
  await expect(page.getByText(/Nasıl bir kural kuracaksın/i)).toBeVisible();

  const o = await page.evaluate(() => {
    const kart = document.querySelector("main .card")!;
    const k = kart.getBoundingClientRect();
    const p = kart.parentElement!.getBoundingClientRect();
    return { sol: k.left - p.left, sag: p.right - k.right };
  });
  expect(Math.abs(o.sol - o.sag), "tek kart geniş ekranda sola yapışık").toBeLessThan(2);
});
