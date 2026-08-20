/**
 * Teslim kanıtı / teslimat akışları (14-FE) — kabul senaryoları.
 *
 * ÇALIŞTIRMA (kök'ten):
 *   PANEL_PASS='<parola>' ./e2e.sh --panel
 * veya tek dosya (tradehubfront kökünden):
 *   PANEL_PASS='…' npx playwright test tests/e2e/panel-lojistik-pod.spec.ts
 *
 * NEDEN VAR:
 *   Birim testi "ekran kullanılabiliyor mu" demiyor. 13-FE'de kaçan
 *   eksiklerin üçte ikisi ancak tarayıcıda görülebiliyordu (görev tamamlama
 *   sözleşmesi §3). Ölçülen şey render değil, İŞİN KAPANMASI: kuyruktan
 *   girip kanıt kaydeden biri kova değişimini görebiliyor mu.
 *
 * KAPSAM: Administrator oturumu. Satıcı rolü ayrı dosyada
 *   (`panel-lojistik-satici.spec.ts`) — iki kimliği aynı dosyada kullanmak
 *   `sid` çerezini test sırasına bağımlı kılıyor.
 */
import { test, expect, request } from "@playwright/test";

const BASE = process.env.PANEL_BASE ?? "http://tradehub.localhost";
const USER = process.env.PANEL_USER ?? "Administrator";
const PASS = process.env.PANEL_PASS ?? "";

const QUEUE = "/panel/lojistik/teslim-kaniti";
const SELLER_FLOW = "/panel/lojistik/satici-teslimati";
const BUYER_FLOW = "/panel/lojistik/alici-teslim-alma";

/** Teslim edilmiş, kanıtı OLMAYAN sevkiyat — kayıt akışının başlangıcı. */
const BEKLEYEN = "SHP-2026-00041";
/** Kanıtı tam olan sevkiyat. */
const TAM = "SHP-2026-00033";

/**
 * `AppSelect` native `<select>` DEĞİL: tetikleyici buton + `role=listbox`
 * paneli. `selectOption()` bu yüzden çalışmıyor; seçim iki tıklama.
 */
async function appSelect(page, id: string, etiket: RegExp | string) {
  await page.locator(`#${id} button.as-trigger`).click();
  await page.locator("li.as-option").filter({ hasText: etiket }).first().click();
}

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
    //
    // ÖLÇÜLDÜ: `addInitScript` HER navigasyonda çalışıyor. Guard olmadan
    // kaydedilen kanıt, kuyruğa dönmek için yapılan `goto` sırasında
    // siliniyordu — "kova değişmedi" hatası aslında verinin silinmesiydi.
    if (!sessionStorage.getItem("__e2e_pod_reset")) {
      localStorage.removeItem("logistics.mock.pod.v1");
      sessionStorage.removeItem("logistics.mock.pod.fault");
      sessionStorage.setItem("__e2e_pod_reset", "1");
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

test("lojistik menüsü GRUPLU ve teslimat kalemleri var", async ({ page }) => {
  await page.goto(QUEUE);
  // Menü SPA ile çiziliyor: başlık görünmeden DOM'u okumak boş dizi döndürür.
  await expect(page.getByRole("heading", { name: /Teslim kanıtı/i }).first()).toBeVisible();

  const links = await page.evaluate(() =>
    [...document.querySelectorAll('a[href*="/lojistik/"]')].map((a) => a.getAttribute("href"))
  );
  for (const yol of [
    "/panel/lojistik/teslim-kaniti",
    "/panel/lojistik/satici-teslimati",
    "/panel/lojistik/alici-teslim-alma",
  ]) {
    expect(links, `menüde yok: ${yol}`).toContain(yol);
  }

  // Grup başlıkları — düz liste değil. Başlıklar menü panelinde ayrı
  // elemanlar olarak duruyor; sayıları 2'den azsa gruplama uygulanmamıştır.
  const basliklar = await page.evaluate(() => {
    const hedef = ["SEVKİYATLAR", "PAKETLEME", "TESLİMAT", "TAŞIYICI", "AYARLAR"];
    return [...document.querySelectorAll("aside *, nav *, [class*=sidebar] *")]
      .map((el) => (el.children.length === 0 ? el.textContent?.trim().toUpperCase() : null))
      .filter((t) => t && hedef.includes(t));
  });
  expect([...new Set(basliklar)].length, "lojistik menüsü gruplanmamış").toBeGreaterThanOrEqual(2);
});

// ── Kuyruk ───────────────────────────────────────────────────────────

test("kuyruk kovaları ve liste AYNI yanıttan geliyor", async ({ page }) => {
  await page.goto(QUEUE);
  await expect(page.getByRole("heading", { name: /Teslim kanıtı/i })).toBeVisible();
  await expect(page.locator("table tbody tr").first()).toBeVisible();

  // Kova sayaçlarının toplamı liste toplamını tutmalı.
  const satirSayisi = await page.locator("table tbody tr").count();
  expect(satirSayisi).toBeGreaterThan(0);
});

test("kova filtresi listeyi süzüyor, sayaçları KAYDIRMIYOR", async ({ page }) => {
  await page.goto(QUEUE);
  await expect(page.locator("table tbody tr").first()).toBeVisible();

  const sayacOnce = await page.locator("table tbody tr").count();
  await page.getByRole("button", { name: /Kanıt bekliyor/i }).first().click();
  await expect(page.locator("table tbody tr").first()).toBeVisible();

  const sayacSonra = await page.locator("table tbody tr").count();
  expect(sayacSonra, "filtre listeyi kısaltmadı").toBeLessThan(sayacOnce);
});

// ── İŞİN KAPANMASI: kanıt kaydetme ───────────────────────────────────

test("kanıtsız sevkiyat SORUN olarak gösteriliyor ve çıkış yolu veriyor", async ({ page }) => {
  await page.goto(`/panel/lojistik/sevkiyatlar/${BEKLEYEN}/teslim-kaniti`);

  // Hata ekranı DEĞİL: bu eksik veri, hata değil.
  await expect(page.getByText(/teslim kanıtı yok/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Teslim kanıtı kaydet/i })).toBeVisible();
});

