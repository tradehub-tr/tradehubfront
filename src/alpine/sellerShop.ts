/**
 * Alpine.js store for the dynamic seller shop page.
 * Fetches layout config + seller data, manages product filtering/sorting.
 */
import Alpine from "alpinejs";
import { isLoggedIn, waitForAuth } from "../utils/auth";
import { showLoginModal } from "../components/product/LoginModal";

const API_BASE = (window as any).API_BASE || "/api";

// ─── Mock data for development / preview ─────────────────
const MOCK_SELLER = {
  name: "SELLER-DEMO",
  seller_code: "demo-seller",
  seller_name: "Demo Ambalaj & Kutu San. Tic. Ltd.",
  logo: "https://picsum.photos/seed/logo1/200/200",
  logo_radius: 8,
  header_bg_image: "",
  city: "Istanbul",
  country: "Turkiye",
  business_type: "Uretici",
  staff_count: 150,
  annual_revenue: "$5M+",
  main_markets: "Avrupa, Orta Dogu",
  description: "Ozel tasarim ambalaj ve kutu uretiminde 15 yillik deneyim.",
  email: "info@demoambalaj.com",
  phone: "+90 212 555 0123",
  website: "http://www.demoambalaj.com",
  contact_person: "Mr. Ahmet Yilmaz",
  contact_title: "Satis Muduru",
  founded_year: 2010,
  verified: true,
  rating: 4.8,
  review_count: 127,
  certification_list: ["ISO 9001", "FSC", "CE"],
  advantages: [
    { title: "Hizli Uretim", description: "7 gun icerisinde uretim ve kargo" },
    { title: "Ozel Tasarim", description: "Cizime gore ozel uretim yapilir" },
    { title: "Kalite Garanti", description: "ISO 9001 sertifikali uretim" },
  ],
  gallery_images: [
    { image: "https://picsum.photos/seed/gal1/600/600", caption: "Fabrika" },
    { image: "https://picsum.photos/seed/gal2/600/600", caption: "Uretim" },
    { image: "https://picsum.photos/seed/gal3/600/600", caption: "Depo" },
    { image: "https://picsum.photos/seed/gal4/600/600", caption: "Ofis" },
  ],
};

const MOCK_CATEGORIES = [
  {
    name: "karton-kutular",
    category_name: "Karton Kutular",
    image: "https://picsum.photos/seed/cat1/400/300",
  },
  {
    name: "hediye-kutulari",
    category_name: "Hediye Kutulari",
    image: "https://picsum.photos/seed/cat2/400/300",
  },
  {
    name: "ambalaj-malzemeleri",
    category_name: "Ambalaj Malzemeleri",
    image: "https://picsum.photos/seed/cat3/400/300",
  },
  {
    name: "kagit-cantalar",
    category_name: "Kagit Cantalar",
    image: "https://picsum.photos/seed/cat4/400/300",
  },
];

const MOCK_PRODUCTS = [
  {
    name: "p1",
    product_name: "Ozel Tasarim Cevre Dostu Tisortler icin Karton Kutu",
    image: "https://picsum.photos/seed/prod1/400/400",
    price_min: "7.35",
    price_max: "17.50",
    moq: 100,
    moq_unit: "Adet",
    category: "karton-kutular",
    sold_count: 40,
  },
  {
    name: "p2",
    product_name: "Ozellestirelmis Karton Sapka Ekran Standi",
    image: "https://picsum.photos/seed/prod2/400/400",
    price_min: "6.35",
    price_max: "17.50",
    moq: 100,
    moq_unit: "Adet",
    category: "karton-kutular",
    sold_count: 28,
  },
  {
    name: "p3",
    product_name: "Raf Hazir Kutu Goz Yasi Uzakta Ambalaj Kagidi",
    image: "https://picsum.photos/seed/prod3/400/400",
    price_min: "0.38",
    price_max: "1.02",
    moq: 100,
    moq_unit: "Adet",
    category: "ambalaj-malzemeleri",
    sold_count: 0,
    view_count: 18,
  },
  {
    name: "p4",
    product_name: "Ozel Tasarim Geri Donusturulebilir Kancali Kutu",
    image: "https://picsum.photos/seed/prod4/400/400",
    price_min: "7.35",
    price_max: "17.50",
    moq: 100,
    moq_unit: "Adet",
    category: "karton-kutular",
    sold_count: 62,
  },
  {
    name: "p5",
    product_name: "Tebrik Karti Ozel Baski Karton Hediye Kutusu",
    image: "https://picsum.photos/seed/prod5/400/400",
    price_min: "5.35",
    price_max: "12.00",
    moq: 100,
    moq_unit: "Adet",
    category: "hediye-kutulari",
    sold_count: 15,
  },
  {
    name: "p6",
    product_name: "Luks Kraft Kagit Alisveris Cantasi",
    image: "https://picsum.photos/seed/prod6/400/400",
    price_min: "1.20",
    price_max: "3.50",
    moq: 500,
    moq_unit: "Adet",
    category: "kagit-cantalar",
    sold_count: 88,
  },
  {
    name: "p7",
    product_name: "Kucuk Beyaz Karton Posta Kutusu",
    image: "https://picsum.photos/seed/prod7/400/400",
    price_min: "0.55",
    price_max: "1.80",
    moq: 200,
    moq_unit: "Adet",
    category: "karton-kutular",
    sold_count: 33,
  },
  {
    name: "p8",
    product_name: "Cevre Dostu Geri Donusum Ambalaj Dolgusu",
    image: "https://picsum.photos/seed/prod8/400/400",
    price_min: "0.10",
    price_max: "0.45",
    moq: 1000,
    moq_unit: "Adet",
    category: "ambalaj-malzemeleri",
    sold_count: 120,
  },
];

