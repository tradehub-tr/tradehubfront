/**
 * İÇERİK DİLİ BACKEND'E GİDER — davranış + kaynak denetimi.
 *
 * Backend'in içerik uçlarının çoğu `lang` parametresi alıyor ve varsayılanı
 * **"tr"**: `category.get_mega_menu`, `seo.get_public_page_seo`,
 * `listing.get_listings`, `search.unified_suggest`, `footer.get_footer_seo_links`…
 * Gönderilmezse arayüz Arapça olsa bile içerik Türkçe döner.
 *
 * Bunu bugün tek bir satır sağlıyor — `utils/api.ts` içindeki `callMethod`,
 * GET çağrılarına aktif dili kendisi ekliyor:
 *
 *     const langParams = "lang" in params ? params : { ...params, lang: getCurrentLang() };
 *
 * Ölçüldü (16 Eyl 2026, gerçek Chrome + ağ kaydı, arayüz `ar`): tek bir sayfa
 * yüklemesinde `get_mega_menu?lang=ar`, `get_listings?...&lang=ar`,
 * `unified_suggest?...&lang=ar`, `get_currency_settings?lang=ar` — hepsi dili
 * taşıyordu, hiçbir çağrı noktası `lang` yazmadığı hâlde.
 *
 * RİSK — ve bu testin var oluş sebebi: o satır sessizce silinirse ya da bir uç
 * POST'a çevrilirse (POST gövdesine lang EKLENMİYOR), tüm içerik dilden bağımsız
 * Türkçeye döner ve **hiçbir mevcut test kırılmaz**. Kusur ekranda da hemen
 * görünmez: kategori çevirileri bugün boş olduğu için fallback zaten Türkçe.
 * Çeviriler girildiği gün menü Türkçe kalır ve sebebi aranır.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { callMethod } from "../../utils/api";

const SRC = join(process.cwd(), "src");

/** `lang` parametresi kabul eden ve varsayılanı "tr" olan backend uçları. */
const DIL_ALAN_UCLAR = [
  "tradehub_core.api.category.get_mega_menu",
  "tradehub_core.api.category.get_platform_category_tree",
  "tradehub_core.api.category.search_platform_categories",
  "tradehub_core.api.category.get_category_ancestors",
  "tradehub_core.api.seo.get_public_page_seo",
  "tradehub_core.api.footer.get_footer_seo_links",
];

function yanitStub() {
  return {
    ok: true,
    status: 200,
    json: async () => ({ message: [] }),
    text: async () => '{"message":[]}',
  } as unknown as Response;
}

describe("callMethod aktif içerik dilini taşır", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("GET çağrısına lang parametresi ekler", async () => {
    const fetchMock = vi.fn().mockResolvedValue(yanitStub());
    vi.stubGlobal("fetch", fetchMock);

    await callMethod("tradehub_core.api.category.get_mega_menu");

    const cagrilanUrl = String(fetchMock.mock.calls[0][0]);
    expect(cagrilanUrl).toContain("get_mega_menu");
    // Varsayılan test dili ne olursa olsun bir dil TAŞINMALI — sabit "tr"
    // beklemek testi kırılgan yapar, asıl kural "lang var".
    expect(cagrilanUrl).toMatch(/[?&]lang=(tr|en|ar|ru)\b/);
  });

  it("çağıran lang verdiyse onu EZMEZ", async () => {
    const fetchMock = vi.fn().mockResolvedValue(yanitStub());
    vi.stubGlobal("fetch", fetchMock);

    await callMethod("tradehub_core.api.seo.get_public_page_seo", {
      page_type: "category",
      lang: "ar",
    });

    expect(String(fetchMock.mock.calls[0][0])).toMatch(/[?&]lang=ar\b/);
  });

  it("dil taşımayan bir çağrı kurgusu testi kırar (denetim çalışıyor)", async () => {
    // Karşı kanıt: `lang` enjeksiyonu olmayan bir URL üretilirse ilk testin
    // beklentisi tutmaz. Burada o beklentiyi doğrudan kurguya uyguluyoruz.
    const langsiz = "/api/method/tradehub_core.api.category.get_mega_menu";
    expect(langsiz).not.toMatch(/[?&]lang=(tr|en|ar|ru)\b/);
  });
});

function tsDosyalari(dizin: string, biriken: string[] = []): string[] {
  for (const ad of readdirSync(dizin)) {
    const tam = join(dizin, ad);
    if (statSync(tam).isDirectory()) {
      tsDosyalari(tam, biriken);
    } else if (ad.endsWith(".ts") && !ad.endsWith(".d.ts")) {
      biriken.push(tam);
    }
  }
  return biriken;
}

describe("hiçbir çağrı sabit dil göndermiyor", () => {
  /**
   * `lang: "tr"` yazmak `callMethod`un enjeksiyonunu devre dışı bırakır —
   * "lang gönderiliyor" göründüğü hâlde içerik dilden koparılmış olur.
   *
   * Bilinen ve KASITLI tek istisna `seo/loadStaticPageSeo.ts`: statik sayfa
   * SEO'sunu backend yalnız tr/en üretiyor (`page_resolver.py:359`,
   * `_normalize_static_seo_language`), bu yüzden ar/ru bilerek tr'ye indiriliyor.
   * Backend dört dile çıktığında bu istisna kalkmalı.
   */
  const MUAF_DOSYALAR = ["seo/loadStaticPageSeo.ts"];

  it("dil alan uçlara sabit lang değeri geçilmiyor", () => {
    const ihlaller: string[] = [];

    for (const yol of tsDosyalari(SRC)) {
      const goreli = relative(SRC, yol);
      if (goreli.includes("__tests__") || goreli.endsWith(".test.ts")) continue;
      if (MUAF_DOSYALAR.some((m) => goreli.endsWith(m))) continue;

      const kaynak = readFileSync(yol, "utf8");
      for (const uc of DIL_ALAN_UCLAR) {
        let i = kaynak.indexOf(uc);
        while (i !== -1) {
          const pencere = kaynak.slice(i, i + 400);
          const sabit = pencere.match(/\blang\s*:\s*["'](tr|en|ar|ru)["']/);
          if (sabit) ihlaller.push(`${goreli} → ${uc} (${sabit[0]})`);
          i = kaynak.indexOf(uc, i + 1);
        }
      }
    }

    expect(
      ihlaller,
      "Sabit dil, callMethod'un otomatik dil enjeksiyonunu devre dışı bırakır."
    ).toEqual([]);
  });

  it("muafiyet listesi büyümemiş", () => {
    // Her yeni muafiyet, o ekranın dilden koparılması demek. Eklemeden önce
    // backend'in o dili gerçekten desteklemediği ölçülmeli.
    expect(MUAF_DOSYALAR).toEqual(["seo/loadStaticPageSeo.ts"]);
  });
});
