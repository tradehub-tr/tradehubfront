/**
 * Tracking Manager
 * Consent-based conditional loading of GTM, Yandex Metrica, Criteo, Facebook Pixel.
 * Reads cookie preferences from localStorage and loads only approved categories.
 */

// ── Types ──────────────────────────────────────────────────────────────
interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

interface TrackingConfig {
  gtmId: string;
  metricaId: string;
  fbPixelId: string;
  criteoPartnerId: string;
}

// ── Config — replace with real IDs before going live ───────────────────
const CONFIG: TrackingConfig = {
  gtmId: 'GTM-XXXXXXX',
  metricaId: '00000000',
  fbPixelId: '000000000000000',
  criteoPartnerId: '00000',
};

const STORAGE_KEY = 'istoc_cookie_prefs';

// Track which scripts have already been injected (avoid double-loading)
const loaded: Record<string, boolean> = {};

// ── Helpers ────────────────────────────────────────────────────────────
function injectScript(id: string, src: string, async = true): void {
  if (loaded[id] || document.getElementById(id)) return;
  const s = document.createElement('script');
  s.id = id;
  s.src = src;
  s.async = async;
  document.head.appendChild(s);
  loaded[id] = true;
}

function injectInlineScript(id: string, code: string): void {
  if (loaded[id] || document.getElementById(id)) return;
  const s = document.createElement('script');
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
function loadGTM(): void {
  if (loaded['gtm']) return;

  // Initialize dataLayer
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js',
  });

  injectScript('gtm', `https://www.googletagmanager.com/gtm.js?id=${CONFIG.gtmId}`);

  // GTM noscript fallback (for body)
  if (!document.getElementById('gtm-noscript')) {
    const noscript = document.createElement('noscript');
    noscript.id = 'gtm-noscript';
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${CONFIG.gtmId}`;
    iframe.height = '0';
    iframe.width = '0';
    iframe.style.display = 'none';
    iframe.style.visibility = 'hidden';
    noscript.appendChild(iframe);
    document.body.insertBefore(noscript, document.body.firstChild);
  }
}

// ── Yandex Metrica (analytics category) ────────────────────────────────
function loadMetrica(): void {
  if (loaded['metrica']) return;

  injectInlineScript('metrica', `
    (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r)return;}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
    (window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
    ym(${CONFIG.metricaId},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});
  `);

  // Metrica noscript pixel
  if (!document.getElementById('metrica-noscript')) {
    const noscript = document.createElement('noscript');
    noscript.id = 'metrica-noscript';
    const div = document.createElement('div');
    const img = document.createElement('img');
    img.src = `https://mc.yandex.ru/watch/${CONFIG.metricaId}`;
    img.style.position = 'absolute';
    img.style.left = '-9999px';
    img.alt = '';
    div.appendChild(img);
    noscript.appendChild(div);
    document.body.appendChild(noscript);
  }
}

// ── Facebook Pixel (marketing category) ────────────────────────────────
function loadFacebookPixel(): void {
  if (loaded['fbpixel']) return;

  injectInlineScript('fbpixel', `
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
    (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init','${CONFIG.fbPixelId}');
    fbq('track','PageView');
  `);

  // FB noscript pixel
  if (!document.getElementById('fbpixel-noscript')) {
    const noscript = document.createElement('noscript');
    noscript.id = 'fbpixel-noscript';
    const img = document.createElement('img');
    img.height = 1;
    img.width = 1;
    img.style.display = 'none';
    img.src = `https://www.facebook.com/tr?id=${CONFIG.fbPixelId}&ev=PageView&noscript=1`;
    noscript.appendChild(img);
    document.body.appendChild(noscript);
  }
}

// ── Criteo (marketing category) ────────────────────────────────────────
function loadCriteo(): void {
  if (loaded['criteo']) return;

  // Criteo OneTag loader
  injectScript('criteo', 'https://static.criteo.net/js/ld/ld.js');

  injectInlineScript('criteo-init', `
    window.criteo_q = window.criteo_q || [];
    window.criteo_q.push(
      { event: "setAccount", account: ${CONFIG.criteoPartnerId} },
      { event: "setSiteType", type: /Mobile|Android|webOS/i.test(navigator.userAgent) ? "m" : "d" }
    );
  `);
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Initialize tracking based on current consent.
 * Call on every page load after Alpine/DOM is ready.
 */
export function initTracking(): void {
  const prefs = getConsentPreferences();

  // Analytics category → GTM + Yandex Metrica
  if (prefs.analytics) {
    loadGTM();
    loadMetrica();
  }

  // Marketing category → Facebook Pixel + Criteo
  if (prefs.marketing) {
    loadFacebookPixel();
    loadCriteo();
  }
}

/**
 * Called when user updates consent preferences.
 * Re-evaluates which scripts to load.
 * Note: already-loaded scripts cannot be unloaded (page reload required to revoke).
 */
export function onConsentUpdate(): void {
  initTracking();
}

/**
 * Accept all cookie categories.
 */
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

/**
 * Reject all optional cookies (keep only necessary).
 */
export function rejectAllCookies(): void {
  const minimal: CookiePreferences = {
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
  // No scripts to load when all optional rejected
}

// ── GTM dataLayer push helper ──────────────────────────────────────────
export function pushToDataLayer(data: Record<string, unknown>): void {
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push(data);
}
