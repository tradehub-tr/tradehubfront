/**
 * T-141 — VİDEO senaryoları (S7 ve S8). W8: iskelet GERÇEK teste çevrildi.
 *
 * ŞARTNAME: docs `72-faz14-test-kabul.html` → T-141.
 *   · S7: "Verimli 10 MB MP4 yüklenir → dokunulmaz" (gereksiz yeniden
 *     kodlama yapılmaz).
 *   · S8: "Şişik bitrate video yüklenir → küçülür, VMAF ≥ 93".
 *
 * ESKİ İSKELETİN ATLAMA GEREKÇESİ DÜŞTÜ: boru hattı artık CANLI —
 * `pipeline_bridge._run_video_job` kuyruktan uçtan uca akıyor, `vmaf_min`
 * kapısı bağlı ve VMAF gerçekten ölçülüyor (rapor 84). Fixture'lar da depoda:
 * `tradehub_core/tests/fixtures/media/video/video_efficient_720p_750k.mp4`
 * ve `video_bloated_720p_8m.mp4`.
 *
 * ÖLÇÜM MİMARİSİ — iki yarım, sahte yeşil iki uçta da imkânsız:
 *
 * 1) BENCH-YARDIMCILI yarı (S7/S8'in kabul ölçütleri: bayt kimliği, VMAF).
 *    Tarayıcıdan görünmezler; ölçüm konteynerdeki gerçek ffmpeg+libvmaf ile
 *    `tradehub_core.tests.t141_bench` üzerinden yapılır (docker exec →
 *    bench execute → JSON). Yardımcı SADECE ölçer (içinde assert yok);
 *    iddiayı bu dosya verir. Docker/konteyner yoksa test SKIP olur —
 *    "koşamadım"ı "geçti" diye raporlamak yasak.
 *
 *    DİKKAT (görev şartı): `vmaf_min` kapısı gerçek türevi ATABİLİR
 *    (rapor 84 §3: VMAF 89,31 < 93 → türev atıldı, kaynak korundu — doğru
 *    davranış). S8 bu yüzden kapının SONUCUNU iddia eder: kapı GEÇTİYSE
 *    küçülme + VMAF ≥ eşik; kapı DÜŞTÜYSE türev teslim EDİLMEMİŞ olmalı.
 *    "Türev üretildi" varsayımı yok.
 *
 * 2) VİTRİN yarısı (bu paketin mevcut deseni: `page.route()` mock —
 *    bkz. media-delivery-manifest.spec.ts). Boru hattının ürettiğini vitrine
 *    taşıyan sözleşmeyi ölçer: API video türev alanlarını bastığında ürün
 *    sayfası HLS master'ı `data-hls-src` ile (poster'lı) basar; türev yokken
 *    (S7 passthrough) ham dosya progressive `<video src>` olarak kalır.
 *
 * SÜRE/PERFORMANS İDDİASI YOK: LCP/saniye ölçülmüyor; bayt, VMAF, DOM yapısı.
 */
import { execFileSync } from "node:child_process";

import { expect, test, type Page, type Route } from "@playwright/test";

// ── Bench-yardımcılı yarı ────────────────────────────────────────────────

const BACKEND_CONTAINER = process.env.T141_BACKEND_CONTAINER || "istoc-dev-backend-1";
const SITE = process.env.T141_SITE || "istoc.localhost";
const HELPER = "tradehub_core.tests.t141_bench";

