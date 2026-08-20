/*
 * VENDOR KÖKENİ (2026-08-20) — T-123 RUM zinciri, storefront montajı.
 * Kaynak: admin-panel/frontend/src/lib/media/rum/lcpAsset.js
 * Sözleşme kaynağı: tradehub_core/tradehub_core/media/pipeline/delivery/rum.py
 * Değişiklikler bu başlığın altında ayrıca işaretlenmedikçe birebir kopyadır.
 */
/**
 * T-123 kabul kriteri #2 — "LCP elementinin hangi asset olduğu kaydediliyor
 * (kötü asset'leri bulmak için)."
 *
 * SORUN: `web-vitals/attribution` LCP kaynağının **tam URL'sini** verir
 * (`attribution.url`). O URL'i olduğu gibi göndermek `rum.py`'nin birinci
 * PII kuralını çiğner ve gövdeyi `pii_field` ile reddettirir — şemada
 * `url` alanı YOK, `additionalProperties: false`.
 *
 * ÇÖZÜM: URL sunucuya GİTMEZ. İstemcide üç kaba etikete indirgenir:
 *
 *   - `lcp_region`  → `sayfa/bölge` (ör. `product_detail/main_image`),
 *                     sözlüğü `simulator/vendor/placements.json`.
 *   - `lcp_profile` → indirilen türev (`w1280` / `original` / `unknown`).
 *   - `lcp_format`  → dosya biçimi (`webp`, `avif`, `jpg`…), en fazla 8 karakter.
 *
 * Üçü birlikte "hangi bölge, hangi türev, hangi biçim" sorusunu cevaplar;
 * hiçbiri tek bir kullanıcıya ya da tek bir ürüne geri götürmez.
 *
 * ÖLÇÜLMEDİ
 * ---------
 * Türev URL'lerinin gerçek adlandırma düzeni bu depoda DOĞRULANMADI —
 * çalışan bir storefront'a bakılmadı. `parseProfile()` iki yaygın deseni
 * (`...-w1280.webp` ve `?w=1280`) tanır, tanımadığında `unknown` döner.
 * `unknown` şemada açıkça geçerli bir değerdir, yani yanlış tahmin
 * ETMEKTENSE bilmediğini söyler. Gerçek desen öğrenildiğinde
 * `resolveLcpAsset` seçeneğiyle dışarıdan verilebilir; bu modül
 * değiştirilmek zorunda değildir.
 */

import { LCP_PROFILE_PATTERN, LCP_REGION_PATTERN, LIMITS } from "./contract.js";

/** Tanınmayan türev için şemanın izin verdiği değer. */
export const PROFILE_UNKNOWN = "unknown";

/** `?w=1280` ya da `-w1280.` / `_w1280.` / `/w1280/` biçimindeki genişlik izi. */
const WIDTH_IN_QUERY = /[?&](?:w|width)=(\d{2,4})\b/i;
const WIDTH_IN_PATH = /[-_/]w(\d{2,4})(?=[-_./]|$)/i;

/** Uzantı — sorgu ve fragment atıldıktan sonraki son nokta. */
const EXTENSION = /\.([a-z0-9]{2,8})$/i;

/**
 * URL'den türev profilini çıkar. URL DIŞARI ÇIKMAZ, yalnız etiket döner.
 *
 * @param {string} url
 * @returns {string} `w\d{2,4}` | `original` | `unknown`
 */
export function parseProfile(url) {
  const ham = String(url || "");
  if (!ham) return PROFILE_UNKNOWN;
  const q = ham.match(WIDTH_IN_QUERY);
  if (q) return clampProfile(`w${q[1]}`);
  const yol = ham.split("?")[0].split("#")[0];
  const p = yol.match(WIDTH_IN_PATH);
  if (p) return clampProfile(`w${p[1]}`);
  // Türev izi yoksa master dosya indirilmiş olabilir. `original` demek için
  // kanıt gerekir; kanıt yok, o yüzden `unknown`. (Faz 12'nin bulgusu tam
  // da "dördü de tek boy master" olduğu için bu ayrım önemli.)
  return PROFILE_UNKNOWN;
}

