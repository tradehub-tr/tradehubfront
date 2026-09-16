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
  // Çerez AYRI bir try içinde: localStorage kapalıyken de yazılabilir ve
  // paneli/sunucuyu ancak o besliyor. Tek try'a konsaydı ilk hata
  // ikincisini de atlatırdı.
  writeLangCookie(lang, "manual");
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
  // Çerez ÖNCE: panelde yapılan seçim storefront'un localStorage'ında
  // görünmez, çerezde görünür. İki kaynaktan biri "manual" diyorsa
  // otomatik tespit geri çeker.
  if (readCookie(LANG_SOURCE_COOKIE_KEY) === "manual") return true;
  try {
    return localStorage.getItem(LANG_SOURCE_KEY) === "manual";
  } catch {
    return false;
  }
}

/**
 * Kullanıcının elle seçtiği dil — çerez ve localStorage birlikte.
 *
 * Çerez önce okunur (panel ve storefront ortak kaynağı odur). Çerez yoksa
 * localStorage'daki ESKİ seçim kabul edilir ve çereze TAŞINIR — bu özellik
 * yayına çıktığında hâlihazırda dil seçmiş kullanıcılar tercihlerini
 * kaybetmesin diye. Taşıma yalnız `th-lang-source=manual` işaretliyken
 * yapılır: i18next otomatik tespit sonucunu da aynı anahtara yazıyor,
 * onu "kullanıcı seçti" saymak ülke tespitini hiç çalıştırmazdı.
 */
export function readManualLang(): SupportedLang | null {
  // Çerezdeki dil TEK BAŞINA yeterli değil: otomatik karar da aynı çereze
  // yazılıyor ("auto"). Kaynağa bakmasaydık ilk ziyarette yazılan otomatik
  // değer "kullanıcı seçti" sayılır ve ülke tespiti bir daha hiç
  // çalışmazdı — ziyaretçi Türkiye'den bağlansa bile ilk tahmine kilitli
  // kalırdı.
  if (readCookie(LANG_SOURCE_COOKIE_KEY) === "manual") {
    const cerez = readLangCookie();
    if (cerez) return cerez;
  }
  try {
    if (localStorage.getItem(LANG_SOURCE_KEY) !== "manual") return null;
    const eski = normalizeLang(localStorage.getItem(LANG_STORAGE_KEY));
    if (eski) {
      writeLangCookie(eski, "manual"); // geçiş: eski seçimi çereze taşı
      return eski;
    }
  } catch {
    // localStorage yok — çerez de yoksa seçim yapılmamış demektir.
  }
  return null;
}

/* ────────────────────────────────────────────────────────────────────────
 * ÇEREZ KÖPRÜSÜ (MOGEM-642 · Faz 1)
 *
 * Neden çerez, localStorage yetmiyor mu: localStorage üç yerde yetersiz.
 *  1. Storefront ile panel AYRI uygulama (Vite MPA ↔ Vue SPA) ve ayrı
 *     localStorage anahtarı kullanıyordu — `i18nextLng` ve `th-lang`.
 *     Aynı kullanıcı iki taraf arasında geçerken dili iki kez seçiyordu.
 *  2. localStorage yalnız tarayıcıda okunur; sunucu göremez. Sayfanın
 *     `<html lang>` değeri sunucudan sabit "tr" geliyor (ölçüldü 16 Eyl) —
 *     düzeltmek için sunucunun tercihi BİLMESİ gerekiyor.
 *  3. Ön bellek anahtarı dile göre ayrılacaksa (Faz 3) ayırt edici şey
 *     istek başlığında olmalı; çerez istekle birlikte gider, localStorage
 *     gitmez.
 *
 * Çerez ADI panelin bugünkü localStorage anahtarıyla aynı tutuldu (`th-lang`)
 * — iki taraf tek isimde buluşsun, yeni bir kavram doğmasın diye.
 * ──────────────────────────────────────────────────────────────────────── */

/** Dil tercihi çerezi — storefront ve panel ORTAK okur/yazar. */
export const LANG_COOKIE_KEY = "th-lang";

/** Tercihin kaynağı çerezi: "manual" → kullanıcı seçti, otomatik tespit ezmez. */
export const LANG_SOURCE_COOKIE_KEY = "th-lang-source";

/** Bir yıl. Dil tercihi mevsimlik değil; kısa ömür kullanıcıya iş çıkarır. */
export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Çerez okuma — ham `document.cookie` dizesinden ayrıştırır.
 *
 * Dışarıdan dize alabildiği için saftır ve test edilebilir; parametresiz
 * çağrıldığında gerçek `document.cookie`'yi okur.
 */
