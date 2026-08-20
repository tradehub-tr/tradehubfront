/*
 * VENDOR KÖKENİ (2026-08-20) — T-123 RUM zinciri, storefront montajı.
 * Kaynak: admin-panel/frontend/src/lib/media/rum/sampling.js
 * Sözleşme kaynağı: tradehub_core/tradehub_core/media/pipeline/delivery/rum.py
 * Değişiklikler bu başlığın altında ayrıca işaretlenmedikçe birebir kopyadır.
 */
/**
 * T-123 — örneklem kararı ve oturum tokeni.
 *
 * VARSAYILAN ORAN NEDEN %10
 * -------------------------
 * `docs/70-faz12-headless-teslim.html` T-123 bölümü örneklemi **%10** olarak
 * yazar; varsayılan oradan alındı, burada KARARLAŞTIRILMADI.
 *
 * Neden %100 değil: her sayfa yüklemesi 4 metrik (LCP/CLS/INP/TTFB) üretir.
 * %100'de bu, her ziyaret başına 4 satır demektir ve `Media RUM Sample`
 * ham örneklemi 30 gün tutar (`rum.DOCTYPE_DESIGN.retention_days`). Oranı
 * kayda yazmak (`sample_rate`) ve sunucuda `1/oran` ile genellemek
 * (`rum.aggregate` → `estimated_population`) tam da bunun için var: %10 ile
 * toplanan p75, %100 ile toplanandan farklı bir SAYI değil, daha geniş
 * güven aralığına sahip aynı tahmindir.
 *
 * Neden %1 değil: p75 kestirimi kova başına yeterli örnek ister. Kovalama
 * `(metric, route, device_class)` üzerinden yapılır (`rum.METRIC_GROUP_BY`),
 * yani trafik 5 metrik × 8 rota × 3 cihaz sınıfına bölünür. %1, seyrek
 * rota/cihaz kovalarını tek haneli örnek sayısına düşürür ve p75 gürültüye
 * döner.
 *
 * NOT — bu proje için "doğru" oranın ne olduğu ÖLÇÜLMEDİ: trafik hacmi
 * bilinmiyor ve uç yayında olmadığı için ölçülemez. %10 dokümandan gelen
 * bir başlangıç değeridir, ölçüme dayanan bir optimum değil. `sampleRate`
 * yapılandırılabilir bırakıldı; ilk gerçek veriden sonra kova başına örnek
 * sayısına bakılıp güncellenmelidir.
 *
 * KARAR NEDEN DETERMİNİSTİK
 * -------------------------
 * `Math.random()` her metrikte ayrı atılsaydı, bir oturumun LCP'si alınıp
 * INP'si düşerdi. `rum.py` bunu açıkça yasaklıyor: "yarım oturum p75'i
 * çarpıtır". Karar token'dan türetilir; aynı token + aynı oran → hep aynı
 * karar. Algoritma sunucudaki `rum.decide()` ile birebirdir ve parity
 * testiyle kanıtlanır.
 */

import { SESSION_TOKEN_PATTERN } from "./contract.js";
import { sha256Hex } from "./sha256.js";

/** Doküman kaynaklı varsayılan örneklem oranı (T-123: %10). */
export const DEFAULT_SAMPLE_RATE = 0.1;

/** Oturum tokeninin uzunluğu (hex karakter). Şema 16-64 kabul eder. */
const TOKEN_HEX_LEN = 32;

/** Aynı sekmede tokeni paylaşmak için kullanılan anahtar. */
export const SESSION_TOKEN_KEY = "tradehub.rum.token";

/**
 * Kriptografik rastgele hex üret. `crypto.getRandomValues` yoksa
 * `Math.random`'a düşer — token bir KİMLİK değil, yalnız örneklem kovası
 * olduğu için bu düşüş kabul edilebilir; yine de tercih sırası korunur.
 *
 * @param {number} hexLen üretilecek hex karakter sayısı (çift olmalı)
 * @returns {string}
 */
