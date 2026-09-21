// @vitest-environment happy-dom

/**
 * Vitrin dört dilde çiziliyor mu — 21 Eyl 2026'da eklendi.
 *
 * NEDEN: Ölçüldü (17 Eyl, alpha'da GERÇEK Suudi IP'siyle): otomatik dil seçimi
 * sayfayı Arapça ve RTL açıyordu ama vitrin bölümü Türkçe/İngilizce kalıyordu
 * ("Kategorileri keşfet", "Tüm kategoriler", hero başlığı).
 * Kanıt: `docs/ulke-turu-kanit/alpha/01-SA-anasayfa.png`.
 *
 * Kök neden iki katmanlıydı ve İKİSİ DE testsizdi:
 *   1. Şema — `Category Showcase Tile` yalnız `_tr`/`_en` kolonu taşıyordu.
 *   2. Seçici — `pick()` `lang === "en"` diye soruyordu, yani ar/ru ziyaretçi
 *      HER ZAMAN Türkçe görüyordu; "Tüm kategoriler" bağlantısı da aynı
 *      iki dilli koşulla sabit yazılmıştı.
 *
 * Bu dosya ikisini de kilitler: dil listesi genişlediğinde buradan başlanır.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CategoryShowcase } from "./CategoryShowcase";
import type { ShowcaseData, ShowcaseTile } from "../../services/categoryShowcaseService";
import { SHOWCASE_LANGS } from "../../services/categoryShowcaseService";

const aktifDil = vi.hoisted(() => ({ deger: "tr" as string }));
vi.mock("../../i18n", () => ({
  getCurrentLang: () => aktifDil.deger,
  // Gerçek sözlüğe bağlanmadan anahtarı geri ver — bu dosya SEÇİCİYİ ölçüyor,
  // çeviri bütünlüğünü `ceviriButunlugu.test.ts` ölçüyor.
  t: (anahtar: string) => `«${anahtar}»`,
}));

function kutu(kismi: Partial<ShowcaseTile> = {}): ShowcaseTile {
  const bos = Object.fromEntries(
    ["label", "hover_text", "promo_badge", "promo_title", "cta_text"].flatMap((kok) =>
      SHOWCASE_LANGS.map((dil) => [`${kok}_${dil}`, ""])
    )
  );
  return {
    ...bos,
    name: "kutu-1",
    tile_type: "category",
    col_span: 1,
    row_span: 1,
    sort_order: 1,
    image: "",
    link_href: "/kategori/test",
    background_color: "#000000",
    cta_href: "",
    ...kismi,
  } as ShowcaseTile;
}

/**
 * Görünen HTML — `data-showcase-hash` özniteliği HARİÇ.
 *
 * TUZAK (ölçüldü): `signature()` tüm veriyi JSON olarak o özniteliğe basıyor,
 * yani DÖRT dilin metni de HTML dizesinde geçiyor. "Türkçe metin görünmüyor"
 * iddiası ham dize üzerinde ölçülürse HER ZAMAN kırmızı çıkar — değişiklik
 * algılama karması, ekranda görünen metin değildir.
 */
function gorunen(html: string): string {
  return html.replace(/data-showcase-hash='[^']*'/g, "");
}

function veri(tiles: ShowcaseTile[]): ShowcaseData {
  return {
    enabled: true,
    columns: 4,
    section_title: { tr: "Kategorileri keşfet", en: "Explore", ar: "استكشف", ru: "Изучите" },
    tiles,
  };
}

describe("CategoryShowcase — dört dil", () => {
  beforeEach(() => {
    aktifDil.deger = "tr";
  });

  it.each([
    ["tr", "Tekstil", "Kategorileri keşfet"],
    ["en", "Textile", "Explore"],
    ["ar", "المنسوجات", "استكشف"],
    ["ru", "Текстиль", "Изучите"],
  ])("%s dilinde kendi metnini çiziyor", (dil, beklenenEtiket, beklenenBaslik) => {
    aktifDil.deger = dil;
    const html = CategoryShowcase(
      veri([
        kutu({
          label_tr: "Tekstil",
          label_en: "Textile",
          label_ar: "المنسوجات",
          label_ru: "Текстиль",
        }),
      ])
    );
    expect(html).toContain(beklenenEtiket);
    expect(html).toContain(beklenenBaslik);
  });

  it("Arapça metin eksikse TÜRKÇEYE düşer — ekran boş kalmaz", () => {
    aktifDil.deger = "ar";
    const html = CategoryShowcase(veri([kutu({ label_tr: "Tekstil", label_en: "Textile" })]));
    expect(html).toContain("Tekstil");
  });

  it("promo kutusunun rozet/başlık/buton metinleri de dile uyuyor", () => {
    aktifDil.deger = "ru";
    const html = CategoryShowcase(
      veri([
        kutu({
          tile_type: "promo",
          promo_badge_tr: "Ticaret Güvencesi",
          promo_badge_ru: "Торговая гарантия",
          promo_title_tr: "Güvenli ödeme",
          promo_title_ru: "Безопасная оплата",
          cta_text_tr: "Nasıl çalışır?",
          cta_text_ru: "Как это работает?",
          cta_href: "/x",
        }),
      ])
    );
    expect(html).toContain("Торговая гарантия");
    expect(html).toContain("Безопасная оплата");
    expect(html).toContain("Как это работает?");
    expect(gorunen(html)).not.toContain("Ticaret Güvencesi");
  });

  it("'Tüm kategoriler' bağlantısı SABİT METİN değil, i18n anahtarı", () => {
    // 2026-09-21'e kadar burada `lang === "en" ? "All categories" : "Tüm
    // kategoriler"` yazıyordu — Arapça ziyaretçi Türkçe görüyordu.
    for (const dil of SHOWCASE_LANGS) {
      aktifDil.deger = dil;
      const html = CategoryShowcase(veri([kutu({ label_tr: "X" })]));
      expect(html).toContain("«categoryShowcase.allCategories»");
      expect(gorunen(html)).not.toContain("Tüm kategoriler");
      expect(gorunen(html)).not.toContain("All categories");
    }
  });

  it("hover metni boşsa i18n yedeğine düşer (sabit Türkçe değil)", () => {
    aktifDil.deger = "ar";
    const html = CategoryShowcase(veri([kutu({ label_tr: "X", label_ar: "س" })]));
    expect(html).toContain("«categoryShowcase.seeProducts»");
    expect(gorunen(html)).not.toContain("Ürünleri gör");
  });
});
