/**
 * hlsVideo — HLS (.m3u8) kaynaklarını <video> elementine bağlama köprüsü.
 *
 * Karar üç kademeli (admin paneldeki `hlsPlayback.js` ile aynı sözleşme):
 *
 *   1. URL HLS değilse → düz `video.src` (progresif, bugünkü davranış).
 *   2. Tarayıcı HLS'i YERLİ çözüyorsa (Safari/iOS `canPlayType`) → yine düz
 *      `video.src`; hls.js hiç İNDİRİLMEZ.
 *   3. Yerli destek yoksa → hls.js dinamik `import()` ile gelir ve MSE
 *      üzerinden çalar. Statik `import Hls from "hls.js"` YAZILMAZ — paket
 *      yalnız gerçekten HLS oynatan oturumda indirilmeli (vendor chunk'a ya
 *      da ana pakete girmemeli).
 *
 * hls.js yüklenemezse (MSE yok / paket gelmedi) URL yine `video.src`'ye
 * yazılır: tarayıcı kendi `error` olayını üretir ve çağıranın mevcut hata
 * yolu çalışır — bu modül asla fırlatmaz.
 */
import type HlsType from "hls.js";

type HlsCtor = typeof HlsType;
export type HlsLoader = () => Promise<HlsCtor | null>;

const HLS_URL_RE = /\.m3u8(?:[?#]|$)/i;

/** URL bir HLS manifesti mi (`.m3u8`, sorgu/parça payıyla birlikte). */
export function isHlsUrl(url: string): boolean {
  return HLS_URL_RE.test((url || "").trim());
}

/** Tarayıcı HLS'i yerli çözüyor mu. Boş dize = hayır ("maybe"/"probably" = evet). */
export function canPlayNativeHls(video: HTMLVideoElement): boolean {
  return (
    typeof video.canPlayType === "function" &&
    video.canPlayType("application/vnd.apple.mpegurl") !== ""
  );
}

/**
 * hls.js'i getir ve ortamın ÇALIŞTIRABİLDİĞİNİ doğrula. Savunmacı: import
 * patlarsa ya da MSE desteklenmiyorsa `null` döner, asla fırlatmaz.
 */
export async function loadHls(): Promise<HlsCtor | null> {
  try {
    const mod = await import("hls.js");
    const Hls = (mod.default ?? mod) as HlsCtor;
    if (typeof Hls?.isSupported === "function" && Hls.isSupported()) return Hls;
    return null;
  } catch {
    return null;
  }
}

/** Video başına aktif hls.js motoru — 3. parti instance, reaktif yapılmaz. */
const engines = new WeakMap<HTMLVideoElement, { destroy(): void }>();
/** Yarış bileti: import beklenirken kaynak değişirse eski bağlanma iptal. */
const tickets = new WeakMap<HTMLVideoElement, number>();

/** Videoya bağlı hls.js motorunu (varsa) söker ve bekleyen bağlanmayı iptal eder. */
export function detachHlsEngine(video: HTMLVideoElement): void {
  tickets.set(video, (tickets.get(video) ?? 0) + 1);
  engines.get(video)?.destroy();
  engines.delete(video);
}

/**
 * Kaynağı videoya bağla — HLS ise gerekirse hls.js ile, değilse düz `src`.
 * Aynı elemente üst üste çağrılabilir: önce eski motor sökülür; import
 * beklerken yeni bir çağrı gelirse eski sonuç sessizce atılır.
 */
export async function attachVideoSource(
  video: HTMLVideoElement,
  url: string,
  load: HlsLoader = loadHls
): Promise<void> {
  detachHlsEngine(video);
  const src = (url || "").trim();
  if (!src) {
    video.removeAttribute("src");
    return;
  }
  if (!isHlsUrl(src) || canPlayNativeHls(video)) {
    video.src = src;
    return;
  }

  const ticket = tickets.get(video) ?? 0;
  const Hls = await load();
  if ((tickets.get(video) ?? 0) !== ticket) return; // bu bağlanma eskidi
  if (!Hls) {
    // MSE yok: yine de src'yi yaz — tarayıcı `error` üretir, çağıranın
    // mevcut hata yolu (fallback görselleri vb.) devreye girer.
    video.src = src;
    return;
  }

  const hls = new Hls();
  let mediaRecoveryUsed = false;
  hls.on(Hls.Events.ERROR, (_event, data) => {
    if (!data?.fatal) return;
    // hls.js API dokümanının önerisi: ölümcül medya hatasında BİR kez
    // `recoverMediaError` denenir; diğer ölümcüllerde motor kapatılır.
    if (data.type === Hls.ErrorTypes.MEDIA_ERROR && !mediaRecoveryUsed) {
      mediaRecoveryUsed = true;
      hls.recoverMediaError();
      return;
    }
    hls.destroy();
    engines.delete(video);
  });
  hls.loadSource(src);
  hls.attachMedia(video);
  engines.set(video, hls);
}

/**
 * `data-hls-src` taşıyan ve henüz bağlanmamış tüm videoları bağla.
 * `data-hls-bound` işareti aynı elementin iki kez bağlanmasını önler —
 * hem gözlemci hem elle çağrı aynı videoyu görse de motor tek kurulur.
 */
export function hydrateHlsVideos(root: ParentNode = document, load: HlsLoader = loadHls): void {
  root
    .querySelectorAll<HTMLVideoElement>("video[data-hls-src]:not([data-hls-bound])")
    .forEach((video) => {
      video.dataset.hlsBound = "1";
      void attachVideoSource(video, video.dataset.hlsSrc || "", load);
    });
}

let hydrationStarted = false;

/**
 * DOM'a `innerHTML` ile giren HLS videolarını otomatik bağlayan gözlemciyi
 * (bir kez) kur. Bu projede video HTML'i dizge olarak üretilip birçok
 * noktadan `innerHTML`/`x-html` ile basılıyor (galeri ana medya, lightbox,
 * MediaViewer, ProductVideoSection swap) — her basma noktasını tek tek
 * kovalamak yerine ekleme anında yakalanır. Gözlemci yalnız HLS videosu
 * ÜRETEN sayfalarda kurulur (`toVideoEmbedHtml` çağırır), her sayfada değil.
 */
export function ensureHlsHydration(): void {
  if (hydrationStarted) return;
  if (typeof MutationObserver === "undefined" || typeof document === "undefined") return;
  hydrationStarted = true;
  const observer = new MutationObserver(() => hydrateHlsVideos());
  const start = (): void => {
    observer.observe(document.body, { childList: true, subtree: true });
    hydrateHlsVideos();
  };
  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start, { once: true });
}
