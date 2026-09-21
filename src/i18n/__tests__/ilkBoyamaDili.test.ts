/**
 * İLK BOYAMA DİLİ — açılış script'i `resolveLang()` ile AYNI kararı veriyor mu?
 *
 * Neden bu test var: `<head>` script'i modül zincirini bekleyemez, bu yüzden
 * öncelik sırası iki yerde yaşıyor — `resolveLang()` ve `ilkBoyamaScripti()`.
 * Kopya mantık sessizce ayrışır: biri ülkeyi öne alır, diğeri almaz; ziyaretçi
 * de sayfanın önce bir dilde açılıp sonra başka dile dönmesini görür. Bu yüzden
 * burada script'in KENDİSİ çalıştırılır ve kararı `resolveLang()` ile senaryo
 * senaryo karşılaştırılır.
 *
 * Test edilen metin, üretime GİDEN metnin ta kendisidir: `ilkBoyamaScripti()`
 * hem vite eklentisinin hem bu testin çağırdığı tek üreteçtir.
 */
import { beforeEach, describe, expect, it } from "vitest";

import {
  LANG_COOKIE_KEY,
  LANG_SOURCE_COOKIE_KEY,
  LANG_SOURCE_KEY,
  LANG_STORAGE_KEY,
  ULKE_COOKIE_KEY,
  readDetectedCountry,
  readLangParam,
  readManualLang,
  resolveLang,
} from "../languageChoice";
import { ULKE_META, KARAR_GLOBALI, baslikScripti, ilkBoyamaScripti } from "../ilkBoyamaDili";

interface Senaryo {
  ad: string;
  search?: string;
  cerez?: Record<string, string>;
  depo?: Record<string, string>;
  ulke?: string | null;
  tarayici?: string;
}

/** Script gövdesi — `<script>` sarmalayıcısı olmadan. */
function govde(): string {
  return ilkBoyamaScripti()
    .replace(/^<script>/, "")
    .replace(/<\/script>$/, "");
}

/**
 * Çerez silmenin DETERMİNİST yolu.
 *
 * `Max-Age=0` happy-dom'da çerezi hemen düşürmüyor; BOŞ DEĞERLE listede
 * bırakıyor ve bir süre sonra siliyor. Ölçüldü (21 Eyl 2026):
 *
 *   document.cookie = "a=1; Path=/"; document.cookie = "b=2; Path=/";
 *   document.cookie = "a=; Path=/; Max-Age=0";   → "b=2; a="   ← a hâlâ listede
 *   document.cookie = "c=; Path=/; <geçmiş Expires>";           → "b=2"      ← anında düştü
 *
 * Sonucu KARARSIZ testti: `document.cookie`yi iki kez okuyan iddialar, arada
 * artık çerez düştüyse farklı dize görüyordu. `ilkBoyamaDili.test.ts` dört
 * koşumun ikisinde kırmızıydı ve DÜŞEN TEST koşumdan koşuma değişiyordu.
 */
const GECMIS_TARIH = "Expires=Thu, 01 Jan 1970 00:00:00 GMT";

function cerezSil(ad: string) {
  document.cookie = `${ad}=; Path=/; ${GECMIS_TARIH}`;
}

function ortamiKur(s: Senaryo) {
  document.documentElement.removeAttribute("lang");
  document.documentElement.removeAttribute("dir");
  document.head.innerHTML = "";
  for (const ad of [LANG_COOKIE_KEY, LANG_SOURCE_COOKIE_KEY, ULKE_COOKIE_KEY]) {
    cerezSil(ad);
  }
  localStorage.clear();

  if (s.ulke !== undefined && s.ulke !== null) {
    document.head.innerHTML = ULKE_META.replace('content="XX"', `content="${s.ulke}"`);
  }
  for (const [ad, deger] of Object.entries(s.cerez ?? {})) {
    document.cookie = `${ad}=${encodeURIComponent(deger)}; Path=/`;
  }
  for (const [ad, deger] of Object.entries(s.depo ?? {})) {
    localStorage.setItem(ad, deger);
  }
}

/**
 * Script'i çalıştırır.
 *
 * `document` ve `localStorage` GERÇEK (happy-dom) — çerez ayrıştırma ve
 * `querySelector` gerçek API'de sınansın. `location` ve `navigator` enjekte
 * edilir; happy-dom'da ikisini de senaryo başına değiştirmek güvenilir değil.
 */