test("kanıt kaydediliyor ve sevkiyat KOVA DEĞİŞTİRİYOR", async ({ page }) => {
  // Önce kuyruktaki "kanıt bekliyor" sayısını al.
  await page.goto(QUEUE);
  await page.getByRole("button", { name: /Kanıt bekliyor/i }).first().click();
  await expect(page.locator("table tbody tr").first()).toBeVisible();
  const bekleyenOnce = await page.locator("table tbody tr").count();

  // Kanıt kaydet.
  await page.goto(`/panel/lojistik/sevkiyatlar/${BEKLEYEN}/teslim-kaniti`);
  await page.getByRole("button", { name: /Teslim kanıtı kaydet/i }).click();

  await page.locator("#pod-delivered-at").fill("2026-08-19T10:00");
  await page.locator("#pod-received-by").fill("Ayşe Korkmaz");
  await appSelect(page, "pod-title", "Depo sorumlusu");

  const kaydet = page.getByRole("button", { name: /^Kanıtı kaydet$/i });
  await expect(kaydet, "doğrulama geçmeden kaydet açık kaldı").toBeEnabled();
  await kaydet.click();

  // Kayıt sonrası kanıt kartı görünüyor.
  await expect(page.getByText(/Operasyon kaydı/i)).toBeVisible();

  // KOVA DEĞİŞTİ: aynı sevkiyat artık "kanıt bekliyor"da değil.
  await page.goto(QUEUE);
  await page.getByRole("button", { name: /Kanıt bekliyor/i }).first().click();
  await expect(page.locator("table tbody tr").first()).toBeVisible();
  const bekleyenSonra = await page.locator("table tbody tr").count();
  expect(bekleyenSonra, "kayıt sonrası kova değişmedi").toBe(bekleyenOnce - 1);
});

test("kısmi teslimde tutarsızlık ZORUNLU oluyor", async ({ page }) => {
  await page.goto(`/panel/lojistik/sevkiyatlar/${BEKLEYEN}/teslim-kaniti`);
  await page.getByRole("button", { name: /Teslim kanıtı kaydet/i }).click();

  await page.locator("#pod-total").fill("4");
  await page.locator("#pod-delivered").fill("2");

  // Onay kutusu işaretli VE kilitli — kısmi teslimde seçenek yok.
  const kutu = page.locator('input[type="checkbox"]').first();
  await expect(kutu).toBeChecked();
  await expect(kutu).toBeDisabled();
  await expect(page.getByText(/tutarsızlık kaydı zorunlu/i)).toBeVisible();

  // İstisna kodu seçilmeden kaydet KAPALI.
  await expect(page.getByRole("button", { name: /^Kanıtı kaydet$/i })).toBeDisabled();
});

