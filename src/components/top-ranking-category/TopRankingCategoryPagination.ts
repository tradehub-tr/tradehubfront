/**
 * TopRankingCategoryPagination — `[‹ Önceki] [1] [2] [Sonraki ›]`
 *
 * Davranış:
 *  - totalPages <= 1  → render YOK (parent zaten x-show ile gizler)
 *  - totalPages == 2  → 2 sayfa butonu + Önceki/Sonraki
 *  - Aktif sayfa primary renkte, pasif yüzey renginde
 *  - Sayfa 1'de Önceki disabled; sayfa 2'de Sonraki disabled
 *
 * Parent Alpine state: { page: number, totalPages: number, goToPage(n) }
 */

import { t } from "../../i18n";

export function TopRankingCategoryPagination(): string {
  return `
    <nav
      class="flex items-center justify-center gap-2 mt-8 mb-4"
      aria-label="Pagination"
      x-show="totalPages > 1"
      x-cloak
    >
      <button
        type="button"
        class="px-3 py-2 rounded-md border border-border-default text-sm font-medium text-text-secondary bg-surface hover:bg-surface-raised transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="page === 1 || loading"
        @click="goToPage(page - 1)"
        data-i18n="topRankingCategoryPage.paginationPrevious"
      >&lsaquo; ${t("topRankingCategoryPage.paginationPrevious")}</button>

      <template x-for="n in totalPages" :key="'page-' + n">
        <button
          type="button"
          class="min-w-[40px] px-3 py-2 rounded-md text-sm font-semibold transition-colors"
          :class="page === n
            ? 'bg-primary-500 text-white'
            : 'border border-border-default text-text-secondary bg-surface hover:bg-surface-raised'"
          :disabled="loading"
          @click="goToPage(n)"
          x-text="n"
          :aria-current="page === n ? 'page' : null"
        ></button>
      </template>

      <button
        type="button"
        class="px-3 py-2 rounded-md border border-border-default text-sm font-medium text-text-secondary bg-surface hover:bg-surface-raised transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="page >= totalPages || loading"
        @click="goToPage(page + 1)"
        data-i18n="topRankingCategoryPage.paginationNext"
      >${t("topRankingCategoryPage.paginationNext")} &rsaquo;</button>
    </nav>
  `;
}
