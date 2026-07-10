/**
 * Category Showcase Service
 * - localStorage cache ile FOUC'suz başlangıç
 * - Stale-while-revalidate: TTL aşılsa da cache döner, arka planda yeni veri çekilir
 * - headerNoticeService.ts deseninin ikizi
 */

const CACHE_KEY = "tradehub-category-showcase-v1";
const CACHE_TTL_MS = 60_000;

export type ShowcaseTileType = "category" | "promo";

export interface ShowcaseTile {
  name: string;
  tile_type: ShowcaseTileType;
  col_span: number;
  row_span: number;
  sort_order: number;
  label_tr: string;
  label_en: string;
  image: string;
  link_href: string;
  hover_text_tr: string;
  hover_text_en: string;
  promo_badge_tr: string;
  promo_badge_en: string;
  promo_title_tr: string;
  promo_title_en: string;
  background_color: string;
  cta_text_tr: string;
  cta_text_en: string;
  cta_href: string;
}

export interface ShowcaseData {
  enabled: boolean;
  section_title: { tr: string; en: string };
  columns: number;
  tiles: ShowcaseTile[];
}

interface CacheShape {
  ts: number;
  data: ShowcaseData;
}

const EMPTY: ShowcaseData = {
  enabled: false,
  section_title: { tr: "", en: "" },
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
  hover_text_tr: "",
  hover_text_en: "",
  promo_badge_tr: "",
  promo_badge_en: "",
  promo_title_tr: "",
  promo_title_en: "",
  background_color: "",
  cta_text_tr: "",
  cta_text_en: "",
  cta_href: "",
};

const MOCK_SHOWCASE: ShowcaseData = {
  enabled: true,
  section_title: { tr: "Kategorileri keşfet", en: "Explore categories" },
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
      label_en: "Textile & Apparel",
      hover_text_tr: "Toptan giyim, kumaş ve konfeksiyon",
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
      label_en: "Electronics & Accessories",
      hover_text_tr: "Telefon aksesuarı, kulaklık ve küçük elektronik",
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
      label_en: "Footwear & Leather",
      hover_text_tr: "Ayakkabı, çanta ve deri ürünleri",
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
      label_en: "Cosmetics & Personal Care",
      hover_text_tr: "Toptan kozmetik ve bakım ürünleri",
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
      label_en: "Home & Kitchen",
      hover_text_tr: "Züccaciye, mutfak ve ev gereçleri",
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
      label_en: "Hardware & Tools",
      hover_text_tr: "El aletleri ve yapı malzemeleri",
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
      label_en: "Stationery & Office",
      hover_text_tr: "Okul, ofis ve kırtasiye ürünleri",
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
      promo_badge_en: "Trade Assurance",
      promo_title_tr: "Güvenli ödeme, teslimat garantisi",
      promo_title_en: "Secure payment, guaranteed delivery",
      background_color: "#0a0a0a",
      cta_text_tr: "Nasıl çalışır?",
      cta_text_en: "How it works?",
      cta_href: "/pages/info/trade-assurance-detail.html",
    },
  ],
};

function isMockEnabled(): boolean {
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
        tr: m.section_title?.tr ?? "",
        en: m.section_title?.en ?? "",
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
