/**
 * T-141 — kritik medya senaryolarının VİTRİN (storefront) yarısı.
 *
 * ŞARTNAME: docs `72-faz14-test-kabul.html` → T-141, 12 senaryo.
 *
 * BU DOSYANIN SINIRI — ÖNEMLİ
 * ---------------------------
 * Şartnamenin 12 senaryosunun çoğu SATICI MEDYA KONSOLU'nda geçiyor (yükle →
 * kırp/odak → cihaz sınıflarını önizle → onayla). O konsol bu depoda DEĞİL:
 * `admin-panel/frontend/src/views/seller/SellerMediaExplorerView.vue`,
 * `components/media/crop/CropStudioModal.vue`, `composables/useSimulatorApproval.js`,
 * `lib/media/upload/session.js`, `utils/uploadPolicy.js`. tradehubfront'un
 * Playwright'ı `http://localhost:5173` (Vite storefront) üzerinde koşar;
 * admin-panel oraya servis edilmiyor.
 *
 * Vitrin, boru hattının TÜKETİCİ ucudur. Burada koşan testler senaryoların
 * "kullanıcıya ne ulaşıyor" yarısını doğrular ve şunu kanıtlar:
 *   · türev üretildiğinde `<picture>` + srcset + içsel ölçü basılır,
 *   · türev YOKKEN / uç ÖLÜKKEN vitrin bugünkü tek `<img>` yolunda kalır.
 *
 * Üretim yarısı (gerçekten 2400×2400 @72dpi mi üretildi, VMAF ≥ 93 mü) bu
 * katmandan ÖLÇÜLEMEZ — o backend/pipeline testlerinin işi. Bu dosya hiçbir
 * yerde "türev üretildi" DEMİYOR; yalnızca "manifest bunu bildirdiğinde vitrin
 * şunu basıyor" diyor.
 *
 * SÜRE/PERFORMANS İDDİASI YOK: LCP, byte, süre ölçülmüyor. Yalnız yapı.
 *
 * Backend lokalde ayakta değil — `page.route()` ile mock'lanır (bu paketin
 * mevcut deseni: bkz. `listing-cache.spec.ts`, `product-detail-layout.spec.ts`).
 */
import { expect, test, type Page, type Route } from "@playwright/test";

import { galeriKaydi, gorselManifesti, kapaliYanit, manifestYaniti } from "./fixtures/media-manifest";

const ILAN = "LST-MEDIA-0001";
const ANA = "/files/urun-ana.jpg";
const IKINCI = "/files/urun-ikinci.jpg";

function urun(images: string[]): Record<string, unknown> {
  return {
    id: ILAN,
    slug: "medya-test-urunu",
    title: "Medya Test Ürünü",
    category: ["Hırdavat"],
    images,
    priceTiers: [{ minQty: 1, maxQty: 99, price: 100 }],
    currency: "USD",
    moq: 1,
    unit: "adet",
    description: "T-141 medya teslim senaryoları için örnek ürün.",
    specs: [],
    packagingSpecs: [],
    reviewCount: 0,
    rating: 0,
    supplier: {
      name: "Test Tedarikçi",
      display_name: "Test Tedarikçi",
      kybVerified: true,
      country: "TR",
    },
  };
}

/**
 * Medya DIŞI uçların gövdesi. Bu testlerin konusu değil, ama şekli yanlış
 * olursa sayfa medyayla ilgisiz bir yerde patlar ve `pageerror` iddiaları
 * gürültüye boğulur — bu yüzden başlıktaki sepet ucu gerçek alan adlarıyla
 * (boş) yanıtlanır.
 */
function genelYanit(url: string): Record<string, unknown> {
  // Birleşik arama önerisi `message.data`yı NESNE bekler (searchService.ts:68);
  // dizi verilirse başlık `data.products.map` üzerinden patlar.
  if (url.includes("search.unified_suggest")) {
    return { message: { data: { products: [], categories: [], brands: [], sellers: [] } } };
  }
  // "Her şeyi boş" zarfı: başlıktaki sepet (`suppliers`) ve arama önerisi
  // (`products/categories/brands/sellers`) alanları YOKSA `.map` üzerinden
  // patlar ve medyayla ilgisiz bir `pageerror` üretir. Boş dizi vermek hiçbir
  // şey uydurmaz — yalnız "sonuç yok" der.
  return {
    message: {
      data: [],
      csrf_token: "None",
      suppliers: [],
      products: [],
      categories: [],
      brands: [],
      sellers: [],
    },
  };
}