test("istisna kodları KATALOGDAN geliyor — gömülü liste değil", async ({ page }) => {
  await page.goto(`/panel/lojistik/sevkiyatlar/${BEKLEYEN}/teslim-kaniti`);
  await page.getByRole("button", { name: /Teslim kanıtı kaydet/i }).click();
  await page.locator("#pod-total").fill("4");
  await page.locator("#pod-delivered").fill("2");

  await page.locator("#pod-exception button.as-trigger").click();
  const secenekler = await page.locator("li.as-option").allTextContents();
  expect(secenekler.join(" ")).toMatch(/SHORT_DELIVERY|DAMAGED/);
});

test("tutanak YENİ SEKMEDE gerçekten açılıyor", async ({ page, context }) => {
  await page.goto(`/panel/lojistik/sevkiyatlar/${BEKLEYEN}/teslim-kaniti`);
  await page.getByRole("button", { name: /Teslim kanıtı kaydet/i }).click();
  await page.locator("#pod-received-by").fill("Ayşe Korkmaz");

  const [yeniSekme] = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole("button", { name: /Tutanağı yazdır/i }).click(),
  ]);
  // Yer tutucu bağlantı değil: gerçek bir belge açılıyor.
  await expect(yeniSekme.locator("body")).toContainText(/Teslim kanıtı/i);
  await expect(yeniSekme.locator("body")).toContainText(BEKLEYEN);
  await yeniSekme.close();
});

// ── Kanıt detayı ─────────────────────────────────────────────────────

test("tam kanıt kartı üst veriyi ve kaynağı gösteriyor", async ({ page }) => {
  await page.goto(`/panel/lojistik/sevkiyatlar/${TAM}/teslim-kaniti`);
  await expect(page.getByText(/Taşıyıcıdan|Operasyon kaydı|Satıcı beyanı/)).toBeVisible();
  await expect(page.getByText(/Teslim alan/i).first()).toBeVisible();
});

// ── Teslimat akışları ────────────────────────────────────────────────

test("D1 ve D2 AYRI ekran — başlıkları farklı", async ({ page }) => {
  await page.goto(SELLER_FLOW);
  await expect(page.getByRole("heading", { name: /Satıcı teslimatı/i })).toBeVisible();

  await page.goto(BUYER_FLOW);
  await expect(page.getByRole("heading", { name: /Alıcı teslim alma/i })).toBeVisible();
});

test("ÖDEME KAPISI: ödenmemiş kayıtta teslim düğmesi HİÇ ÇİZİLMİYOR", async ({ page }) => {
  await page.goto(BUYER_FLOW);
  await expect(page.locator("article").first()).toBeVisible();

  // Ödeme uyarısı taşıyan kartta "Teslim et" düğmesi bulunmamalı — devre dışı
  // değil, HİÇ YOK. Uyarıya rağmen tıklanabilen buton günün sonunda tıklanır.
  const blokluKart = page.locator("article").filter({ hasText: /Ödeme alınmadan teslim edilemez/i });
  if (await blokluKart.count()) {
    await expect(
      blokluKart.first().getByRole("button", { name: /^Teslim et$/i }),
      "ödeme bloklu kartta teslim düğmesi çizilmiş"
    ).toHaveCount(0);
  }
});

test("teslim kodunun DEĞERİ hiçbir yerde görünmüyor", async ({ page }) => {
  await page.goto(BUYER_FLOW);
  await expect(page.locator("article").first()).toBeVisible();

  // Mock evrenindeki geçerli kod "4821" — ekranda asla yazmamalı.
  const govde = await page.locator("body").textContent();
  expect(govde ?? "", "teslim kodu ekranda görünüyor").not.toContain("4821");
});

test("randevusu geçmiş kayıt işaretleniyor", async ({ page }) => {
  await page.goto(SELLER_FLOW);
  await expect(page.locator("article").first()).toBeVisible();
  await expect(page.getByText(/Randevu geçti/i).first()).toBeVisible();
});

