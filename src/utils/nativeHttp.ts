/**
 * Native (Capacitor) cross-origin köprüsü.
 *
 * SORUN: Bundle (App Store/TestFlight) modunda app, web içeriğini KENDİ yerel
 * kaynağından yükler (iOS: `capacitor://localhost`, Android: `https://localhost`).
 * Bu modda `fetch("/api/...")` gibi RELATIVE URL'ler `capacitor://localhost/api`'ye
 * çözülür → backend yok, istek başarısız. Ayrıca farklı origin'e fetch CORS'a takılır.
 *
 * ÇÖZÜM:
 *  1) `CapacitorHttp` (capacitor.config.ts'te enabled) — fetch'i NATIVE ağ katmanına
 *     yönlendirir; browser CORS politikası uygulanmaz, cookie'ler native jar'da tutulur.
 *     → backend'de CORS ayarı GEREKMEZ.
 *  2) Bu modül — bundle modunda `window.fetch`'i sarıp relative `/api|/files|...`
 *     URL'lerini mutlak backend URL'ine (VITE_NATIVE_API_URL) çevirir.
 *
 * DEV LIVE-RELOAD modunda (CAP_SERVER_URL ile Vite dev server'a bağlıyken) origin
 * zaten dev server olduğu için relative `/api` Vite proxy ile çalışır → rewrite YAPILMAZ.
 */
import { Capacitor } from "@capacitor/core";

const NATIVE_BACKEND = ((import.meta.env.VITE_NATIVE_API_URL as string) || "https://rc.istoc.com").replace(
  /\/+$/,
  ""
);

// Yalnızca backend'e ait relative kökler çevrilir (statik asset/route'lar değil).
const REWRITE_RE = /^\/(api|files|private|assets|socket\.io)(\/|$|\?)/;

/**
 * Bundle (App Store) bağlamı mı? = native + yerel kaynaktan yüklenmiş.
 * Live-reload (LAN IP host) ve saf web bundan hariç.
 */
export function isNativeBundleContext(): boolean {
  if (!Capacitor.isNativePlatform()) return false;
  return location.protocol === "capacitor:" || location.hostname === "localhost";
}

/** Bundle modunda mutlak API base; değilse null (web/live-reload relative kullanır). */
export const NATIVE_API_BASE: string | null = isNativeBundleContext() ? `${NATIVE_BACKEND}/api` : null;

let _installed = false;

/** `window.fetch`'i sar: bundle modunda relative backend URL'lerini mutlaklaştır. Idempotent. */
export function installNativeFetchRewrite(): void {
  if (_installed || !isNativeBundleContext()) return;
  _installed = true;

  const orig = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    try {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.pathname + input.search
            : input instanceof Request
              ? input.url
              : "";
      if (REWRITE_RE.test(url)) {
        const abs = NATIVE_BACKEND + url;
        if (input instanceof Request) return orig(new Request(abs, input), init);
        return orig(abs, init);
      }
    } catch {
      /* herhangi bir hata: dokunmadan orijinale düş */
    }
    return orig(input as RequestInfo, init);
  };
}

// Import edildiği anda kur (bundle değilse no-op).
installNativeFetchRewrite();