interface KurguSecenek {
  images?: string[];
  /** `null` → uç 500 döner (S11: depo/uç düştü). */
  manifest: unknown | null;
  onManifestRequest?: (url: string) => void;
}

async function kur(page: Page, opts: KurguSecenek): Promise<void> {
  const govde = urun(opts.images ?? [ANA]);
  await page.route("**/api/method/**", (route: Route) => {
    const url = route.request().url();
    if (url.includes("get_listing_detail")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: { data: govde } }),
      });
    }
    if (url.includes("media_manifest.get_manifest_batch")) {
      opts.onManifestRequest?.(url);
      if (opts.manifest === null) {
        return route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ exception: "storage backend unavailable" }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(opts.manifest),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(genelYanit(url)),
    });
  });
}

/** Sayfadaki her galeri görselinin adresi + `<picture>` içinde olup olmadığı. */
async function galeriDurumu(
  page: Page
): Promise<Array<{ src: string; srcset: string; picture: boolean; w: string; h: string }>> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLImageElement>("img.gallery-media-asset")).map((i) => ({
      src: i.getAttribute("src") || "",
      srcset: i.getAttribute("srcset") || "",
      picture: i.parentElement?.tagName === "PICTURE",
      w: i.getAttribute("width") || "",
      h: i.getAttribute("height") || "",
    }))
  );
}

/** `<img>` ya da `<source>` srcset'indeki en büyük `w` tanımlayıcısı. */
function enBuyukW(srcset: string): number {
  let enb = 0;
  for (const parca of srcset.split(",")) {
    const m = parca.trim().match(/\s(\d+)w$/);
    if (m) enb = Math.max(enb, Number(m[1]));
  }
  return enb;
}

/** Ana görselin `<picture>` düğümü — ürün detayın LCP adayı. */
function anaPicture(page: Page) {
  return page.locator("#gallery-main-image > picture");
}

function anaImg(page: Page) {
  return page.locator("#gallery-main-image img.gallery-media-asset--large");
}

