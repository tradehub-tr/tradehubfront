export type StorefrontAuthProfile = "public" | "buyer" | "seller";
export type StorefrontRouteCluster =
  | "C00-home"
  | "C01-public-shell"
  | "C02-catalog"
  | "C03-detail"
  | "C04-auth"
  | "C05-account"
  | "C06-rfq"
  | "C07-checkout"
  | "C08-help-legal"
  | "C09-seller"
  | "C10-merchandising"
  | "C11-status";

export interface StorefrontRouteVariant {
  kind: "pretty" | "legacy";
  path?: `/${string}`;
  pathEnv?: string;
}

export interface StorefrontRouteCase {
  id: string;
  cluster: StorefrontRouteCluster;
  entry: string;
  auth: StorefrontAuthProfile;
  readySelector: string;
  variants: StorefrontRouteVariant[];
}

export const STOREFRONT_VIEWPORTS = {
  desktop: { width: 1440, height: 1000 },
  mobile: { width: 390, height: 844 },
} as const;

function route(
  id: string,
  cluster: StorefrontRouteCluster,
  entry: string,
  prettyPath: `/${string}` | null,
  auth: StorefrontAuthProfile = "public",
  extraVariants: StorefrontRouteVariant[] = []
): StorefrontRouteCase {
  return {
    id,
    cluster,
    entry,
    auth,
    readySelector: "body",
    variants: [
      ...(prettyPath ? [{ kind: "pretty" as const, path: prettyPath }] : []),
      ...extraVariants,
      { kind: "legacy", path: `/${entry}` },
    ],
  };
}

