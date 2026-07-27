// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadStaticPageSeo, normalizeStaticSeoPath } from "./loadStaticPageSeo";

describe("static page SEO HTTP refresh", () => {
  beforeEach(() => {
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
