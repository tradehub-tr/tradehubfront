import { t } from "../../i18n";

/**
 * Numaralı sayfa gezinme çubuğu. data-page attribute'lu butonlar üretir;
 * tıklama delegasyonunu çağıran sayfa kurar (bkz. pages/products.ts).
 */
export function renderPagination(page: number, totalPages: number, hasNext: boolean, hasPrev: boolean): string {
  if (totalPages <= 1) return '';

  const pages: string[] = [];
  const maxVisible = 5;
  let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
  const endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  const baseBtn = 'inline-flex items-center justify-center w-9 h-9 text-sm rounded-md border transition-colors duration-150 select-none';
  const idleBtn = `${baseBtn} border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 cursor-pointer`;
  const activeBtn = `${baseBtn} border-primary-500 bg-primary-500 text-white font-semibold cursor-default shadow-sm`;
  const disabledBtn = `${baseBtn} border-gray-100 bg-white text-gray-300 cursor-not-allowed`;

  pages.push(`<button data-page="${page - 1}" ${!hasPrev ? 'disabled' : ''} aria-label="${t('infoMisc.previousPage')}" class="${hasPrev ? idleBtn : disabledBtn}">
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M9 3L5 7l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </button>`);

  if (startPage > 1) {
    pages.push(`<button data-page="1" class="${idleBtn}">1</button>`);
    if (startPage > 2) pages.push(`<span class="inline-flex items-center justify-center w-9 h-9 text-gray-400 select-none">…</span>`);
  }

  for (let i = startPage; i <= endPage; i++) {
    const isActive = i === page;
    pages.push(`<button data-page="${i}" ${isActive ? 'aria-current="page"' : ''} class="${isActive ? activeBtn : idleBtn}">${i}</button>`);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) pages.push(`<span class="inline-flex items-center justify-center w-9 h-9 text-gray-400 select-none">…</span>`);
    pages.push(`<button data-page="${totalPages}" class="${idleBtn}">${totalPages}</button>`);
  }

  pages.push(`<button data-page="${page + 1}" ${!hasNext ? 'disabled' : ''} aria-label="${t('infoMisc.nextPage')}" class="${hasNext ? idleBtn : disabledBtn}">
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M5 3l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </button>`);

  return `<nav aria-label="${t('infoMisc.pagination')}" class="flex items-center justify-center gap-1.5 mt-6">${pages.join('')}</nav>`;
}
