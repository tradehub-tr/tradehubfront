/*
 * VENDOR KÖKENİ (2026-08-20) — T-123 RUM zinciri, storefront montajı.
 * Kaynak: admin-panel/frontend/src/lib/media/rum/context.js
 * Sözleşme kaynağı: tradehub_core/tradehub_core/media/pipeline/delivery/rum.py
 * Değişiklikler bu başlığın altında ayrıca işaretlenmedikçe birebir kopyadır.
 */
/**
 * T-123 — ölçüm bağlamı: cihaz sınıfı, viewport kovası, ağ, rota şablonu.
 *
 * Buradaki her fonksiyon KABA bir kovaya indirger. Ham genişlik, ham
 * User-Agent, tam URL hiçbir zaman dışarı çıkmaz — `rum.py`'nin üç sert PII
 * kuralı yapısal olarak burada uygulanır:
 *
 *   1. `routeTemplate()` sorgu dizgesini ve yol parametrelerini SİLER,
 *      beyaz liste dışını `other`'a düşürür.
 *   2. `deviceClass()` ham UA metnini değil, üç kaba sınıftan birini döner.
 *   3. `viewportBucket()` ham genişliği değil, kovanın alt sınırını döner.
 *
 * Tüm fonksiyonlar tarayıcı global'lerini `globalThis` üzerinden ve
 * savunmacı okur; jsdom'da ya da eksik API'li tarayıcıda FIRLATMAZ,
 * bilinmeyen değere düşer.
 */

import {
  CONNECTION_TYPES,
  DEVICE_CLASSES,
  NAVIGATION_TYPES,
  ROUTE_EXACT,
  ROUTE_OTHER,
  ROUTE_PREFIX_MAP,
  ROUTE_TEMPLATES,
  VIEWPORT_BUCKETS,
  LIMITS,
} from "./contract.js";
// VENDOR EKİ (2026-08-20): fiziksel `/pages/*.html` yollarını pretty
// karşılığına çeviren storefront'a özgü ön adım — gerekçe routePhysical.js.
import { normalizePhysicalPath } from "./routePhysical.js";

/**
 * Ham yolu rota şablonuna indirge — `rum.route_template()` ile birebir.
 *
 * `/urun/bonny-kap?utm_source=x` → `/urun/:slug`
 * `/dashboard`                   → `other`
 *
 * @param {string} path
 * @returns {string} `ROUTE_TEMPLATES` üyesi
 */
export function routeTemplate(path) {
  let ham = String(path || "")
    .split("?")[0]
    .split("#")[0]
    .trim();
  if (!ham) return ROUTE_OTHER;
  if (!ham.startsWith("/")) ham = `/${ham}`;
  ham = ham.replace(/\/+$/, "") || "/";
  if (ROUTE_EXACT.includes(ham)) return ham;
  const parcalar = ham.split("/").filter(Boolean);
  if (parcalar.length === 2) {
    const aday = ROUTE_PREFIX_MAP[parcalar[0]];
    if (aday) return aday;
  }
  return ROUTE_OTHER;
}

/**
 * Viewport genişliğini kovaya indirge — kovanın ALT sınırı döner.
 * `rum.viewport_bucket()` ile birebir.
 *
 * @param {number} width
 * @returns {number}
 */
export function viewportBucket(width) {
  const w = Math.trunc(Number(width));
  if (!Number.isFinite(w) || w <= 0) return 0;
  let out = 0;
  for (const b of VIEWPORT_BUCKETS) if (b <= w) out = b;
  return out;
}

/**
 * Kaba cihaz sınıfı. Ham User-Agent OKUNMAZ ve SAKLANMAZ.
 *
 * Sıra: `navigator.userAgentData.mobile` (varsa) → viewport genişliği.
 * Eşikler `simulator/vendor/placements.json` kırılma noktalarıyla aynı
 * ailedendir (bu projede lg=768, xl=1024): <768 phone, <1024 tablet,
 * üzeri desktop. Bu eşikler ÖLÇÜLMEDİ; storefront kırılma noktalarından
 * türetilmiş kaba bir sınıflandırmadır.
 *
 * @param {{width?: number, uaMobile?: boolean|null}} [env]
 * @returns {"phone"|"tablet"|"desktop"}
 */
export function deviceClass(env = {}) {
  const width = Number.isFinite(env.width) ? env.width : viewportWidth();
  let uaMobile = env.uaMobile;
  if (uaMobile === undefined) {
    const nav = safeNavigator();
    uaMobile = nav && nav.userAgentData ? nav.userAgentData.mobile : undefined;
  }
  if (uaMobile === true) return width >= 768 ? "tablet" : "phone";
  if (width < 768) return "phone";
  if (width < 1024) return "tablet";
  return "desktop";
}

