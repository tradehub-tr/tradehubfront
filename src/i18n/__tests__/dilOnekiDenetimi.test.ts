/**
 * DİL ÖNEKİ DENETİMİ — `/en/...` şeması bir daha üretilmesin.
 *
 * Neden var: kod `/en/urun/x`, `/en/kategori/x` gibi adresler üretiyordu ve
 * bunları site haritasında Google'a *alternate* olarak bildiriyordu — ama o
 * adresler HİÇ SUNULMUYORDU. Ölçüldü (21 Eyl 2026, canlı): `/en/kategori/<slug>`
 * → 404, `/en/` → 404; buna karşılık beş site haritası toplam **25.997** adet
 * `hreflang="en"` bildiriyordu (products 2.431 · categories 23.511 · brands 3 ·
 * sellers 28 · static-pages 24). Google kırık alternate'i yok sayar, Search
 * Console'da hata olarak raporlar ve tekrarlanan 404'ler tarama bütçesini yer.
 *
 * Kusur aylarca görünmedi çünkü HİÇBİR çağıran ikinci argümanı (`lang`)
 * geçmiyordu: şema ölü koddu, testler yeşildi, zarar yalnız site haritasında
 * birikiyordu. Bu yüzden denetim iki katmanlı:
 *   (1) DAVRANIŞ — üreticiler hiçbir girdide `/en` döndürmemeli,
 *   (2) KAYNAK   — dosyalarda `/en` adres üreten bir ifade kalmamalı.
 * Yalnız (1) olsaydı, kullanılmayan bir kod dalı yine sessizce yaşardı.
 *
 * Karar (K7, yönetici): yol öneki YOK, dil `?hl=` ile taşınır. Şema ileride
 * gerçekten kurulursa (MOGEM-655 §6.1) bu dosya bilerek güncellenir — o gün
 * "adres gerçekten sunuluyor mu" sorusu da cevaplanmış olmalı.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { getBrandUrl } from "../../utils/brandUrl";
import { getCategoryUrl } from "../../utils/categoryUrl";
import { getListingUrl } from "../../utils/listingUrl";
import { getSellerUrl } from "../../utils/sellerUrl";
import { getStaticPageUrl } from "../../utils/staticPageUrl";

/** Yorumları soy — açıklama metnindeki `/en/` sahte kırmızı üretmesin. */
function kodu(icerik: string): string {
  return icerik.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

const TARANAN = [
  "src/utils/listingUrl.ts",
  "src/utils/categoryUrl.ts",
  "src/utils/brandUrl.ts",
  "src/utils/sellerUrl.ts",
  "src/utils/staticPageUrl.ts",
  "src/seo/setPageMeta.ts",
  "src/seo/loadStaticPageSeo.ts",
  "src/lib/rum/routePhysical.js",
  "src/pages/product-detail.ts",
  "src/pages/brand.ts",
  "src/pages/categories.ts",
  "src/pages/media-watch.ts",
  "vite.config.ts",
];

describe("dil öneki şeması sökülü kalmalı", () => {
  it("üreticiler hiçbir girdide `/en` ile başlayan adres dönmez", () => {
    const uretilen = [
      getListingUrl({ slug: "bonny-kap" }),
      getListingUrl({ id: "LST-1" }),
      getCategoryUrl({ url_slug: "ambalaj" }),
      getCategoryUrl({ slug: "ambalaj" }),
      getBrandUrl({ slug: "acme" }),
      getSellerUrl({ slug: "magaza-1" }),
      getStaticPageUrl("products"),
      getStaticPageUrl("home"),
    ];
    for (const adres of uretilen) {
      expect(adres.startsWith("/en/"), `\`${adres}\` dil öneki taşıyor`).toBe(false);
      expect(adres).not.toBe("/en");
    }
  });

  it("üreticiler ikinci bir dil argümanı KABUL ETMİYOR", () => {
    // Şema tam olarak buradan sızmıştı: imzada `lang` duruyordu, kimse
    // geçmiyordu, kimse fark etmiyordu. İmza tek argümanlı kalmalı.
    for (const fn of [getListingUrl, getCategoryUrl, getBrandUrl, getSellerUrl]) {
      expect(fn.length, `${fn.name} tek argüman almalı`).toBe(1);
    }
    expect(getStaticPageUrl.length).toBe(1);
  });

  it("kaynakta `/en` adresi üreten bir ifade kalmadı", () => {
    const ihlaller: string[] = [];
    for (const yol of TARANAN) {
      const kod = kodu(readFileSync(join(process.cwd(), yol), "utf8"));
      // `"/en"`, `/en/` dize parçası ya da `(?:en\/)?` biçimli isteğe bağlı önek
      if (/["'`]\/en(\/|["'`])/.test(kod) || /\(\?:en\\\//.test(kod)) {
        ihlaller.push(yol);
      }
    }
    expect(ihlaller, `dil öneki geri sızmış: ${ihlaller.join(", ")}`).toEqual([]);
  });

  it("tarama gerçekten çalışıyor (dosyalar okunabiliyor)", () => {
    for (const yol of TARANAN) {
      expect(readFileSync(join(process.cwd(), yol), "utf8").length).toBeGreaterThan(50);
    }
  });
});
