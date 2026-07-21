/**
 * CategoryQuickNav — categories.html sol panelinde bölümler-arası hızlı gezinme.
 *
 * NOT: Eskiden "CategoryFilterSidebar" idi ama gerçekte FİLTRE üretmiyor — sadece
 * quick-nav (her bölüme smooth-scroll atlama linkleri). Ölü `filters`/`FilterGroup`
 * render dalı kaldırıldı (mapper `filters` alanını hiç doldurmuyordu). Gerçek ürün
 * facet'i products.html?cat='te; kategori navigasyonu bu paneldedir.
 */

import type { CategorySection } from "../../data/categories";
import { t } from "../../i18n";
import { escapeHtml } from "../../utils/sanitize";

/** Sol sticky quick-nav paneli — her bölüme atlama linkleri (görünüm eskisiyle aynı). */
export function CategoryQuickNav(sections: CategorySection[]): string {
  return `
    <aside class="w-56 shrink-0">
      <div class="sticky top-24">
        <nav class="bg-white rounded-lg border border-gray-200 p-4 max-h-[calc(100vh-120px)] overflow-y-auto">
          <!-- Quick Nav -->
          <div class="border-b border-gray-200 pb-3 mb-4">
            <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">${t("categoryPage.quickNav")}</h3>
            <ul class="space-y-1 list-none p-0 m-0">
              ${sections.map((s, i) => `<li><a href="#cat-section-${i}" class="text-[13px] text-gray-600 hover:text-(--primary) hover:underline block py-0.5">${escapeHtml(s.title)}</a></li>`).join("")}
            </ul>
          </div>
        </nav>
      </div>
    </aside>
  `;
}

/** Quick-nav anchor linkleri için smooth-scroll davranışı. */
export function initCategoryQuickNav(): void {
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#cat-section-"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href")?.slice(1);
      if (!targetId) return;
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}
