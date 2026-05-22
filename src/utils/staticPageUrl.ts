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
	"home": "/",
	"products": "/urunler",
	"categories": "/kategoriler",
	"manufacturers": "/markalar",
	"cart": "/sepet",
	"login": "/giris",
	"register": "/kayit",
	"forgot-password": "/sifremi-unuttum",
	"reset-password": "/sifre-sifirla",
	"help-center": "/yardim-merkezi",
	"faq": "/sss",
	"after-sales": "/satis-sonrasi",
	"blog": "/blog",
	"careers": "/kariyer",
	"csr": "/kurumsal-sorumluluk",
	"membership": "/uyelik",
	"news": "/haberler",
	"partnerships": "/ortakliklar",
	"payments": "/odeme-secenekleri",
	"refund-policy": "/iade-politikasi",
	"shipping-logistics": "/kargo-lojistik",
	"shipping-protection": "/kargo-koruma",
	"tax": "/vergi",
	"trade-assurance": "/ticaret-guvencesi",
	"trade-assurance-detail": "/ticaret-guvencesi/detay",
	"accessibility": "/erisilebilirlik",
	"cookies": "/cerezler",
	"distance-sales": "/mesafeli-satis",
	"ip": "/fikri-mulkiyet",
	"kvkk": "/kvkk",
	"notice": "/yasal-uyari",
	"privacy": "/gizlilik",
	"product-listing": "/urun-listeleme-kurallari",
	"returns": "/iade-kosullari",
	"terms": "/kullanim-kosullari",
	"sell": "/satici-ol",
	"sell-pricing": "/satici/fiyatlandirma",
	"checkout": "/odeme",
	"top-deals": "/firsat",
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
