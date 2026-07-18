/**
 * FooterSeo Component
 * Trendyol tarzı SEO üst bölgesi: "Popüler Üreticiler ve Mağazalar" + "Popüler Sayfalar"
 * Beyaz zemin, sarı üst çizgi; masaüstünde çok kolonlu liste, mobilde 2 kolon.
 *
 * NOT: Marka/arama linkleri SEO hedefli sabit içeriktir; ileride backend'den
 * (ör. popüler arama servisi) beslenecek şekilde tasarlandı. Marka adları özel
 * isim olduğu için, arama terimleri de locale'e özgü SEO anahtar kelimeleri
 * olduğu için i18n'e çevrilmez — yalnızca bölüm başlıkları çevrilir.
 */

import { t } from "../../i18n";

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

function renderSeoGroup(titleKey: string, links: SeoLink[]): string {
  return `
    <div class="min-w-0">
      <h3
        class="text-[17px] sm:text-[20px] font-bold tracking-[-0.015em] mb-2.5 sm:mb-4"
        style="color: var(--footer-heading-color, #0a0a0a);"
      ><span data-i18n="${titleKey}">${t(titleKey)}</span></h3>
      <ul class="columns-2 md:columns-3 gap-x-4 md:gap-x-6">
        ${links
          .map(
            (link) => `
          <li class="break-inside-avoid">
            <a
              href="${link.href}"
              class="th-footer-link block text-[13px] sm:text-[13.5px] leading-snug py-[7px] sm:py-2"
            >${link.label}</a>
          </li>
        `
          )
          .join("")}
      </ul>
    </div>
  `;
}

/**
 * FooterSeo Component
 * Renders the SEO link zone above the main footer.
 */
export function FooterSeo(): string {
  return `
    <section
      class="border-t-2 border-primary-500 bg-[var(--footer-bg,#fff)]"
      aria-label="Popular brands and pages"
    >
      <div class="container-boxed px-3 sm:px-4 py-6 sm:py-9">
        <div class="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-7 xl:gap-12">
          ${renderSeoGroup("footer.popularBrands", popularBrands)}
          ${renderSeoGroup("footer.popularPages", popularPages)}
        </div>
      </div>
    </section>
  `;
}