function scriptiCalistir(s: Senaryo): { lang: string; kaynak: string } {
  const pencere: Record<string, unknown> = {};
  new Function("window", "location", "navigator", govde())(
    pencere,
    { search: s.search ?? "" },
    { language: s.tarayici ?? "" }
  );
  return pencere[KARAR_GLOBALI] as { lang: string; kaynak: string };
}

/** Modül tarafının aynı senaryodaki kararı (i18n/index.ts'teki çağrı sırası). */
function modulKarari(s: Senaryo) {
  return resolveLang({
    hl: readLangParam(s.search ?? ""),
    manuel: readManualLang(),
    ulke: readDetectedCountry(),
    tarayici: s.tarayici ?? "",
  });
}

const SENARYOLAR: Senaryo[] = [
  { ad: "hiçbir ipucu yok → varsayılan", tarayici: "" },
  { ad: "yalnız tarayıcı Türkçe", tarayici: "tr-TR" },
  { ad: "tarayıcı desteklenmeyen dilde (Almanca)", tarayici: "de-DE" },
  { ad: "?hl=ar her şeyi ezer", search: "?hl=ar", tarayici: "tr-TR" },
  { ad: "?lang=ru eski takma ad", search: "?lang=ru", tarayici: "tr-TR" },
  { ad: "?hl=de desteklenmiyor → sıradaki basamak", search: "?hl=de", tarayici: "tr-TR" },
  { ad: "?hl=AR büyük harf", search: "?hl=AR", tarayici: "tr-TR" },
  { ad: "?hl=tr-TR bölgeli biçim", search: "?hl=tr-TR", tarayici: "" },
  {
    ad: "elle seçim çerezi ülkeyi ezer",
    cerez: { "th-lang": "ru", "th-lang-source": "manual" },
    ulke: "SA",
    tarayici: "tr-TR",
  },
  {
    ad: "kaynak işareti yoksa çerez elle seçim SAYILMAZ",
    cerez: { "th-lang": "ru" },
    ulke: "SA",
    tarayici: "tr-TR",
  },
  {
    ad: "eski localStorage seçimi (geçiş yolu)",
    depo: { [LANG_STORAGE_KEY]: "ar", [LANG_SOURCE_KEY]: "manual" },
    tarayici: "tr-TR",
  },
  {
    ad: "localStorage'da işaret yoksa seçim sayılmaz",
    depo: { [LANG_STORAGE_KEY]: "ar" },
    tarayici: "tr-TR",
  },
  // ── Ülke META'dan (Faz 1 sözleşmesi; sunucu bir gün HTML'e yazarsa) ──
  { ad: "ülke TR → Türkçe", ulke: "TR", tarayici: "en-US" },
  { ad: "ülke SA → Arapça", ulke: "SA", tarayici: "en-US" },
  { ad: "ülke RU → Rusça", ulke: "RU", tarayici: "en-US" },
  { ad: "ülke EG → Arapça (Kuzey Afrika)", ulke: "EG", tarayici: "en-US" },
  { ad: "ülke MR haritada YOK → tarayıcıya düşer", ulke: "MR", tarayici: "ru-RU" },
  { ad: "ülke DE haritada yok → tarayıcıya düşer", ulke: "DE", tarayici: "tr-TR" },
  { ad: "ülke XX (sunucu doldurmadı) → atlanır", ulke: "XX", tarayici: "ru-RU" },
  { ad: "ülke üç harfli (TUR) → geçersiz, atlanır", ulke: "TUR", tarayici: "ru-RU" },
  { ad: "ülke küçük harf (sa)", ulke: "sa", tarayici: "en-US" },
  { ad: "ülke boş dize", ulke: "", tarayici: "tr-TR" },

  // ── Ülke ÇEREZTEN (Faz 5; nginx'in bugün kullandığı yol) ─────────────
  { ad: "çerezden ülke SA → Arapça", cerez: { "th-country": "SA" }, tarayici: "en-US" },
  { ad: "çerezden ülke TR → Türkçe", cerez: { "th-country": "TR" }, tarayici: "en-US" },
  { ad: "çerezden ülke RU → Rusça", cerez: { "th-country": "RU" }, tarayici: "en-US" },
  {
    ad: "çerezden haritada olmayan ülke → tarayıcıya düşer",
    cerez: { "th-country": "DE" },
    tarayici: "ru-RU",
  },
  {
    ad: "meta XX iken çerez devreye girer (bugünkü gerçek durum)",
    ulke: "XX",
    cerez: { "th-country": "SA" },
    tarayici: "en-US",
  },
  {
    ad: "meta DOLUYSA çerezi ezer (sunucu HTML'e yazmaya geçerse)",
    ulke: "RU",
    cerez: { "th-country": "SA" },
    tarayici: "en-US",
  },
  {
    ad: "elle seçim çerezi ülke çerezini de ezer",
    cerez: { "th-lang": "tr", "th-lang-source": "manual", "th-country": "SA" },
    tarayici: "en-US",
  },
  {
    ad: "?hl= ülke çerezini ezer",
    search: "?hl=ru",
    cerez: { "th-country": "SA" },
    tarayici: "en-US",
  },
  { ad: "çerezde geçersiz ülke kodu", cerez: { "th-country": "zzz" }, tarayici: "ru-RU" },
];

