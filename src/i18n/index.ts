import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en";
import tr from "./locales/tr";
import ar from "./locales/ar";
import ru from "./locales/ru";
import { sanitizeHtml } from "../utils/sanitize";

export const SUPPORTED_LANGS = ["en", "tr", "ar", "ru"] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

/** Right-to-left languages — drive document `dir` attribute. */
export const RTL_LANGS: readonly SupportedLang[] = ["ar"];

export function isRtl(lang: SupportedLang): boolean {
  return RTL_LANGS.includes(lang);
}

const LANG_STORAGE_KEY = "i18nextLng";

// Merge namespace-level objects (mockProduct, dropshipping, sellerMock)
// into the translation namespace so t('mockProduct.title') works correctly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mergeIntoTranslation(resource: any): any {
  const { translation, ...rest } = resource;
  return { translation: { ...translation, ...rest } };
}

// Initialize i18next
i18next.use(LanguageDetector).init({
  resources: {
    en: mergeIntoTranslation(en),
    tr: mergeIntoTranslation(tr),
    ar: mergeIntoTranslation(ar),
    ru: mergeIntoTranslation(ru),
  },
  fallbackLng: "en",
  defaultNS: "translation",
  interpolation: { escapeValue: false },
  initImmediate: false,
  detection: {
    order: ["localStorage", "navigator"],
    caches: ["localStorage"],
    lookupLocalStorage: LANG_STORAGE_KEY,
  },
});

// Sync <html lang> and text direction with the language detected on first
// paint (reload path). The static HTML files hard-code lang="tr"/"en", so
// without this the lang attribute would not match the detected language.
{
  const initialLang = getCurrentLang();
  document.documentElement.lang = initialLang;
  applyDocumentDirection(initialLang);
  // Statik HTML'deki <title> Türkçe sabit; ilk boyamada aktif dile çevir.
  // (Dil değişiminde updatePageTranslations zaten <title> textContent'ini günceller.)
  const titleEl = document.querySelector("title[data-i18n]");
  const titleKey = titleEl?.getAttribute("data-i18n");
  if (titleKey) document.title = i18next.t(titleKey) as string;
}

/**
 * Translate a key. Use in template literals for initial render.
 * Usage: t('header.signIn')
 */
export function t(key: string, options?: Record<string, unknown>): string {
  return i18next.t(key, options) as string;
}

/**
 * Get current language code
 */
export function getCurrentLang(): SupportedLang {
  const lang = i18next.language?.substring(0, 2) as SupportedLang;
  return SUPPORTED_LANGS.includes(lang) ? lang : "en";
}

/**
 * Change language and update all DOM elements with data-i18n attributes
 */
export async function changeLanguage(lang: SupportedLang): Promise<void> {
  await i18next.changeLanguage(lang);
  document.documentElement.lang = lang;
  applyDocumentDirection(lang);
  updatePageTranslations();
  window.dispatchEvent(new CustomEvent("languageChanged", { detail: { lang } }));
}

/**
 * Set <html dir="rtl|ltr"> for the given language so layout mirrors for RTL
 * locales. Tailwind's `rtl:`/`ltr:` variants and logical properties key off this.
 */
export function applyDocumentDirection(lang: SupportedLang): void {
  document.documentElement.dir = isRtl(lang) ? "rtl" : "ltr";
}

/**
 * Walk the DOM and update all elements that have data-i18n attributes.
 * Supports:
 *   data-i18n="key"               → textContent
 *   data-i18n-placeholder="key"   → placeholder attribute
 *   data-i18n-aria-label="key"    → aria-label attribute
 *   data-i18n-title="key"         → title attribute
 *   data-i18n-html="key"          → innerHTML (use sparingly)
 *   data-i18n-options='{"count":5}' → interpolation options (JSON)
 */
export function updatePageTranslations(): void {
  // Text content
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!key) return;
    const opts = parseI18nOptions(el);
    el.textContent = i18next.t(key, opts) as string;
  });

  // Placeholders
  document.querySelectorAll<HTMLElement>("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (!key) return;
    const opts = parseI18nOptions(el);
    (el as HTMLInputElement).placeholder = i18next.t(key, opts) as string;
  });

  // Aria labels
  document.querySelectorAll<HTMLElement>("[data-i18n-aria-label]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria-label");
    if (!key) return;
    el.setAttribute("aria-label", i18next.t(key) as string);
  });

  // Titles
  document.querySelectorAll<HTMLElement>("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (!key) return;
    el.setAttribute("title", i18next.t(key) as string);
  });

  // HTML content
  document.querySelectorAll<HTMLElement>("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html");
    if (!key) return;
    const opts = parseI18nOptions(el);
    el.innerHTML = sanitizeHtml(i18next.t(key, opts) as string);
  });
}

function parseI18nOptions(el: HTMLElement): Record<string, unknown> | undefined {
  const raw = el.getAttribute("data-i18n-options");
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export { i18next };
export default i18next;
