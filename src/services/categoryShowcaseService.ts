/**
 * Category Showcase Service
 * - localStorage cache ile FOUC'suz başlangıç
 * - Stale-while-revalidate: TTL aşılsa da cache döner, arka planda yeni veri çekilir
 * - headerNoticeService.ts deseninin ikizi
 */

const CACHE_KEY = "tradehub-category-showcase-v1";
const CACHE_TTL_MS = 60_000;

export type ShowcaseTileType = "category" | "promo";

/**
 * Vitrin metinlerinin dilleri — TEK KAYNAK, backend `category_showcase.DILLER`
 * ile birebir.
 *
 * 2026-09-21: `ar` ve `ru` eklendi. Ölçüldü (17 Eyl, alpha'da gerçek Suudi
 * IP'siyle): sayfa Arapça ve RTL açılıyordu ama vitrin bölümü Türkçe kalıyordu
 * ("Kategorileri keşfet", "Tüm kategoriler"). Kusur çeviri hattında değil
 * ŞEMADAYDI — bu yükte `_ar`/`_ru` alanı hiç yoktu.
 * Kanıt: `docs/ulke-turu-kanit/alpha/01-SA-anasayfa.png`.
 */
export const SHOWCASE_LANGS = ["tr", "en", "ar", "ru"] as const;
export type ShowcaseLang = (typeof SHOWCASE_LANGS)[number];

/** Kutu başına çevrilebilir alan kökleri — her biri `<kok>_<dil>` taşır. */
export const CEVRILEBILIR_KOKLER = [
  "label",
  "hover_text",
  "promo_badge",
  "promo_title",
  "cta_text",
] as const;
export type CevrilebilirKok = (typeof CEVRILEBILIR_KOKLER)[number];

/** `label_tr` … `cta_text_ru` — 5 kök × 4 dil = 20 alan, elle yazılmaz. */
export type DilliTileAlanlari = { [K in `${CevrilebilirKok}_${ShowcaseLang}`]: string };

export interface ShowcaseTile extends DilliTileAlanlari {
  name: string;
  tile_type: ShowcaseTileType;
  col_span: number;
  row_span: number;
  sort_order: number;
  image: string;
  link_href: string;
  background_color: string;
  cta_href: string;
}

export interface ShowcaseData {
  enabled: boolean;
  section_title: Record<ShowcaseLang, string>;
  columns: number;
  tiles: ShowcaseTile[];
}

/** Her dil için boş dize — eksik dil `undefined` yerine "" olsun. */
function bosBaslik(): Record<ShowcaseLang, string> {
  return Object.fromEntries(SHOWCASE_LANGS.map((d) => [d, ""])) as Record<ShowcaseLang, string>;
}

interface CacheShape {
  ts: number;
  data: ShowcaseData;
}

const EMPTY: ShowcaseData = {
  enabled: false,
  section_title: bosBaslik(),
  columns: 4,
  tiles: [],
};

// ── DEV mock ──────────────────────────────────────────────────────────────
// Admin'de tile içeriği girilmeden bento grid'in gerçek görsellerle nasıl
// göründüğünü test etmek için (socialProofService ?mock_sp deseninin ikizi).
//
//   URL:           ?mock_cs=1  → tek sayfa için mock
//   localStorage:  dev_mock_category_showcase = "1"  → kalıcı (sekmeler arası)
//
// Production'da kullanıcı flag açmaz, hiçbir etki yapmaz.
const MOCK_TILE_DEFAULTS = {
  ...(Object.fromEntries(
    CEVRILEBILIR_KOKLER.flatMap((kok) => SHOWCASE_LANGS.map((dil) => [`${kok}_${dil}`, ""]))
  ) as DilliTileAlanlari),
  background_color: "",
  cta_href: "",
};