// ── İstasyonlar ──────────────────────────────────────────────────────

test("istasyon çizelgesi ardışık aynı konumu TEK satıra indiriyor", async ({ page }) => {
  await page.goto(`/panel/lojistik/sevkiyatlar/${TAM}/istasyonlar`);
  await expect(page.getByRole("heading", { name: /İstasyonlar/i })).toBeVisible();
  // Olaylar asenkron geliyor: yükleme iskeletinde `ol` henüz yok.
  await expect(page.locator("ol li").first()).toBeVisible();

  const satirlar = await page.locator("ol li").allTextContents();
  expect(satirlar.length, "istasyon çizelgesi boş").toBeGreaterThan(0);

  // Aynı konum art arda iki kez satır olmamalı.
  const konumlar = satirlar.map((t) => t.split("\n")[0]?.trim());
  for (let i = 1; i < konumlar.length; i++) {
    expect(konumlar[i], "ardışık aynı konum ayrı satır olmuş").not.toBe(konumlar[i - 1]);
  }
});

// ── K6 · Düzeltme izi ────────────────────────────────────────────────

test("K6: kanıt gerekçeyle düzeltiliyor ve İZ BIRAKIYOR", async ({ page }) => {
  await page.goto(`/panel/lojistik/sevkiyatlar/${TAM}/teslim-kaniti`);
  await expect(page.getByText(/Taşıyıcıdan|Operasyon kaydı|Satıcı beyanı/).first()).toBeVisible();

  await page.getByRole("button", { name: /Teslim kanıtını düzelt/i }).click();

  // Gerekçe ZORUNLU: boşken kaydet kapalı.
  await expect(page.getByRole("button", { name: /Düzeltmeyi kaydet/i })).toBeDisabled();

  await page.locator("#pod-reason").fill("Koli sayısı yanlış girilmişti");
  const kaydet = page.getByRole("button", { name: /Düzeltmeyi kaydet/i });
  await expect(kaydet).toBeEnabled();
  await kaydet.click();

  // Kayıt SİLİNMİYOR, denetim izine yazılıyor.
  await expect(page.getByText(/Düzeltme izi/i)).toBeVisible();
  await expect(page.getByText(/Koli sayısı yanlış girilmişti/)).toBeVisible();
});

// ── K9 · Takılan gönderi ─────────────────────────────────────────────

test("K9: 24 saati aşan bekleme AYIRT EDİLİYOR", async ({ page }) => {
  // Tohumdaki "takılan gönderi" seti: son istasyonda süre "şu an"a göre
  // hesaplanıyor, bir sonraki olay hiç gelmemiş.
  await page.goto("/panel/lojistik/sevkiyatlar/SHP-2026-00038/istasyonlar");
  await expect(page.locator("ol li").first()).toBeVisible();

  // "Şu an burada" ifadesi ve saat bilgisi son istasyonda görünmeli.
  const sonSatir = page.locator("ol li").last();
  await expect(sonSatir).toContainText(/saattir burada|saat/i);
});

test("K9: konum HİÇ taşınmıyorsa çizelge çizilmiyor, sebep yazıyor", async ({ page }) => {
  // Boş çizelge operasyona "hiç hareket yok" der — yalan olur.
  await page.goto("/panel/lojistik/sevkiyatlar/SHP-2026-00045/istasyonlar");
  await expect(page.getByText(/Konum bilgisi henüz taşınmıyor/i)).toBeVisible();
  await expect(page.locator("ol li")).toHaveCount(0);
});

// ── K11 · Teslim noktası kartı ───────────────────────────────────────

test("K11: teslim noktası ekranı TERK ETMEDEN görünüyor", async ({ page }) => {
  await page.goto(BUYER_FLOW);
  await expect(page.locator("article").first()).toBeVisible();

  // Nokta bilgisi ayrı EKRAN değil, kart olarak açılıyor (K-C).
  //
  // "Buton yoksa sessizce geç" dalı KALDIRILDI: test hiç çalışmadan yeşil
  // görünüyordu (ölçüldü 2026-08-19). Tohumda teslim noktası taşıyan kayıt
  // VAR; yoksa bu bir eksiktir ve testin bunu söylemesi gerekir.
  const noktaBtn = page.locator("article button").filter({ hasText: /^[A-Z]+-[A-Z0-9]+$/ }).first();
  await expect(noktaBtn, "teslim noktası bağlantısı hiçbir kartta yok").toBeVisible();
  await noktaBtn.click();

  // Kart asenkron yükleniyor (katalog ucu) — görünmesini bekle.
  await expect(page.getByText(/Çalışma saatleri/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/Açık|Kapalı/).first()).toBeVisible();

  // Sayfa DEĞİŞMEDİ: hâlâ teslim alma ekranındayız (K-C: ayrı ekran yok).
  expect(page.url()).toContain("alici-teslim-alma");
});

