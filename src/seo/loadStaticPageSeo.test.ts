// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadStaticPageSeo, normalizeStaticSeoPath } from "./loadStaticPageSeo";

describe("static page SEO HTTP refresh", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.head.innerHTML = "<title>Build başlığı</title>";
    document.documentElement.lang = "tr";
  });

  it("yol dil öneki taşımaz — `/en/...` artık ayrıştırılmaz (2026-09-21)", () => {
    // Şema söküldü: `/en/...` nginx'te 301 ile önekiz karşılığına + `?hl=en`e
    // dönüyor, yani tarayıcı bu fonksiyona hiç önekli yol vermiyor. Önek
    // ayrıştırması dursaydı, gerçekten `/en...` diye başlayan bir statik sayfa
    // eklendiği gün yolu yanlış kırpardı.
    expect(normalizeStaticSeoPath("/en/urunler")).toEqual({ path: "/en/urunler" });
    expect(normalizeStaticSeoPath("/urunler")).toEqual({ path: "/urunler" });
    expect(normalizeStaticSeoPath("")).toEqual({ path: "/" });
  });

  it("loads and applies current metadata for a registered static page", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: { title: "Veritabanı başlığı" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await loadStaticPageSeo("tr", "/");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("get_static_page_meta"),
      expect.objectContaining({ cache: "no-store", credentials: "include" })
    );
    expect(document.title).toBe("Veritabanı başlığı");
  });

  it("dil AKTİF dilden gelir, yoldan değil", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: { title: "Current English title" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await loadStaticPageSeo("en", "/urunler");

    const request = new URL(fetchMock.mock.calls[0][0], window.location.origin);
    expect(request.searchParams.get("path")).toBe("/urunler");
    expect(request.searchParams.get("lang")).toBe("en");
    expect(document.title).toBe("Current English title");
  });

  it("sends Turkish metadata language for Arabic storefront state", async () => {
    document.documentElement.lang = "ar";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: { title: "Güncel başlık", lang: "tr" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await loadStaticPageSeo("ar", "/urunler");

    const request = new URL(fetchMock.mock.calls[0][0], window.location.origin);
    expect(request.searchParams.get("lang")).toBe("tr");
    expect(document.documentElement.lang).toBe("ar");
  });

  it("sends Turkish metadata language for Russian storefront state", async () => {
    document.documentElement.lang = "ru";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: { title: "Güncel başlık", lang: "tr" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await loadStaticPageSeo("ru", "/urunler");

    const request = new URL(fetchMock.mock.calls[0][0], window.location.origin);
    expect(request.searchParams.get("lang")).toBe("tr");
    expect(document.documentElement.lang).toBe("ru");
  });

  it("belge dili aktif dile göre kurulur", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: { title: "Current English title", lang: "tr" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await loadStaticPageSeo("en", "/urunler");

    expect(document.documentElement.lang).toBe("en");
  });

  it("skips dynamic paths", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await loadStaticPageSeo("tr", "/urun/dinamik-urun");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(document.title).toBe("Build başlığı");
  });

  it("preserves build metadata when HTTP fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await loadStaticPageSeo("tr", "/");
    expect(document.title).toBe("Build başlığı");
  });
});
