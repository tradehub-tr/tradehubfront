/**
 * Statik sayfa SEO verisi (FE-3) — vite.config.ts `staticSeoPlugin` tarafından
 * build sırasında HTML head'lerine enjekte edilir.
 *
 * İki küme:
 * - NOINDEX_FILES (38): auth/dashboard/order gibi indexlenmemesi gereken
 *   sayfalar → `<meta name="robots" content="noindex, nofollow">`
 *   (tek istisna 404.html → `noindex, follow`). Bu sayfalara canonical/OG
 *   EKLENMEZ (indexlenmeyecek sayfaya meta yatırımı yapılmaz).
 * - INDEXABLE_META: self-canonical (apex, prefix'siz TR) + description + OG.
 *   `prettyPath: null` → dinamik şablon (product-detail, brand, seller-*):
 *   statik canonical YANLIŞ olur (tüm ürünler aynı canonical'ı iddia eder);
 *   gerçek meta backend `page_resolver` + `applyServerSeo` ile gelir,
 *   buradaki description yalnız fallback'tir.
 *
 * Senkron: nginx $resolved_page map'i + tradehub_core static_pages_registry.py
 * ile `scripts/check-seo-path-sync.sh` senkron denetler (üçlü reconciliation).
 */

export const CANONICAL_ORIGIN = "https://istoc.com";

/** İndexlenMEYECEK dosyalar (proje-köküne göre path). 38 dosya. */
export const NOINDEX_FILES = new Set<string>([
  // auth (5)
  "pages/auth/accept-invite.html",
  "pages/auth/login.html",
  "pages/auth/register.html",
  "pages/auth/forgot-password.html",
  "pages/auth/reset-password.html",
  // dashboard (16)
  "pages/dashboard/addresses.html",
  "pages/dashboard/buyer-dashboard.html",
  "pages/dashboard/contacts.html",
  "pages/dashboard/favorites.html",
  "pages/dashboard/inquiries.html",
  "pages/dashboard/kyb.html",
  "pages/dashboard/kyc.html",
  "pages/dashboard/messages.html",
  "pages/dashboard/orders.html",
  "pages/dashboard/payment.html",
  "pages/dashboard/profile.html",
  "pages/dashboard/rfq.html",
  "pages/dashboard/rfq-form.html",
  "pages/dashboard/rfq-quotes.html",
  "pages/dashboard/rfq-success.html",
  "pages/dashboard/settings.html",
  // help-internal (3)
  "pages/help/help-ticket.html",
  "pages/help/help-ticket-new.html",
  "pages/help/help-tickets.html",
  // order (4)
  "pages/order/checkout.html",
  "pages/order/order-success.html",
  "pages/order/payment-failed.html",
  "pages/order/payment-processing.html",
  // seller-internal (3) — supplier-setup kod kanıtıyla noindex (auth-gated)
  "pages/seller/application-pending.html",
  "pages/seller/dashboard.html",
  "pages/seller/supplier-setup.html",
  // yasal — kullanıcı kararı 2026-07-23: Google'a kapalı, sitede erişilebilir (4)
  "pages/legal/kvkk.html",
  "pages/legal/returns.html",
  "pages/legal/ip.html",
  "pages/legal/notice.html",
  // diğer işlem (3)
  "404.html",
  "pages/cart.html",
  "pages/tailored-selections.html",
]);

/** 404 tek istisna: noindex ama linkler izlensin. */
export const NOINDEX_FOLLOW_FILES = new Set<string>(["404.html"]);

export interface StaticPageMeta {
  /** Pretty URL path'i (canonical için). null = dinamik şablon, canonical yok. */
  prettyPath: string | null;
  description: string;
}

