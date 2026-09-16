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

/**
 * Ülke → arayüz dili eşlemesi (MOGEM-642).
 *
 * Bu tablo ülke kodunun NEREDEN geldiğini bilmez ve umursamaz: Cloudflare'in
 * `CF-IPCountry` başlığı da olabilir, nginx'in `geo` modülü de, backend'in
 * `detectedCountry` alanı da. Eşleme aynı kalır.
 *
 * Kapsam kararları (16 Eyl 2026):
 *  - Türkçe: yalnız TR.
 *  - Rusça: yalnız RU. Belarus/Kazakistan/Kırgızistan'da Rusça yaygın iş dili
 *    olsa da görev metni "Rusya: Rusça" diyor; oralardan gelenler İngilizce
 *    görür ve dili elle değiştirebilir. Liste tek kaynakta olduğu için
 *    sonradan ülke eklemek tek satır.
 *  - Arapça: Arap Ligi'nin 22 üyesinden 18'i. Moritanya (MR), Somali (SO),
 *    Cibuti (DJ) ve Komorlar (KM) BİLİNÇLİ olarak dışarıda: bu ülkelerde
 *    Arapça baskın arayüz dili değil (Fransızca ve yerel diller yaygın),
 *    ziyaretçileri İngilizce görür.
 *  - Haritada olmayan her ülke ve ülkenin belirlenemediği durum: İngilizce.
 *    Görevin "ülke tespiti bozulursa site açılmaya devam etsin" şartı budur.
 */
export const COUNTRY_LANG_MAP: Readonly<Record<string, SupportedLang>> = {
  TR: "tr",
  RU: "ru",
  // Arapça — Körfez
  SA: "ar",
  AE: "ar",
  QA: "ar",
  KW: "ar",
  BH: "ar",
  OM: "ar",
  YE: "ar",
  // Arapça — Levant ve Mezopotamya
  JO: "ar",
  LB: "ar",
  SY: "ar",
  IQ: "ar",
  PS: "ar",
  // Arapça — Kuzey Afrika
  EG: "ar",
  LY: "ar",
  TN: "ar",
  DZ: "ar",
  MA: "ar",
  SD: "ar",
};

/** Ülke belirlenemediğinde ve haritada bulunmadığında kullanılan dil. */
export const VARSAYILAN_DIL: SupportedLang = "en";

/**
 * Ülke kodundan arayüz dilini verir.
 *
 * ISO 3166-1 alpha-2 (iki harfli) kod bekler: "tr" · "TR" · " tr " · "tr-TR"
 * biçimlerini normalize eder. Üç harfli kodlar (TUR) DESTEKLENMEZ — ilk iki
 * harfi alındığı için yanlış ülkeye denk gelebilirdi; bunun yerine haritada
 * bulunamaz ve İngilizceye düşer. Boş, bozuk ya da tanınmayan her girdide de
 * İngilizce döner — çağıranın hata yakalamasına gerek yoktur, ekran her
 * hâlükârda açılır.
 */
export function languageForCountry(raw: string | null | undefined): SupportedLang {
  if (!raw) return VARSAYILAN_DIL;
  // Yalnız alpha-2 ("TR") ve bölgeli biçim ("tr-TR") kabul edilir.
  // Üç harfli kodda körü körüne ilk iki harfi almak TEHLİKELİ: "SAU" → "SA"
  // (Suudi Arabistan) ve "EGY" → "EG" (Mısır) tesadüfen DOĞRU eşleşirken
  // "TUR" → "TU" hiçbir şeye denk gelmiyordu — yani davranış öngörülemezdi.
  // Ölçüldü 16 Eyl 2026. Kaynaklarımız (CF-IPCountry, nginx geo) alpha-2 üretir.
  const kirpik = raw.trim();
  if (!/^[A-Za-z]{2}(-|$)/.test(kirpik)) return VARSAYILAN_DIL;
  return COUNTRY_LANG_MAP[kirpik.slice(0, 2).toUpperCase()] ?? VARSAYILAN_DIL;
}

/** Kullanıcı dili kendi seçti mi? Otomatik tespit buna bakıp geri çekilir. */
export function isLanguageManuallySelected(): boolean {
  try {
    return localStorage.getItem(LANG_SOURCE_KEY) === "manual";
  } catch {
    return false;
  }
}