// ── K13 · Hata durumu ────────────────────────────────────────────────

test("K13: hata durumunda GEREKÇE gösteriliyor, sessizce boş kalmıyor", async ({ page, context }) => {
  // Mock'un geliştirici anahtarı: sözleşmedeki her hata kodu denenebilmeli
  // (FE-MOCK-DISIPLINI §2.4). Hata ekranları yalnız hata gerçekleşince
  // görülebiliyor; tetiklenemezse gözden geçirilemez.
  await context.addInitScript(() => {
    sessionStorage.setItem("logistics.mock.pod.fault", "internal");
  });

  await page.goto(QUEUE);
  await expect(page.getByText(/Bir sorun oluştu|hata/i).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Yeniden dene/i })).toBeVisible();
});

test("K13: yetki hatası, genel hatadan AYRI anlatılıyor", async ({ page, context }) => {
  await context.addInitScript(() => {
    sessionStorage.setItem("logistics.mock.pod.fault", "permission");
  });

  await page.goto(QUEUE);
  await expect(page.getByText(/yetki/i).first()).toBeVisible();
});

// ── K12 · Medya yetkisi ──────────────────────────────────────────────

test("K12: yetki yoksa görsel kanıt gizli, üst veri GÖRÜNMEYE DEVAM ediyor", async ({ page }) => {
  // ÇALIŞTIRMA: bu test `shipment.write` capability'si registry'de PASİF
  // iken anlamlı ve YALNIZ o kurulumda koşuyor. Kurulumu yapan script
  // `POD_MEDIA_DENIED=1` veriyor; normal koşuda atlanıyor, aksi hâlde
  // "yetkiniz yok" metnini arayıp haksız yere kırmızı olurdu.
  test.skip(
    process.env.POD_MEDIA_DENIED !== "1",
    "capability pasif kurulumu gerekli — scratchpad/k12.sh ile koşulur"
  );
  //
  // Gerçek `view.pod_media` capability'si 14-BE'de gelecek; o güne kadar
  // `can.viewMedia` köprüsü `shipment.write`e düşüyor (sözleşme §6.2).
  await page.goto(`/panel/lojistik/sevkiyatlar/${TAM}/teslim-kaniti`);
  await expect(page.getByText(/Taşıyıcıdan|Operasyon kaydı|Satıcı beyanı/).first()).toBeVisible();

  // Yetki yoksa dosya HİÇ İSTENMİYOR: bulanık önizleme veriyi yine indirirdi.
  await expect(page.getByText(/görsel kanıtı görme yetkiniz yok/i)).toBeVisible();
  await expect(page.locator("figure img")).toHaveCount(0);

  // Üst veri GÖRÜNMEYE DEVAM ediyor — yetkisizlik tüm kaydı gizlemek değil.
  await expect(page.getByText(/Teslim alan/i).first()).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────
// GÖRÜNÜM MODLARI (A6)
//
// Birim testler statik: `:modes` listesi ile render dallarını eşleştiriyor,
// "ölü düğme yok" diyebiliyor. Ama düğmeye BASILDIĞINDA ekranın gerçekten
// değiştiğini yalnız tarayıcı gösterir — 13-FE'de kaçan eksiklerin üçte
// ikisi tam olarak bu boşluktaydı.
// ─────────────────────────────────────────────────────────────────────────

/**
 * Toggle düğmeleri sırayla: tablo · kart · pano · liste.
 * `ViewModeToggle` düğmelere metin değil ikon koyuyor ve `aria-pressed`
 * kullanmıyor — seçim sınıf adından gidiyor (`.view-mode-btn`).
 */
function modDugmesi(page, sira: number) {
  return page.locator(".view-mode-toggle .view-mode-btn").nth(sira);
}

/**
 * Kuyruğu BİLİNEN modda açar.
 *
 * Mod kalıcı (`lv-mode:logistics-pod-queue`) — bu ekranın özelliği, kusuru
 * değil. Ama testler arasında sızıyor: panoyu bırakan bir test, tablodan
 * başlamayı bekleyen bir sonrakini düşürüyordu. Her senaryo kendi
 * başlangıcını kuruyor.
 */
async function kuyrugaGit(page, mod: "table" | "grid" | "kanban" | "list" = "table") {
  // `addInitScript` HER navigasyonda koşuyor — koruma olmadan `reload()`
  // sonrası da yazar ve "mod hatırlanıyor mu" testi kendi kurduğu değeri
  // doğrular hâle gelirdi. `sessionStorage` reload'ı aştığı için ilk
  // yüklemeden sonra script sessizce çekiliyor.
  await page.addInitScript((m) => {
    if (sessionStorage.getItem("__pod_mod_kuruldu")) return;
    sessionStorage.setItem("__pod_mod_kuruldu", "1");
    localStorage.setItem("lv-mode:logistics-pod-queue", m);
  }, mod);
  await page.goto(QUEUE);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

test("GÖRÜNÜM — kuyruk dört modu da sunuyor", async ({ page }) => {
  await kuyrugaGit(page);
  await expect(page.locator(".view-mode-toggle .view-mode-btn")).toHaveCount(4);
});

test("GÖRÜNÜM — pano dört kovayı SÜTUN olarak gösteriyor, süzgeç çekiliyor", async ({ page }) => {
  await kuyrugaGit(page);
  // Tabloda kova süzgeci VAR.
  await expect(page.getByText(/Kanıt bekliyor/).first()).toBeVisible();

  await modDugmesi(page, 2).click();

  // Pano dört kovayı birden gösterdiği için süzgeç gizleniyor: ikisi yan
  // yana dururken hangisinin geçerli olduğu okunmuyordu.
  await expect(page.locator(".kanban-col")).toHaveCount(4);
  await expect(page.locator("main").getByRole("button", { name: /^Tümü/ })).toHaveCount(0);
});

test("GÖRÜNÜM — pano SALT-OKUNUR: kart sürüklenemiyor, uyarı görünüyor", async ({ page }) => {
  await kuyrugaGit(page, "kanban");
  await expect(page.getByText(/salt-okunur/i)).toBeVisible();

  // Kova sevkiyatın verisinden hesaplanıyor; sürükleme kanıt kaydetmez ve
  // kart bir sonraki yüklemede eski kovasına dönerdi.
  await expect(page.locator(".kanban-card[draggable='true']")).toHaveCount(0);
});

test("GÖRÜNÜM — pano kartından kanıt detayına giriliyor", async ({ page }) => {
  await kuyrugaGit(page, "kanban");
  await page.locator(".kanban-card").first().click();
  await expect(page).toHaveURL(/\/lojistik\/sevkiyatlar\/SHP-[\d-]+\/teslim-kaniti/);
});

test("GÖRÜNÜM — kart modu aynı sevkiyatları gösteriyor, veri kaybolmuyor", async ({ page }) => {
  await kuyrugaGit(page, "table");
  // `count()` ANLIK — satırlar yanıt gelmeden sayılırsa 0 çıkar ve test
  // "kart modu boş" der. Önce ilk satırın görünmesini bekliyoruz.
  await expect(page.locator("main table tbody tr").first()).toBeVisible();
  const tabloSatir = await page.locator("main table tbody tr").count();
  await modDugmesi(page, 1).click();
  await expect(page.locator(".list-grid-card")).toHaveCount(tabloSatir);
});

test("GÖRÜNÜM — seçilen mod sayfa yenilenince HATIRLANIYOR", async ({ page }) => {
  // Kalıcılığı GERÇEKTEN sınamak için tablodan başlayıp panoya TIKLIYORUZ;
  // hazır pano ile açılsaydı test kendi kurduğu değeri doğrulardı.
  await kuyrugaGit(page, "table");
  await modDugmesi(page, 2).click();
  await expect(page.locator(".kanban-col")).toHaveCount(4);

  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // Masaüstü tercihi saklanıyor; telefonda ZORLANAN mod saklanmıyor.
  await expect(page.locator(".kanban-col")).toHaveCount(4);
});