describe("ilk boyama dili — script kararı `resolveLang()` ile aynı", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("lang");
    document.documentElement.removeAttribute("dir");
  });

  it.each(SENARYOLAR.map((s) => [s.ad, s] as const))("%s", (_ad, s) => {
    ortamiKur(s);
    const script = scriptiCalistir(s); // ÖNCE: script salt okur
    const modul = modulKarari(s); // SONRA: readManualLang() çereze yazabilir

    expect(script.lang).toBe(modul.lang);
    expect(script.kaynak).toBe(modul.kaynak);
  });

  it("senaryo listesi gerçekten koşuyor (tarama boş değil)", () => {
    expect(SENARYOLAR.length).toBeGreaterThanOrEqual(20);
  });
});

describe("ilk boyama dili — belge nitelikleri", () => {
  it("lang ve dir'i YAZAR; Arapça'da rtl olur", () => {
    ortamiKur({ ad: "ar", search: "?hl=ar" });
    scriptiCalistir({ ad: "ar", search: "?hl=ar" });
    expect(document.documentElement.lang).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");
  });

  it("RTL olmayan dilde dir AÇIKÇA ltr yazılır", () => {
    // Statik HTML'de `dir` hiç yok. Boş bırakmak "tarayıcı varsayılanı" demek;
    // Arapça bir sayfadan aynı sekmede LTR bir sayfaya geçildiğinde belgenin
    // yönü ne olacağı açıkça yazılmadıkça okunamaz hâle gelir.
    ortamiKur({ ad: "ru", search: "?hl=ru" });
    scriptiCalistir({ ad: "ru", search: "?hl=ru" });
    expect(document.documentElement.dir).toBe("ltr");
  });

  it("çerez okunamıyorsa (gizli sekme) PATLAMAZ, varsayılana düşer", () => {
    ortamiKur({ ad: "kapalı" });
    const gercek = Object.getOwnPropertyDescriptor(Document.prototype, "cookie");
    Object.defineProperty(document, "cookie", {
      configurable: true,
      get() {
        throw new Error("çerez engelli");
      },
    });
    try {
      const karar = scriptiCalistir({ ad: "kapalı", tarayici: "ru-RU" });
      expect(karar.lang).toBe("ru");
    } finally {
      delete (document as unknown as Record<string, unknown>).cookie;
      if (gercek) Object.defineProperty(Document.prototype, "cookie", gercek);
    }
  });

  it("localStorage erişimi hata fırlatsa bile karar verilir", () => {
    ortamiKur({ ad: "depo yok" });
    const gercek = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("depolama engelli");
      },
    });
    try {
      const karar = scriptiCalistir({ ad: "depo yok", search: "?hl=ar" });
      expect(karar.lang).toBe("ar");
    } finally {
      if (gercek) Object.defineProperty(window, "localStorage", gercek);
    }
  });

  it("çerez/localStorage'a HİÇBİR ŞEY yazmaz (salt okur)", () => {
    // Tercihi iki yerden yazmak, iki farklı "kaynak" değeri üretme riskidir:
    // script "auto" yazsa, modül aynı ziyaretçi için "manual" yazsa, ülke
    // tespiti bir daha hiç çalışmazdı.
    ortamiKur({ ad: "yazma yok", search: "?hl=ar" });
    const cerezOnce = document.cookie;
    const depoOnce = JSON.stringify({ ...localStorage });
    scriptiCalistir({ ad: "yazma yok", search: "?hl=ar" });
    expect(document.cookie).toBe(cerezOnce);
    expect(JSON.stringify({ ...localStorage })).toBe(depoOnce);
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBeNull();
  });
});

