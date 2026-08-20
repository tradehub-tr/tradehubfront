/*
 * VENDOR KÖKENİ (2026-08-20) — T-123 RUM zinciri, storefront montajı.
 * Kaynak: admin-panel/frontend/src/lib/media/rum/transport.js
 * Sözleşme kaynağı: tradehub_core/tradehub_core/media/pipeline/delivery/rum.py
 * Değişiklikler bu başlığın altında ayrıca işaretlenmedikçe birebir kopyadır.
 */
/**
 * T-123 — gönderim katmanı. **ASLA FIRLATMAZ.**
 *
 * SÖZLEŞME
 * --------
 * `send()` hiçbir koşulda istisna fırlatmaz ve hiçbir koşulda reddedilen bir
 * söz (rejected promise) döndürmez. Uç 404 verse, sunucu 500 atsa, ağ hiç
 * olmasa, `sendBeacon` kuyruğu dolsa da çağıran kod etkilenmez. Telemetri
 * kullanıcının sayfasını ASLA kırmamalı: ölçüm, ölçtüğü şeyi bozarsa
 * ölçüm değildir.
 *
 * Bu, depodaki mevcut desenin aynısı — `composables/useMediaBrowser.js`
 * `load()`: *"Asla fırlatmaz. Uç henüz yayına girmemiş ya da hata döndürmüş
 * olabilir; o durumda ekran çökmemeli."* T-123 için bu varsayımsal değil,
 * BUGÜNKÜ DURUM: uç kurulmadı (bkz. modül sonundaki not).
 *
 * NEDEN `utils/api.js` KULLANILMIYOR
 * ----------------------------------
 * `CLAUDE.md` yeni HTTP isteklerinin `utils/api.js` üzerinden geçmesini
 * söyler. Telemetri bunun BİLİNÇLİ istisnasıdır, iki ölçülmüş nedenle:
 *
 *   1. `api.js` 401/417 aldığında `window.location.href = "/panel/reset"`
 *      ile SERT YÖNLENDİRME yapar (`src/utils/api.js:145,176`). Sayfa
 *      kapanırken atılan bir telemetri isteği bayat oturum yüzünden 401
 *      alırsa, kullanıcı ölçüm uğruna oturumundan atılırdı. Telemetrinin
 *      oturum yaşam döngüsüne dokunma yetkisi olamaz.
 *   2. `navigator.sendBeacon` `api.js`'ten GEÇEMEZ — `fetch` sarmalayıcısı
 *      değildir, ayrı bir tarayıcı API'sidir. Sayfa kapanırken ölçümün
 *      kaybolmaması tam olarak bu API'ye bağlıdır.
 *
 * Takas: CSRF başlığı gönderilmez. Uç bu yüzden CSRF muaf ve `allow_guest`
 * olmak zorundadır — gerekçesi ve riski raporun "uç tarifi" bölümünde.
 */

/** Uç bulunamadı sayılan HTTP durumları — devre kalıcı olarak açılır. */
const KALICI_HATA = Object.freeze([404, 405, 410, 501]);

/** Gönderim sonucu kodları. Yalnız tanılama içindir, akışı etkilemez. */
export const SEND_OK = "ok";
export const SEND_BEACON = "beacon";
export const SEND_FETCH = "fetch";
export const SEND_DISABLED = "disabled";
export const SEND_FAILED = "failed";
export const SEND_EMPTY = "empty";

/**
 * Gönderici kur.
 *
 * @param {object} opts
 * @param {string} opts.endpoint gövdenin POST edileceği yol
 * @param {Navigator} [opts.navigator] test için
 * @param {Function} [opts.fetch] test için
 * @param {Function} [opts.onDiagnostic] `(kod, ayrıntı) => void` — ASLA
 *        fırlatmamalı; yine de fırlatırsa yutulur.
 * @returns {{send: Function, isDisabled: Function, reset: Function}}
 */