/** Konteyner erişilebilir mi? (docker yoksa/duruyorsa bench yarısı SKIP.) */
function benchErisilebilir(): boolean {
  try {
    execFileSync("docker", ["exec", BACKEND_CONTAINER, "true"], {
      timeout: 15_000,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

/** `bench execute` çıktısının son JSON satırını ayrıştır. */
function benchExecute(fn: string, timeoutMs: number): Record<string, unknown> {
  const out = execFileSync(
    "docker",
    ["exec", BACKEND_CONTAINER, "bench", "--site", SITE, "execute", `${HELPER}.${fn}`],
    { timeout: timeoutMs, encoding: "utf8" }
  );
  const satir = out
    .split("\n")
    .reverse()
    .find((l) => l.trim().startsWith("{"));
  if (!satir) throw new Error(`bench execute JSON dönmedi:\n${out.slice(-500)}`);
  return JSON.parse(satir) as Record<string, unknown>;
}

test.describe("T-141 S7/S8 — backend ölçümü (bench-yardımcılı, gerçek ffmpeg+libvmaf)", () => {
  test("S7 — verimli MP4 dokunulmaz: PASSTHROUGH, dosya baytı aynı", () => {
    test.skip(!benchErisilebilir(), `docker/${BACKEND_CONTAINER} erişilemedi — backend ölçümü koşamaz`);
    test.setTimeout(180_000);

    const o = benchExecute("s7_verimli_video_dokunulmaz", 150_000);

    // Karar: motor bu dosyaya dokunmamayı SEÇMELİ.
    expect(o.probe_measured).toBe(true);
    expect(o.action).toBe("PASSTHROUGH");
    expect(o.writes_new_file).toBe(false);

    // Uygulama: ffmpeg koşmadı, hedefe hiçbir şey yazılmadı, kaynak korundu.
    expect(o.accepted).toBe(true);
    expect(o.kept_source).toBe(true);
    expect(o.out_file_written).toBe(false);
    // "Dokunulmadı"nın bayt kanıtı: içerik özeti koşumdan önce ve sonra aynı.
    expect(o.source_sha_unchanged).toBe(true);
    expect(o.out_bytes).toBe(o.src_bytes);
  });

  test("S8 — şişik bitrate: kapı SONUCU tutarlı (küçülme + VMAF ≥ eşik, ya da türev teslim edilmedi)", () => {
    test.skip(!benchErisilebilir(), `docker/${BACKEND_CONTAINER} erişilemedi — backend ölçümü koşamaz`);
    test.setTimeout(600_000);

    const o = benchExecute("s8_sisik_video_kapi_sonucu", 540_000);

    // Ön koşul: karar tablosu bu dosyayı gerçekten TRANSCODE'a yollamalı,
    // yoksa test şişik-olmayan bir fixture'ı ölçüyor demektir.
    expect(o.decision_action).toBe("TRANSCODE");

    const vmafMin = o.vmaf_min as number;
    expect(vmafMin).toBeGreaterThan(0); // eşik tablodan geldi

    // libvmaf'sız imajda kapı uygulanmaz ve sayı uydurulmaz — o durumda
    // S8'in VMAF iddiası verilemez: SKIP (yeşil DEĞİL).
    test.skip(
      o.vmaf_gate === "OLCULEMEDI",
      "VMAF bu imajda ölçülemiyor (libvmaf yok) — S8 iddiası verilemez"
    );

    expect(typeof o.vmaf).toBe("number");
    const vmaf = o.vmaf as number;

    if (o.accepted) {
      // Kapı GEÇTİ: şartnamenin düz okuması — küçüldü ve kalite eşikte.
      expect(o.vmaf_gate).toBe("GECTI");
      expect(o.delivered_file_exists).toBe(true);
      expect(o.out_bytes as number).toBeLessThan(o.src_bytes as number);
      expect(vmaf).toBeGreaterThanOrEqual(vmafMin);
      // Fayda kapısı da üretim eşiğiyle tutarlı (min_saving_ratio=0,1).
      expect(o.saving_ratio as number).toBeGreaterThanOrEqual(0.1);
    } else {
      // Kapı DÜŞTÜ: doğru davranış "eşiğin altındaki türevi TESLİM ETME".
      // (89,31 < 93 vakası — rapor 84 §3. Bu dal yeşilse hat yine doğru.)
      expect(vmaf).toBeLessThan(vmafMin);
      expect(o.vmaf_gate).toBe("DUSTU");
      expect(o.delivered_file_exists).toBe(false);
      expect(o.kept_source).toBe(true);
    }
  });
});

// ── Vitrin yarısı (mock'lu — bu paketin standart deseni) ────────────────

const ILAN = "LST-VIDEO-0001";
const GORSEL = "/files/urun-ana.jpg";
const HAM_MP4 = "/files/tanitim-ham.mp4";
const HLS_MASTER = "/files/media/vidasset01/aa11/hls/master.m3u8";
const POSTER = "/files/media/vidasset01/aa11/poster-1280.webp";
const H264 = "/files/media/vidasset01/aa11/h264-1280.mp4";
const PREVIEW = "/files/media/vidasset01/aa11/preview-854.mp4";

function urun(videoAlanlari: Record<string, unknown>): Record<string, unknown> {
  return {
    id: ILAN,
    slug: "video-test-urunu",
    title: "Video Test Ürünü",
    category: ["Hırdavat"],
    images: [GORSEL],
    priceTiers: [{ minQty: 1, maxQty: 99, price: 100 }],
    currency: "USD",
    moq: 1,
    unit: "adet",
    description: "T-141 video teslim senaryoları için örnek ürün.",
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
    ...videoAlanlari,
  };
}

/** Medya dışı uçlar boş-ama-doğru-şekilli yanıtlanır (sibling spec deseni). */
function genelYanit(url: string): Record<string, unknown> {
  if (url.includes("search.unified_suggest")) {
    return { message: { data: { products: [], categories: [], brands: [], sellers: [] } } };
  }
  return {
    message: {
      data: [],
      csrf_token: "None",
      suppliers: [],
      products: [],
      categories: [],
      brands: [],
      sellers: [],
      manifests: {},
    },
  };
}

async function kur(page: Page, videoAlanlari: Record<string, unknown>): Promise<void> {
  const govde = urun(videoAlanlari);
  await page.route("**/api/method/**", (route: Route) => {
    const url = route.request().url();
    if (url.includes("get_listing_detail")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: { data: govde } }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(genelYanit(url)),
    });
  });
}

/** Video küçük resmine tıkla → ana alandaki <video> düğümünü döndür. */
async function videoSlaydiniAc(page: Page) {
  const thumb = page.locator(".gallery-thumb-video").first();
  await expect(thumb).toBeVisible();
  await thumb.click();
  return page.locator("#gallery-main-image video");
}

test.describe("T-141 S7/S8 — vitrin yarısı (manifest alanları DOM'a taşınıyor)", () => {
  test("S7 vitrin — türev bildirilmediğinde ham MP4 progressive basılır (data-hls-src YOK)", async ({
    page,
  }) => {
    // Passthrough'un vitrin görünümü: API türev alanı basmaz; videoUrl ham dosya.
    await kur(page, { videoUrl: HAM_MP4 });
    await page.goto(`/pages/product-detail.html?id=${ILAN}`);

    const video = await videoSlaydiniAc(page);
    await expect(video).toHaveCount(1);
    // Ham dosyanın KENDİSİ basılır — bayt-birebir teslim vitrinde böyle görünür.
    await expect(video).toHaveAttribute("src", HAM_MP4);
    await expect(video).not.toHaveAttribute("data-hls-src");
  });

  test("S8 vitrin — API hlsSrc+poster bastığında DOM'da data-hls-src ve poster var, ham dosya yok", async ({
    page,
  }) => {
    await kur(page, {
      videoUrl: HAM_MP4,
      videoHlsSrc: HLS_MASTER,
      videoSrc: H264,
      videoPoster: POSTER,
      videoPreviewSrc: PREVIEW,
    });
    await page.goto(`/pages/product-detail.html?id=${ILAN}`);

    const video = await videoSlaydiniAc(page);
    await expect(video).toHaveCount(1);
    // HLS master düz `src` DEĞİL `data-hls-src` ile işaretlenir (hls.js köprüsü).
    await expect(video).toHaveAttribute("data-hls-src", HLS_MASTER);
    await expect(video).toHaveAttribute("poster", POSTER);
    // Ham dosya bu slaytta HİÇ geçmemeli — teslim türev üzerinden.
    const html = await page.locator("#gallery-main-image").innerHTML();
    expect(html).not.toContain(HAM_MP4);
  });

  test("S8 vitrin — HLS yok ama h264 türevi varsa progressive teslim türevden yapılır", async ({
    page,
  }) => {
    // Kısa video (HLS eşiği altı) + REMUX/TRANSCODE türevi: src türev olmalı.
    await kur(page, { videoUrl: HAM_MP4, videoSrc: H264, videoPoster: POSTER });
    await page.goto(`/pages/product-detail.html?id=${ILAN}`);

    const video = await videoSlaydiniAc(page);
    await expect(video).toHaveAttribute("src", H264);
    await expect(video).toHaveAttribute("poster", POSTER);
    await expect(video).not.toHaveAttribute("data-hls-src");
  });
});