const DEFAULT_SECTIONS = [
  {
    type: "hero_banner",
    order: 1,
    enabled: true,
    settings: { mode: "slider", autoplay: true, delay: 5000 },
  },
  { type: "category_grid", order: 2, enabled: true, settings: { columns: 4, bgColor: "" } },
  { type: "hot_products", order: 3, enabled: true, settings: { title: "", bgColor: "", count: 8 } },
  {
    type: "category_listing",
    order: 4,
    enabled: true,
    settings: { showSort: true, viewModes: ["grid", "list"], columns: 4 },
  },
];

const SECTION_LABELS: Record<string, string> = {
  hero_banner: "Banner",
  category_grid: "Kategoriler",
  hot_products: "Populer Urunler",
  category_listing: "Urunler",
  company_info: "Sirket Bilgisi",
  certificates: "Sertifikalar",
  why_choose_us: "Neden Bizi Secmelisiniz",
  gallery: "Galeri",
  company_introduction: "Sirket Tanitimi",
  contact_form: "Iletisim",
};

Alpine.data("sellerShop", () => ({
  // State
  loading: true,
  sellerCode: "",
  seller: null as Record<string, any> | null,
  layout: { sections: DEFAULT_SECTIONS, theme: {} } as {
    sections: any[];
    theme: Record<string, any>;
  },
  categories: [] as any[],
  products: [] as any[],
  filteredProducts: [] as any[],
  activeCategory: "",
  activeCategoryType: "" as string, // "" | "seller" | "platform"
  activeCategoryName: "",
  sortBy: "default",
  viewMode: "grid",
  activePage: "home" as string, // 'home' | 'products' | 'profile' | 'contacts'
  inquiryMessage: "",
  showInquiryModal: false,
  isLoggedIn: false as boolean,

  async init() {
    this.sellerCode = new URLSearchParams(window.location.search).get("seller") || "";

    // Auth: contact bilgileri login kullanıcıya gösterilir
    waitForAuth()
      .then(() => {
        this.isLoggedIn = isLoggedIn();
      })
      .catch(() => {
        this.isLoggedIn = false;
      });
    // Login modal kapandıktan sonra tekrar kontrol (başarılı giriş senaryosu)
    window.addEventListener("login-success", () => {
      this.isLoggedIn = isLoggedIn();
    });

    // sellerCode varsa API'den cek, yoksa veya basarisizsa mock data kullan
    if (this.sellerCode) {
      try {
        const [sellerRes, layoutRes, catRes, prodRes] = await Promise.all([
          fetch(`${API_BASE}/method/tradehub_core.api.seller.get_seller?slug=${this.sellerCode}`, {
            credentials: "omit",
          }).then((r) => r.json()),
          fetch(
            `${API_BASE}/method/tradehub_core.api.seller.get_storefront_layout?seller_code=${this.sellerCode}`,
            { credentials: "omit" }
          )
            .then((r) => r.json())
            .catch(() => null),
          fetch(
            `${API_BASE}/method/tradehub_core.api.seller.get_seller_categories?seller_code=${this.sellerCode}`,
            { credentials: "omit" }
          )
            .then((r) => r.json())
            .catch(() => ({ message: [] })),
          fetch(
            `${API_BASE}/method/tradehub_core.api.seller.get_seller_products?seller_code=${this.sellerCode}&page_size=50`,
            { credentials: "omit" }
          )
            .then((r) => r.json())
            .catch(() => ({ message: { products: [] } })),
        ]);

        this.seller = sellerRes?.message || null;
        this.categories = catRes?.message?.categories || catRes?.message || [];
        this.products = prodRes?.message?.products || [];

        if (layoutRes?.message) {
          this.layout = {
            sections: layoutRes.message.sections || DEFAULT_SECTIONS,
            theme: layoutRes.message.theme || {},
          };
        }
      } catch (e) {
        console.error("Seller shop API error, falling back to mock:", e);
        this._loadMockData();
      }
    }

    // API sonrasi seller hala null ise mock data yukle
    if (!this.seller) {
      this._loadMockData();
    }

    this.filteredProducts = [...this.products];
    this.applyTheme();
    // URL hash'ten aktif sayfayı oku (#products, #profile, #contacts)
    const VALID_PAGES = new Set(["home", "products", "profile", "contacts"]);
    const hash = window.location.hash.replace("#", "");
    if (hash && VALID_PAGES.has(hash)) {
      this.activePage = hash;
    }
    this.loading = false;
  },

  _loadMockData() {
    this.seller = { ...MOCK_SELLER };
    this.sellerCode = MOCK_SELLER.seller_code;
    this.categories = [...MOCK_CATEGORIES];
    this.products = [...MOCK_PRODUCTS];
    this.layout = {
      sections: DEFAULT_SECTIONS,
      theme: {
        primaryColor: "#1e3a5f",
        accentColor: "#cc9900",
        navBgColor: "#1f1f1f",
        navTextColor: "#ffffff",
      },
    };
  },

  switchPage(page: string) {
    this.activePage = page;
    window.location.hash = page === "home" ? "" : page;
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (page === "products" && !this.activeCategory) {
      this.filteredProducts = [...this.products];
    }
  },

  applyTheme() {
    const theme = this.layout.theme;
    if (!theme) return;
    const root = document.documentElement;
    if (theme.primaryColor) root.style.setProperty("--store-nav-bg", theme.primaryColor);
    if (theme.accentColor) root.style.setProperty("--store-accent", theme.accentColor);
    if (theme.navTextColor) root.style.setProperty("--store-nav-text", theme.navTextColor);
  },

  sectionTitle(type: string): string {
    const section = this.layout.sections.find((s: any) => s.type === type);
    return section?.settings?.title || SECTION_LABELS[type] || "";
  },

  filterByCategory(categoryName: string, categoryType: string = "seller") {
    if (this.activeCategory === categoryName && this.activeCategoryType === categoryType) {
      this.activeCategory = "";
      this.activeCategoryType = "";
      this.activeCategoryName = "";
      this.filteredProducts = [...this.products];
    } else {
      this.activeCategory = categoryName;
      this.activeCategoryType = categoryType;
      const cat = this.categories.find(
        (c: any) => c.name === categoryName && (c.type || "seller") === categoryType
      ) as any;
      this.activeCategoryName = cat?.category_name || categoryName;
      this.filteredProducts = this.products.filter((p: any) => {
        if (categoryType === "platform") {
          return (
            p.product_category === categoryName || p.product_category_name === categoryName
          );
        }
        return p.category === categoryName || p.category_name === categoryName;
      });
    }
  },

  sortProducts() {
    const sorted = [...this.filteredProducts];
    switch (this.sortBy) {
      case "price_asc":
        sorted.sort(
          (a: any, b: any) => parseFloat(a.price_min || "0") - parseFloat(b.price_min || "0")
        );
        break;
      case "price_desc":
        sorted.sort(
          (a: any, b: any) => parseFloat(b.price_min || "0") - parseFloat(a.price_min || "0")
        );
        break;
      case "newest":
        sorted.sort((a: any, b: any) => (b.creation || "").localeCompare(a.creation || ""));
        break;
      case "best_selling":
        sorted.sort((a: any, b: any) => (b.sold_count || 0) - (a.sold_count || 0));
        break;
    }
    this.filteredProducts = sorted;
  },

  formatPrice(p: any): string {
    if (!p.price_min) return "";
    const min = parseFloat(p.price_min);
    const max = p.price_max ? parseFloat(p.price_max) : 0;
    const cur = (p as any).currency || "TRY";
    if (max > min && (window as any).csFormatPriceRange)
      return (window as any).csFormatPriceRange(min, max, cur);
    if ((window as any).csFormatPrice) return (window as any).csFormatPrice(min, cur);
    return `₺${min.toFixed(2)}`;
  },

  requireLogin() {
    if (this.isLoggedIn) return true;
    showLoginModal();
    return false;
  },

  async submitShopInquiry() {
    if (!this.inquiryMessage.trim() || !this.sellerCode) return;
    try {
      const res = await fetch(`${API_BASE}/method/tradehub_core.api.seller.send_inquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seller_code: this.sellerCode,
          message: this.inquiryMessage.trim(),
        }),
      });
      if (res.ok) {
        this.inquiryMessage = "";
        alert("Mesajiniz gonderildi!");
      }
    } catch (e) {
      console.error("Inquiry error:", e);
    }
  },
}));
