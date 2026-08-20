/*
 * VENDOR KÖKENİ (2026-08-20) — T-123 RUM zinciri, storefront montajı.
 * Kaynak: admin-panel/frontend/src/lib/media/rum/contract.js
 * Sözleşme kaynağı: tradehub_core/tradehub_core/media/pipeline/delivery/rum.py
 * Değişiklikler bu başlığın altında ayrıca işaretlenmedikçe birebir kopyadır.
 */
/**
 * T-123 — RUM veri sözleşmesi. Sunucudaki `rum.py` ile BİREBİR aynı sabitler.
 *
 * KAYNAK
 * ------
 * `tradehub_core/tradehub_core/media/pipeline/delivery/rum.py`
 *
 * Bu dosyadaki hiçbir sabit BURADA KARARLAŞTIRILMADI. Hepsi sunucudaki
 * `rum.py`'den okundu ve `vendor/rum_vectors.json` içine o dosyadan ÜRETİLEN
 * vektörlerle birlikte dondu. `__tests__/rumContractParity.test.js` her koşuda
 * ikisinin hâlâ aynı olduğunu doğrular; sunucu sözleşmesi değişip bu dosya
 * güncellenmezse test KIRILIR.
 *
 * Vektörleri yeniden üretmek için (rum.py değiştiğinde):
 *
 *   python3 - <<'PY'
 *   import hashlib, json, pathlib, sys, types
 *   SRC = pathlib.Path("tradehub_core/tradehub_core/media/pipeline/delivery/rum.py")
 *   m = types.ModuleType("rum_standalone"); m.__file__ = str(SRC)
 *   sys.modules["rum_standalone"] = m
 *   exec(compile(SRC.read_bytes(), str(SRC), "exec"), m.__dict__)
 *   # ... vektörleri yaz (bkz. rum_vectors.json içindeki alan adları)
 *   PY
 *
 * NEDEN KOPYA
 * -----------
 * Storefront/panel sunucudaki Python'u içe aktaramaz. Sözleşmeyi istemcide
 * yeniden yazmak yerine KOPYALAMAK ve kopyanın ayrışmasını testle yakalamak,
 * bu depoda `crop/vendor` ve `simulator/vendor` ile kurulmuş desendir.
 *
 * DİKKAT — ölçülmüş uyumsuzluk
 * ----------------------------
 * `ROUTE_TEMPLATES` **storefront** rotalarıdır (`/urun/:slug`, `/sepet`…).
 * Admin panelin hiçbir rotası (`/dashboard`, `/media-library`, `/seo/...`)
 * bu beyaz listede YOKTUR; hepsi `other` kovasına düşer. Bu bir hata değil,
 * ölçülmüş bir olgudur ve `__tests__/rumContractParity.test.js` içinde
 * açıkça test edilir. Sonucu: panelden toplanan veride "sayfa tipi kırılımı"
 * OLUŞMAZ. T-123'ün kabul kriteri #1 ancak (a) toplayıcı storefront'a
 * monte edilirse ya da (b) sunucu `ROUTE_TEMPLATES`'i panel rotalarıyla
 * genişletirse karşılanır. İkisi de bu görevin kapsamı dışında.
 */

/** Toplanan metrikler — `web-vitals` adlarıyla birebir (rum.py METRICS). */
export const METRICS = Object.freeze(["LCP", "CLS", "INP", "FCP", "TTFB"]);

/** Birimsiz metrikler; geri kalanı milisaniyedir (rum.py UNITLESS). */
export const UNITLESS = Object.freeze(["CLS"]);

/** web.dev Core Web Vitals eşikleri: [iyi_üst_sınır, geliştirilmeli_üst_sınır].
 *  DIŞ STANDART — bu projede ÖLÇÜLMEDİ. */
export const RATING_THRESHOLDS = Object.freeze({
  LCP: Object.freeze([2500.0, 4000.0]),
  CLS: Object.freeze([0.1, 0.25]),
  INP: Object.freeze([200.0, 500.0]),
  FCP: Object.freeze([1800.0, 3000.0]),
  TTFB: Object.freeze([800.0, 1800.0]),
});

export const RATING_GOOD = "good";
export const RATING_NEEDS_IMPROVEMENT = "needs-improvement";
export const RATING_POOR = "poor";

