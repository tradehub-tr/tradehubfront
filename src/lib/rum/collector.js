/*
 * VENDOR KÖKENİ (2026-08-20) — T-123 RUM zinciri, storefront montajı.
 * Kaynak: admin-panel/frontend/src/lib/media/rum/collector.js
 * Sözleşme kaynağı: tradehub_core/tradehub_core/media/pipeline/delivery/rum.py
 * Değişiklikler bu başlığın altında ayrıca işaretlenmedikçe birebir kopyadır.
 */
/**
 * T-123 — `web-vitals` toplayıcısı. **ASLA FIRLATMAZ.**
 *
 * NE TOPLAR
 * ---------
 * LCP, CLS, INP, TTFB (kabul kriteri #1'in istediği dördü) ve isteğe bağlı
 * FCP. Adlar `rum.METRICS` ile birebir; `web-vitals` zaten aynı adları
 * kullanıyor, dönüşüm yok.
 *
 * NEDEN `attribution` YAPISI
 * --------------------------
 * Kabul kriteri #2 "LCP elementinin hangi asset olduğu" der. Bunu yalnız
 * `web-vitals/attribution` yapısı verir (`attribution.url`,
 * `attribution.lcpEntry`). URL'in kendisi ASLA gönderilmez — `lcpAsset.js`
 * onu üç kaba etikete indirger.
 *
 * NE ZAMAN GÖNDERİR
 * -----------------
 * Metrikler kuyruğa alınır, gönderim sayfa GİZLENİRKEN yapılır
 * (`visibilitychange` → hidden, ve yedek olarak `pagehide`). Nedeni
 * `web-vitals`'ın kendi davranışı: CLS ve INP nihai değerlerini ancak sayfa
 * gizlenirken bilir. Erken göndermek, ölçümün yarısını göndermek olurdu.
 *
 * Dinleyici sırası ÖNEMLİ: önce `web-vitals` kaydedilir, sonra bizim flush
 * dinleyicimiz. Aynı olayda dinleyiciler kayıt sırasına göre çalışır; ters
 * sırada bağlansaydık, kuyruk `web-vitals` son değerleri yazmadan
 * boşaltılırdı.
 *
 * ÖRNEKLEM
 * --------
 * Karar oturum başına BİR kez verilir (`sampling.decideSafe`). Örnekleme
 * girmeyen oturumda hiçbir `web-vitals` dinleyicisi kurulmaz — ölçüp atmak
 * yerine hiç ölçmemek, hem `PerformanceObserver` maliyetini hem de kuyruğu
 * sıfırlar.
 */

import { collectContext } from "./context.js";
import { lcpAssetTags } from "./lcpAsset.js";
import { buildPayloadSafe } from "./payload.js";
import { navigationType } from "./context.js";
import { DEFAULT_SAMPLE_RATE, decideSafe, sessionToken } from "./sampling.js";
import { DEFAULT_ENDPOINT, createTransport } from "./transport.js";

/** Varsayılan olarak toplanan metrikler. FCP kapalı — dördü kabul kriteri. */
export const DEFAULT_METRICS = Object.freeze(["LCP", "CLS", "INP", "TTFB"]);

/**
 * Tek gövdede gönderilecek en fazla ölçüm. Kuyruk bunu aşarsa erken
 * boşaltılır. Sınır `sendBeacon`'ın tarayıcı kotasından (~64 KB) çok altta
 * tutuldu; bir ölçüm ~200 bayt.
 */
const MAX_BATCH = 20;

/**
 * `web-vitals/attribution` modülünü getir. Geç ve savunmacı: paket yoksa ya
 * da tarayıcı desteklemiyorsa toplayıcı sessizce devre dışı kalır.
 *
 * @returns {Promise<object|null>}
 */
async function loadVitals() {
  try {
    return await import("web-vitals/attribution");
  } catch {
    return null;
  }
}

