/**
 * Sell sayfası iOS gating — regresyon bekçisi (FE-1, AC-1/AC-3).
 *
 * UA 'istocApp/ios' iken SellPageLayout/PricingTable çıktısında fiyat, paket
 * kartı ve trial CTA node'u BULUNMAZ; web modunda mevcut render aynen korunur.
 * Playwright bu ortamda koşamadığı için sözleşme vitest'te sabitlenir.
 *
 * i18n mock'lanır (t → anahtarın kendisi): assert'ler locale metnine değil
 * anahtar + veri (fiyat rakamı, data-* attribute) izlerine bağlanır — çeviri
 * değişince test yalan söylemez.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const bridge = vi.hoisted(() => ({ platform: "web" }));

vi.mock("@capacitor/core", () => ({
  Capacitor: { getPlatform: () => bridge.platform },
}));

// src/i18n — side-effect zinciri (nativeHttp, deepLinks, i18next init) test
// ortamında koşmasın; t anahtarı aynen döndürür (interpolasyon önemsiz).
vi.mock("../../i18n", () => ({
  // `numberLocale` i18n'den `getCurrentLang` okuyor; kısmi mock onu da
  // vermeli, yoksa biçimlendirme çağrısı "export tanımlı değil" ile patlar.
  t: (key: string) => key,
  getCurrentLang: () => "tr",
}));

import { SellPageLayout } from "./SellPageLayout";
import { PricingTable } from "../shared/PricingTable";
import type { PricingPlan, PricingPlansResponse } from "../../services/pricingService";

const IOS_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) istocApp/ios";
const WEB_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15";

// Fiyatlar bilinçli olarak "sınıf adına benzemeyen" ayırt edici rakamlar —
// utility class içindeki sayılarla (py-2.5, z-[60]…) çakışıp yanlış pozitif
// vermesin.
function plan(overrides: Partial<PricingPlan> = {}): PricingPlan {
  return {
    plan_code: "start",
    plan_name: "MEGAPAKET",
    description: null,
    badge_label: null,
    badge_color: "default",
    theme: "default",
    short_tagline: null,
    monthly_price: 4321,
    yearly_price: 43210,
    currency: "EUR",
    commission_rate: 5,
    max_active_listings: 100,
    cta_label: "",
    cta_action: "signup",
    price_override_label: null,
    highlighted: false,
    trial_days: 14,
    features: [],
    ...overrides,
  };
}

const PRICING: PricingPlansResponse = {
  plans: [
    plan(),
    plan({ plan_code: "pro", plan_name: "DEVPAKET", monthly_price: 8765, highlighted: true }),
  ],
  trial_config: { enabled: true, plan_code: "start", days: 14, cta_label: "14 gün ücretsiz dene" },
  meta: { currency: "EUR", updated_at: "2026-09-08" },
};

// Satış yüzeyi izleri — iOS çıktısında HİÇBİRİ bulunmamalı (AC-1).
const SALES_MARKERS = [
  'id="paketler"', // pricing section
  "#paketler", // pricing'e işaret eden çıpa linkleri
  "MEGAPAKET", // paket kartı (plan adı)
  "DEVPAKET",
  "4321", // fiyatlar
  "8765",
  "€",
  "data-trial-plan", // trial CTA node'u
  "ücretsiz dene", // trial CTA metni
  "sellPage.trustTrial", // güven bandındaki deneme hücresi
  "sellPage.stickyFrom", // fiyatlı sticky CTA bar
];

afterEach(() => {
  vi.unstubAllGlobals();
  bridge.platform = "web";
});

describe("SellPageLayout — iOS modu (UA 'istocApp/ios')", () => {
  it("fiyat/paket/trial CTA node'u YOK; bilgi içeriği ve ücretsiz başvuru kalır", () => {
    vi.stubGlobal("navigator", { userAgent: IOS_UA });
    const html = SellPageLayout(PRICING);
    for (const marker of SALES_MARKERS) {
      expect(html, `iOS çıktısına satış yüzeyi sızdı: "${marker}"`).not.toContain(marker);
    }
    // Bilgi içeriği korunur — sayfa boşalmaz (AC-2 ruhu: bilgi-only).
    expect(html).toContain("sellPage.heroTitle");
    expect(html).toContain("sellPage.applyAsSeller");
    // Başvuru ücretsizdir, fiyat içermez — CTA'sı iOS'ta da kalır.
    expect(html).toContain("data-seller-cta");
  });

  it("Capacitor bridge 'ios' (UA işaretsiz) tek başına yeterli", () => {
    bridge.platform = "ios";
    vi.stubGlobal("navigator", { userAgent: WEB_UA });
    const html = SellPageLayout(PRICING);
    for (const marker of SALES_MARKERS) {
      expect(html, `bridge-iOS çıktısına satış yüzeyi sızdı: "${marker}"`).not.toContain(marker);
    }
  });
});

describe("SellPageLayout — web modu (regresyon yok, AC-3)", () => {
  it("pricing section, paket kartları ve trial CTA web modunda render edilir", () => {
    vi.stubGlobal("navigator", { userAgent: WEB_UA });
    const html = SellPageLayout(PRICING);
    expect(html).toContain('id="paketler"');
    expect(html).toContain("MEGAPAKET");
    expect(html).toContain("DEVPAKET");
    expect(html).toContain('data-trial-plan="start"');
    expect(html).toContain("14 gün ücretsiz dene");
    expect(html).toContain("sellPage.trustTrial");
    // Fiyatlı sticky CTA bar (mobil)
    expect(html).toContain("sellPage.stickyFrom");

    // Fiyat rakamı çıktıda olmalı, ama BİÇİMİNDEN bağımsız doğrulanır:
    // ayırıcılar temizlenip aranır. Bu testin sorusu "satış yüzeyi web'de
    // görünüyor mu"; fiyatın hangi biçimde yazıldığı (4321 mi 4.321 mi,
    // varsayılan aylık mı yıllık mı) SellPageLayout.test.ts'in sorusu.
    // Ölçüldü 16 Eyl 2026: biçim 4321 → 4.321 olarak değiştiğinde ve
    // varsayılan dönem yıllığa alındığında bu test kırılmıştı, oysa aynı
    // davranışı SellPageLayout.test.ts zaten doğruluyordu.
    const ayiricisiz = html.replace(/[.,\s]/g, "");
    expect(ayiricisiz).toContain("4321");
    expect(ayiricisiz).toContain("8765");
  });
});

describe("PricingTable — iOS/web modu", () => {
  const props = {
    plans: [{ name: "MEGAPAKET" }, { name: "DEVPAKET", recommended: true }],
    features: [{ label: "API erişimi", values: [false, true] }],
  };

  it("iOS: tablo HİÇ render edilmez (boş string)", () => {
    vi.stubGlobal("navigator", { userAgent: IOS_UA });
    expect(PricingTable(props)).toBe("");
  });

  it("web: tablo plan adları + özellik başlığıyla render edilir", () => {
    vi.stubGlobal("navigator", { userAgent: WEB_UA });
    const html = PricingTable(props);
    expect(html).toContain("common.feature");
    expect(html).toContain("MEGAPAKET");
    expect(html).toContain("DEVPAKET");
    expect(html).toContain("API erişimi");
  });
});
