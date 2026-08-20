/*
 * VENDOR KÖKENİ (2026-08-20) — T-123 RUM zinciri, storefront montajı.
 * Kaynak: admin-panel/frontend/src/lib/media/rum/index.js
 * Sözleşme kaynağı: tradehub_core/tradehub_core/media/pipeline/delivery/rum.py
 * Değişiklikler bu başlığın altında ayrıca işaretlenmedikçe birebir kopyadır.
 */
/**
 * T-123 — RUM toplayıcısı, genel giriş noktası.
 *
 * ZİNCİRİN NERESİ HAZIR
 * ---------------------
 * Bu paket zincirin İSTEMCİ halkasıdır ve tamamlanmıştır. Zincirin geri
 * kalanı (ölçülmüş durum, 2026-08-19):
 *
 *   [x] Sunucu çekirdeği  — `media/pipeline/delivery/rum.py` (doğrulama,
 *                           örneklem, p75, `to_metrics()` köprüsü)
 *   [x] Alarmlar          — `observability/alerts.py` içinde 4 RUM kuralı
 *   [x] İstemci toplayıcı — BU PAKET
 *   [x] HTTP ucu          — `tradehub_core/api/rum.py:collect`
 *                           (VENDOR GÜNCELLEMESİ 2026-08-20: kaynak kopyada
 *                           "YOK" yazıyordu; uç bu görevle kuruldu)
 *   [x] `Media RUM Sample` DocType — kuruldu (aynı görev), alan kümesi
 *                           `rum.DOCTYPE_FIELDS` ile birebir.
 *
 * STOREFRONT'TA KALAN ENGEL (ölçüldü 2026-08-20): `web-vitals` paketi
 * tradehubfront'ta KURULU DEĞİL (`package.json`'da yok). `collector.js`
 * paketi dinamik import ile geç yükler; paket kurulmadan bu modül bir
 * giriş dosyasından import EDİLMEMELİ (Vite, `import("web-vitals/attribution")`
 * belirtecini çözümleyemez ve build kırılır). Montaj bu yüzden `main.ts`
 * içinde HAZIR-AMA-KAPALI bırakıldı; açma adımları oradaki blokta.
 */

/*
 * VENDOR EKİ (2026-08-20): çerçevesiz tekil başlatıcı. Kaynak paketteki Vue
 * köprüsü (`useRum.js`) storefront'a taşınmadı (Vue yok); onun start/stop
 * sözleşmesinin çerçeveden bağımsız karşılığı budur.
 */
import { createRumCollector } from "./collector.js";

let _aktifToplayici = null;

/**
 * Toplayıcıyı bir kez başlat (idempotent). **Asla fırlatmaz** —
 * `createRumCollector` zaten fırlatmamayı taahhüt eder.
 *
 * @param {object} [opts] `createRumCollector` seçenekleri (sampleRate, endpoint…)
 * @returns {object} toplayıcı tutamacı ({stop, flush, isSampled, ...})
 */
export function startRum(opts = {}) {
  if (_aktifToplayici) return _aktifToplayici;
  _aktifToplayici = createRumCollector(opts);
  return _aktifToplayici;
}

/** Toplayıcıyı durdur ve kuyruğu boşalt. Asla fırlatmaz. */
export function stopRum() {
  const t = _aktifToplayici;
  _aktifToplayici = null;
  return t ? t.stop() : Promise.resolve("empty");
}

export {
  ALLOWED_FIELDS,
  CONNECTION_TYPES,
  DEVICE_CLASSES,
  FORBIDDEN_FIELDS,
  LIMITS,
  METRICS,
  METRIC_GROUP_BY,
  NAVIGATION_TYPES,
  RATING_GOOD,
  RATING_NEEDS_IMPROVEMENT,
  RATING_POOR,
  RATING_THRESHOLDS,
  REQUIRED_FIELDS,
  ROUTE_TEMPLATES,
  SOURCES,
  UNITLESS,
  VIEWPORT_BUCKETS,
} from "./contract.js";

export {
  collectContext,
  connectionType,
  deviceClass,
  dprValue,
  navigationType,
  routeTemplate,
  viewportBucket,
  viewportWidth,
} from "./context.js";

export { DEFAULT_SAMPLE_RATE, decide, decideSafe, randomHex, sessionToken } from "./sampling.js";

export {
  RumPayloadError,
  buildPayload,
  buildPayloadSafe,
  piiFields,
  rating,
  roundValue,
} from "./payload.js";

export { lcpAssetTags, normalizeRegion, parseFormat, parseProfile } from "./lcpAsset.js";

export {
  DEFAULT_ENDPOINT,
  SEND_BEACON,
  SEND_DISABLED,
  SEND_EMPTY,
  SEND_FAILED,
  SEND_FETCH,
  SEND_OK,
  createTransport,
} from "./transport.js";

export { DEFAULT_METRICS, createRumCollector } from "./collector.js";

export { sha256Hex } from "./sha256.js";
