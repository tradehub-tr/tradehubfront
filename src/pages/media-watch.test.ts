/**
 * Task 4 (2026-08-26 medya-watch-page) — `/medya/v/<slug>` sayfasının
 * DOM'suz saf fonksiyonları: slug/`?t=` parse'ı + lisans veri eşlemesi.
 * Sayfanın kendisi (`main()`) import anında kendini çizer (diğer MPA
 * girişleri gibi) — burada yalnız dışa açılan saf fonksiyonlar test edilir.
 */
import { describe, expect, it } from "vitest";
import { buildLicenseRows, getSlugFromPath, parseSeekSeconds } from "./media-watch";

describe("getSlugFromPath", () => {
  it("/medya/v/<slug> path'inden slug'ı okur", () => {
    expect(getSlugFromPath("/medya/v/yeni-urun-tanitimi")).toBe("yeni-urun-tanitimi");
  });

  it("/en/medya/v/<slug> dev-rewrite varyantını da kabul eder", () => {
    expect(getSlugFromPath("/en/medya/v/yeni-urun-tanitimi")).toBe("yeni-urun-tanitimi");
  });

  it("slug'dan sonraki fazla path segmentini kırpar", () => {
    expect(getSlugFromPath("/medya/v/abc/def")).toBe("abc");
  });

  it("eşleşmeyen path için boş dize döner", () => {
    expect(getSlugFromPath("/urun/abc")).toBe("");
    expect(getSlugFromPath("/")).toBe("");
  });

  it("URL-encode edilmiş slug'ı decode eder", () => {
    expect(getSlugFromPath("/medya/v/kampanya%20videosu")).toBe("kampanya videosu");
  });
});

describe("parseSeekSeconds — ?t= başlangıç davranışı", () => {
  it("geçerli tam sayı saniyeyi okur", () => {
    expect(parseSeekSeconds("?t=42")).toBe(42);
  });

  it("ondalık saniyeyi okur", () => {
    expect(parseSeekSeconds("?t=12.5")).toBe(12.5);
  });

  it("parametre yoksa null döner", () => {
    expect(parseSeekSeconds("")).toBeNull();
    expect(parseSeekSeconds("?foo=1")).toBeNull();
  });

  it("negatif değer reddedilir (null)", () => {
    expect(parseSeekSeconds("?t=-5")).toBeNull();
  });

  it("sayısal olmayan değer reddedilir (null)", () => {
    expect(parseSeekSeconds("?t=abc")).toBeNull();
  });

  it("sonsuz/NaN üretebilecek değerler reddedilir (null)", () => {
    expect(parseSeekSeconds("?t=Infinity")).toBeNull();
    expect(parseSeekSeconds("?t=")).toBeNull();
  });
});

describe("buildLicenseRows — veri eşleme", () => {
  it("tam alanlı lisansın 5 satırını da üretir", () => {
    const rows = buildLicenseRows({
      creator: "İstoç",
      creditText: "İstoç Medya",
      copyrightNotice: "© İstoç",
      licenseUrl: "https://example.com/lisans",
      acquireLicensePageUrl: "https://example.com/lisans-al",
    });
    expect(rows).toHaveLength(5);
    expect(rows.map((r) => r.label)).toEqual([
      "Üretici",
      "Kredi",
      "Telif",
      "Lisans",
      "Lisans edinme",
    ]);
  });

  it("boş/whitespace alanlar satıra dönüşmez", () => {
    const rows = buildLicenseRows({
      creator: "İstoç",
      creditText: "",
      copyrightNotice: "   ",
      licenseUrl: "https://example.com/lisans",
      acquireLicensePageUrl: "",
    });
    expect(rows).toEqual([
      { label: "Üretici", value: "İstoç" },
      { label: "Lisans", value: "https://example.com/lisans" },
    ]);
  });

  it("lisans hiç yoksa boş dizi döner", () => {
    expect(buildLicenseRows(null)).toEqual([]);
    expect(buildLicenseRows(undefined)).toEqual([]);
  });

  it("değerler trim edilir", () => {
    const rows = buildLicenseRows({
      creator: "  İstoç  ",
      creditText: "",
      copyrightNotice: "",
      licenseUrl: "",
      acquireLicensePageUrl: "",
    });
    expect(rows).toEqual([{ label: "Üretici", value: "İstoç" }]);
  });
});