function clampProfile(aday) {
  return LCP_PROFILE_PATTERN.test(aday) ? aday : PROFILE_UNKNOWN;
}

/**
 * URL'den dosya biçimini çıkar. Bilinmiyorsa boş dizge (şemada `lcp_format`
 * zorunlu değil).
 *
 * @param {string} url
 * @returns {string} en fazla 8 karakter, küçük harf
 */
export function parseFormat(url) {
  const yol = String(url || "")
    .split("?")[0]
    .split("#")[0];
  const m = yol.match(EXTENSION);
  if (!m) return "";
  const uzanti = m[1].toLowerCase();
  return uzanti.length <= LIMITS.lcpFormatMaxLength ? uzanti : "";
}

/**
 * Bölge etiketini doğrula. Biçimsizse boş dizge — sunucu `invalid_lcp_region`
 * ile TÜM kaydı reddederdi; bir etiket uğruna ölçümü kaybetmek yanlış takas.
 *
 * @param {string} region `sayfa/bölge`
 * @returns {string}
 */
export function normalizeRegion(region) {
  const r = String(region || "")
    .trim()
    .toLowerCase();
  return LCP_REGION_PATTERN.test(r) ? r : "";
}

/**
 * `web-vitals/attribution` LCP metriğinden asset etiketlerini çıkar.
 * **Asla fırlatmaz.**
 *
 * Bölge, LCP elementinin `data-rum-region` niteliğinden okunur. Bu nitelik
 * bir SÖZLEŞMEDİR: render eden component `data-rum-region="product_detail/main_image"`
 * yazmadıysa bölge boş kalır ve "hangi bölge" sorusu cevapsız kalır. Niteliği
 * otomatik türetmek (ör. CSS seçicisinden) denenmedi: seçici DOM yapısına
 * bağlıdır, ilk yeniden düzenlemede sessizce başka bir şeyi etiketler.
 *
 * @param {object} metric web-vitals metrik nesnesi (attribution build)
 * @param {{doc?: Document}} [opts]
 * @returns {{lcp_profile: string, lcp_format: string, lcp_region: string}}
 */
export function lcpAssetTags(metric, opts = {}) {
  const bos = { lcp_profile: "", lcp_format: "", lcp_region: "" };
  try {
    const attribution = metric && metric.attribution;
    if (!attribution) return bos;
    const url = attribution.url || "";
    const out = {
      lcp_profile: url ? parseProfile(url) : "",
      lcp_format: url ? parseFormat(url) : "",
      lcp_region: normalizeRegion(readRegion(attribution, opts.doc)),
    };
    return out;
  } catch {
    return bos;
  }
}

/**
 * LCP elementini bulup `data-rum-region` niteliğini oku.
 *
 * `attribution.target` bir CSS SEÇİCİ dizgesidir (element değil). Seçiciyle
 * elementi geri bulmak gerekir; bulunamazsa (element o sırada DOM'dan
 * çıkmışsa) bölge boş kalır.
 */
function readRegion(attribution, doc) {
  const d = doc || globalThis.document;
  if (!d || typeof d.querySelector !== "function") return "";
  // Öncelik: doğrudan element referansı (lcpEntry.element), sonra seçici.
  const entry = attribution.lcpEntry;
  const el = entry && entry.element ? entry.element : selectorLookup(d, attribution.target);
  if (!el || typeof el.closest !== "function") return "";
  const tasiyici = el.closest("[data-rum-region]");
  return tasiyici ? tasiyici.getAttribute("data-rum-region") || "" : "";
}

function selectorLookup(doc, target) {
  if (!target || typeof target !== "string") return null;
  try {
    return doc.querySelector(target);
  } catch {
    // Geçersiz seçici — `querySelector` fırlatır. Bölge yok, ölçüm yaşar.
    return null;
  }
}