export function createTransport(opts = {}) {
  const endpoint = String(opts.endpoint || "");
  let devreKapali = false;

  function tani(kod, ayrinti) {
    if (typeof opts.onDiagnostic !== "function") return;
    try {
      opts.onDiagnostic(kod, ayrinti);
    } catch {
      // Tanılama geri çağrısı bile sayfayı kıramaz.
    }
  }

  function nav() {
    try {
      return opts.navigator !== undefined ? opts.navigator : globalThis.navigator;
    } catch {
      return null;
    }
  }

  function fetchImpl() {
    try {
      return typeof opts.fetch === "function" ? opts.fetch : globalThis.fetch;
    } catch {
      return null;
    }
  }

  /**
   * `sendBeacon` dene. Tarayıcı desteklemiyorsa ya da kuyruk doluysa `false`.
   * `sendBeacon` senkron `false` döner ya da (bazı tarayıcılarda, gövde
   * çok büyükse) FIRLATIR — ikisi de yutulur.
   */
  function beacon(govde) {
    const n = nav();
    if (!n || typeof n.sendBeacon !== "function") return false;
    try {
      // `type` ÖNEMLİ: `application/json` "basit istek" olmadığı için
      // CORS ön-kontrolü (preflight) tetikler ve sayfa kapanırken
      // ön-kontrol tamamlanamaz. `text/plain` basit istektir; sunucu
      // gövdeyi yine JSON olarak ayrıştırır.
      const blob = new globalThis.Blob([govde], { type: "text/plain;charset=UTF-8" });
      return n.sendBeacon(endpoint, blob) === true;
    } catch {
      return false;
    }
  }

  /**
   * `fetch` yedeği. `keepalive` ile sayfa kapanırken de yola çıkabilir
   * (gövde sınırı ~64 KB, bizim gövdemiz bunun çok altında).
   */
  async function yedek(govde) {
    const f = fetchImpl();
    if (typeof f !== "function") return SEND_FAILED;
    try {
      const yanit = await f(endpoint, {
        method: "POST",
        body: govde,
        keepalive: true,
        credentials: "same-origin",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
      });
      const durum = yanit && typeof yanit.status === "number" ? yanit.status : 0;
      if (KALICI_HATA.includes(durum)) {
        devreKapali = true;
        tani(SEND_DISABLED, durum);
        return SEND_DISABLED;
      }
      if (yanit && yanit.ok === false) {
        tani(SEND_FAILED, durum);
        return SEND_FAILED;
      }
      return SEND_OK;
    } catch (e) {
      // Ağ yok, DNS yok, CORS reddi, iptal — hepsi buraya düşer ve BURADA
      // ölür. Çağırana asla ulaşmaz.
      tani(SEND_FAILED, e && e.name ? e.name : "network");
      return SEND_FAILED;
    }
  }

  return {
    /**
     * Gövdeyi gönder. **Asla fırlatmaz, asla reject etmez.**
     *
     * @param {string} govde JSON dizgesi
     * @returns {Promise<string>} `SEND_*` kodlarından biri
     */
    async send(govde) {
      try {
        if (!endpoint) return SEND_DISABLED;
        if (devreKapali) return SEND_DISABLED;
        if (!govde) return SEND_EMPTY;
        if (beacon(govde)) {
          tani(SEND_BEACON, govde.length);
          return SEND_BEACON;
        }
        const sonuc = await yedek(govde);
        if (sonuc === SEND_OK) tani(SEND_FETCH, govde.length);
        return sonuc;
      } catch (e) {
        // Ulaşılamaz olması beklenir; yine de son bir ağ. `send`'in
        // fırlatmadığı bu satırla GARANTİ edilir, yukarıdaki dikkatle değil.
        tani(SEND_FAILED, e && e.name ? e.name : "unexpected");
        return SEND_FAILED;
      }
    },

    /** Devre açıldı mı (uç kalıcı hata verdi mi). */
    isDisabled() {
      return devreKapali;
    },

    /** Devreyi kapat — yalnız test ve elle yeniden deneme için. */
    reset() {
      devreKapali = false;
    },
  };
}

/**
 * VENDOR DEĞİŞİKLİĞİ (2026-08-20): kaynak kopyada bu sabit
 * `tradehub_core.api.v1.media_rum.collect` idi ve "UÇ HENÜZ YOK" notu
 * taşıyordu. Uç bu görevle KURULDU: `tradehub_core/api/rum.py:collect`
 * (`@frappe.whitelist(allow_guest=True, methods=["POST"])` + hız sınırı).
 * Yol gerçek uca güncellendi; `startRum({ endpoint })` ile hâlâ ezilebilir.
 */
export const DEFAULT_ENDPOINT = "/api/method/tradehub_core.api.rum.collect";