const MOCK_SHOWCASE: ShowcaseData = {
  enabled: true,
  section_title: {
    tr: "Kategorileri keşfet",
    en: "Explore categories",
    ar: "استكشف الفئات",
    ru: "Изучите категории",
  },
  columns: 4,
  tiles: [
    {
      ...MOCK_TILE_DEFAULTS,
      name: "mock-tekstil",
      tile_type: "category",
      col_span: 2,
      row_span: 2,
      sort_order: 1,
      label_tr: "Tekstil ve Giyim",
      label_ar: "المنسوجات والملابس",
      label_ru: "Текстиль и одежда",
      label_en: "Textile & Apparel",
      hover_text_tr: "Toptan giyim, kumaş ve konfeksiyon",
      hover_text_ar: "ملابس وأقمشة ومنسوجات بالجملة",
      hover_text_ru: "Оптом одежда, ткани и трикотаж",
      hover_text_en: "Wholesale apparel, fabric and garments",
      image:
        "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1200&q=70",
      link_href: "/pages/categories.html?cat=tekstil-giyim",
    },
    {
      ...MOCK_TILE_DEFAULTS,
      name: "mock-elektronik",
      tile_type: "category",
      col_span: 2,
      row_span: 1,
      sort_order: 2,
      label_tr: "Elektronik ve Aksesuar",
      label_ar: "الإلكترونيات والإكسسوارات",
      label_ru: "Электроника и аксессуары",
      label_en: "Electronics & Accessories",
      hover_text_tr: "Telefon aksesuarı, kulaklık ve küçük elektronik",
      hover_text_ar: "إكسسوارات الهاتف وسماعات وإلكترونيات صغيرة",
      hover_text_ru: "Аксессуары для телефонов, наушники и мелкая электроника",
      hover_text_en: "Phone accessories, headphones and gadgets",
      image:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=70",
      link_href: "/pages/categories.html?cat=elektronik",
    },
    {
      ...MOCK_TILE_DEFAULTS,
      name: "mock-ayakkabi",
      tile_type: "category",
      col_span: 1,
      row_span: 1,
      sort_order: 3,
      label_tr: "Ayakkabı ve Deri",
      label_ar: "الأحذية والجلود",
      label_ru: "Обувь и изделия из кожи",
      label_en: "Footwear & Leather",
      hover_text_tr: "Ayakkabı, çanta ve deri ürünleri",
      hover_text_ar: "أحذية وحقائب ومنتجات جلدية",
      hover_text_ru: "Обувь, сумки и изделия из кожи",
      hover_text_en: "Shoes, bags and leather goods",
      image:
        "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=70",
      link_href: "/pages/categories.html?cat=ayakkabi-deri",
    },
    {
      ...MOCK_TILE_DEFAULTS,
      name: "mock-kozmetik",
      tile_type: "category",
      col_span: 1,
      row_span: 1,
      sort_order: 4,
      label_tr: "Kozmetik ve Kişisel Bakım",
      label_ar: "مستحضرات التجميل والعناية الشخصية",
      label_ru: "Косметика и личная гигиена",
      label_en: "Cosmetics & Personal Care",
      hover_text_tr: "Toptan kozmetik ve bakım ürünleri",
      hover_text_ar: "مستحضرات تجميل وعناية بالجملة",
      hover_text_ru: "Оптом косметика и средства ухода",
      hover_text_en: "Wholesale cosmetics and care products",
      image:
        "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=70",
      link_href: "/pages/categories.html?cat=kozmetik",
    },
    {
      ...MOCK_TILE_DEFAULTS,
      name: "mock-ev-mutfak",
      tile_type: "category",
      col_span: 1,
      row_span: 1,
      sort_order: 5,
      label_tr: "Ev ve Mutfak",
      label_ar: "المنزل والمطبخ",
      label_ru: "Дом и кухня",
      label_en: "Home & Kitchen",
      hover_text_tr: "Züccaciye, mutfak ve ev gereçleri",
      hover_text_ar: "أدوات زجاجية ومستلزمات المطبخ والمنزل",
      hover_text_ru: "Посуда, кухонные и хозяйственные товары",
      hover_text_en: "Glassware, kitchen and homeware",
      image:
        "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=800&q=70",
      link_href: "/pages/categories.html?cat=ev-mutfak",
    },
    {
      ...MOCK_TILE_DEFAULTS,
      name: "mock-hirdavat",
      tile_type: "category",
      col_span: 1,
      row_span: 1,
      sort_order: 6,
      label_tr: "Hırdavat ve Yapı Market",
      label_ar: "الأدوات ومواد البناء",
      label_ru: "Инструменты и стройматериалы",
      label_en: "Hardware & Tools",
      hover_text_tr: "El aletleri ve yapı malzemeleri",
      hover_text_ar: "عدد يدوية ومواد بناء",
      hover_text_ru: "Ручной инструмент и стройматериалы",
      hover_text_en: "Hand tools and building supplies",
      image:
        "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=70",
      link_href: "/pages/categories.html?cat=hirdavat",
    },
    {
      ...MOCK_TILE_DEFAULTS,
      name: "mock-kirtasiye",
      tile_type: "category",
      col_span: 1,
      row_span: 1,
      sort_order: 7,
      label_tr: "Kırtasiye ve Ofis",
      label_ar: "القرطاسية والمكتب",
      label_ru: "Канцтовары и офис",
      label_en: "Stationery & Office",
      hover_text_tr: "Okul, ofis ve kırtasiye ürünleri",
      hover_text_ar: "مستلزمات المدرسة والمكتب والقرطاسية",
      hover_text_ru: "Школьные, офисные и канцелярские товары",
      hover_text_en: "School, office and stationery supplies",
      image:
        "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=800&q=70",
      link_href: "/pages/categories.html?cat=kirtasiye",
    },
    {
      ...MOCK_TILE_DEFAULTS,
      name: "mock-promo-guvence",
      tile_type: "promo",
      col_span: 1,
      row_span: 1,
      sort_order: 8,
      label_tr: "",
      label_en: "",
      image: "",
      link_href: "",
      promo_badge_tr: "Ticaret Güvencesi",
      promo_badge_ar: "ضمان التجارة",
      promo_badge_ru: "Торговая гарантия",
      promo_badge_en: "Trade Assurance",
      promo_title_tr: "Güvenli ödeme, teslimat garantisi",
      promo_title_ar: "دفع آمن وضمان التسليم",
      promo_title_ru: "Безопасная оплата, гарантия доставки",
      promo_title_en: "Secure payment, guaranteed delivery",
      background_color: "#0a0a0a",
      cta_text_tr: "Nasıl çalışır?",
      cta_text_ar: "كيف يعمل؟",
      cta_text_ru: "Как это работает?",
      cta_text_en: "How it works?",
      cta_href: "/pages/info/trade-assurance-detail.html",
    },
  ],
};

