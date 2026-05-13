/**
 * OrdersTabs Component
 * 3 pill-shaped tabs for orders filtering.
 * Last tab has chevron + click dropdown with filter items.
 * Alpine directives: @click on tabs/filters, :class for active states,
 * @click.outside on wrapper to close dropdown.
 */

import type { OrdersTabItem, OrdersFilterItem } from "../../types/buyerDashboard";
import { t } from "../../i18n";

export interface OrdersTabsProps {
  tabs: OrdersTabItem[];
  filters: OrdersFilterItem[];
  activeTabId: string;
  selectedFilterId: string | null;
  dropdownOpen: boolean;
}

function chevronSvg(): string {
  return `<svg class="orders__tab-chevron transition-transform duration-150 [.orders__tab--active_&]:rotate-180" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function checkSvg(): string {
  return `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 7L5.5 10L11.5 4" stroke="var(--color-dropdown-check)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

export function OrdersTabs({
  tabs,
  filters,
  activeTabId,
  selectedFilterId,
  dropdownOpen,
}: OrdersTabsProps): string {
  const tabsHtml = tabs
    .map((tab) => {
      const isActive = tab.id === activeTabId;
      const activeClass = isActive ? "orders__tab--active" : "";

      return `
      <button
        class="orders__tab ${activeClass} inline-flex items-center gap-1 px-3.5 py-1.5 rounded-(--radius-tab) border-none text-[13px] font-medium cursor-pointer whitespace-nowrap transition-all max-md:snap-start max-md:shrink-0
               bg-[var(--color-orders-tab-inactive-bg)] text-[var(--color-orders-tab-inactive-text)]
               hover:bg-[var(--color-orders-tab-hover-bg)]
               [&.orders__tab--active]:bg-[var(--color-orders-tab-active-bg)]
               [&.orders__tab--active]:text-[var(--color-orders-tab-active-text)]
               [&.orders__tab--active]:hover:bg-[var(--color-orders-tab-active-bg)]"
        :class="{ 'orders__tab--active': activeTabId === '${tab.id}' }"
        @click="selectTab('${tab.id}', ${!!tab.hasDropdown})"
        role="tab"
        :aria-selected="(activeTabId === '${tab.id}').toString()"
        aria-selected="${isActive}"
        aria-label="${tab.label}"
      >
        <span>${tab.label}</span>
        ${tab.hasDropdown ? chevronSvg() : ""}
      </button>
    `;
    })
    .join("");

  const filtersHtml = filters
    .map((filter) => {
      const isSelected = filter.id === selectedFilterId;
      const selectedClass = isSelected ? "orders__dropdown-item--selected" : "";
      // x-cloak on non-initially-selected check SVGs prevents flash before Alpine
      const cloakAttr = isSelected ? "" : "x-cloak";

      return `
      <button
        class="orders__dropdown-item ${selectedClass} flex items-center justify-between w-full py-2 px-3.5 border-none bg-transparent text-[13px] text-(--color-text-body,#333333) cursor-pointer transition-colors text-left
               hover:bg-[var(--color-dropdown-hover-bg)]
               [&.orders__dropdown-item--selected]:font-semibold"
        :class="{ 'orders__dropdown-item--selected': selectedFilterId === '${filter.id}' }"
        @click="selectFilter('${filter.id}')"
        role="menuitem"
      >
        <span>${filter.label}</span>
        <span x-show="selectedFilterId === '${filter.id}'" ${cloakAttr}>
          ${checkSvg()}
        </span>
      </button>
    `;
    })
    .join("");

  const dropdownVisibility = dropdownOpen ? "orders__dropdown--open" : "";

  return `
    <div class="orders__tabs-wrapper relative px-5 max-sm:px-3" @click.outside="dropdownOpen = false">
      <div class="orders__tabs flex gap-2 flex-wrap max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:scrollbar-none max-md:px-3 max-md:snap-x max-md:snap-mandatory" role="tablist" aria-label="${t("ordersTabs.ariaOrderFilters")}">
        ${tabsHtml}
      </div>
      <div class="orders__dropdown ${dropdownVisibility}
                  absolute top-[calc(100%+6px)] right-5 z-20 min-w-[200px]
                  bg-[var(--color-dropdown-bg)] border border-[var(--color-dropdown-border)]
                  rounded-[var(--radius-dropdown)] shadow-[0_4px_12px_var(--color-dropdown-shadow)]
                  py-1
                  opacity-0 invisible -translate-y-1
                  transition-[opacity,visibility,transform] duration-150
                  [&.orders__dropdown--open]:opacity-100
                  [&.orders__dropdown--open]:visible
                  [&.orders__dropdown--open]:translate-y-0"
           :class="{ 'orders__dropdown--open': dropdownOpen }" role="menu" aria-label="${t("ordersTabs.ariaOrderStatusFilter")}">
        ${filtersHtml}
      </div>
    </div>
  `;
}
