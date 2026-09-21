// @vitest-environment happy-dom

/**
 * `applyHreflangFallback` testleri — 21 Eyl 2026'ya kadar HİÇ YOKTU.
 *
 * Fonksiyon Google'a gönderilen `<link rel="alternate" hreflang>` etiketlerini
 * basıyor, yani doğrudan indekslemeyi etkiliyor; buna rağmen tek bir testi
 * yoktu. Ürettiği `/en/...` alternate'i canlıda 404 dönüyordu (ölçüldü) ve
 * kusur yalnız site haritası sayılarak fark edildi.
 *
 * Kümenin backend `build_hreflang_links` ile BİREBİR aynı olması şart: iki
 * kanal ayrışırsa Google çelişkili sinyal alır. Backend tarafının eşi:
 * `tradehub_core/seo/tests/test_i18n.py::TestBuildHreflangLinks`.
 */
import { beforeEach, describe, expect, it } from "vitest";

import { applyHreflangFallback } from "./setPageMeta";

function alternates(): Array<{ hreflang: string; href: string }> {
  return [...document.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]')].map(
    (el) => ({ hreflang: el.getAttribute("hreflang") ?? "", href: el.getAttribute("href") ?? "" })
  );
}

describe("applyHreflangFallback", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    window.history.replaceState({}, "", "/urun/bonny-kap");
  });

  it("yalnız `tr` + `x-default` basar — `en` alternate'i YOK", () => {
    applyHreflangFallback();
    const diller = alternates()
      .map((a) => a.hreflang)
      .sort();
    expect(diller).toEqual(["tr", "x-default"]);
  });

  it("bildirilen her adres sayfanın KENDİSİ (self-referencing)", () => {
    applyHreflangFallback();
    const beklenen = `${window.location.origin}/urun/bonny-kap`;
    for (const alt of alternates()) {
      expect(alt.href, `${alt.hreflang} başka adrese işaret ediyor`).toBe(beklenen);
    }
  });

  it("hiçbir adres `/en` öneki taşımaz", () => {
    applyHreflangFallback();
    for (const alt of alternates()) {
      expect(alt.href.includes("/en/")).toBe(false);
    }
  });

  it("sorgu parametresi alternate'e girmez (crawl budget)", () => {
    window.history.replaceState({}, "", "/urunler?sayfa=2&q=kutu");
    applyHreflangFallback();
    for (const alt of alternates()) {
      expect(alt.href).toBe(`${window.location.origin}/urunler`);
    }
  });

  it("sunucu payload'ı zaten hreflang bastıysa dokunmaz (NO-OP)", () => {
    document.head.innerHTML =
      '<link rel="alternate" hreflang="tr" href="https://sunucu.example/x">';
    applyHreflangFallback();
    expect(alternates()).toEqual([{ hreflang: "tr", href: "https://sunucu.example/x" }]);
  });

  it("noindex sayfada hiç alternate basmaz", () => {
    document.head.innerHTML = '<meta name="robots" content="noindex, follow">';
    applyHreflangFallback();
    expect(alternates()).toEqual([]);
  });
});
