/**
 * FooterSeo Component
 * Trendyol tarzı SEO üst bölgesi: "Popüler Üreticiler ve Mağazalar" + "Popüler Sayfalar"
 * Beyaz zemin, sarı üst çizgi; masaüstünde çok kolonlu liste, mobilde 2 kolon.
 *
 * İçerik iki katmanlı:
 *  1. Sabit fallback (aşağıdaki `popularBrands`/`popularPages`) — ilk boyama +
 *     fetch başarısızsa gösterilir. Marka/arama terimleri SEO anahtar kelimesi
 *     olduğu için i18n'e çevrilmez, yalnızca başlıklar çevrilir.
 *  2. Backend hydration (`get_footer_seo_links`) — gerçekten aktif ilanı olan
 *     marka/mağaza/kategori DB'den gelir ve linkler gerçek pretty sayfalara
 *     (/marka, /magaza, products.html?cat=) bağlanır. Böylece footer asla
 *     boş/olmayan sayfaya link vermez (bkz: ürün olan kategoriler kuralı).
 */

import { t, getCurrentLang } from "../../i18n";
import { callMethod } from "../../utils/api";
import { escapeHtml, safeInnerHTML, sanitizeUrl } from "../../utils/sanitize";
import { getBrandUrl } from "../../utils/brandUrl";
import { getSellerUrl } from "../../utils/sellerUrl";

interface SeoLink {
  label: string;
  href: string;
}

const popularBrands: SeoLink[] = [
  { label: "Arçelik", href: "/pages/products.html?q=Ar%C3%A7elik" },
  { label: "Vestel", href: "/pages/products.html?q=Vestel" },
  { label: "Bosch Professional", href: "/pages/products.html?q=Bosch" },
  { label: "Makita", href: "/pages/products.html?q=Makita" },
  { label: "Kärcher", href: "/pages/products.html?q=K%C3%A4rcher" },
  { label: "Schneider Electric", href: "/pages/products.html?q=Schneider" },
  { label: "Siemens", href: "/pages/products.html?q=Siemens" },
  { label: "Legrand", href: "/pages/products.html?q=Legrand" },
  { label: "Viko", href: "/pages/products.html?q=Viko" },
  { label: "ABB", href: "/pages/products.html?q=ABB" },
  { label: "Philips", href: "/pages/products.html?q=Philips" },
  { label: "Osram", href: "/pages/products.html?q=Osram" },
  { label: "Baymak", href: "/pages/products.html?q=Baymak" },
  { label: "ECA", href: "/pages/products.html?q=ECA" },
  { label: "Vaillant", href: "/pages/products.html?q=Vaillant" },
];

const popularPages: SeoLink[] = [
  { label: "Toptan İş Eldiveni", href: "/pages/products.html?q=i%C5%9F+eldiveni" },
  { label: "Jeneratör", href: "/pages/products.html?q=jenerat%C3%B6r" },
  { label: "Sağlık Ekipmanları", href: "/pages/products.html?q=sa%C4%9Fl%C4%B1k+ekipmanlar%C4%B1" },
  { label: "Toptan Tekstil", href: "/pages/products.html?q=tekstil" },
  { label: "Kaynak Makinesi", href: "/pages/products.html?q=kaynak+makinesi" },
  { label: "Toptan Ambalaj", href: "/pages/products.html?q=ambalaj" },
  { label: "Hijyen Ürünleri", href: "/pages/products.html?q=hijyen" },
  { label: "Ofis Mobilyaları", href: "/pages/products.html?q=ofis+mobilyas%C4%B1" },
  { label: "Güneş Paneli", href: "/pages/products.html?q=g%C3%BCne%C5%9F+paneli" },
  { label: "Elektrik Malzemeleri", href: "/pages/products.html?q=elektrik+malzemeleri" },
  { label: "İş Güvenliği", href: "/pages/products.html?q=i%C5%9F+g%C3%BCvenli%C4%9Fi" },
  { label: "Depo Raf Sistemleri", href: "/pages/products.html?q=depo+raf" },
  { label: "Endüstriyel Mutfak", href: "/pages/products.html?q=end%C3%BCstriyel+mutfak" },
  { label: "Şantiye Ekipmanları", href: "/pages/products.html?q=%C5%9Fantiye" },
  { label: "Hesaplama Araçları", href: "/pages/help/help-center.html" },
];

function renderSeoItem(link: SeoLink): string {
  return `
    <li class="break-inside-avoid">
      <a
        href="${escapeHtml(sanitizeUrl(link.href))}"
        class="th-footer-link block text-[13px] sm:text-[13.5px] leading-snug py-[7px] sm:py-2"
      >${escapeHtml(link.label)}</a>
    </li>
  `;
}

