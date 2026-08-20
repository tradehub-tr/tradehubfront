import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearMediaManifestCache,
  getMediaImageManifest,
  getMediaManifest,
  primeMediaManifests,
  seedMediaManifest,
} from "./manifest";

/** `get_manifest_batch` gövdesini Frappe zarfına sar. */
function yanit(mesaj: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({ message: mesaj }),
  } as unknown as Response;
}

const TAM_MANIFEST = {
  slot_key: "product.image",
  src: "/files/media/abc/urun__w768.webp",
  sizes: "100vw",
  alt: "Ürün",
  loading: "eager",
  decoding: "sync",
  fetchpriority: "high",
  width: 1200,
  height: 900,
  aspect_ratio: 1.3333,
  sources: [
    { type: "image/avif", srcset: "/files/media/abc/urun__w768.avif 768w", sizes: "" },
    { type: "image/webp", srcset: "/files/media/abc/urun__w768.webp 768w", sizes: "" },
  ],
};

describe("media manifest istemcisi — bayrak KAPALI (bugünkü davranış korunur)", () => {
  beforeEach(() => clearMediaManifestCache());
  afterEach(() => vi.unstubAllGlobals());

  it("`enabled:false` + boş manifest → görsel manifesti YOK", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        yanit({
          slot: "product.image",
          enabled: false,
          manifests: {},
          missing: ["LST-0001"],
        })
      )
    );
    await primeMediaManifests(["LST-0001"]);
    expect(getMediaImageManifest("LST-0001", "/files/urun.jpg")).toBeNull();
  });

  it("bayrak kapalı öğrenildikten sonra İKİNCİ istek atılmaz", async () => {
    const sahte = vi.fn(async () => yanit({ enabled: false, manifests: {} }));
    vi.stubGlobal("fetch", sahte);
    await primeMediaManifests(["LST-0001"]);
    await primeMediaManifests(["LST-0002"]);
    await primeMediaManifests(["LST-0003"]);
    expect(sahte).toHaveBeenCalledTimes(1);
  });
});

describe("media manifest istemcisi — devre kesici TAZE sayfada da tutar", () => {
  // Bu bir MPA: her gezinme modülü sıfırdan yükler, `_kapali` yeniden `false`
  // başlar. Devre kesicinin tek hafızası `sessionStorage`; oradaki işaret
  // erken çıkıştan ÖNCE okunmazsa kullanıcının gezdiği HER sayfa bir istek
  // daha atar ve devre kesici pratikte hiç çalışmaz.
  // `sessionStorage` HER İKİ UÇTA da temizlenir: önceki testlerden kalan
  // manifest önbelleği "istek atılmadı" sonucunu sahte biçimde doğrulardı
  // (istek zaten önbellek yüzünden atılmazdı, devre kesici yüzünden değil).
  beforeEach(() => {
    clearMediaManifestCache();
    sessionStorage.clear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    try {
      sessionStorage.clear();
    } catch {
      // Depolama yoksa temizlenecek bir şey de yok.
    }
  });

  it("sessionStorage'da kapalı işareti varken taze modül HİÇ istek atmaz", async () => {
    sessionStorage.setItem("tradehub-media-manifest-off-v1", "1");
    const sahte = vi.fn(async () => yanit({ enabled: true, manifests: {} }));
    vi.stubGlobal("fetch", sahte);

    // Taze sayfa yüklemesinin karşılığı: modül kayıt defterini sıfırla ve
    // manifest istemcisini YENİDEN yükle — `_kapali` yine `false` başlar.
    vi.resetModules();
    const taze = await import("./manifest");
    await taze.primeMediaManifests(["LST-0001"]);

    expect(sahte).not.toHaveBeenCalled();
  });

  it("işaret YOKKEN taze modül normal şekilde istek atar (kontrol)", async () => {
    const sahte = vi.fn(async () => yanit({ enabled: true, manifests: {} }));
    vi.stubGlobal("fetch", sahte);

    vi.resetModules();
    const taze = await import("./manifest");
    await taze.primeMediaManifests(["LST-0001"]);

    expect(sahte).toHaveBeenCalledTimes(1);
  });

  it("sessionStorage erişilemezken (gizli sekme) patlamaz, istek atar", async () => {
    const sahte = vi.fn(async () => yanit({ enabled: true, manifests: {} }));
    vi.stubGlobal("fetch", sahte);
    vi.stubGlobal("sessionStorage", {
      getItem() {
        throw new Error("SecurityError: storage disabled");
      },
      setItem() {
        throw new Error("SecurityError: storage disabled");
      },
      removeItem() {
        throw new Error("SecurityError: storage disabled");
      },
    });

    vi.resetModules();
    const taze = await import("./manifest");
    await expect(taze.primeMediaManifests(["LST-0001"])).resolves.toBeUndefined();
    expect(sahte).toHaveBeenCalledTimes(1);
  });
});