// ─────────────────────────────────────────────────────────────────────────
// Senaryo 3 — "18 MP / 1 MB görsel yüklenir → piksel tavanı uygulanır"
// Vitrin yarısı: tavan uygulanmış türev bildirildiğinde ürün sayfası ham
// 18 MP dosyayı DEĞİL, tavanlanmış türevi ister. LCP SAYISI ÖLÇÜLMEZ.
// ─────────────────────────────────────────────────────────────────────────
test("[FR-123] S3 vitrin yarısı — piksel tavanı uygulanmış türev bildirildiğinde ürün sayfası ham dosyayı istemez", async ({
  page,
}) => {
  // 18 MP kaynak: 5184×3456. Tavan 2400 uzun kenar → 2400×1600 türev.
  const man = gorselManifesti(ANA, [384, 768, 1200, 2400], [2400, 1600]);
  await kur(page, { manifest: manifestYaniti(ILAN, [galeriKaydi(ANA, man, true)]) });

  await page.goto(`/pages/product-detail.html?id=${ILAN}`);
  await expect(anaPicture(page)).toHaveCount(1);

  const img = anaImg(page).first();
  const srcset = (await img.getAttribute("srcset")) || "";
  const src = (await img.getAttribute("src")) || "";

  // Ham 18 MP dosya HİÇBİR adayda geçmemeli — tavan tam da bunu engelliyor.
  expect(src).not.toBe(ANA);
  expect(srcset).not.toContain(`${ANA} `);
  // Hiçbir aday tavanı aşmaz.
  expect(enBuyukW(srcset)).toBeLessThanOrEqual(2400);

  // AVIF → WebP → JPEG sırası korunur; son biçim `<img srcset>`te taşınır.
  const tipler = await anaPicture(page).locator("source").evaluateAll((n) =>
    n.map((s) => s.getAttribute("type"))
  );
  expect(tipler).toEqual(["image/avif", "image/webp"]);
  for (const t of await anaPicture(page).locator("source").evaluateAll((n) =>
    n.map((s) => s.getAttribute("srcset") || "")
  )) {
    expect(enBuyukW(t)).toBeLessThanOrEqual(2400);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// Senaryo 2 — "3000×3000 @300 dpi → 2400×2400 @72 dpi, çözünürlük düşmez"
// Vitrin yarısı: tavan ölçüsü İÇSEL ölçü olarak yazılır (CLS=0) ve srcset
// tavana kadar aday taşır. dpi vitrinden görünmez — ölçülmez, iddia edilmez.
// ─────────────────────────────────────────────────────────────────────────
test("[FR-121][FR-124] S2 vitrin yarısı — 2400×2400 türev içsel ölçüsüyle ve tavana kadar srcset'le basılır", async ({
  page,
}) => {
  const man = gorselManifesti(ANA, [384, 768, 1200, 2400], [2400, 2400]);
  await kur(page, { manifest: manifestYaniti(ILAN, [galeriKaydi(ANA, man, true)]) });

  await page.goto(`/pages/product-detail.html?id=${ILAN}`);
  const img = anaImg(page).first();
  await expect(img).toHaveAttribute("width", "2400");
  await expect(img).toHaveAttribute("height", "2400");
  // Oran 1:1 — kırpılmadı.
  expect(Number(await img.getAttribute("width"))).toBe(Number(await img.getAttribute("height")));
  // Tavan adayı gerçekten sunuluyor; ara basamaklar da var.
  const srcset = (await img.getAttribute("srcset")) || "";
  expect(srcset).toContain("2400w");
  expect(enBuyukW(srcset)).toBe(2400);
  // İçsel ölçü YAZILMIŞ olmalı — `ResponsiveImage` ölçüsüz manifestte üretimi
  // durdurup yedek `<img>`e düşer; bu iddia o kuralın da nöbetçisidir.
  await expect(img).toHaveAttribute("sizes", /\S/);
});

// ─────────────────────────────────────────────────────────────────────────
// Senaryo 6 — "crop değişir → YALNIZ etkilenen rendition'lar yenilenir"
// Vitrin yarısı: manifest yalnız etkilenen görsel için türev bildirdiğinde,
// vitrin SADECE o görseli yükseltir; dokunulmamış görselin işaretlemesi
// bayt bayt bugünküdür.
// ─────────────────────────────────────────────────────────────────────────
test("S6 vitrin yarısı — yalnız manifesti gelen görsel yükseltilir, diğeri dokunulmadan kalır", async ({
  page,
}) => {
  const man = gorselManifesti(ANA, [384, 768, 1200], [1200, 1200]);
  await kur(page, {
    images: [ANA, IKINCI],
    manifest: manifestYaniti(ILAN, [
      galeriKaydi(ANA, man, true),
      // Kırpma bu görseli etkilemedi → türevi yenilenmedi → manifest yok.
      galeriKaydi(IKINCI, null, false),
    ]),
  });

  await page.goto(`/pages/product-detail.html?id=${ILAN}`);
  await expect(anaPicture(page)).toHaveCount(1);

  const durum = await galeriDurumu(page);
  const etkilenen = durum.filter((d) => d.src.startsWith("/files/urun-ana"));
  const etkilenmeyen = durum.filter((d) => d.src === IKINCI);

  expect(etkilenen.length).toBeGreaterThan(0);
  expect(etkilenmeyen.length).toBeGreaterThan(0);
  // Etkilenen: hepsi `<picture>` içinde ve srcset taşıyor.
  for (const d of etkilenen) {
    expect(d.picture).toBe(true);
    expect(d.srcset).not.toBe("");
  }
  // Etkilenmeyen: `<picture>` YOK, srcset YOK, adres ham dosyanın kendisi.
  for (const d of etkilenmeyen) {
    expect(d.picture).toBe(false);
    expect(d.srcset).toBe("");
    expect(d.src).toBe(IKINCI);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// Senaryo 12 — "retention dolan türev silinir → istendiğinde yeniden üretilir,
// kullanıcı fark etmez"
// Vitrin yarısı, İKİ ADIM:
//   (a) türev silinmişken (manifest: null) sayfa ham `<img>` ile ÇALIŞIR,
//   (b) türev yeniden üretilip manifest dolduğunda sayfa `<picture>`a geçer.
// "Kullanıcı fark etmez" iddiasının vitrinde ölçülebilen kısmı (a)'dır:
// görsel kaybolmaz, hata çıkmaz.
// ─────────────────────────────────────────────────────────────────────────
test("S12 vitrin yarısı — türev silinmişken sayfa ham görselle çalışır, türev dönünce picture'a yükselir", async ({
  page,
}) => {
  const hatalar: string[] = [];
  page.on("pageerror", (e) => hatalar.push(e.message));

  // (a) Türev yok — retention süpürücüsü sildi.
  let govde: unknown = manifestYaniti(ILAN, [galeriKaydi(ANA, null, true)]);
  await page.route("**/api/method/**", (route: Route) => {
    const url = route.request().url();
    if (url.includes("get_listing_detail")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: { data: urun([ANA]) } }),
      });
    }
    if (url.includes("media_manifest.get_manifest_batch")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(govde),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(genelYanit(url)),
    });
  });

  await page.goto(`/pages/product-detail.html?id=${ILAN}`);
  await expect(anaImg(page).first()).toHaveAttribute("src", ANA);
  await expect(anaPicture(page)).toHaveCount(0);
  expect(hatalar).toEqual([]);

  // (b) Türev talep üzerine yeniden üretildi. Manifest önbelleği oturumluk;
  //     yeniden üretimi görebilmek için önbelleği temizleyip yeniden geziyoruz
  //     (üretimin kendisi backend'in işi — burada yalnız teslim doğrulanıyor).
  govde = manifestYaniti(ILAN, [
    galeriKaydi(ANA, gorselManifesti(ANA, [384, 768, 1200], [1200, 1200]), true),
  ]);
  await page.evaluate(() => sessionStorage.clear());
  await page.goto(`/pages/product-detail.html?id=${ILAN}`);

  await expect(anaPicture(page)).toHaveCount(1);
  await expect(anaImg(page).first()).toHaveAttribute("srcset", /1200w/);
  expect(hatalar).toEqual([]);
});

// ─────────────────────────────────────────────────────────────────────────
// Senaryo 11 — "S3 düşerse sistem yerelde çalışmaya devam eder"
// Vitrin yarısı: manifest ucu 500 dönerse ürün sayfası ham `<img>` ile ayakta
// kalır ve işlenmemiş hata bırakmaz. (Aynalama/superadmin yarısı admin-panel
// + backend işi; bu katmandan görünmez.)
// ─────────────────────────────────────────────────────────────────────────
test("S11 vitrin yarısı — manifest ucu 500 dönse de ürün sayfası ham görselle ayakta kalır", async ({
  page,
}) => {
  const hatalar: string[] = [];
  page.on("pageerror", (e) => hatalar.push(e.message));

  await kur(page, { manifest: null }); // → 500

  await page.goto(`/pages/product-detail.html?id=${ILAN}`);
  await expect(page.locator("#gallery-main-image")).toBeVisible();
  await expect(anaImg(page).first()).toHaveAttribute("src", ANA);
  await expect(anaPicture(page)).toHaveCount(0);
  expect(hatalar).toEqual([]);
});

// ─────────────────────────────────────────────────────────────────────────
// EK (şartnamede senaryo numarası YOK — ölçülen ön koşuldan çıkarıldı):
// `media_pipeline_enabled` VARSAYILAN 0. Bugünkü üretim hâli budur; vitrinin
// o hâlde bozulmadığı ve devre kesicinin çalıştığı doğrudan doğrulanmalı.
// ─────────────────────────────────────────────────────────────────────────
test("EK — boru hattı bayrağı kapalıyken vitrin bugünkü <img> yolunda kalır ve oturum başına tek istek atar", async ({
  page,
}) => {
  let istek = 0;
  await kur(page, { manifest: kapaliYanit(), onManifestRequest: () => void istek++ });

  await page.goto(`/pages/product-detail.html?id=${ILAN}`);
  await expect(anaImg(page).first()).toHaveAttribute("src", ANA);
  await expect(anaPicture(page)).toHaveCount(0);
  const ilk = istek;
  expect(ilk).toBeGreaterThanOrEqual(1);

  // İkinci gezinme: `enabled:false` öğrenildi → sessionStorage devre kesicisi
  // yeni istek attırmamalı.
  await page.goto(`/pages/product-detail.html?id=${ILAN}`);
  await expect(anaImg(page).first()).toHaveAttribute("src", ANA);
  expect(istek).toBe(ilk);
});
