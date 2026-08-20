/*
 * VENDOR KÖKENİ (2026-08-20) — T-123 RUM zinciri, storefront montajı.
 * Kaynak: admin-panel/frontend/src/lib/media/rum/payload.js
 * Sözleşme kaynağı: tradehub_core/tradehub_core/media/pipeline/delivery/rum.py
 * Değişiklikler bu başlığın altında ayrıca işaretlenmedikçe birebir kopyadır.
 */
/**
 * T-123 — gövde kurma ve istemci tarafı doğrulama.
 *
 * Sunucu zaten `rum.validate()` ile doğruluyor. Aynı kuralı istemcide de
 * uygulamanın nedeni güvenlik değil, GERİ BİLDİRİM: sunucu reddettiğinde
 * kayıt `media_rum_rejected_total` sayacına düşer ve istemci hiçbir şey
 * öğrenmez (uç `sendBeacon` ile çağrıldığı için yanıt okunamaz bile).
 * Biçimsiz gövdeyi hiç göndermemek, sessiz veri kaybını önler.
 *
 * PII KORUMASI — İKİ KATMAN
 * -------------------------
 *   1. `ALLOWED_FIELDS` beyaz listesi: şemada olmayan HER alan atılır.
 *      Sunucudaki `additionalProperties: false` ile aynı yön.
 *   2. `FORBIDDEN_FIELDS` kara listesi: yasak bir alan gövdeye girmişse
 *      gövde REDDEDİLİR (atılmaz). Beyaz liste zaten yeterliydi; kara liste
 *      ikinci bir kilit, çünkü `ALLOWED_FIELDS`'e ileride yanlışlıkla
 *      `referrer` gibi bir alan eklenirse tek kilit sessizce açılırdı.
 */

import {
  ALLOWED_FIELDS,
  CONNECTION_TYPES,
  DEVICE_CLASSES,
  FORBIDDEN_FIELDS,
  LCP_PROFILE_PATTERN,
  LCP_REGION_PATTERN,
  LIMITS,
  METRICS,
  NAVIGATION_TYPES,
  RATING_THRESHOLDS,
  RATING_GOOD,
  RATING_NEEDS_IMPROVEMENT,
  RATING_POOR,
  REQUIRED_FIELDS,
  ROUTE_TEMPLATES,
  SESSION_TOKEN_PATTERN,
  UNITLESS,
} from "./contract.js";

/** Gövde sözleşmeye uymuyor. Toplayıcı bunu yutar, sayfaya sızdırmaz. */
export class RumPayloadError extends Error {
  constructor(message, field = "") {
    super(message);
    this.name = "RumPayloadError";
    this.field = field;
  }
}

/**
 * Metriği web.dev eşiklerine göre sınıfla — `rum.rating()` ile birebir.
 * Sunucu bunu kendisi hesaplar; istemcide yalnız yerel ayıklama için var,
 * gövdeye YAZILMAZ (şemada `rating` alanı yok).
 *
 * @param {string} metric
 * @param {number} value
 * @returns {string}
 */
export function rating(metric, value) {
  const ad = String(metric || "").toUpperCase();
  const esik = RATING_THRESHOLDS[ad];
  if (!esik) throw new RumPayloadError(`Bilinmeyen metrik: ${metric}`, "metric");
  if (value <= esik[0]) return RATING_GOOD;
  if (value <= esik[1]) return RATING_NEEDS_IMPROVEMENT;
  return RATING_POOR;
}

/**
 * `rum.RumSample` ile aynı yuvarlama: CLS 4 hane, milisaniye 1 hane.
 *
 * @param {string} metric
 * @param {number} value
 * @returns {number}
 */
export function roundValue(metric, value) {
  const basamak = UNITLESS.includes(String(metric).toUpperCase()) ? 4 : 1;
  const carpan = 10 ** basamak;
  return Math.round(Number(value) * carpan) / carpan;
}

/**
 * Gövdede yasak alan var mı — varsa adlarını döner.
 *
 * @param {object} body
 * @returns {string[]} sıralı yasak alan adları
 */
export function piiFields(body) {
  if (!body || typeof body !== "object") return [];
  return FORBIDDEN_FIELDS.filter((f) => Object.prototype.hasOwnProperty.call(body, f)).sort();
}

/**
 * Ham girdiden sunucuya gidecek gövdeyi kur ve DOĞRULA.
 *
 * @param {object} input
 * @returns {object} yalnız `ALLOWED_FIELDS` içeren, şemaya uygun gövde
 * @throws {RumPayloadError} sözleşmeye uymuyorsa
 */
