/**
 * Tracking Manager
 * Consent-based conditional loading of GTM, Yandex Metrica, Criteo, Facebook Pixel.
 * Reads cookie preferences from localStorage and loads only approved categories.
 * Tracking IDs are fetched from the backend API (admin-managed).
 */

// ── Types ──────────────────────────────────────────────────────────────
interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

interface TrackingConfig {
  gtm_id: string | null;
  metrica_id: string | null;
  fb_pixel_id: string | null;
  criteo_partner_id: string | null;
}

const STORAGE_KEY = "istoc_cookie_prefs";
const API_ENDPOINT = "/api/method/tradehub_core.api.tracking.get_public_tracking";

let config: TrackingConfig | null = null;
const loaded: Record<string, boolean> = {};

// ── Config Fetch ──────────────────────────────────────────────────────
async function fetchTrackingConfig(): Promise<TrackingConfig> {
  if (config) return config;

  const empty: TrackingConfig = {
    gtm_id: null,
    metrica_id: null,
    fb_pixel_id: null,
    criteo_partner_id: null,
  };

  try {
    const res = await fetch(API_ENDPOINT);
    if (!res.ok) {
      config = empty;
      return config;
    }
    const data = await res.json();
    const msg = data?.message ?? {};
    // IDs are interpolated into inline <script> bodies and provider URLs, so a
    // malformed/hostile value would be script injection. Accept only the exact
    // format each provider uses; reject (null) anything else.
    const safeId = (value: unknown, pattern: RegExp): string | null => {
      const s = String(value ?? "").trim();
      return s && pattern.test(s) ? s : null;
    };
    config = {
      gtm_id: safeId(msg.gtm_id, /^GTM-[A-Z0-9]+$/i),
      metrica_id: safeId(msg.metrica_id, /^\d+$/),
      fb_pixel_id: safeId(msg.fb_pixel_id, /^\d+$/),
      criteo_partner_id: safeId(msg.criteo_partner_id, /^\d+$/),
    };
  } catch {
    config = empty;
  }

  return config;
}

// ── Helpers ────────────────────────────────────────────────────────────
function injectScript(id: string, src: string, async = true): void {
  if (loaded[id] || document.getElementById(id)) return;
  const s = document.createElement("script");
  s.id = id;
  s.src = src;
  s.async = async;
  document.head.appendChild(s);
  loaded[id] = true;
}

function injectInlineScript(id: string, code: string): void {
  if (loaded[id] || document.getElementById(id)) return;
  const s = document.createElement("script");
  s.id = id;
  s.textContent = code;
  document.head.appendChild(s);
  loaded[id] = true;
}

// ── Read saved preferences ─────────────────────────────────────────────
export function getConsentPreferences(): CookiePreferences {
  const defaults: CookiePreferences = {
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed, necessary: true };
  } catch {
    return defaults;
  }
}

export function hasConsentBeenGiven(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

// ── GTM (analytics category) ───────────────────────────────────────────
function loadGTM(gtmId: string): void {
  if (loaded["gtm"]) return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    "gtm.start": new Date().getTime(),
    event: "gtm.js",
  });

  injectScript("gtm", `https://www.googletagmanager.com/gtm.js?id=${gtmId}`);

  if (!document.getElementById("gtm-noscript")) {
    const noscript = document.createElement("noscript");
    noscript.id = "gtm-noscript";
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmId}`;
    iframe.height = "0";
    iframe.width = "0";
    iframe.style.display = "none";
    iframe.style.visibility = "hidden";
    noscript.appendChild(iframe);
    document.body.insertBefore(noscript, document.body.firstChild);
  }
}

// ── Yandex Metrica (analytics category) ────────────────────────────────
function loadMetrica(metricaId: string): void {
  if (loaded["metrica"]) return;

  injectInlineScript(
    "metrica",
    `
    (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r)return;}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
    (window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
    ym(${metricaId},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});
  `
  );

  if (!document.getElementById("metrica-noscript")) {
    const noscript = document.createElement("noscript");
    noscript.id = "metrica-noscript";
    const div = document.createElement("div");
    const img = document.createElement("img");
    img.src = `https://mc.yandex.ru/watch/${metricaId}`;
    img.style.position = "absolute";
    img.style.left = "-9999px";
    img.alt = "";
    div.appendChild(img);
    noscript.appendChild(div);
    document.body.appendChild(noscript);
  }
}

// ── Facebook Pixel (marketing category) ────────────────────────────────
function loadFacebookPixel(pixelId: string): void {
  if (loaded["fbpixel"]) return;

  injectInlineScript(
    "fbpixel",
    `
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
    (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init','${pixelId}');
    fbq('track','PageView');
  `
  );

  if (!document.getElementById("fbpixel-noscript")) {
    const noscript = document.createElement("noscript");
    noscript.id = "fbpixel-noscript";
    const img = document.createElement("img");
    img.height = 1;
    img.width = 1;
    img.style.display = "none";
    img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
    noscript.appendChild(img);
    document.body.appendChild(noscript);
  }
}

// ── Criteo (marketing category) ────────────────────────────────────────
function loadCriteo(partnerId: string): void {
  if (loaded["criteo"]) return;

  injectScript("criteo", "https://static.criteo.net/js/ld/ld.js");

  injectInlineScript(
    "criteo-init",
    `
    window.criteo_q = window.criteo_q || [];
    window.criteo_q.push(
      { event: "setAccount", account: ${partnerId} },
      { event: "setSiteType", type: /Mobile|Android|webOS/i.test(navigator.userAgent) ? "m" : "d" }
    );
  `
  );
}

// ── Public API ─────────────────────────────────────────────────────────

export async function initTracking(): Promise<void> {
  const cfg = await fetchTrackingConfig();
  const prefs = getConsentPreferences();

  if (prefs.analytics) {
    if (cfg.gtm_id) loadGTM(cfg.gtm_id);
    if (cfg.metrica_id) loadMetrica(cfg.metrica_id);
  }

  if (prefs.marketing) {
    if (cfg.fb_pixel_id) loadFacebookPixel(cfg.fb_pixel_id);
    if (cfg.criteo_partner_id) loadCriteo(cfg.criteo_partner_id);
  }
}

export async function onConsentUpdate(): Promise<void> {
  await initTracking();
}

export function acceptAllCookies(): void {
  const all: CookiePreferences = {
    necessary: true,
    functional: true,
    analytics: true,
    marketing: true,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  initTracking();
}

export function rejectAllCookies(): void {
  const minimal: CookiePreferences = {
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
}

// ── GTM dataLayer push helper ──────────────────────────────────────────
export function pushToDataLayer(data: Record<string, unknown>): void {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(data);
}
