/**
 * iOS native geri butonu.
 *
 * iOS cihazlarda donanım/gesture geri tuşu garantili değildir (Android'de var),
 * bu yüzden native iOS app'te kullanıcı derin sayfalarda sıkışabilir. Bu modül
 * yalnızca **native iOS**'ta sol-üste, çentik-altına (safe-area) yüzen bir geri
 * butonu enjekte eder. Web ve Android'de hiçbir şey yapmaz.
 *
 * MPA olduğu için her sayfa tam reload → buton her sayfada yeniden enjekte edilir.
 * Ana sayfada (geri gidilecek yer yok) gösterilmez.
 */
import { Capacitor } from "@capacitor/core";
import { getBaseUrl } from "./url";

const BTN_ID = "native-back-btn";

// i18n modülüne bağımlı kalmamak için (döngüsel import'tan kaçınma) küçük etiket haritası.
const BACK_LABEL: Record<string, string> = { tr: "Geri", en: "Back", ar: "رجوع", ru: "Назад" };
function backLabel(): string {
  const lang = (document.documentElement.lang || "tr").slice(0, 2);
  return BACK_LABEL[lang] || BACK_LABEL.tr;
}

function isIos(): boolean {
  return Capacitor.getPlatform() === "ios";
}

function homeHref(): string {
  return getBaseUrl() || "/";
}

function isHomePage(): boolean {
  const path = location.pathname.replace(/\/+$/, "");
  const home = homeHref().replace(/\/+$/, "");
  return path === "" || path === home || /\/index(\.html)?$/.test(location.pathname);
}

function goBack(): void {
  // MPA: sayfalar arası gerçek history var. Geçmiş varsa geri git, yoksa ana sayfa.
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = homeHref();
  }
}

// Press/hover geri bildirimi inline stilde :active yazılamadığı için tek seferlik <style> bloğu.
function injectBackButtonStyles(): void {
  const styleId = `${BTN_ID}-styles`;
  if (document.getElementById(styleId)) return;
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent =
    `#${BTN_ID}{transition:transform 120ms cubic-bezier(0.23,1,0.32,1),background 120ms cubic-bezier(0.23,1,0.32,1)}` +
    `@media(hover:hover) and (pointer:fine){#${BTN_ID}:hover{background:rgba(0,0,0,0.7)}}` +
    `#${BTN_ID}:active{transform:scale(0.94)}` +
    `@media(prefers-reduced-motion:reduce){#${BTN_ID}{transition:none}#${BTN_ID}:active{transform:none}}`;
  document.head.appendChild(style);
}

function injectBackButton(): void {
  if (!isIos()) return;
  if (document.getElementById(BTN_ID)) return;
  if (isHomePage()) return;

  injectBackButtonStyles();

  const btn = document.createElement("button");
  btn.id = BTN_ID;
  btn.type = "button";
  btn.setAttribute("aria-label", backLabel());
  // Inline stil — runtime enjeksiyonda Tailwind JIT'e bağımlı kalmamak için.
  btn.style.cssText = [
    "position:fixed",
    "top:calc(env(safe-area-inset-top, 0px) + 8px)",
    "inset-inline-start:10px", // RTL'de otomatik sağa geçer
    "z-index:2000",
    "width:38px",
    "height:38px",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "padding:0",
    "border:none",
    "border-radius:9999px",
    "background:rgba(0,0,0,0.55)",
    "color:#fff",
    "-webkit-backdrop-filter:blur(6px)",
    "backdrop-filter:blur(6px)",
    "box-shadow:0 2px 8px rgba(0,0,0,0.25)",
    "cursor:pointer",
    "-webkit-tap-highlight-color:transparent",
  ].join(";");
  // chevron-left (RTL'de yön çevrilsin diye dir'e göre ayna)
  const flip = document.documentElement.dir === "rtl" ? ' style="transform:scaleX(-1)"' : "";
  btn.innerHTML =
    `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"` +
    ` stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"${flip}>` +
    `<path d="M15 18l-6-6 6-6"/></svg>`;
  btn.addEventListener("click", goBack);
  document.body.appendChild(btn);
}

/** iOS native'de geri butonunu kur (DOM hazır olunca). Idempotent. */
export function installNativeBackButton(): void {
  if (!isIos()) return;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectBackButton, { once: true });
  } else {
    injectBackButton();
  }
}

// Import edildiğinde kur (iOS değilse no-op).
installNativeBackButton();
