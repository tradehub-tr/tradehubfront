/**
 * Dil seçiminin TEK KARAR NOKTASI — davranış sözleşmesi.
 *
 * Korunan iddialar:
 *  1. Elle seçim `th-lang-source=manual` ile işaretlenir (otomatik ülke
 *     tespiti MOGEM-642'de buna bakıp geri çekilecek).
 *  2. Desteklenmeyen kod YAZILMAZ — eski `langMap[code] || "en"` kalıbı
 *     AR/RU seçimini sessizce İngilizceye çeviriyordu.
 *  3. Kod biçimi ne olursa olsun ("TR", "tr-TR", "tr") aynı sonuca normalize olur.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  LANG_COOKIE_KEY,
  LANG_SOURCE_COOKIE_KEY,
  LANG_SOURCE_KEY,
  LANG_STORAGE_KEY,
  isLanguageManuallySelected,
  normalizeLang,
  readCookie,
  readLangCookie,
  setLanguageManually,
} from "../languageChoice";

/**
 * Seçim artık localStorage'a VE çereze yazılıyor (MOGEM-642 · Faz 1 — panel
 * ile ortak köprü). `localStorage.clear()` tek başına yetmiyor: çerez sayfa
 * ömrünü aşıyor ve bir sonraki testin başlangıç durumuna sızıyor. Ölçüldü —
 * bu temizleyici eklenene kadar "işaret yokken false" testi, kendisinden
 * önceki `setLanguageManually("en")` çağrısının çerezi yüzünden kırmızıydı.
 */
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
  localStorage.clear();
  for (const ad of [LANG_COOKIE_KEY, LANG_SOURCE_COOKIE_KEY]) {
    document.cookie = `${ad}=; Path=/; ${GECMIS_TARIH}`;
  }
}

describe("normalizeLang", () => {
  it("büyük/küçük harf ve bölge ekini normalize eder", () => {
    expect(normalizeLang("TR")).toBe("tr");
    expect(normalizeLang("tr-TR")).toBe("tr");
    expect(normalizeLang("  EN  ")).toBe("en");
    expect(normalizeLang("ar")).toBe("ar");
    expect(normalizeLang("RU")).toBe("ru");
  });

  it("desteklenmeyen kodda null döner", () => {
    expect(normalizeLang("de")).toBeNull();
    expect(normalizeLang("zh-CN")).toBeNull();
    expect(normalizeLang("")).toBeNull();
    expect(normalizeLang(null)).toBeNull();
    expect(normalizeLang(undefined)).toBeNull();
  });
});

describe("setLanguageManually", () => {
  beforeEach(ortamiTemizle);

  it("dili yazar ve 'manual' olarak işaretler", () => {
    expect(setLanguageManually("TR")).toBe("tr");
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe("tr");
    expect(localStorage.getItem(LANG_SOURCE_KEY)).toBe("manual");
    expect(isLanguageManuallySelected()).toBe(true);
  });

  it("dört dilin dördünü de kabul eder", () => {
    for (const [girdi, beklenen] of [
      ["TR", "tr"],
      ["EN", "en"],
      ["AR", "ar"],
      ["RU", "ru"],
    ] as const) {
      localStorage.clear();
      expect(setLanguageManually(girdi)).toBe(beklenen);
      expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe(beklenen);
    }
  });

  it("DESTEKLENMEYEN kodu yazmaz ve null döner", () => {
    expect(setLanguageManually("de")).toBeNull();
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(LANG_SOURCE_KEY)).toBeNull();
    expect(readLangCookie()).toBeNull(); // çereze de sızmamalı
  });

  it("geçersiz koddan sonra önceki seçim bozulmaz", () => {
    setLanguageManually("ar");
    setLanguageManually("de");
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe("ar");
  });

  it("localStorage yazılamıyorsa çökmez, dili yine döner VE çerez yazılır", () => {
    // Çerez ayrı bir `try` içinde olmasaydı localStorage hatası onu da
    // atlatırdı; gizli sekmedeki kullanıcının seçimi panele hiç geçmezdi.
    const orijinal = Storage.prototype.setItem;
    Storage.prototype.setItem = vi.fn(() => {
      throw new Error("QuotaExceeded");
    });
    try {
      expect(setLanguageManually("ru")).toBe("ru");
      expect(readLangCookie()).toBe("ru");
    } finally {
      Storage.prototype.setItem = orijinal;
    }
  });

  it("seçim localStorage ve çerezin İKİSİNE birden yazılır", () => {
    setLanguageManually("ar");
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe("ar");
    expect(readLangCookie()).toBe("ar");
    expect(readCookie(LANG_SOURCE_COOKIE_KEY)).toBe("manual");
  });
});

describe("isLanguageManuallySelected", () => {
  beforeEach(ortamiTemizle);

  it("işaret yokken false — otomatik tespit dili ezebilir", () => {
    localStorage.setItem(LANG_STORAGE_KEY, "tr"); // i18next'in kendi cache'i
    expect(isLanguageManuallySelected()).toBe(false);
  });

  it("işaret varken true", () => {
    setLanguageManually("en");
    expect(isLanguageManuallySelected()).toBe(true);
  });

  it("PANELDE yapılan seçim de görülür — çerez localStorage'sız da yeter", () => {
    // Panel ayrı bir uygulama; storefront'un localStorage'ına hiç yazmaz.
    // Köprü yalnız çerez olduğu için bu senaryo localStorage boşken sınanır.
    document.cookie = `${LANG_SOURCE_COOKIE_KEY}=manual; Path=/`;
    expect(localStorage.getItem(LANG_SOURCE_KEY)).toBeNull();
    expect(isLanguageManuallySelected()).toBe(true);
  });
});
