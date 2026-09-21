/**
 * DİL KARARI — öncelik sırası, `?hl=` parametresi ve çerez köprüsü.
 *
 * Neden: 16 Eyl 2026'da ölçüldü — `?hl=` ve `?lang=` parametrelerinin ikisi
 * de kodda HİÇ okunmuyordu (`grep "hl=" src/i18n/` → 0 satır), yani
 * `istoc.com/?hl=ar` yazan ziyaretçi Türkçe bir sayfa görüyordu. Aynı turda
 * storefront ve panelin ayrı localStorage anahtarı kullandığı, dolayısıyla
 * iki taraf arasında geçen kullanıcının dili iki kez seçtiği görüldü.
 *
 * Buradaki testler kararın SIRASINI kilitler. Sıra bozulursa (ör. elle seçim
 * `?hl=`in üstüne çıkarsa) paylaşılan dil bağlantıları sessizce işlevsiz
 * kalırdı — hiçbir derleme hatası vermeden.
 */
import { beforeEach, describe, expect, it } from "vitest";

import {
  LANG_COOKIE_KEY,
  LANG_COOKIE_MAX_AGE,
  LANG_SOURCE_COOKIE_KEY,
  LANG_SOURCE_KEY,
  LANG_STORAGE_KEY,
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
} from "../languageChoice";

/** Testler arası sızıntıyı önler: her çerez ve depolama anahtarı sıfırlanır. */
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

function ortamiTemizle() {
  for (const ad of [LANG_COOKIE_KEY, LANG_SOURCE_COOKIE_KEY]) {
    document.cookie = `${ad}=; Path=/; ${GECMIS_TARIH}`;
  }
  localStorage.clear();
  document.head.querySelectorAll('meta[name="th-country"]').forEach((m) => m.remove());
}

beforeEach(ortamiTemizle);

describe("resolveLang — öncelik sırası", () => {
  it("?hl= her şeyin üstünde: elle seçimi de ülkeyi de ezer", () => {
    // Paylaşılan bağlantının anlamı bu. Alıcı geçen ay Türkçe seçmiş olsa
    // bile kendisine gönderilen Arapça bağlantı Arapça açılmalı.
    const karar = resolveLang({ hl: "ar", manuel: "tr", ulke: "RU", tarayici: "en" });
    expect(karar).toEqual({ lang: "ar", kaynak: "hl" });
  });

  it("elle seçim ülke tespitini ezer — görevin açık şartı", () => {
    const karar = resolveLang({ manuel: "tr", ulke: "SA", tarayici: "ru" });
    expect(karar).toEqual({ lang: "tr", kaynak: "manual" });
  });

  it("seçim yoksa ülke karar verir", () => {
    expect(resolveLang({ ulke: "RU", tarayici: "en" })).toEqual({
      lang: "ru",
      kaynak: "country",
    });
    expect(resolveLang({ ulke: "EG", tarayici: "en" })).toEqual({
      lang: "ar",
      kaynak: "country",
    });
  });

  it("HARİTADA OLMAYAN ülke tarayıcı diline yol verir, İngilizceye kilitlemez", () => {
    // Tuzak: `languageForCountry("DE")` → "en" döner (varsayılan). Bunu
    // "ülke kararı" saymak, Almanya'dan bağlanan Rusça tarayıcılı bir
    // kullanıcıyı İngilizceye kilitlerdi.
    expect(resolveLang({ ulke: "DE", tarayici: "ru" })).toEqual({
      lang: "ru",
      kaynak: "browser",
    });
  });

  it("ülke TR/RU/arapça listesinde ise tarayıcıya sormaz", () => {
    expect(resolveLang({ ulke: "TR", tarayici: "en" }).kaynak).toBe("country");
  });

  it("hiçbir kaynak yoksa İngilizce — 'tespit bozulursa site açılmaya devam etsin'", () => {
    expect(resolveLang({})).toEqual({ lang: "en", kaynak: "default" });
    expect(resolveLang({ hl: null, manuel: null, ulke: null, tarayici: "de" })).toEqual({
      lang: "en",
      kaynak: "default",
    });
  });

  it("desteklenmeyen değerler sessizce atlanır, bir sonraki kaynağa düşer", () => {
    expect(resolveLang({ hl: "de" as never, manuel: "tr" })).toEqual({
      lang: "tr",
      kaynak: "manual",
    });
  });

  it("bölgeli tarayıcı kodu normalize edilir (tr-TR → tr)", () => {
    expect(resolveLang({ tarayici: "tr-TR" })).toEqual({ lang: "tr", kaynak: "browser" });
  });
});

describe("readLangParam", () => {
  it("?hl= okunur", () => {
    expect(readLangParam("?hl=ar")).toBe("ar");
    expect(readLangParam("hl=RU")).toBe("ru");
  });

  it("?lang= eski bağlantılar için takma ad", () => {
    expect(readLangParam("?lang=tr")).toBe("tr");
  });

  it("hl, lang'den önce gelir", () => {
    expect(readLangParam("?lang=tr&hl=ar")).toBe("ar");
  });

  it("desteklenmeyen dil null — ekran hata vermez, normal akışa düşer", () => {
    expect(readLangParam("?hl=de")).toBeNull();
    expect(readLangParam("?hl=")).toBeNull();
    expect(readLangParam("")).toBeNull();
    expect(readLangParam("?q=masa")).toBeNull();
  });
});

