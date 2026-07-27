// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadStaticPageSeo, normalizeStaticSeoPath } from "./loadStaticPageSeo";

describe("static page SEO HTTP refresh", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.head.innerHTML = "<title>Build başlığı</title>";
  });

  it("normalizes the English URL prefix", () => {
    expect(normalizeStaticSeoPath("/en/urunler")).toEqual({
      path: "/urunler",
      langFromPath: "en",
    });
    expect(normalizeStaticSeoPath("/en")).toEqual({ path: "/", langFromPath: "en" });
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

  it("sends the canonical path and English language for an English-prefixed URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: { title: "Current English title" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await loadStaticPageSeo("tr", "/en/urunler");

    const request = new URL(fetchMock.mock.calls[0][0], window.location.origin);
    expect(request.searchParams.get("path")).toBe("/urunler");
    expect(request.searchParams.get("lang")).toBe("en");
    expect(document.title).toBe("Current English title");
  });

  it("sends Turkish metadata language for Arabic storefront state", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: { title: "Güncel başlık" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await loadStaticPageSeo("ar", "/urunler");

    const request = new URL(fetchMock.mock.calls[0][0], window.location.origin);
    expect(request.searchParams.get("lang")).toBe("tr");
  });

  it("sends Turkish metadata language for Russian storefront state", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: { title: "Güncel başlık" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await loadStaticPageSeo("ru", "/urunler");

    const request = new URL(fetchMock.mock.calls[0][0], window.location.origin);
    expect(request.searchParams.get("lang")).toBe("tr");
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
