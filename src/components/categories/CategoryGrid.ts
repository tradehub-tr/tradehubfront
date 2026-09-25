/**
 * CategoryGrid — /pages/categories.html sayfasının ana içeriği.
 * Her ana kategoriyi (1. seviye) ikonlu+kalın başlık + "Tümünü Gör" ile açar,
 * altında CategoryGroupGrid (2. seviye gruplar ızgarası, 3. seviye yapraklarla)
 * render eder — mega menü kategori paneliyle birebir aynı görsel dil ve aynı
 * render fonksiyonu (workflow.md §1 refactor-before-write; bkz. ../shared/CategoryGroupGrid).
 *
 * Önceden bu dosya "Amazon tarzı" dairesel ikon ızgarasıydı ve 3. seviyeyi hiç
 * göstermiyordu (`subcategories: []` her zaman boştu) — kaldırıldı.
 *
 * Bölüm girişi staggered "yukarı kayarak belirir" mikro-animasyonu alır
 * (`.th-cat-rise`, style.css) — yalnız ilk ekrandaki birkaç bölüm için;
 * gerisi animasyonsuz (fazla animasyon "delight" değil gürültü olur).
 * `prefers-reduced-motion`: style.css'teki global `*` reset'i devreye girer.
 */

import { t } from "../../i18n";
import { escapeHtml } from "../../utils/sanitize";
import { getCategoryIcon, getIconByName } from "../shared/categoryIcons";
import { renderCategoryGroupsGrid } from "../shared/CategoryGroupGrid";
import type { ApiCategory } from "../../services/categoryService";

/** İlk kaç bölüme staggered giriş animasyonu uygulanır (style.css `.th-cat-rise:nth-of-type`). */
const ANIMATED_SECTION_COUNT = 6;

function renderCategorySection(cat: ApiCategory, index: number, isLast: boolean): string {
  const icon = cat.icon_class ? getCategoryIcon(cat.icon_class) : getIconByName(cat.name);
  const borderClass = isLast ? "" : "border-b border-gray-200";
  const animClass = index < ANIMATED_SECTION_COUNT ? " th-cat-rise" : "";

  return `
    <section id="cat-section-${index}" data-slug="${escapeHtml(cat.slug)}" class="py-7 lg:py-9 ${borderClass}${animClass} scroll-mt-28">
      <div class="flex items-center gap-2.5 mb-5 lg:mb-6">
        <span class="inline-flex shrink-0 items-center justify-center text-gray-400 [&>svg]:w-5 [&>svg]:h-5 lg:[&>svg]:w-6 lg:[&>svg]:h-6">${icon}</span>
        <h2 class="text-lg sm:text-xl lg:text-2xl font-extrabold tracking-tight text-gray-900">${escapeHtml(cat.name)}</h2>
        <span class="flex-1"></span>
        <a href="/pages/products.html?cat=${encodeURIComponent(cat.slug)}" class="group/cat inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700 whitespace-nowrap">
          ${t("commonNav.viewAll")}
          <svg class="w-3.5 h-3.5 shrink-0 transition-transform group-hover/cat:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover/cat:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 5 7 7-7 7"/></svg>
        </a>
      </div>
      ${renderCategoryGroupsGrid(cat.children ?? [], "/pages/products.html")}
    </section>
  `;
}

/** Kategoriler sayfasının tüm bölümlerini render eder. */
export function renderCategoryPage(cats: ApiCategory[]): string {
  return cats.map((cat, i) => renderCategorySection(cat, i, i === cats.length - 1)).join("");
}