describe("stripLangParam — kullanıcının sorgusunu KORUR", () => {
  it("yalnız dil parametresini siler, diğerlerini bırakır", () => {
    // Bu satırın koruduğu kusur: sorguyu tamamen silmek arama sayfasında
    // kullanıcının aramasını uçururdu.
    expect(stripLangParam("/products?hl=ar&q=çelik&page=2")).toBe("/products?q=%C3%A7elik&page=2");
  });

  it("tek parametre silinince soru işareti de kalkar", () => {
    expect(stripLangParam("/?hl=ar")).toBe("/");
  });

  it("çapa korunur", () => {
    expect(stripLangParam("/urun/5?hl=ru#yorumlar")).toBe("/urun/5#yorumlar");
  });

  it("parametre yoksa girdi AYNEN döner — çağıran replaceState çağırmaz", () => {
    expect(stripLangParam("/products?q=masa")).toBe("/products?q=masa");
    expect(stripLangParam("/products")).toBe("/products");
  });

  it("hem hl hem lang varsa ikisi de silinir", () => {
    expect(stripLangParam("/?hl=ar&lang=tr&x=1")).toBe("/?x=1");
  });
});

describe("çerez köprüsü", () => {
  it("yazılan çerez geri okunur", () => {
    writeCookie("th-deneme", "değer");
    expect(readCookie("th-deneme")).toBe("değer");
    document.cookie = `th-deneme=; Path=/; ${GECMIS_TARIH}`;
  });

  it("çerez adı ve ömrü panelle ORTAK sözleşme", () => {
    // Panel tarafındaki eşi: admin-panel/frontend/src/i18n/languageChoice.js
    // Bu değerler değişirse iki uygulama farklı çerez okur ve köprü sessizce
    // kopar — bu yüzden sabitler testte yazılı.
    expect(LANG_COOKIE_KEY).toBe("th-lang");
    expect(LANG_SOURCE_COOKIE_KEY).toBe("th-lang-source");
    expect(LANG_COOKIE_MAX_AGE).toBe(31536000);
  });

  it("writeLangCookie dili ve kaynağı BİRLİKTE yazar", () => {
    writeLangCookie("ru", "manual");
    expect(readLangCookie()).toBe("ru");
    expect(readCookie(LANG_SOURCE_COOKIE_KEY)).toBe("manual");
  });

  it("çerezdeki geçersiz dil null döner", () => {
    writeCookie(LANG_COOKIE_KEY, "de");
    expect(readLangCookie()).toBeNull();
  });

  it("benzer adlı çerez yanlışlıkla eşleşmez", () => {
    // "th-lang-source" adı "th-lang" ile başlıyor; naif `startsWith`
    // araması kaynak çerezini dil çerezi sanardı.
    document.cookie = "th-lang-source=manual; Path=/";
    expect(readCookie("th-lang", "th-lang-source=manual")).toBeNull();
  });
});

describe("readManualLang — geçiş ve kaynak ayrımı", () => {
  it("çerez 'manual' ise dili döner", () => {
    writeLangCookie("ar", "manual");
    expect(readManualLang()).toBe("ar");
  });

  it("çerez 'auto' ise elle seçim SAYILMAZ — ülke tespiti çalışmaya devam eder", () => {
    // Kusurun kendisi: kaynağa bakmasaydık ilk ziyarette yazılan otomatik
    // değer kullanıcı seçimi sanılır, ülke tespiti bir daha hiç çalışmazdı.
    writeLangCookie("en", "auto");
    expect(readManualLang()).toBeNull();
  });

  it("çerez yoksa ESKİ localStorage seçimi çereze taşınır", () => {
    // Bu özellik yayına çıktığında dilini çoktan seçmiş kullanıcılar
    // tercihlerini kaybetmemeli.
    localStorage.setItem(LANG_STORAGE_KEY, "ru");
    localStorage.setItem(LANG_SOURCE_KEY, "manual");
    expect(readManualLang()).toBe("ru");
    expect(readLangCookie()).toBe("ru");
    expect(readCookie(LANG_SOURCE_COOKIE_KEY)).toBe("manual");
  });

  it("localStorage'da işaretsiz dil taşınmaz — i18next'in otomatik yazdığı değerdir", () => {
    localStorage.setItem(LANG_STORAGE_KEY, "tr"); // th-lang-source YOK
    expect(readManualLang()).toBeNull();
    expect(readLangCookie()).toBeNull();
  });
});

describe("setLanguageManually", () => {
  it("localStorage ve çerezin İKİSİNİ birden yazar", () => {
    expect(setLanguageManually("AR")).toBe("ar");
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe("ar");
    expect(localStorage.getItem(LANG_SOURCE_KEY)).toBe("manual");
    expect(readLangCookie()).toBe("ar");
    expect(readCookie(LANG_SOURCE_COOKIE_KEY)).toBe("manual");
  });

  it("geçersiz kod hiçbir yere yazmaz", () => {
    expect(setLanguageManually("de")).toBeNull();
    expect(readLangCookie()).toBeNull();
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBeNull();
  });
});

describe("readDetectedCountry", () => {
  it("meta yoksa null — Faz 5 bağlanana kadar davranış değişmez", () => {
    expect(readDetectedCountry()).toBeNull();
  });

  it("meta varsa kod okunur", () => {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "th-country");
    meta.setAttribute("content", "SA");
    document.head.appendChild(meta);
    expect(readDetectedCountry()).toBe("SA");
  });

  it("sunucu dolduramadığında yazdığı 'XX' bilinmiyor demektir", () => {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "th-country");
    meta.setAttribute("content", "XX");
    document.head.appendChild(meta);
    expect(readDetectedCountry()).toBeNull();
  });
});
