/**
 * Statik sayfa pretty URL helper (Faz 4c).
 *
 * Backend STATIC_PAGES_REGISTRY ile uyumlu key→path haritası.
 * Yeni statik sayfa eklenirse hem backend
 * (tradehub_core/seo/static_pages_registry.py) hem de buraya entry ekle.
 *
 * Multi-language: lang='en' verilirse /en<path> (Faz 7 path prefix).
 */

const STATIC_PAGE_PATHS: Record<string, string> = {
  home: "/",
  products: "/urunler",
  categories: "/kategoriler",
  manufacturers: "/ureticiler",
  cart: "/sepet",
  login: "/giris",
  register: "/kayit",
  "forgot-password": "/sifremi-unuttum",
  "reset-password": "/sifre-sifirla",
  "accept-invite": "/davet-kabul",
  "help-center": "/yardim-merkezi",
  faq: "/sss",
  "after-sales": "/satis-sonrasi",
  payments: "/odeme-secenekleri",
  "refund-policy": "/iade-politikasi",
  "shipping-logistics": "/kargo-lojistik",
  "trade-assurance": "/ticaret-guvencesi",
  "trade-assurance-detail": "/ticaret-guvencesi/detay",
  accessibility: "/erisilebilirlik",
  cookies: "/cerezler",
  "distance-sales": "/mesafeli-satis",
  ip: "/fikri-mulkiyet",
  kvkk: "/kvkk",
  notice: "/yasal-uyari",
  privacy: "/gizlilik",
  "product-listing": "/urun-listeleme-kurallari",
  returns: "/iade-kosullari",
  terms: "/kullanim-kosullari",
  sell: "/satici-ol",
  "sell-pricing": "/satici/fiyatlandirma",
  checkout: "/odeme",
  "top-deals": "/firsatlar",
  "top-ranking": "/cok-satanlar",
  "top-ranking-category": "/cok-satanlar/kategori",
  "tailored-selections": "/size-ozel",
};

export function getStaticPageUrl(key: string, lang: "tr" | "en" = "tr"): string {
  const path = STATIC_PAGE_PATHS[key];
  if (!path) return "#";
  if (lang === "en" && path !== "/") return `/en${path}`;
  if (lang === "en" && path === "/") return "/en";
  return path;
}

/**
 * Türkçe pretty URL path → dist içindeki HTML dosya yolu.
 *
 * static_pages_registry.py STATIC_PAGES listesi ile **senkron** tutulmalı —
 * Vite dev plugin ve production nginx rewrite bu mapping'ten besleniyor,
 * backend page_resolver da aynı path'leri tanır.
 *
 * Bir path buraya eklendiğinde:
 * 1. tradehub_core/seo/static_pages_registry.py'a entry eklenir
 * 2. Yeni HTML dosyası `tradehubfront/pages/...` altında olmalı
 * 3. nginx.conf.template'teki `map $uri $static_page_html` bloğu güncellenir
 *    (production), Vite plugin otomatik bu map'i kullanır (dev)
 */