/**
 * Ağ sınıfı — `navigator.connection.effectiveType`. Tanınmayan/eksik değer
 * `unknown`. (Firefox ve Safari bu API'yi vermez; `unknown` beklenen
 * durumdur, arıza değil.)
 *
 * @param {object} [nav] test için enjekte edilebilir navigator
 * @returns {string} `CONNECTION_TYPES` üyesi
 */
export function connectionType(nav) {
  const n = nav === undefined ? safeNavigator() : nav;
  const tip = n && n.connection ? String(n.connection.effectiveType || "").toLowerCase() : "";
  return CONNECTION_TYPES.includes(tip) ? tip : "unknown";
}

/**
 * Cihaz piksel oranı, şema aralığına kırpılmış ve 2 haneye yuvarlanmış.
 * Ham `devicePixelRatio` (ör. 2.625) tek başına parmak izi parçasıdır;
 * yuvarlama bilinçlidir.
 *
 * @param {number} [raw]
 * @returns {number} 0.5..6
 */
export function dprValue(raw) {
  const ham = raw === undefined ? globalThis.devicePixelRatio : raw;
  const n = Number(ham);
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.min(LIMITS.dprMax, Math.max(LIMITS.dprMin, Math.round(n * 100) / 100));
}

/**
 * Gezinme tipi — `PerformanceNavigationTiming.type`. Bilinmiyorsa
 * `navigate`. `prerender` şemada var ama tarayıcı `activationStart` ile
 * bildirir; burada yalnız doğrudan raporlanan tip okunur.
 *
 * @param {string} [raw] `web-vitals` metric.navigationType
 * @returns {string} `NAVIGATION_TYPES` üyesi
 */
export function navigationType(raw) {
  const t = String(raw || "").toLowerCase();
  if (NAVIGATION_TYPES.includes(t)) return t;
  // web-vitals `back-forward-cache` ve `restore` da üretebilir; ikisi de
  // şemada yok, en yakın kova `back-forward`.
  if (t.startsWith("back")) return "back-forward";
  if (t === "restore") return "back-forward";
  return "navigate";
}

/** Şema sınırlarına kırpılmış viewport genişliği (ham, kova DEĞİL). */
export function viewportWidth() {
  const w = Math.trunc(Number(globalThis.innerWidth));
  if (!Number.isFinite(w) || w <= 0) return LIMITS.viewportWidthMin;
  return Math.min(LIMITS.viewportWidthMax, Math.max(LIMITS.viewportWidthMin, w));
}

function safeNavigator() {
  try {
    return globalThis.navigator || null;
  } catch {
    return null;
  }
}

/**
 * Sayfa bağlamını tek seferde topla. **Asla fırlatmaz.**
 *
 * @param {object} [overrides] testte tüm alanlar ezilebilir
 * @returns {{route: string, device_class: string, viewport_width: number,
 *            dpr: number, connection: string}}
 */
export function collectContext(overrides = {}) {
  let ham = "";
  try {
    ham = globalThis.location ? globalThis.location.pathname : "";
  } catch {
    ham = "";
  }
  // VENDOR EKİ (2026-08-20): `routeTemplate()` sunucu `rum.route_template()`
  // ile birebir KALIR; storefront'un fiziksel dosya yolları yalnız burada,
  // şablona indirgenmeden ÖNCE normalize edilir (routePhysical.js).
  ham = normalizePhysicalPath(ham);
  const width = overrides.viewport_width ?? viewportWidth();
  const taban = {
    route: routeTemplate(ham),
    device_class: deviceClass({ width }),
    viewport_width: width,
    dpr: dprValue(),
    connection: connectionType(),
  };
  const birlesik = { ...taban, ...overrides };
  // Ezilen değerler de sözleşmeye uymalı — test kolaylığı bir kaçak yolu
  // olmamalı, yoksa sunucu gövdeyi reddeder ve sebebi görünmez.
  if (!ROUTE_TEMPLATES.includes(birlesik.route)) birlesik.route = routeTemplate(birlesik.route);
  if (!DEVICE_CLASSES.includes(birlesik.device_class)) birlesik.device_class = taban.device_class;
  if (!CONNECTION_TYPES.includes(birlesik.connection)) birlesik.connection = "unknown";
  return birlesik;
}
