/**
 * CategoryQuickNav — categories.html'de bölümler-arası hızlı gezinme.
 * Masaüstünde sticky sol panel (`CategoryQuickNav`), mobil/tablette yatay
 * kayan çip şeridi (`CategoryMobileChips`) — ikisi de aynı `data-quicknav-link`
 * sözleşmesini kullanır, `initCategoryQuickNav()` ile birlikte senkron kalır:
 * hangi bölüm görünür olursa (IntersectionObserver) o link aktif olur.
 *
 * NOT: Eskiden "CategoryFilterSidebar" idi ama gerçekte FİLTRE üretmiyor — sadece
 * quick-nav (her bölüme smooth-scroll atlama linkleri). Ölü `filters`/`FilterGroup`
 * render dalı kaldırıldı (mapper `filters` alanını hiç doldurmuyordu). Gerçek ürün
 * facet'i products.html?cat='te; kategori navigasyonu bu paneldedir.
 */

import type { ApiCategory } from "../../services/categoryService";
import { t } from "../../i18n";
import { escapeHtml } from "../../utils/sanitize";

const ACTIVE_DESKTOP = ["bg-primary-50", "text-primary-700", "font-semibold"];
const INACTIVE_DESKTOP = ["text-gray-600"];
const ACTIVE_MOBILE = ["bg-primary-500", "text-white", "font-semibold"];
const INACTIVE_MOBILE = ["bg-gray-100", "text-gray-600"];

/**
 * Sol sticky quick-nav paneli (masaüstü). `<aside>`'e `h-full` şart: categories.ts'teki
 * `flex lg:flex-row` satırı varsayılan `align-items:stretch` ile `#cat-sidebar-container`'ı
 * (bu component'in oturduğu flex item) yanındaki uzun `#cat-grid-container` kadar
 * uzatıyor — ama `<aside>` kendi haline bırakılırsa yalnızca içeriği kadar (kısa) kalır.
 * `position:sticky`'nin hareket edebileceği alan, EN YAKIN kapsayan bloğun (burada
 * `<aside>`) yüksekliğiyle sınırlı: `<aside>` kısa kalırsa sticky'nin gidecek yeri
 * olmuyor ve öğe hiç yapışmadan sayfayla birlikte akıp gidiyor (ölçülüp doğrulandı —
 * kısa `<aside>`'de scrollTop arttıkça `top` birebir azalıyor, hiç 96px'te sabitlenmiyor).
 * `h-full`, stretch edilmiş `#cat-sidebar-container`'ın boyunu `<aside>`'e taşıyıp
 * sticky'ye gerçek bir kapsayan blok kazandırıyor.
 */
export function CategoryQuickNav(cats: ApiCategory[]): string {
  return `
    <aside class="w-56 shrink-0 h-full">
      <div class="sticky top-24">
        <nav class="bg-white rounded-lg border border-gray-200 p-4 max-h-[calc(100vh-120px)] overflow-y-auto">
          <div class="border-b border-gray-200 pb-3 mb-3">
            <h2 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">${t("categoryPage.quickNav")}</h2>
            <ul class="space-y-0.5 list-none p-0 m-0">
              ${cats
                .map(
                  (c, i) => `
                <li>
                  <a href="#cat-section-${i}" data-quicknav-link data-quicknav-scope="desktop" data-index="${i}"
                     class="block truncate rounded-md px-2.5 py-1.5 text-[13px] transition-colors duration-150 ${i === 0 ? ACTIVE_DESKTOP.join(" ") : INACTIVE_DESKTOP.join(" ")}">${escapeHtml(c.name)}</a>
                </li>`
                )
                .join("")}
            </ul>
          </div>
        </nav>
      </div>
    </aside>
  `;
}

/** Mobil/tablet (lg altı) yatay kayan hızlı erişim çip şeridi. */
export function CategoryMobileChips(cats: ApiCategory[]): string {
  return `
    <div class="lg:hidden mb-4">
      <div class="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        ${cats
          .map(
            (c, i) => `
          <a href="#cat-section-${i}" data-quicknav-link data-quicknav-scope="mobile" data-index="${i}"
             class="shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] transition-colors duration-150 ${i === 0 ? ACTIVE_MOBILE.join(" ") : INACTIVE_MOBILE.join(" ")}">${escapeHtml(c.name)}</a>`
          )
          .join("")}
      </div>
    </div>
  `;
}

/** Quick-nav linklerinin tıklama + scroll-aktif senkronizasyonu (masaüstü + mobil ortak). */
export function initCategoryQuickNav(): void {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-quicknav-link]"));
  if (links.length === 0) return;

  function setActive(index: number): void {
    links.forEach((link) => {
      const isActive = link.dataset.index === String(index);
      const isMobile = link.dataset.quicknavScope === "mobile";
      const activeSet = isMobile ? ACTIVE_MOBILE : ACTIVE_DESKTOP;
      const inactiveSet = isMobile ? INACTIVE_MOBILE : INACTIVE_DESKTOP;
      link.classList.remove(...activeSet, ...inactiveSet);
      link.classList.add(...(isActive ? activeSet : inactiveSet));
    });
    // Aktif mobil çip görünür alanda kalsın (uzun listede kaybolmasın).
    const activeMobile = links.find(
      (l) => l.dataset.quicknavScope === "mobile" && l.dataset.index === String(index)
    );
    activeMobile?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }

  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const idx = link.dataset.index;
      if (!idx) return;
      const target = document.getElementById(`cat-section-${idx}`);
      if (!target) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });
  });

  const sections = Array.from(
    document.querySelectorAll<HTMLElement>("#cat-grid-container section[id^='cat-section-']")
  );
  if (sections.length === 0) return;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const idx = entry.target.id.replace("cat-section-", "");
          setActive(Number(idx));
          break;
        }
      }
    },
    { rootMargin: "-96px 0px -70% 0px", threshold: 0 }
  );
  sections.forEach((s) => observer.observe(s));
}