/** İndexlenecek sayfalar — self-canonical + description + OG kaynağı. */
export const INDEXABLE_META: Record<string, StaticPageMeta> = {
  "index.html": {
    prettyPath: "/",
    description:
      "Türkiye'nin B2B toptan satış pazaryeri iStoc'ta doğrulanmış tedarikçilerden güvenli ödemeyle toptan ürün alın. Toptan fiyat avantajını keşfedin.",
  },
  "pages/products.html": {
    prettyPath: "/urunler",
    description:
      "Elektronikten tekstile binlerce toptan ürünü fiyat, marka ve kategoriye göre karşılaştırın; doğrulanmış tedarikçilerden toptan fiyatına alın.",
  },
  "pages/product-detail.html": {
    prettyPath: null,
    description:
      "Ürünün toptan fiyatını, adet bazlı indirimleri ve stok durumunu inceleyin; tedarikçiden teklif alın veya hemen sipariş verin.",
  },
  "pages/categories.html": {
    prettyPath: "/kategoriler",
    description:
      "Elektronik, tekstil, kozmetik ve daha yüzlerce kategoride toptan ürünleri keşfedin; aradığınız toptan kategoriye tek sayfadan ulaşın.",
  },
  "pages/brand.html": {
    prettyPath: null,
    description:
      "Markanın tüm ürünlerini toptan fiyatlarla inceleyin; doğrulanmış tedarikçilerden hızlı ve güvenli şekilde tedarik edin.",
  },
  "pages/manufacturers.html": {
    prettyPath: "/ureticiler",
    description:
      "Türkiye'nin üretici, toptancı ve markalarını tek listede keşfedin; güvenilir tedarikçilerle doğrudan bağlantı kurun.",
  },
  "pages/top-deals.html": {
    prettyPath: "/firsatlar",
    description:
      "Güncel kampanyalı toptan ürünler ve indirimli fırsatlar iStoc'ta. Stoklarla sınırlı toptan fiyat avantajlarını kaçırmayın.",
  },
  "pages/top-ranking.html": {
    prettyPath: "/cok-satanlar",
    description:
      "iStoc'ta en çok satan toptan ürünleri görün; popüler kategorilerde öne çıkan tedarikçileri karşılaştırıp siparişinizi hemen verin.",
  },
  "pages/top-ranking-category.html": {
    prettyPath: "/cok-satanlar/kategori",
    description:
      "Her kategorinin en çok satan toptan ürünlerini ayrı ayrı inceleyin; talep gören ürünlerle stoğunuzu doğru planlayın.",
  },
  "pages/trade-assurance.html": {
    prettyPath: "/ticaret-guvencesi",
    description:
      "iStoc Ticari Güvence ile ödemeniz teslimata kadar korumada: güvenli ödeme, para iade garantisi ve sevkiyat takibi tek pakette.",
  },
  "pages/info/trade-assurance-detail.html": {
    prettyPath: "/ticaret-guvencesi/detay",
    description:
      "Ticari Güvence'nin adımlarını öğrenin: ödeme koruması, teslimat takibi ve anlaşmazlık çözümü süreçleri örneklerle bu sayfada.",
  },
  "pages/info/after-sales.html": {
    prettyPath: "/satis-sonrasi",
    description:
      "Garanti şartları, iade süreçleri ve teknik destek: iStoc'ta satış sonrası korumalarla toptan alışverişiniz güvence altında.",
  },
  "pages/info/payments.html": {
    prettyPath: "/odeme-secenekleri",
    description:
      "Kredi kartı, havale ve güvenceli ödeme seçenekleri iStoc'ta. Alıcı korumasıyla toptan siparişlerinizi risk almadan tamamlayın.",
  },
  "pages/info/refund-policy.html": {
    prettyPath: "/iade-politikasi",
    description:
      "Para iadesinin hangi koşullarda ve kaç günde yapıldığını öğrenin; iade talebi açma ve anlaşmazlık çözümü adımları bu sayfada.",
  },
  "pages/info/shipping-logistics.html": {
    prettyPath: "/kargo-lojistik",
    description:
      "Toptan siparişlerde kargo süreleri, sevkiyat takibi ve teslimat güvencesi: iStoc lojistik süreçlerinin tamamını inceleyin.",
  },
  "pages/help/help-center.html": {
    prettyPath: "/yardim-merkezi",
    description:
      "Sipariş takibi, iade, ödeme ve kargo konularında adım adım rehberler. Çözüm bulamazsanız destek ekibine buradan ulaşın.",
  },
  "pages/help/faq.html": {
    prettyPath: "/sss",
    description:
      "Alışveriş, ödeme, kargo, iade ve satıcılık hakkında en çok sorulan soruların net cevapları iStoc SSS sayfasında.",
  },
  "pages/help/faq-detail.html": {
    prettyPath: "/sss/detay",
    description:
      "Sorunuzun ayrıntılı cevabını okuyun; ilgili rehberlere ve benzer sorulara bu sayfadan kolayca geçiş yapın.",
  },
  "pages/legal/privacy.html": {
    prettyPath: "/gizlilik",
    description:
      "iStoc gizlilik politikası: hangi verilerin toplandığı, nasıl korunduğu ve haklarınızı nasıl kullanacağınız bu sayfada.",
  },
  "pages/legal/cookies.html": {
    prettyPath: "/cerezler",
    description:
      "iStoc'ta kullanılan çerez türlerini, kullanım amaçlarını ve çerez tercihlerinizi nasıl yöneteceğinizi adım adım öğrenin.",
  },
  "pages/legal/terms.html": {
    prettyPath: "/kullanim-kosullari",
    description:
      "iStoc B2B pazaryeri kullanım koşulları: üyelik, sipariş ve ödeme kuralları ile alıcı-satıcı yükümlülüklerinin güncel metni.",
  },
  "pages/legal/distance-sales.html": {
    prettyPath: "/mesafeli-satis",
    description:
      "Mesafeli satış sözleşmesinin tam metni: cayma hakkı, teslimat süreleri, iade koşulları ve tarafların yükümlülükleri.",
  },
  "pages/legal/product-listing.html": {
    prettyPath: "/urun-listeleme-kurallari",
    description:
      "Satıcılar için ürün listeleme kuralları: kategori seçimi, görsel ve içerik standartları ile fiyatlandırma ilkeleri rehberi.",
  },
  "pages/legal/accessibility.html": {
    prettyPath: "/erisilebilirlik",
    description:
      "iStoc'un erişilebilirlik taahhüdü: uygulanan standartlar ve siteyi herkes için kullanılabilir kılan iyileştirmeler.",
  },
  "pages/seller/sell.html": {
    prettyPath: "/satici-ol",
    description:
      "Ürünlerinizi binlerce B2B alıcısına satın. Başvuru ücretsiz: mağazanızı açın, toptan satışa bugün başlayın.",
  },
  "pages/seller/sell-pricing.html": {
    prettyPath: "/satici/fiyatlandirma",
    description:
      "Satıcı üyelik paketlerini, komisyon oranlarını ve fiyatlandırmayı karşılaştırın; işletmenize uygun planla satışa başlayın.",
  },
  "pages/seller/seller-shop.html": {
    prettyPath: null,
    description:
      "Satıcının mağazasını keşfedin: öne çıkan toptan ürünler, kampanyalar ve kategoriler tek sayfada.",
  },
  "pages/seller/seller-storefront.html": {
    prettyPath: null,
    description:
      "Satıcının şirket bilgileri, doğrulama rozetleri, sertifikaları ve tüm ürün kataloğu iStoc B2B pazaryerinde.",
  },
};