function renderSeoGroup(titleKey: string, links: SeoLink[], groupKey: string): string {
  return `
    <div class="min-w-0">
      <h3
        class="text-[17px] sm:text-[20px] font-bold tracking-[-0.015em] mb-2.5 sm:mb-4"
        style="color: var(--footer-heading-color, #0a0a0a);"
      ><span data-i18n="${titleKey}">${t(titleKey)}</span></h3>
      <ul class="columns-2 md:columns-3 gap-x-4 md:gap-x-6" data-seo-group="${groupKey}">
        ${links.map(renderSeoItem).join("")}
      </ul>
    </div>
  `;
}

// ─────────────────────────── Backend hydration ────────────────────────────────

interface FooterSeoResponse {
  brands: { label: string; slug: string }[];
  stores: { label: string; slug: string }[];
  categories: { label: string; slug: string }[];
}

const HYDRATE_CACHE_TTL_MS = 30 * 60 * 1000; // 30 dk — footer her sayfada; fetch'i azalt
let hydrateScheduled = false;

/** URL helper'ları yalnızca tr/en prefix'i destekler; diğer içerik dilleri tr'ye düşer. */
function urlLang(): "tr" | "en" {
  return getCurrentLang() === "en" ? "en" : "tr";
}

async function loadFooterSeoLinks(): Promise<FooterSeoResponse | null> {
  const key = `footerSeoLinks:${getCurrentLang()}`;
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const cached = JSON.parse(raw) as { t: number; d: FooterSeoResponse };
      if (Date.now() - cached.t < HYDRATE_CACHE_TTL_MS) return cached.d;
    }
  } catch {
    // sessionStorage erişilemezse fetch'e düş
  }
  try {
    const data = await callMethod<FooterSeoResponse>("tradehub_core.api.footer.get_footer_seo_links");
    if (data) {
      try {
        sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d: data }));
      } catch {
        // quota dolu — cache'i atla, veri yine döner
      }
    }
    return data ?? null;
  } catch {
    return null; // fetch başarısız → sabit fallback kalır
  }
}

async function hydrateFooterSeo(): Promise<void> {
  const lists = document.querySelectorAll<HTMLUListElement>("[data-footer-seo] ul[data-seo-group]");
  if (!lists.length) return;
  const data = await loadFooterSeoLinks();
  if (!data) return;

  const lang = urlLang();
  const brandsAndStores: SeoLink[] = [
    ...data.brands.map((b) => ({ label: b.label, href: getBrandUrl({ slug: b.slug }, lang) })),
    ...data.stores.map((s) => ({ label: s.label, href: getSellerUrl({ slug: s.slug }, lang) })),
  ];
  // /kategori/<slug> sayfası tekil kategori ürünlerini listelemiyor (tüm ağacı açar);
  // gerçek ürün listesi products.html?cat=<url_slug> üzerinden gelir.
  const pages: SeoLink[] = data.categories.map((c) => ({
    label: c.label,
    href: `/pages/products.html?cat=${encodeURIComponent(c.slug)}`,
  }));

  lists.forEach((ul) => {
    const links = ul.dataset.seoGroup === "brands" ? brandsAndStores : pages;
    // Boş dönen grup için sabit fallback'i koru (dead link yerine SEO araması)
    if (links.length) safeInnerHTML(ul, links.map(renderSeoItem).join(""));
  });
}

/**
 * Footer 20+ sayfada render edildiği için her sayfaya init çağrısı gömmek yerine
 * render sırasında bir kez hydration planlanır (idempotent guard'lı side-effect).
 */
function scheduleHydration(): void {
  if (hydrateScheduled || typeof document === "undefined") return;
  hydrateScheduled = true;
  const run = () => void hydrateFooterSeo();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => requestAnimationFrame(run), { once: true });
  } else {
    requestAnimationFrame(run);
  }
}

/**
 * FooterSeo Component
 * Renders the SEO link zone above the main footer.
 */
export function FooterSeo(): string {
  scheduleHydration();
  return `
    <section
      class="border-t-2 border-primary-500 bg-[var(--footer-bg,#fff)]"
      aria-label="Popular brands and pages"
      data-footer-seo
    >
      <div class="container-boxed px-3 sm:px-4 py-6 sm:py-9">
        <div class="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-7 xl:gap-12">
          ${renderSeoGroup("footer.popularBrands", popularBrands, "brands")}
          ${renderSeoGroup("footer.popularPages", popularPages, "pages")}
        </div>
      </div>
    </section>
  `;
}
