/**
 * TopDealsSubFilters Component
 * Pill-shaped sub-filter buttons (iSTOC referansı: rounded border pills)
 * Mobile: single-row horizontal scroll with truncated pills
 * Desktop: wrapping multi-row layout
 */

export function TopDealsSubFilters(): string {
  return `
    <div
      class="flex md:flex-wrap gap-2 mt-3 pb-2 overflow-x-auto md:overflow-x-visible scrollbar-hide"
      x-show="subFilters.length > 0"
      x-transition:enter="transition ease-out duration-200"
      x-transition:enter-start="opacity-0"
      x-transition:enter-end="opacity-100"
      x-transition:leave="transition ease-out duration-150"
      x-transition:leave-start="opacity-100"
      x-transition:leave-end="opacity-0"
    >
      <template x-for="filter in subFilters" :key="filter.id">
        <button
          type="button"
          class="flex-shrink-0 px-4 py-1.5 rounded-full text-sm transition-[color,background-color,border-color] duration-150 border max-w-[120px] md:max-w-none truncate"
          :class="activeSubFilter === filter.id
            ? 'border-[#222] text-[#222] font-medium bg-white'
            : 'border-[#e5e5e5] text-[#666] bg-white hover:border-[#999]'"
          @click="setSubFilter(filter.id)"
          x-text="filter.labelKey.startsWith('topDealsPage.') ? $t(filter.labelKey) : filter.labelKey"
        ></button>
      </template>
    </div>
  `;
}