describe("ülke çerezi — sunucunun yazdığı değer", () => {
  it("çerezden okunan ülke belgeye RTL olarak yansıyor", () => {
    // Zincirin ucu: nginx `th-country=SA` yazar → açılış script'i okur →
    // Arapça açılır → yön sağdan sola döner.
    ortamiKur({ ad: "SA", cerez: { "th-country": "SA" }, tarayici: "en-US" });
    const karar = scriptiCalistir({ ad: "SA", tarayici: "en-US" });
    expect(karar).toEqual({ lang: "ar", kaynak: "country" });
    expect(document.documentElement.dir).toBe("rtl");
  });

  it("ülke çerezi YOKSA davranış değişmez (tarayıcı diline düşer)", () => {
    // nginx ülkeyi bilmiyorsa başlığı hiç göndermiyor. O durumda akış Faz 1
    // davranışının aynısı olmalı — yeni kod eski yolu bozmamalı.
    ortamiKur({ ad: "yok", tarayici: "ru-RU" });
    expect(scriptiCalistir({ ad: "yok", tarayici: "ru-RU" })).toEqual({
      lang: "ru",
      kaynak: "browser",
    });
  });

  it("ülke çerezine YAZMIYOR — yazan tek taraf sunucu", () => {
    ortamiKur({ ad: "yazma", cerez: { "th-country": "SA" }, tarayici: "en-US" });
    const once = document.cookie;
    scriptiCalistir({ ad: "yazma", tarayici: "en-US" });
    expect(document.cookie).toBe(once);
  });
});

describe("başlık script'i", () => {
  it("karar globalindeki dile göre başlığı değiştirir", () => {
    document.head.innerHTML = '<title data-i18n="pageTitle.home">Türkçe başlık</title>';
    (window as unknown as Record<string, unknown>)[KARAR_GLOBALI] = { lang: "ar" };
    new Function(
      "window",
      baslikScripti({ tr: "Türkçe başlık", ar: "عنوان" })
        .replace(/^<script>/, "")
        .replace(/<\/script>$/, "")
    )(window);
    expect(document.title).toBe("عنوان");
  });

  it("`title[data-i18n]` YOKSA dokunmaz — bot yolunda sunucunun başlığı korunur", () => {
    // `seo_html_injector._strip_hardcoded_seo_tags` bot isteklerinde statik
    // `<title>`ı söküp veritabanındaki SEO başlığını koyuyor. Script o yolda
    // kendi başlığını yazsaydı, sunucunun SEO başlığını ezerdi.
    document.head.innerHTML = "<title>Sunucunun SEO başlığı</title>";
    (window as unknown as Record<string, unknown>)[KARAR_GLOBALI] = { lang: "ar" };
    new Function(
      "window",
      baslikScripti({ tr: "Türkçe başlık", ar: "عنوان" })
        .replace(/^<script>/, "")
        .replace(/<\/script>$/, "")
    )(window);
    expect(document.title).toBe("Sunucunun SEO başlığı");
  });

  it("o dilde başlık yoksa statik başlık kalır", () => {
    document.head.innerHTML = '<title data-i18n="pageTitle.home">Türkçe başlık</title>';
    (window as unknown as Record<string, unknown>)[KARAR_GLOBALI] = { lang: "ru" };
    new Function(
      "window",
      baslikScripti({ tr: "Türkçe başlık", ar: "عنوان" })
        .replace(/^<script>/, "")
        .replace(/<\/script>$/, "")
    )(window);
    expect(document.title).toBe("Türkçe başlık");
  });
});

describe("ülke meta'sı — Faz 5 kancası", () => {
  it("yer tutucu XX ile gelir (sunucu doldurana kadar davranış değişmez)", () => {
    expect(ULKE_META).toContain('name="th-country"');
    expect(ULKE_META).toContain('content="XX"');
  });

  it("`readDetectedCountry()` ile AYNI etiketi kullanır", () => {
    document.head.innerHTML = ULKE_META.replace('content="XX"', 'content="SA"');
    expect(readDetectedCountry()).toBe("SA");
  });
});
