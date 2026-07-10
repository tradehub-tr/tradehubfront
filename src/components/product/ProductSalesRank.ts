/**
 * ProductSalesRank — Kategori bazlı satış sıralaması bölümü ("Defne Çelengi"
 * tasarımı). Tek sırada duran mini ödül kartları: sıra numarası iki defne
 * dalının arasında, #1 kartları krem-altın zeminli, düşük sıra nötr. Dar
 * ekranda şerit yatay kaydırılır (scrollbar-hide). Her kart ilgili kategori
 * listesine linklenir. `ranks` boşsa hiçbir şey render edilmez.
 */

import { t, getCurrentLang } from "../../i18n";
import { escapeHtml } from "../../utils/sanitize";
import type { CategoryRank } from "../../types/product";

function fmt(n: number): string {
  return n.toLocaleString(getCurrentLang() === "en" ? "en-US" : "tr-TR");
}

function laurelBranch(mirrored: boolean): string {
  return `<svg class="h-[26px] w-4 shrink-0${mirrored ? " -scale-x-100" : ""}" viewBox="0 0 16 26" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 24C7 21.5 4.5 16 5.5 9.5"/><path d="M5.5 9.5C4 8.2 3.4 6.2 4 4.2c1.9.6 3.1 2.1 3.4 4"/><path d="M4.8 14.5c-1.8-.5-3-2-3.4-3.9 2-.2 3.7.7 4.6 2.3"/><path d="M6.8 19c-1.9 0-3.4-1-4.4-2.7 1.8-.7 3.7-.3 5 .9"/></svg>`;
}

/**
 * Yalnızca kart şeridi — masaüstü sekmesi ve mobil layout aynı görseli
 * paylaşır; sarmalayıcı başlık/divider çağırana aittir.
 */
export function SalesRankCards(ranks: CategoryRank[]): string {
  const cards = ranks
    .map((r) => {
      const isTop = r.rank === 1;
      const cardCls = isTop
        ? "bg-[#fffdf5] border-[#efe3bd] hover:border-[#e0b93c]"
        : "bg-[var(--pd-spec-header-bg,#fafafa)] border-[var(--pd-spec-border,#e5e5e5)] hover:border-[#a3a3a3]";
      const wreathCls = isTop ? "text-[#c9a227]" : "text-neutral-400";
      const rankCls = isTop
        ? "text-[19px] text-amber-700"
        : "text-[15px] text-neutral-600";
      return `
        <a href="/pages/products.html?cat=${encodeURIComponent(r.slug)}"
           class="flex min-w-[128px] flex-none flex-col items-center gap-1.5 rounded-md border px-5 pb-3 pt-3.5 no-underline appearance-none focus:outline-none transition-colors duration-150 ${cardCls}">
          <span class="flex items-center gap-0.5 ${wreathCls}">
            ${laurelBranch(false)}
            <span class="px-1 font-extrabold leading-none tabular-nums ${rankCls}">#${fmt(r.rank)}</span>
            ${laurelBranch(true)}
          </span>
          <span class="whitespace-nowrap text-center text-[14px] font-semibold" style="color: var(--pd-title-color, #111827);">${escapeHtml(r.categoryName)}</span>
          <span class="text-[11px] tabular-nums" style="color: var(--pd-spec-key-color, #6b7280);">${t("product.salesRankOutOf", { total: fmt(r.total) })}</span>
        </a>`;
    })
    .join("");

  return `<div class="scrollbar-hide flex gap-2.5 overflow-x-auto">${cards}</div>`;
}

export function ProductSalesRank(ranks: CategoryRank[]): string {
  if (!ranks || ranks.length === 0) return "";

  return `
    <section id="pd-sales-rank" class="mt-8 pt-8" style="border-top: 1px solid var(--pd-spec-border, #e5e5e5);">
      <h2 class="mb-1 flex items-center gap-2 text-lg font-bold" style="color: var(--pd-title-color, #111827);">
        <svg class="h-5 w-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4zM5 4H3v2a3 3 0 0 0 3 3M19 4h2v2a3 3 0 0 1-3 3"/></svg>
        ${t("product.salesRank")}
      </h2>
      <p class="mb-4 text-[13px]" style="color: var(--pd-spec-key-color, #6b7280);">${t("product.salesRankSubtitle")}</p>
      ${SalesRankCards(ranks)}
    </section>`;
}