describe("media manifest istemcisi — hata yolları ASLA fırlatmaz", () => {
  beforeEach(() => clearMediaManifestCache());
  afterEach(() => vi.unstubAllGlobals());

  it("ağ hatası → resolve olur, önbellek boş kalır", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      })
    );
    await expect(primeMediaManifests(["LST-0001"])).resolves.toBeUndefined();
    expect(getMediaManifest("LST-0001")).toBeNull();
    expect(getMediaImageManifest("LST-0001", "/files/urun.jpg")).toBeNull();
  });

  it("HTTP 500 → resolve olur, önbellek boş kalır", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 500 }) as unknown as Response)
    );
    await expect(primeMediaManifests(["LST-0001"])).resolves.toBeUndefined();
    expect(getMediaManifest("LST-0001")).toBeNull();
  });

  it("bozuk JSON → resolve olur", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          ({
            ok: true,
            status: 200,
            json: async () => {
              throw new SyntaxError("unexpected token");
            },
          }) as unknown as Response
      )
    );
    await expect(primeMediaManifests(["LST-0001"])).resolves.toBeUndefined();
    expect(getMediaManifest("LST-0001")).toBeNull();
  });

  it("kaynağı olmayan manifest KULLANILAMAZ sayılır", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        yanit({
          enabled: true,
          manifests: {
            "LST-0001": {
              listing: "LST-0001",
              enabled: true,
              fallback: "/files/urun.jpg",
              images: [
                {
                  file_url: "/files/urun.jpg",
                  alt_text: "",
                  primary: true,
                  asset: "MA-1",
                  manifest: { ...TAM_MANIFEST, sources: [] },
                },
              ],
            },
          },
        })
      )
    );
    await primeMediaManifests(["LST-0001"]);
    expect(getMediaImageManifest("LST-0001", "/files/urun.jpg")).toBeNull();
  });
});

describe("media manifest istemcisi — bayrak AÇIK", () => {
  beforeEach(() => clearMediaManifestCache());
  afterEach(() => vi.unstubAllGlobals());

  function acikYanit() {
    return yanit({
      slot: "product.image",
      enabled: true,
      manifests: {
        "LST-0001": {
          listing: "LST-0001",
          slot: "product.image",
          enabled: true,
          fallback: "/files/media/abc/urun__w768.webp",
          suppressed: 1,
          images: [
            {
              file_url: "/files/urun.jpg",
              alt_text: "Ürün",
              primary: true,
              asset: "MA-1",
              manifest: TAM_MANIFEST,
            },
          ],
        },
      },
    });
  }

  it("görsel manifesti `file_url` ile bulunur", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => acikYanit())
    );
    await primeMediaManifests(["LST-0001"]);
    const m = getMediaImageManifest("LST-0001", "/files/urun.jpg");
    expect(m?.sources.length).toBe(2);
    expect(m?.width).toBe(1200);
  });

  it("`VITE_MEDIA_BASE` ile mutlaklaşmış URL de eşleşir", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => acikYanit())
    );
    await primeMediaManifests(["LST-0001"]);
    expect(
      getMediaImageManifest("LST-0001", "https://cdn.example.com/files/urun.jpg?v=2")
    ).not.toBeNull();
  });

  it("bilinmeyen görsel `null` döner (varyant swap sonrası yeni URL)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => acikYanit())
    );
    await primeMediaManifests(["LST-0001"]);
    expect(getMediaImageManifest("LST-0001", "/files/baska.jpg")).toBeNull();
  });

  it("önbellek tazeyken ikinci `prime` istek ATMAZ", async () => {
    const sahte = vi.fn(async () => acikYanit());
    vi.stubGlobal("fetch", sahte);
    await primeMediaManifests(["LST-0001"]);
    await primeMediaManifests(["LST-0001"]);
    expect(sahte).toHaveBeenCalledTimes(1);
  });

  it("50'den fazla ilan parçalara bölünür (backend MAX_BATCH_LISTINGS)", async () => {
    const sahte = vi.fn(async () => yanit({ enabled: true, manifests: {} }));
    vi.stubGlobal("fetch", sahte);
    const ilanlar = Array.from({ length: 120 }, (_, i) => `LST-${i}`);
    await primeMediaManifests(ilanlar);
    expect(sahte).toHaveBeenCalledTimes(3);
  });
});