const STATIC_PAGE_HTML_MAP: Record<string, string> = {
  "/": "/index.html",

  // Ana + listing
  "/urunler": "/pages/products.html",
  "/kategoriler": "/pages/categories.html",
  "/ureticiler": "/pages/manufacturers.html",
  "/sepet": "/pages/cart.html",

  // Auth
  "/giris": "/pages/auth/login.html",
  "/kayit": "/pages/auth/register.html",
  "/sifremi-unuttum": "/pages/auth/forgot-password.html",
  "/sifre-sifirla": "/pages/auth/reset-password.html",
  "/davet-kabul": "/pages/auth/accept-invite.html",

  // Yardım
  "/yardim-merkezi": "/pages/help/help-center.html",
  "/sss": "/pages/help/faq.html",
  "/sss/detay": "/pages/help/faq-detail.html",
  "/destek/yeni": "/pages/help/help-ticket-new.html",
  "/destek/taleplerim": "/pages/help/help-tickets.html",
  "/destek/talep": "/pages/help/help-ticket.html",

  // Bilgi
  "/satis-sonrasi": "/pages/info/after-sales.html",
  "/odeme-secenekleri": "/pages/info/payments.html",
  "/iade-politikasi": "/pages/info/refund-policy.html",
  "/kargo-lojistik": "/pages/info/shipping-logistics.html",
  "/ticaret-guvencesi/detay": "/pages/info/trade-assurance-detail.html",

  // Hukuki
  "/erisilebilirlik": "/pages/legal/accessibility.html",
  "/cerezler": "/pages/legal/cookies.html",
  "/mesafeli-satis": "/pages/legal/distance-sales.html",
  "/fikri-mulkiyet": "/pages/legal/ip.html",
  "/kvkk": "/pages/legal/kvkk.html",
  "/yasal-uyari": "/pages/legal/notice.html",
  "/gizlilik": "/pages/legal/privacy.html",
  "/urun-listeleme-kurallari": "/pages/legal/product-listing.html",
  "/iade-kosullari": "/pages/legal/returns.html",
  "/kullanim-kosullari": "/pages/legal/terms.html",

  // Dashboard
  "/hesabim": "/pages/dashboard/buyer-dashboard.html",
  "/hesabim/adresler": "/pages/dashboard/addresses.html",
  "/hesabim/kisiler": "/pages/dashboard/contacts.html",
  "/hesabim/favoriler": "/pages/dashboard/favorites.html",
  "/hesabim/sorularim": "/pages/dashboard/inquiries.html",
  "/hesabim/kyb": "/pages/dashboard/kyb.html",
  "/hesabim/mesajlar": "/pages/dashboard/messages.html",
  "/hesabim/siparisler": "/pages/dashboard/orders.html",
  "/hesabim/odeme": "/pages/dashboard/payment.html",
  "/hesabim/profil": "/pages/dashboard/profile.html",
  "/hesabim/rfq": "/pages/dashboard/rfq.html",
  "/hesabim/rfq/yeni": "/pages/dashboard/rfq-form.html",
  "/hesabim/rfq/teklifler": "/pages/dashboard/rfq-quotes.html",
  "/hesabim/ayarlar": "/pages/dashboard/settings.html",

  // Order
  "/odeme": "/pages/order/checkout.html",
  "/odeme/basarili": "/pages/order/order-success.html",
  "/odeme/basarisiz": "/pages/order/payment-failed.html",
  "/odeme/isleniyor": "/pages/order/payment-processing.html",

  // Seller
  "/satici-ol": "/pages/seller/sell.html",
  "/satici/fiyatlandirma": "/pages/seller/sell-pricing.html",
  "/satici/dashboard": "/pages/seller/dashboard.html",
  "/satici/basvuru-bekleyen": "/pages/seller/application-pending.html",
  "/satici/tedarikci-kurulum": "/pages/seller/supplier-setup.html",
  "/satici/vitrin": "/pages/seller/seller-storefront.html",

  // Top + Special
  "/firsatlar": "/pages/top-deals.html",
  "/cok-satanlar": "/pages/top-ranking.html",
  "/cok-satanlar/kategori": "/pages/top-ranking-category.html",
  "/size-ozel": "/pages/tailored-selections.html",
  "/ticaret-guvencesi": "/pages/trade-assurance.html",
};

/**
 * Türkçe pretty URL'i (örn. `/ureticiler`) dist içindeki HTML dosya yoluna
 * (örn. `/pages/manufacturers.html`) çevirir. Eşleşme yoksa `undefined`.
 *
 * Vite dev plugin'i ve build sonrası nginx rewrite zinciri bu fonksiyonu
 * kullanır — backend page_resolver ile mapping eşitliği zorunludur.
 */
export function getStaticPageHtmlPath(urlPath: string): string | undefined {
  return STATIC_PAGE_HTML_MAP[urlPath];
}

/** Tüm Türkçe statik path → HTML mapping (build-time tüketiciler için). */
export function getStaticPageHtmlMap(): Readonly<Record<string, string>> {
  return STATIC_PAGE_HTML_MAP;
}