function isMockEnabled(): boolean {
  // F-033: Production'da mock modları devre dışı
  if (!import.meta.env.DEV) return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mock_cs") === "1") return true;
    return localStorage.getItem("dev_mock_category_showcase") === "1";
  } catch {
    return false;
  }
}

export function getCachedShowcase(): ShowcaseData {
  if (isMockEnabled()) return MOCK_SHOWCASE;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as CacheShape;
    if (!parsed || !Array.isArray(parsed.data?.tiles)) return EMPTY;
    return parsed.data;
  } catch {
    return EMPTY;
  }
}

export async function fetchActiveShowcase(): Promise<ShowcaseData> {
  if (isMockEnabled()) return MOCK_SHOWCASE;
  try {
    const res = await fetch("/api/method/tradehub_core.api.category_showcase.get_active_tiles", {
      credentials: "include",
    });
    if (!res.ok) return getCachedShowcase();
    const json = (await res.json()) as { message?: Partial<ShowcaseData> };
    const m = json?.message ?? {};
    const data: ShowcaseData = {
      enabled: Boolean(m.enabled),
      section_title: {
        ...bosBaslik(),
        ...(m.section_title ?? {}),
      },
      columns: m.columns ?? 4,
      tiles: Array.isArray(m.tiles) ? m.tiles : [],
    };
    const payload: CacheShape = { ts: Date.now(), data };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    return data;
  } catch (err) {
    console.warn("[CategoryShowcase] fetch failed", err);
    return getCachedShowcase();
  }
}

export function isCacheFresh(): boolean {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as CacheShape;
    return Date.now() - parsed.ts < CACHE_TTL_MS;
  } catch {
    return false;
  }
}
