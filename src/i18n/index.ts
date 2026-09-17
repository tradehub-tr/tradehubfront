// Native bundle modunda relative /api → mutlak backend rewrite'ı kur (web/live-reload'da no-op).
// i18n her sayfada en erken yüklenen modüllerden biri olduğu için buraya konuldu.
import "../utils/nativeHttp";
// iOS native'de sol-üst geri butonunu enjekte et (web/Android'de no-op).
import "../utils/nativeBackButton";
import "../utils/deepLinks";
import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { sanitizeHtml } from "../utils/sanitize";

// Dil seçiminin tek karar noktası `languageChoice.ts`'te; burada yalnız
// re-export ediliyor ki 266 çağıran dosyanın import satırı değişmesin.
import {
  LANG_STORAGE_KEY,
  SUPPORTED_LANGS,
  isRtl,
  readDetectedCountry,
  readLangParam,
  readManualLang,
  resolveLang,
  setLanguageManually,
  stripLangParam,
  writeLangCookie,
  type SupportedLang,
} from "./languageChoice";

export {
  COUNTRY_LANG_MAP,
  HL_PARAM_NAMES,
  LANGUAGE_OPTIONS,
  LANG_COOKIE_KEY,
  LANG_COOKIE_MAX_AGE,
  LANG_SOURCE_COOKIE_KEY,
  LANG_SOURCE_KEY,
  LANG_STORAGE_KEY,
  RTL_LANGS,
  ULKE_COOKIE_KEY,
  SUPPORTED_LANGS,
  isLanguageManuallySelected,
  isRtl,
  languageForCountry,
  languageLabel,
  normalizeLang,
  readCookie,
  readDetectedCountry,
  readLangCookie,
  readLangParam,
  readManualLang,
  resolveLang,
  setLanguageManually,
  stripLangParam,
  writeCookie,
  writeLangCookie,
  VARSAYILAN_DIL,
  type DilKarari,
  type DilKaynaklari,
  type LanguageOption,
  type SupportedLang,
} from "./languageChoice";

// Merge namespace-level objects (mockProduct, dropshipping, sellerMock)
// into the translation namespace so t('mockProduct.title') works correctly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mergeIntoTranslation(resource: any): any {
  const { translation, ...rest } = resource;
  return { translation: { ...translation, ...rest } };
}

// Aktif dili resource'lardan ÖNCE tespit et — yalnızca o dilin locale dosyasını
// (400-600 KB) dinamik import ederiz, 4 dilin tamamını (1.68 MB) değil.
function detectInitialLang(): SupportedLang {
  const hl = readLangParam(location.search);
  const { lang, kaynak } = resolveLang({
    hl,
    manuel: readManualLang(),
    ulke: readDetectedCountry(),
    tarayici: navigator.language,
  });

  if (kaynak === "hl") {
    // Bağlantıyla gelen dil KALICI tercih sayılır ve "manual" işaretlenir:
    // ziyaretçiye Arapça bir bağlantı gönderildiyse ikinci sayfada ülke
    // tespitinin onu İngilizceye çevirmesi bağlantıyı işlevsiz kılardı.
    setLanguageManually(lang);
    // Adresi temizle — karar (16 Eyl): `?hl=` giriş kapısı, hafıza çerezde.
    // `replaceState` geçmişe kayıt EKLEMEZ; `pushState` olsaydı ziyaretçi
    // geri tuşuna bastığında parametreli adrese dönüp döngüye girerdi.
    try {
      const temiz = stripLangParam(location.href);
      if (temiz !== location.href) history.replaceState(history.state, "", temiz);
    } catch {
      // history API yok/engelli: adres kirli kalır, dil yine de doğrudur.
    }
  } else if (kaynak === "country" || kaynak === "browser") {
    // Otomatik kararı da çereze yaz ki panel ve sunucu aynı dili görsün.
    // "auto" işareti bilinçli: kullanıcı elle seçtiğinde bu değer ezilir,
    // ülke tespiti de bir dahaki ziyarette yeniden karar verebilir.
    writeLangCookie(lang, "auto");
  }

  // localStorage i18next'in kendi tespit zincirinin okuduğu yer; karar
  // burada verildiği için sonucu oraya da yazıyoruz, yoksa `detection`
  // ayarı bir sonraki açılışta farklı bir dile karar verebilir.
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // localStorage kapalı — karar bu oturum için geçerli.
  }

  return lang;
}

/** Bir dilin locale modülünü dinamik yükleyip i18next'e resource bundle olarak ekler. */
async function loadLocaleBundle(lang: SupportedLang): Promise<void> {
  const mod = await import(`./locales/${lang}.ts`);
  const merged = mergeIntoTranslation(mod.default);
  i18next.addResourceBundle(lang, "translation", merged.translation, true, true);
}

// Top-level await: bu modülü import eden TÜM sayfa entry'leri, locale yüklenip
// i18next init olana kadar bekler → t() çağrıları hazır i18n üzerinde çalışır.
// (i18n her sayfada en erken import edilen modüllerden biri; sayfa entry'lerine
// tek tek dokunmaya gerek yok — module graph beklemeyi otomatik yönetir.)
const initialLang = detectInitialLang();
const initialModule = await import(`./locales/${initialLang}.ts`);

// Initialize i18next — yalnızca aktif dil yüklü. fallbackLng aktif dile ayarlı:
// tek dil yüklü olduğu için cross-dil fallback yok; locale'ler tam çeviri içerir.
i18next.use(LanguageDetector).init({
  lng: initialLang,
  resources: {
    [initialLang]: mergeIntoTranslation(initialModule.default),
  },
  fallbackLng: initialLang,
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

  import("../seo/loadStaticPageSeo").then(({ loadStaticPageSeo }) =>
    loadStaticPageSeo(initialLang)
  );

  // FE-4: server hreflang payload'ı yoksa `/` ↔ `/en/` alternates fallback'i.
  // Her sayfada i18n init koştuğu için MPA genelinde tek çağrı noktası burası.
  import("../seo/setPageMeta").then(({ applyHreflangFallback }) => applyHreflangFallback());
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
  // Lazy: hedef dil henüz yüklü değilse locale modülünü dinamik import et.
  if (!i18next.hasResourceBundle(lang, "translation")) {
    await loadLocaleBundle(lang);
  }
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