export const STOREFRONT_ROUTE_MATRIX: StorefrontRouteCase[] = [
  route("home", "C00-home", "index.html", "/"),
  route("not-found", "C01-public-shell", "404.html", "/__perf-missing-route__"),

  route("auth-accept-invite", "C04-auth", "pages/auth/accept-invite.html", "/davet-kabul"),
  route("auth-forgot-password", "C04-auth", "pages/auth/forgot-password.html", "/sifremi-unuttum"),
  route("auth-login", "C04-auth", "pages/auth/login.html", "/giris"),
  route("auth-register", "C04-auth", "pages/auth/register.html", "/kayit"),
  route("auth-reset-password", "C04-auth", "pages/auth/reset-password.html", "/sifre-sifirla"),

  route("brand-detail", "C03-detail", "pages/brand.html", null, "public", [
    { kind: "pretty", pathEnv: "PERF_BRAND_PRETTY_PATH" },
  ]),
  route("cart", "C07-checkout", "pages/cart.html", "/sepet", "buyer"),
  route("categories", "C02-catalog", "pages/categories.html", "/kategoriler", "public", [
    { kind: "pretty", pathEnv: "PERF_CATEGORY_PRETTY_PATH" },
  ]),

  // 12-FE ve 15-FE ile gelen sayfalar. `prettyPath` YOK — bu altısının
  // `nginx.conf.template`'te güzel adres eşlemesi hiç tanımlanmamış, yalnız
  // `/pages/...html` ile açılıyorlar. Matris gerçeği yansıtıyor; eşleme
  // eklendiğinde buraya da pretty variant girer.
  route(
    "account-notification-preferences",
    "C05-account",
    "pages/dashboard/notification-preferences.html",
    null,
    "buyer"
  ),
  route(
    "account-return-request",
    "C05-account",
    "pages/dashboard/return-request.html",
    null,
    "buyer"
  ),
  route("account-returns", "C05-account", "pages/dashboard/returns.html", null, "buyer"),
  route(
    "account-shipment-tracking",
    "C05-account",
    "pages/dashboard/shipment-tracking.html",
    null,
    "buyer"
  ),

  route(
    "account-addresses",
    "C05-account",
    "pages/dashboard/addresses.html",
    "/hesabim/adresler",
    "buyer"
  ),
  route(
    "account-dashboard",
    "C05-account",
    "pages/dashboard/buyer-dashboard.html",
    "/hesabim",
    "buyer"
  ),
  route(
    "account-contacts",
    "C05-account",
    "pages/dashboard/contacts.html",
    "/hesabim/kisiler",
    "buyer"
  ),
  route(
    "account-favorites",
    "C05-account",
    "pages/dashboard/favorites.html",
    "/hesabim/favoriler",
    "buyer"
  ),
  route(
    "account-inquiries",
    "C05-account",
    "pages/dashboard/inquiries.html",
    "/hesabim/sorularim",
    "buyer"
  ),
  route("account-kyb", "C05-account", "pages/dashboard/kyb.html", "/hesabim/kyb", "buyer"),
  route(
    "account-kyc",
    "C05-account",
    "pages/dashboard/kyc.html",
    "/pages/dashboard/kyc.html",
    "buyer"
  ),
  route(
    "account-messages",
    "C05-account",
    "pages/dashboard/messages.html",
    "/hesabim/mesajlar",
    "buyer"
  ),
  route(
    "account-orders",
    "C05-account",
    "pages/dashboard/orders.html",
    "/hesabim/siparisler",
    "buyer"
  ),
  route(
    "account-payment",
    "C05-account",
    "pages/dashboard/payment.html",
    "/hesabim/odeme",
    "buyer"
  ),
  route(
    "account-profile",
    "C05-account",
    "pages/dashboard/profile.html",
    "/hesabim/profil",
    "buyer"
  ),
  route("rfq-form", "C06-rfq", "pages/dashboard/rfq-form.html", "/hesabim/rfq/yeni", "buyer"),
  route(
    "rfq-quotes",
    "C06-rfq",
    "pages/dashboard/rfq-quotes.html",
    "/hesabim/rfq/teklifler",
    "buyer"
  ),
  route(
    "rfq-success",
    "C11-status",
    "pages/dashboard/rfq-success.html",
    "/pages/dashboard/rfq-success.html",
    "buyer"
  ),
  route("rfq-list", "C06-rfq", "pages/dashboard/rfq.html", "/hesabim/rfq", "buyer"),
  route(
    "account-settings",
    "C05-account",
    "pages/dashboard/settings.html",
    "/hesabim/ayarlar",
    "buyer"
  ),

  route("faq-detail", "C08-help-legal", "pages/help/faq-detail.html", "/sss/detay"),
  route("faq", "C08-help-legal", "pages/help/faq.html", "/sss"),
  route("help-center", "C08-help-legal", "pages/help/help-center.html", "/yardim-merkezi"),
  route(
    "help-ticket-new",
    "C08-help-legal",
    "pages/help/help-ticket-new.html",
    "/destek/yeni",
    "buyer"
  ),
  route("help-ticket", "C08-help-legal", "pages/help/help-ticket.html", "/destek/talep", "buyer"),
  route(
    "help-tickets",
    "C08-help-legal",
    "pages/help/help-tickets.html",
    "/destek/taleplerim",
    "buyer"
  ),

  route("after-sales", "C08-help-legal", "pages/info/after-sales.html", "/satis-sonrasi"),
  route("payments-info", "C08-help-legal", "pages/info/payments.html", "/odeme-secenekleri"),
  route(
    "refund-policy-info",
    "C08-help-legal",
    "pages/info/refund-policy.html",
    "/iade-politikasi"
  ),
  route(
    "shipping-logistics",
    "C08-help-legal",
    "pages/info/shipping-logistics.html",
    "/kargo-lojistik"
  ),
  route(
    "trade-assurance-detail",
    "C08-help-legal",
    "pages/info/trade-assurance-detail.html",
    "/ticaret-guvencesi/detay"
  ),

  route("accessibility", "C08-help-legal", "pages/legal/accessibility.html", "/erisilebilirlik"),
  route("cookies", "C08-help-legal", "pages/legal/cookies.html", "/cerezler"),
  route("distance-sales", "C08-help-legal", "pages/legal/distance-sales.html", "/mesafeli-satis"),
  route("intellectual-property", "C08-help-legal", "pages/legal/ip.html", "/fikri-mulkiyet"),
  route("kvkk", "C08-help-legal", "pages/legal/kvkk.html", "/kvkk"),
  route("legal-notice", "C08-help-legal", "pages/legal/notice.html", "/yasal-uyari"),
  route("privacy", "C08-help-legal", "pages/legal/privacy.html", "/gizlilik"),
  route(
    "product-listing-rules",
    "C08-help-legal",
    "pages/legal/product-listing.html",
    "/urun-listeleme-kurallari"
  ),
  route("returns", "C08-help-legal", "pages/legal/returns.html", "/iade-kosullari"),
  route("terms", "C08-help-legal", "pages/legal/terms.html", "/kullanim-kosullari"),

  route("manufacturers", "C02-catalog", "pages/manufacturers.html", "/ureticiler"),
  route("checkout", "C07-checkout", "pages/order/checkout.html", "/odeme", "buyer"),
  route(
    "order-success",
    "C11-status",
    "pages/order/order-success.html",
    "/odeme/basarili",
    "buyer"
  ),
  route(
    "payment-failed",
    "C11-status",
    "pages/order/payment-failed.html",
    "/odeme/basarisiz",
    "buyer"
  ),
  route(
    "payment-processing",
    "C11-status",
    "pages/order/payment-processing.html",
    "/odeme/isleniyor",
    "buyer"
  ),

  route("product-detail", "C03-detail", "pages/product-detail.html", null, "public", [
    { kind: "pretty", pathEnv: "PERF_PRODUCT_PRETTY_PATH" },
  ]),
  route("products", "C02-catalog", "pages/products.html", "/urunler"),

  route(
    "seller-return-decision",
    "C09-seller",
    "pages/seller/return-decision.html",
    null,
    "seller"
  ),
  route("seller-shipment", "C09-seller", "pages/seller/shipment.html", null, "seller"),

  route(
    "seller-application-pending",
    "C09-seller",
    "pages/seller/application-pending.html",
    "/satici/basvuru-bekleyen",
    "seller"
  ),
  route(
    "seller-dashboard",
    "C09-seller",
    "pages/seller/dashboard.html",
    "/satici/dashboard",
    "seller"
  ),
  route("seller-pricing", "C09-seller", "pages/seller/sell-pricing.html", "/satici/fiyatlandirma"),
  route("seller-landing", "C09-seller", "pages/seller/sell.html", "/satici-ol"),
  route("seller-shop", "C03-detail", "pages/seller/seller-shop.html", null, "public", [
    { kind: "pretty", pathEnv: "PERF_SELLER_SHOP_PRETTY_PATH" },
  ]),
  route(
    "seller-storefront",
    "C03-detail",
    "pages/seller/seller-storefront.html",
    "/satici/vitrin",
    "public",
    [{ kind: "pretty", pathEnv: "PERF_SELLER_PRETTY_PATH" }]
  ),
  route(
    "supplier-setup",
    "C09-seller",
    "pages/seller/supplier-setup.html",
    "/satici/tedarikci-kurulum",
    "seller"
  ),

  route(
    "tailored-selections",
    "C10-merchandising",
    "pages/tailored-selections.html",
    "/size-ozel",
    "buyer"
  ),
  route("top-deals", "C10-merchandising", "pages/top-deals.html", "/firsatlar"),
  route(
    "top-ranking-category",
    "C10-merchandising",
    "pages/top-ranking-category.html",
    "/cok-satanlar/kategori"
  ),
  route("top-ranking", "C10-merchandising", "pages/top-ranking.html", "/cok-satanlar"),
  route("trade-assurance", "C01-public-shell", "pages/trade-assurance.html", "/ticaret-guvencesi"),
];