/** Kabul edilen rota şablonları. Beyaz liste dışı her yol `other`. */
export const ROUTE_TEMPLATES = Object.freeze([
  "/",
  "/urunler",
  "/urun/:slug",
  "/magaza/:code",
  "/kategori/:slug",
  "/marka/:slug",
  "/sepet",
  "other",
]);

/** Beyaz liste dışı yolların düştüğü kova. */
export const ROUTE_OTHER = "other";

/** İki parçalı yolların şablon eşlemesi (rum.py route_template içindeki sözlük). */
export const ROUTE_PREFIX_MAP = Object.freeze({
  urun: "/urun/:slug",
  magaza: "/magaza/:code",
  kategori: "/kategori/:slug",
  marka: "/marka/:slug",
});

/** Tek parçalı, doğrudan eşleşen yollar. */
export const ROUTE_EXACT = Object.freeze(["/", "/urunler", "/sepet"]);

export const DEVICE_CLASSES = Object.freeze(["phone", "tablet", "desktop"]);

export const CONNECTION_TYPES = Object.freeze(["slow-2g", "2g", "3g", "4g", "unknown"]);

export const NAVIGATION_TYPES = Object.freeze(["navigate", "reload", "back-forward", "prerender"]);

/** Viewport kovaları (CSS px, alt sınır dâhil). Ham genişlik SAKLANMAZ. */
export const VIEWPORT_BUCKETS = Object.freeze([
  0, 360, 390, 430, 480, 640, 768, 1024, 1280, 1440, 1536, 1920,
]);

/**
 * ASLA gönderilmeyecek alan adları. Sunucu bunlardan birini görürse kaydı
 * REDDEDER (`pii_field`) — yani buradaki liste yalnız kibarlık değil,
 * gövdeyi çöpe attıracak bir tuzak listesidir.
 */
export const FORBIDDEN_FIELDS = Object.freeze([
  "user",
  "user_id",
  "email",
  "phone",
  "ip",
  "ip_address",
  "remote_addr",
  "session_id",
  "cookie",
  "cookies",
  "user_agent",
  "ua",
  "referrer",
  "url",
  "href",
  "query",
  "search",
  "customer",
  "order",
  "cart_id",
]);

/**
 * Sunucu şemasının izin verdiği alanlar. `additionalProperties: false`
 * olduğu için bu kümenin DIŞINDAKİ her alan gövdeyi reddettirir.
 */
export const ALLOWED_FIELDS = Object.freeze([
  "connection",
  "device_class",
  "dpr",
  "engine_version",
  "lcp_format",
  "lcp_profile",
  "lcp_region",
  "metric",
  "navigation_type",
  "route",
  "sample_rate",
  "session_token",
  "value",
  "viewport_width",
]);

/** Şemanın zorunlu tuttuğu alanlar. */
export const REQUIRED_FIELDS = Object.freeze([
  "metric",
  "value",
  "route",
  "device_class",
  "viewport_width",
  "sample_rate",
]);

export const SESSION_TOKEN_PATTERN = /^[0-9a-f]{16,64}$/;
export const LCP_REGION_PATTERN = /^[a-z0-9_]+\/[a-z0-9_]+$/;
export const LCP_PROFILE_PATTERN = /^(w\d{2,4}|original|unknown)$/;

/** Sunucu `to_metrics()` bu kovalamayı bekler — panel/alarm etiketleri buna bağlı. */
export const METRIC_GROUP_BY = Object.freeze(["route", "device_class"]);

/** Şema sınırları (rum.py SCHEMA). */
export const LIMITS = Object.freeze({
  viewportWidthMin: 1,
  viewportWidthMax: 10000,
  dprMin: 0.5,
  dprMax: 6,
  lcpFormatMaxLength: 8,
  engineVersionMaxLength: 32,
});

export const SOURCES = Object.freeze({
  contract: "tradehub_core/tradehub_core/media/pipeline/delivery/rum.py",
  thresholds: "https://web.dev/articles/vitals — dış standart, bu projede ölçülmedi",
  acceptance: "docs/70-faz12-headless-teslim.html — T-123 kabul kriterleri",
  regions: "src/lib/media/simulator/vendor/placements.json — `sayfa/bölge` sözlüğü",
});
