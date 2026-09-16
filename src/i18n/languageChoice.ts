/**
 * Dil seçiminin TEK KARAR NOKTASI.
 *
 * Neden ayrı dosya: `i18n/index.ts` top-level await ile i18next'i başlatıyor.
 * Buradaki yardımcılar saf tutulunca i18next yüklenmeden test edilebiliyor;
 * `index.ts` hepsini re-export ettiği için çağıranlar için bir şey değişmiyor.
 *
 * Neden tek nokta: dil seçimi dört ayrı yerde (header popover, footer bölge
 * menüsü, mobil hesap menüsü, yardım merkezi) doğrudan `localStorage`'a
 * yazılıyordu. Ülkeye göre otomatik dil seçimi (MOGEM-642) eklenince
 * "kullanıcı dili kendi mi seçti?" sorusunun cevabı gerekiyor — dağınık
 * yazımda o cevap yok, çünkü i18next otomatik tespit sonucunu da aynı
 * anahtara yazıyor. Elle seçim buradan geçer ve ayrıca işaretlenir.
 */

export const SUPPORTED_LANGS = ["en", "tr", "ar", "ru"] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

/** Right-to-left languages — drive document `dir` attribute. */
export const RTL_LANGS: readonly SupportedLang[] = ["ar"];

/** i18next'in kendi anahtarı; otomatik tespit sonucu da buraya yazılır. */
export const LANG_STORAGE_KEY = "i18nextLng";

/** "manual" → dili kullanıcı seçti; otomatik ülke tespiti bunu EZMEZ. */
export const LANG_SOURCE_KEY = "th-lang-source";

/**
 * Seçicilerde sunulan diller — TEK KAYNAK.
 *
 * Neden burada: liste dört ayrı yerde ayrı ayrı yazılıydı (header 4 dil,
 * footer 2, mobil hesap menüsü 2, yardım merkezi 2). AR/RU 3 Haziran 2026'da
 * eklendiğinde yalnız header güncellendi; Temmuz'da eklenen footer ve mobil
 * menü dört dil zaten mevcutken ikişer dille yazıldı. Sonuç: mobil kullanıcı
 * Arapça ve Rusça'yı hiçbir yoldan seçemiyordu (ölçüldü 16 Eyl 2026).
 *
 * `name` her dilin KENDİ dilinde yazılır — kullanıcı tanımadığı bir arayüzde
 * kendi dilini bulabilmeli.
 */
export interface LanguageOption {
  code: SupportedLang;
  name: string;
  flag: string;
}

export const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
];

/** Bir dilin kendi dilindeki adı; bilinmeyen kodda kodun kendisi döner. */
export function languageLabel(lang: SupportedLang): string {
  return LANGUAGE_OPTIONS.find((o) => o.code === lang)?.name ?? lang;
}

export function isRtl(lang: SupportedLang): boolean {
  return RTL_LANGS.includes(lang);
}

/**
 * "TR" · "tr-TR" · "tr" → "tr". Desteklenmeyen kodda null.
 *
 * Seçiciler kodu farklı biçimlerde tutuyor (header "TR", footer "tr",
 * mobil menü "tr"); normalizasyon burada yapılır ki çağıranlar kendi
 * `langMap`'ini taşımasın.
 */
export function normalizeLang(raw: string | null | undefined): SupportedLang | null {
  if (!raw) return null;
  const kod = raw.trim().slice(0, 2).toLowerCase() as SupportedLang;
  return SUPPORTED_LANGS.includes(kod) ? kod : null;
}

/**
 * Kullanıcının ELLE seçtiği dili kaydeder ve "manual" olarak işaretler.
 *
 * Desteklenmeyen kod yazılmaz. Çağıranların eski `langMap[code] || "en"`
 * kalıbı, AR/RU seçimini sessizce İngilizceye çeviriyordu; artık geçersiz
 * kod null döner ve arayan sayfayı yenilemez.
 *
 * @returns yazılan dil, geçersiz kodda null
 */
export function setLanguageManually(raw: string | null | undefined): SupportedLang | null {
  const lang = normalizeLang(raw);
  if (!lang) return null;
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
    localStorage.setItem(LANG_SOURCE_KEY, "manual");
  } catch {
    // localStorage kapalı (gizli sekme, izin reddi): seçim bu oturumda
    // geçerli olur, kalıcı olmaz. Site açılmaya devam eder.
  }
  return lang;
}

/** Kullanıcı dili kendi seçti mi? Otomatik tespit buna bakıp geri çekilir. */
export function isLanguageManuallySelected(): boolean {
  try {
    return localStorage.getItem(LANG_SOURCE_KEY) === "manual";
  } catch {
    return false;
  }
}