/**
 * Toplayıcıyı kur ve başlat.
 *
 * @param {object} [opts]
 * @param {string}   [opts.endpoint]      gönderim yolu
 * @param {number}   [opts.sampleRate]    0..1, varsayılan 0.1
 * @param {string[]} [opts.metrics]       toplanacak metrikler
 * @param {string}   [opts.engineVersion] medya motoru sürümü (<=32 karakter)
 * @param {object}   [opts.vitals]        `web-vitals` sahtesi (test)
 * @param {object}   [opts.transport]     gönderici sahtesi (test)
 * @param {string}   [opts.token]         oturum tokeni (test)
 * @param {object}   [opts.target]        olay dinleyici hedefi (test), vars. window
 * @param {object}   [opts.doc]           document (test)
 * @param {Function} [opts.onDiagnostic]  `(kod, ayrıntı) => void`
 * @returns {{stop: Function, flush: Function, isSampled: Function,
 *            queueSize: Function, ready: Promise<boolean>}}
 */
export function createRumCollector(opts = {}) {
  const durum = {
    kuyruk: [],
    durduruldu: false,
    ornekte: false,
    cozuldu: null,
  };

  function tani(kod, ayrinti) {
    if (typeof opts.onDiagnostic !== "function") return;
    try {
      opts.onDiagnostic(kod, ayrinti);
    } catch {
      /* tanılama sayfayı kıramaz */
    }
  }

  const transport =
    opts.transport ||
    createTransport({
      endpoint: opts.endpoint !== undefined ? opts.endpoint : DEFAULT_ENDPOINT,
      onDiagnostic: tani,
    });

  const sampleRate = Number.isFinite(opts.sampleRate) ? opts.sampleRate : DEFAULT_SAMPLE_RATE;
  const metrics = Array.isArray(opts.metrics) ? opts.metrics : DEFAULT_METRICS;

  let token = "";
  try {
    token = opts.token || sessionToken();
  } catch {
    token = "";
  }
  durum.ornekte = decideSafe(token, sampleRate);

  const doc = opts.doc || safeGlobal("document");
  const target = opts.target || safeGlobal("window") || globalThis;

  /**
   * Bir `web-vitals` metriğini kuyruğa al. **Asla fırlatmaz.**
   * `web-vitals` bunu kendi geri çağrısı içinde çağırır; buradan çıkan bir
   * istisna doğrudan kütüphanenin observer'ına sızardı.
   */
  function kuyrukla(metric) {
    try {
      if (durum.durduruldu || !durum.ornekte || !metric) return;
      const ad = String(metric.name || "").toUpperCase();
      const baglam = collectContext();
      const govde = {
        ...baglam,
        metric: ad,
        value: metric.value,
        sample_rate: sampleRate,
        navigation_type: navigationType(metric.navigationType),
        session_token: token,
      };
      if (opts.engineVersion) govde.engine_version = String(opts.engineVersion);
      if (ad === "LCP") Object.assign(govde, lcpAssetTags(metric, { doc }));

      const gecerli = buildPayloadSafe(govde);
      if (!gecerli) {
        tani("invalid", ad);
        return;
      }
      durum.kuyruk.push(gecerli);
      tani("queued", ad);
      if (durum.kuyruk.length >= MAX_BATCH) flush();
    } catch (e) {
      tani("collect-error", e && e.name ? e.name : "unknown");
    }
  }

  /**
   * Kuyruğu gönder. **Asla fırlatmaz, asla reject etmez.**
   *
   * @returns {Promise<string>} gönderim sonucu kodu
   */
  function flush() {
    try {
      if (!durum.kuyruk.length) return Promise.resolve("empty");
      const paket = durum.kuyruk.splice(0, durum.kuyruk.length);
      let govde = "";
      try {
        govde = JSON.stringify({ samples: paket });
      } catch {
        // Döngüsel referans olamaz (gövde düz nesne) ama garanti altına al.
        return Promise.resolve("failed");
      }
      const sonuc = transport.send(govde);
      // `send` bir söz döndürür ve reddetmemeyi taahhüt eder; yine de
      // yakala — sahte bir transport bu taahhüdü tutmayabilir.
      return Promise.resolve(sonuc).catch(() => "failed");
    } catch {
      return Promise.resolve("failed");
    }
  }

  function gizlendiMi() {
    try {
      return !doc || doc.visibilityState === "hidden";
    } catch {
      return false;
    }
  }

  function onVisibility() {
    if (gizlendiMi()) flush();
  }

  function onPageHide() {
    flush();
  }

  /**
   * Dinleyicileri bağla.
   *
   * HEDEF ve FAZ bilinçli seçildi:
   *   - `visibilitychange` olayı **`document`** üzerinde tetiklenir ve
   *     `web-vitals` de dinleyicisini oraya bağlar. Aynı hedefte, aynı fazda
   *     dinleyiciler KAYIT SIRASINA göre çalışır; bu fonksiyon `web-vitals`
   *     kaydından SONRA çağrıldığı için kuyruk, son değerler yazıldıktan
   *     sonra boşaltılır.
   *   - YAKALAMA (capture) fazı KULLANILMAZ. `window` üzerinde capture ile
   *     dinlemek, olayın `document`'e inmeden önce bizi çağırırdı — yani
   *     `web-vitals`'tan ÖNCE. Tam da kaçınmak istediğimiz sıra bu.
   *   - `pagehide` `window` üzerinde tetiklenir; yedek yoldur (iOS Safari'de
   *     `visibilitychange` bazı kapanışlarda gelmez).
   */
  function baglaDinleyiciler() {
    try {
      if (doc && typeof doc.addEventListener === "function") {
        doc.addEventListener("visibilitychange", onVisibility);
      }
      if (target && typeof target.addEventListener === "function") {
        target.addEventListener("pagehide", onPageHide);
      }
    } catch {
      /* dinleyici bağlanamadı — flush yalnız elle çağrılır */
    }
  }

  function cozDinleyiciler() {
    try {
      if (doc && typeof doc.removeEventListener === "function") {
        doc.removeEventListener("visibilitychange", onVisibility);
      }
      if (target && typeof target.removeEventListener === "function") {
        target.removeEventListener("pagehide", onPageHide);
      }
    } catch {
      /* yoksay */
    }
  }

  /** `web-vitals` dinleyicilerini kur. Hata olursa toplayıcı sessizce susar. */
  async function baslat() {
    try {
      if (!durum.ornekte) {
        tani("not-sampled", sampleRate);
        return false;
      }
      const wv = opts.vitals || (await loadVitals());
      if (!wv) {
        tani("vitals-missing", "");
        return false;
      }
      const eslesme = {
        LCP: wv.onLCP,
        CLS: wv.onCLS,
        INP: wv.onINP,
        TTFB: wv.onTTFB,
        FCP: wv.onFCP,
      };
      let kurulan = 0;
      for (const ad of metrics) {
        const fn = eslesme[String(ad).toUpperCase()];
        if (typeof fn !== "function") continue;
        try {
          fn(kuyrukla);
          kurulan += 1;
        } catch (e) {
          // Tek bir metrik gözlemcisi kurulamadıysa (tarayıcı desteklemiyor)
          // diğerleri yaşamalı.
          tani("observer-failed", `${ad}:${e && e.name ? e.name : "unknown"}`);
        }
      }
      // Dinleyiciler `web-vitals` KAYDINDAN SONRA bağlanır — bkz. başlık.
      baglaDinleyiciler();
      tani("started", kurulan);
      return kurulan > 0;
    } catch (e) {
      tani("start-failed", e && e.name ? e.name : "unknown");
      return false;
    }
  }

  const ready = baslat().catch(() => false);

  return {
    /** Dinleyicileri çöz ve kalanı gönder. Asla fırlatmaz. */
    stop() {
      try {
        durum.durduruldu = true;
        cozDinleyiciler();
        return flush();
      } catch {
        return Promise.resolve("failed");
      }
    },
    flush,
    isSampled: () => durum.ornekte,
    queueSize: () => durum.kuyruk.length,
    ready,
  };
}

function safeGlobal(ad) {
  try {
    return globalThis[ad] || null;
  } catch {
    return null;
  }
}