export function readCookie(ad: string, ham?: string): string | null {
  let kaynak = ham;
  if (kaynak === undefined) {
    try {
      kaynak = document.cookie;
    } catch {
      return null; // çerez erişimi engelli (bazı gömülü tarayıcılar)
    }
  }
  if (!kaynak) return null;
  for (const parca of kaynak.split(";")) {
    const esittir = parca.indexOf("=");
    if (esittir < 0) continue;
    if (parca.slice(0, esittir).trim() !== ad) continue;
    try {
      return decodeURIComponent(parca.slice(esittir + 1).trim());
    } catch {
      return parca.slice(esittir + 1).trim(); // bozuk yüzdelik kodlama
    }
  }
  return null;
}

/**
 * Çerez yazar. `Secure` YALNIZ https'te eklenir — http://localhost'ta
 * `Secure` konursa tarayıcı çerezi sessizce atar ve lokal geliştirmede
 * dil hiç hatırlanmaz.
 *
 * `SameSite=Lax`: dil tercihi üçüncü taraf iframe'de gerekmiyor; `None`
 * demek `Secure` zorunluluğu ve gereksiz izleme yüzeyi getirirdi.
 */
export function writeCookie(ad: string, deger: string, maxAge = LANG_COOKIE_MAX_AGE): void {
  try {
    const guvenli = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${ad}=${encodeURIComponent(deger)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${guvenli}`;
  } catch {
    // Çerez yazılamıyor (gizli sekme kısıtı / izin reddi): tercih bu
    // oturumda localStorage'da yaşar, site açılmaya devam eder.
  }
}

/** Çerezdeki dil tercihi; geçersiz/eksik değerde null. */
export function readLangCookie(ham?: string): SupportedLang | null {
  return normalizeLang(readCookie(LANG_COOKIE_KEY, ham));
}

/** Tercih çerezini ve kaynağını birlikte yazar — ikisi hiç ayrışmasın. */
export function writeLangCookie(lang: SupportedLang, kaynak: "manual" | "auto"): void {
  writeCookie(LANG_COOKIE_KEY, lang);
  writeCookie(LANG_SOURCE_COOKIE_KEY, kaynak);
}

/* ────────────────────────────────────────────────────────────────────────
 * `?hl=` BAĞLANTI PARAMETRESİ (MOGEM-642 · Faz 1)
 *
 * Yönetici kararı: dil bağlantısı `/tr` gibi yol öneki DEĞİL, `?hl=tr`
 * biçiminde olacak. Bugün ölçüldü (16 Eyl 2026): `?hl=` ve `?lang=`
 * parametrelerinin ikisi de kodda HİÇ okunmuyordu — `istoc.com/?hl=ar`
 * yazan ziyaretçi Türkçe bir sayfa görüyordu.
 *
 * Karar (16 Eyl): parametre okunur, tercih KALICI yazılır, sonra adres
 * `replaceState` ile temizlenir. Gerekçe: `?hl=` bir GİRİŞ KAPISI, kalıcı
 * hafıza çerezde. Parametre adreste bırakılsaydı ilk iç bağlantıda zaten
 * düşecek (adres üreticilerinin hiçbiri onu taşımıyor), bu arada Google
 * `/?hl=tr` ile `/`yi iki ayrı sayfa sayacaktı.
 * ──────────────────────────────────────────────────────────────────────── */

/** Kabul edilen parametre adları — `lang` eski bağlantılar için takma ad. */
export const HL_PARAM_NAMES = ["hl", "lang"] as const;

/**
 * Sorgu dizesinden dil parametresini okur. Saf: `location` görmez.
 *
 * Desteklenmeyen değer (`?hl=de`) null döner — hata verilmez, akış normal
 * sıraya düşer. Ziyaretçiye "Almanca yok" demenin yeri dil seçicisi değil,
 * boş bir ekran hiç değil.
 */
export function readLangParam(search: string): SupportedLang | null {
  if (!search) return null;
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search);
  } catch {
    return null;
  }
  for (const ad of HL_PARAM_NAMES) {
    const lang = normalizeLang(params.get(ad));
    if (lang) return lang;
  }
  return null;
}

/**
 * Dil parametrelerini adresten çıkarır, GERİ KALAN her şeyi korur.
 *
 * Kritik: `?hl=ar&q=çelik&page=2` → `?q=çelik&page=2`. Naif bir yaklaşım
 * (sorguyu tamamen silmek) arama sayfasında kullanıcının sorgusunu
 * uçururdu. Parametre yoksa girdi AYNEN döner — çağıran `replaceState`
 * çağırıp çağırmayacağına buna bakarak karar verir.
 */
export function stripLangParam(url: string): string {
  const [yol, ...sorguParcalari] = url.split("?");
  if (sorguParcalari.length === 0) return url;
  const sorguVeCapa = sorguParcalari.join("?");
  const [sorgu, ...capaParcalari] = sorguVeCapa.split("#");
  const capa = capaParcalari.length ? `#${capaParcalari.join("#")}` : "";

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(sorgu);
  } catch {
    return url;
  }
  let dokunuldu = false;
  for (const ad of HL_PARAM_NAMES) {
    if (params.has(ad)) {
      params.delete(ad);
      dokunuldu = true;
    }
  }
  if (!dokunuldu) return url;

  const kalan = params.toString();
  return kalan ? `${yol}?${kalan}${capa}` : `${yol}${capa}`;
}

/* ────────────────────────────────────────────────────────────────────────
 * ÖNCELİK SIRASI — tek karar fonksiyonu
 * ──────────────────────────────────────────────────────────────────────── */

/** `resolveLang()` girdileri — hepsi dışarıdan verilir, fonksiyon SAFTIR. */
export interface DilKaynaklari {
  /** `?hl=` parametresi (varsa). */
  hl?: SupportedLang | null;
  /** Kullanıcının daha önce ELLE seçtiği dil (çerez/localStorage). */
  manuel?: SupportedLang | null;
  /** Bağlantının geldiği ülke kodu (Faz 5'te bağlanacak). */
  ulke?: string | null;
  /** Tarayıcı dili (`navigator.language`). */
  tarayici?: string | null;
}

/** `resolveLang()` çıktısı — hangi dil, NEDEN o dil. */
export interface DilKarari {
  lang: SupportedLang;
  /** Kararı veren kaynak; günlüğe ve teste girer, davranışı da belirler. */
  kaynak: "hl" | "manual" | "country" | "browser" | "default";
}

/**
 * Dil kararının TEK yeri. Sıra bilinçli:
 *
 *  1. `?hl=`     — paylaşılan bağlantı her şeyi ezer. Birisi Arapça bir
 *                  bağlantı gönderdiyse alıcı Arapça görmeli; "ama sen
 *                  geçen ay Türkçe seçmiştin" demek bağlantıyı işlevsiz
 *                  kılardı.
 *  2. elle seçim — kullanıcının kendi kararı, otomatik tespitten ÜSTÜN.
 *                  Görev metninin "elle seçim hatırlanacak ve otomatik
 *                  tespit onu ezmeyecek" şartı tam olarak bu satır.
 *  3. ülke       — görevin asıl işi. Yalnız kullanıcı henüz seçim
 *                  yapmamışken devreye girer.
 *  4. tarayıcı   — ülke bilinmiyorsa ikinci en iyi tahmin.
 *  5. `en`       — "ülke tespiti bozulursa site İngilizce açılmaya devam
 *                  etsin" şartı.
 *
 * Her koşulda GEÇERLİ bir dil döner; çağıranın hata yakalaması gerekmez.
 */
export function resolveLang(kaynaklar: DilKaynaklari = {}): DilKarari {
  const hl = normalizeLang(kaynaklar.hl);
  if (hl) return { lang: hl, kaynak: "hl" };

  const manuel = normalizeLang(kaynaklar.manuel);
  if (manuel) return { lang: manuel, kaynak: "manual" };

  if (kaynaklar.ulke) {
    // languageForCountry tanınmayan ülkede VARSAYILAN_DIL döndürüyor.
    // Onu "ülke kararı" saymak yanlış olurdu: Almanya'dan gelen biri
    // tarayıcısı Rusça olsa bile İngilizceye kilitlenirdi. Yalnız haritada
    // GERÇEKTEN bulunan ülkeler bu basamağı bitirir.
    const ulkeDili = languageForCountry(kaynaklar.ulke);
    const haritada =
      ulkeDili !== VARSAYILAN_DIL ||
      COUNTRY_LANG_MAP[String(kaynaklar.ulke).trim().slice(0, 2).toUpperCase()];
    if (haritada) return { lang: ulkeDili, kaynak: "country" };
  }

  const tarayici = normalizeLang(kaynaklar.tarayici);
  if (tarayici) return { lang: tarayici, kaynak: "browser" };

  return { lang: VARSAYILAN_DIL, kaynak: "default" };
}

/**
 * Sayfaya sunucunun yazdığı ülke kodunu okur.
 *
 * KAYNAĞI K1 KARARI BELİRLER, bu fonksiyon değil. Burada tanımlanan tek şey
 * ön yüzün ülke kodunu nereden OKUYACAĞI: `<meta name="th-country">`.
 * Cloudflare `CF-IPCountry`, nginx `geo` ya da backend — hangisi seçilirse
 * seçilsin, işi bu meta etiketini doldurmak olacak; buradaki kod değişmez.
 *
 * Meta yoksa null döner ve akış tarayıcı diline düşer: Faz 5 bağlanana
 * kadar davranış BUGÜNKÜNÜN AYNISI kalır.
 */
export function readDetectedCountry(): string | null {
  try {
    const meta = document.querySelector('meta[name="th-country"]');
    const kod = meta?.getAttribute("content")?.trim();
    // Sunucu değeri dolduramadığında şablonda `XX` ya da boş bırakılıyor;
    // ikisi de "bilmiyorum" demektir, ülke basamağı atlanır.
    if (!kod || kod.toUpperCase() === "XX") return null;
    return kod;
  } catch {
    return null;
  }
}
