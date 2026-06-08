/**
 * ProductSalesRank — Amazon "Best Sellers Rank" tarzı kategori bazlı satış
 * sıralaması bölümü. Özellikler sekmesinin en altında, kart tabanlı bir
 * layout ile gösterilir. En spesifik (yaprak) seviye vurgulu; her kart ilgili
 * kategori listesine linklenir. `ranks` boşsa hiçbir şey render edilmez.
 */

import { t, getCurrentLang } from "../../i18n";
import { escapeHtml } from "../../utils/sanitize";
import type { CategoryRank } from "../../types/product";

function fmt(n: number): string {
  return n.toLocaleString(getCurrentLang() === "en" ? "en-US" : "tr-TR");
}

export function ProductSalesRank(ranks: CategoryRank[]): string {
  if (!ranks || ranks.length === 0) return "";

  const cards = ranks
    .map((r, i) => {
      const isTop = i === 0;
      const badge =
        isTop && r.rank === 1
          ? `<span class="ms-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
               <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4zM5 4H3v2a3 3 0 0 0 3 3M19 4h2v2a3 3 0 0 1-3 3"/></svg>
               ${t("product.bestSeller")}
             </span>`
          : "";
      const rankColor = isTop ? "text-amber-500" : "text-primary-600";
      return `
        <a href="/pages/products.html?cat=${encodeURIComponent(r.slug)}"
           class="group flex items-center gap-4 rounded-md border p-4 no-underline appearance-none focus:outline-none transition-colors duration-150 hover:border-amber-300"
           style="border-color: var(--pd-spec-border, #e5e5e5); background: var(--pd-spec-header-bg, #f9fafb);">
          <div class="flex shrink-0 flex-col items-center justify-center">
            <span class="text-[10px] font-medium uppercase tracking-wider" style="color: var(--pd-spec-key-color, #6b7280);">${t("product.salesRankPosition")}</span>
            <span class="text-2xl font-extrabold leading-none tabular-nums ${rankColor}">#${fmt(r.rank)}</span>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-y-1">
              <span class="truncate text-sm font-semibold group-hover:underline" style="color: var(--pd-title-color, #111827);">${escapeHtml(r.categoryName)}</span>
              ${badge}
            </div>
            <span class="text-xs tabular-nums" style="color: var(--pd-spec-key-color, #6b7280);">${t("product.salesRankOutOf", { total: fmt(r.total) })}</span>
          </div>
          <svg class="h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-gray-500 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </a>`;
    })
    .join("");

  return `
    <section id="pd-sales-rank" class="mt-8 pt-8" style="border-top: 1px solid var(--pd-spec-border, #e5e5e5);">
      <h3 class="mb-1 flex items-center gap-2 text-lg font-bold" style="color: var(--pd-title-color, #111827);">
        <svg class="h-5 w-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4zM5 4H3v2a3 3 0 0 0 3 3M19 4h2v2a3 3 0 0 1-3 3"/></svg>
        ${t("product.salesRank")}
      </h3>
      <p class="mb-4 text-[13px]" style="color: var(--pd-spec-key-color, #6b7280);">${t("product.salesRankSubtitle")}</p>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">${cards}</div>
    </section>`;
}