export function randomHex(hexLen = TOKEN_HEX_LEN) {
  const byteLen = Math.ceil(hexLen / 2);
  const buf = new Uint8Array(byteLen);
  const c = globalThis.crypto;
  if (c && typeof c.getRandomValues === "function") {
    c.getRandomValues(buf);
  } else {
    for (let i = 0; i < byteLen; i += 1) buf[i] = Math.floor(Math.random() * 256);
  }
  let out = "";
  for (let i = 0; i < byteLen; i += 1) out += buf[i].toString(16).padStart(2, "0");
  return out.slice(0, hexLen);
}

/**
 * Bu OTURUM için token. `sessionStorage` varsa oradan okunur; böylece aynı
 * sekmede yapılan yumuşak gezinmeler tek örneklem kararını paylaşır.
 *
 * KALICI DEĞİL: `sessionStorage` sekme kapanınca silinir. `localStorage`
 * bilinçli olarak KULLANILMADI — kalıcı bir token, oturumlar arası
 * birleştirilebilir bir tanımlayıcı olurdu ve `rum.py`'nin "kimlik alanı
 * yok" kuralının ruhuna aykırı düşerdi.
 *
 * **Asla fırlatmaz** — depolama erişimi (gizli sekme, üçüncü taraf çerez
 * engeli) `SecurityError` atabilir; o durumda bellekte kalan yeni bir token
 * üretilir.
 *
 * @param {{storage?: Storage}} [opts]
 * @returns {string} 32 hex karakter
 */
export function sessionToken(opts = {}) {
  const store = opts.storage !== undefined ? opts.storage : safeSessionStorage();
  try {
    if (store) {
      const mevcut = store.getItem(SESSION_TOKEN_KEY);
      if (mevcut && SESSION_TOKEN_PATTERN.test(mevcut)) return mevcut;
      const yeni = randomHex(TOKEN_HEX_LEN);
      store.setItem(SESSION_TOKEN_KEY, yeni);
      return yeni;
    }
  } catch {
    // Depolama yok ya da yasak — sessizce bellekteki tokene düş.
  }
  return randomHex(TOKEN_HEX_LEN);
}

function safeSessionStorage() {
  try {
    return globalThis.sessionStorage || null;
  } catch {
    return null;
  }
}

/**
 * Bu oturum örnekleme giriyor mu — DETERMİNİSTİK.
 *
 * `rum.decide()` ile birebir: ilk 8 hex → [0,1), `< oran` ise girer.
 *
 * @param {string} token 16-64 hex oturum tokeni
 * @param {number} rate 0..1
 * @returns {boolean}
 * @throws {RangeError} oran aralık dışıysa ya da token biçimsizse
 */
export function decide(token, rate) {
  const oran = Number(rate);
  if (!Number.isFinite(oran) || oran < 0 || oran > 1) {
    throw new RangeError(`sample_rate 0..1 aralığında olmalı: ${rate}`);
  }
  if (oran === 0) return false;
  if (oran === 1) return true;
  if (!SESSION_TOKEN_PATTERN.test(token || "")) {
    throw new RangeError("Oturum tokeni 16-64 hex olmalı");
  }
  const birim = parseInt(sha256Hex(token).slice(0, 8), 16) / 0xffffffff;
  return birim < oran;
}

/**
 * `decide` ama ASLA FIRLATMAZ — biçimsiz girdide "örnekleme girme" der.
 *
 * Toplayıcının sıcak yolunda kullanılır: bir yapılandırma hatası yüzünden
 * telemetri istisna fırlatıp sayfayı bozmaktansa, ölçüm göndermemek yeğdir.
 *
 * @param {string} token
 * @param {number} rate
 * @returns {boolean}
 */
export function decideSafe(token, rate) {
  try {
    return decide(token, rate);
  } catch {
    return false;
  }
}