describe("seedMediaManifest — gömülü gövdeyi ağ turu OLMADAN tohumlar (W10)", () => {
  beforeEach(() => {
    clearMediaManifestCache();
    sessionStorage.clear();
  });
  afterEach(() => vi.unstubAllGlobals());

  // `get_listings` yanıtına gömülen ilan gövdesi (batch endpoint'in ilan başına
  // döndürdüğüyle AYNI biçim — FE tek `_govdeTemizle` yolundan geçer).
  const GOVDE = {
    listing: "LST-0001",
    slot: "product.image",
    enabled: true,
    fallback: "/files/media/abc/urun__w768.webp",
    images: [
      {
        file_url: "/files/urun.jpg",
        alt_text: "Ürün",
        primary: true,
        asset: "AS-1",
        manifest: TAM_MANIFEST,
      },
    ],
    suppressed: 0,
  };

  it("tohumlanan gövde SENKRON okunur — hiç ağ isteği atmadan <picture> verisi hazır", () => {
    const sahte = vi.fn();
    vi.stubGlobal("fetch", sahte);
    seedMediaManifest("LST-0001", GOVDE);
    const man = getMediaImageManifest("LST-0001", "/files/urun.jpg");
    expect(man).not.toBeNull();
    expect(man?.sources[0].type).toBe("image/avif");
    expect(sahte).not.toHaveBeenCalled();
  });

  it("VACUITY: tohumlama YAPILMAZSA senkron okuma null döner (soğuk önbellek)", () => {
    expect(getMediaImageManifest("LST-0001", "/files/urun.jpg")).toBeNull();
  });

  it("ağdan gelmiş TAZE kaydı EZMEZ — otorite ağdadır", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        yanit({
          enabled: true,
          manifests: { "LST-0001": { ...GOVDE, fallback: "/files/AGDAN.webp" } },
        })
      )
    );
    await primeMediaManifests(["LST-0001"]);
    seedMediaManifest("LST-0001", { ...GOVDE, fallback: "/files/TOHUM.webp" });
    expect(getMediaManifest("LST-0001")?.fallback).toBe("/files/AGDAN.webp");
  });

  it("boş/geçersiz gövde sessizce yok sayılır (fırlatmaz)", () => {
    expect(() => seedMediaManifest("LST-X", null)).not.toThrow();
    expect(() => seedMediaManifest("", GOVDE)).not.toThrow();
    expect(getMediaManifest("LST-X")).toBeNull();
    expect(getMediaManifest("")).toBeNull();
  });

  it("tohumlanmış kart primeMediaManifests turunda ATLANIR (yalnız KALAN kartlar sorulur)", async () => {
    const sahte = vi.fn(async () => yanit({ enabled: true, manifests: { "LST-0002": GOVDE } }));
    vi.stubGlobal("fetch", sahte);
    seedMediaManifest("LST-0001", GOVDE);
    await primeMediaManifests(["LST-0001", "LST-0002"]);
    expect(sahte).toHaveBeenCalledTimes(1);
    const url = String((sahte.mock.calls[0] as unknown[])[0]);
    expect(url).toContain("LST-0002");
    expect(url).not.toContain("LST-0001");
  });
});