export function buildPayload(input) {
  if (!input || typeof input !== "object") {
    throw new RumPayloadError("Gövde nesne olmalı", "");
  }

  const yasak = piiFields(input);
  if (yasak.length) {
    throw new RumPayloadError(`PII taşıyan alan(lar): ${yasak.join(", ")}`, yasak[0]);
  }

  const metric = String(input.metric || "").toUpperCase();
  if (!METRICS.includes(metric)) {
    throw new RumPayloadError(`Bilinmeyen metrik: ${input.metric}`, "metric");
  }

  const ham = Number(input.value);
  if (!Number.isFinite(ham) || ham < 0) {
    throw new RumPayloadError(`\`value\` geçersiz: ${input.value}`, "value");
  }

  const route = String(input.route || "");
  if (!ROUTE_TEMPLATES.includes(route)) {
    throw new RumPayloadError(`\`route\` beyaz listede yok: ${route}`, "route");
  }

  const device = String(input.device_class || "").toLowerCase();
  if (!DEVICE_CLASSES.includes(device)) {
    throw new RumPayloadError(`\`device_class\` geçersiz: ${input.device_class}`, "device_class");
  }

  const vw = Math.trunc(Number(input.viewport_width));
  if (!Number.isFinite(vw) || vw < LIMITS.viewportWidthMin || vw > LIMITS.viewportWidthMax) {
    throw new RumPayloadError(
      `\`viewport_width\` aralık dışı: ${input.viewport_width}`,
      "viewport_width"
    );
  }

  const rate = Number(input.sample_rate);
  if (!Number.isFinite(rate) || rate <= 0 || rate > 1) {
    throw new RumPayloadError(`\`sample_rate\` (0,1] olmalı: ${input.sample_rate}`, "sample_rate");
  }

  const body = {
    metric,
    value: roundValue(metric, ham),
    route,
    device_class: device,
    viewport_width: vw,
    sample_rate: rate,
  };

  const dpr = Number(input.dpr);
  if (Number.isFinite(dpr)) {
    if (dpr < LIMITS.dprMin || dpr > LIMITS.dprMax) {
      throw new RumPayloadError(`\`dpr\` aralık dışı: ${dpr}`, "dpr");
    }
    body.dpr = Math.round(dpr * 100) / 100;
  }

  if (input.connection !== undefined && input.connection !== "") {
    const c = String(input.connection).toLowerCase();
    if (!CONNECTION_TYPES.includes(c)) {
      throw new RumPayloadError(`\`connection\` geçersiz: ${input.connection}`, "connection");
    }
    body.connection = c;
  }

  if (input.navigation_type !== undefined && input.navigation_type !== "") {
    const n = String(input.navigation_type).toLowerCase();
    if (!NAVIGATION_TYPES.includes(n)) {
      throw new RumPayloadError(
        `\`navigation_type\` geçersiz: ${input.navigation_type}`,
        "navigation_type"
      );
    }
    body.navigation_type = n;
  }

  if (input.session_token) {
    const t = String(input.session_token);
    if (!SESSION_TOKEN_PATTERN.test(t)) {
      throw new RumPayloadError("`session_token` 16-64 hex olmalı", "session_token");
    }
    body.session_token = t;
  }

  // LCP etiketleri yalnız LCP'de anlamlı. Diğer metriklerde gönderilirse
  // sunucu reddetmez ama veri gürültü olur; burada susturulur.
  if (metric === "LCP") {
    if (input.lcp_region) {
      const r = String(input.lcp_region);
      if (!LCP_REGION_PATTERN.test(r)) {
        throw new RumPayloadError(`\`lcp_region\` biçimsiz: ${r}`, "lcp_region");
      }
      body.lcp_region = r;
    }
    if (input.lcp_profile) {
      const p = String(input.lcp_profile);
      if (!LCP_PROFILE_PATTERN.test(p)) {
        throw new RumPayloadError(`\`lcp_profile\` tanınmadı: ${p}`, "lcp_profile");
      }
      body.lcp_profile = p;
    }
    if (input.lcp_format) {
      const f = String(input.lcp_format);
      if (f.length > LIMITS.lcpFormatMaxLength) {
        throw new RumPayloadError(
          `\`lcp_format\` en fazla ${LIMITS.lcpFormatMaxLength} karakter`,
          "lcp_format"
        );
      }
      body.lcp_format = f;
    }
  }

  if (input.engine_version) {
    const v = String(input.engine_version);
    if (v.length > LIMITS.engineVersionMaxLength) {
      throw new RumPayloadError(
        `\`engine_version\` en fazla ${LIMITS.engineVersionMaxLength} karakter`,
        "engine_version"
      );
    }
    body.engine_version = v;
  }

  // Son kilit: beyaz liste dışı hiçbir alan çıkmasın. Yukarıdaki kod zaten
  // yalnız izinli alanları yazıyor; bu kontrol o kodun ileride bozulmasına
  // karşı.
  for (const alan of Object.keys(body)) {
    if (!ALLOWED_FIELDS.includes(alan)) {
      throw new RumPayloadError(`Şemada olmayan alan: ${alan}`, alan);
    }
  }
  for (const alan of REQUIRED_FIELDS) {
    if (body[alan] === undefined) {
      throw new RumPayloadError(`Zorunlu alan eksik: ${alan}`, alan);
    }
  }

  return body;
}

/**
 * `buildPayload` ama ASLA FIRLATMAZ — geçersizse `null` döner.
 *
 * @param {object} input
 * @returns {object|null}
 */
export function buildPayloadSafe(input) {
  try {
    return buildPayload(input);
  } catch {
    return null;
  }
}
