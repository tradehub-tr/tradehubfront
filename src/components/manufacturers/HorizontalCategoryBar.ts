import { t } from "../../i18n";
import { CategoryNavBar, initCategoryNavBar, type CategoryNavController } from "../shared/CategoryNavBar";

function getSubTabFilters(): string[] {
  return [
    t("mfr.filter.lowMoqCustomization"),
    t("mfr.filter.sampleCustomization"),
    t("mfr.filter.qualityCertified"),
    t("mfr.filter.smallCustomization"),
  ];
}
function getSubTabMoreFilters(): string[] {
  return [
    t("mfr.filter.lowMoqCustomization"),
    t("mfr.filter.sampleCustomization"),
    t("mfr.filter.qualityCertified"),
    t("mfr.filter.smallCustomization"),
    t("mfr.filter.fullCustomization"),
    t("mfr.filter.highRdCapacity"),
    t("mfr.filter.fortune500Collab"),
  ];
}

function desktopSubTabSlot(): string {
  const SUB_TAB_FILTERS = getSubTabFilters();
  const SUB_TAB_MORE_FILTERS = getSubTabMoreFilters();
  return `
    <ul class="flex items-center h-[48px] px-5 list-none m-0 p-0 overflow-x-auto" data-factory-sub-tab>
      ${SUB_TAB_FILTERS.map((filter) => `
        <li class="flex-shrink-0 flex items-center h-8 me-3 mt-0 px-4 border border-[#767676] rounded-full text-xs text-[#222] text-center cursor-pointer whitespace-nowrap hover:border-[#222] hover:font-medium transition-colors">${filter}</li>
      `).join("")}
      <li id="sub-tab-more-btn" class="ms-auto flex-shrink-0 flex items-center gap-1 h-8 px-4 border border-[#d8d8d8] rounded-full text-xs text-[#222] text-center cursor-pointer whitespace-nowrap hover:border-[#999] transition-colors">
        ${t("mfr.viewMore")}
        <svg class="w-3 h-3 transition-transform duration-200" id="sub-tab-more-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
      </li>
    </ul>
    <div id="sub-tab-dropdown" class="hidden absolute start-0 end-0 top-[110px] z-50 bg-white rounded-b-lg py-6 px-5" style="box-shadow: rgba(0,0,0,0.12) 0 8px 20px 0">
      <ul class="flex flex-wrap list-none m-0 p-0">
        ${SUB_TAB_MORE_FILTERS.map((filter) => `
          <li class="w-1/4 mb-3 pe-4 text-sm text-[#222] cursor-pointer hover:text-primary-600 transition-colors">${filter}</li>
        `).join("")}
      </ul>
    </div>
  `;
}

function mobileFilterButton(): string {
  // Mobil: kategori satırının BAŞINA, aynı satır içinde filtre ikonu (tek sıra).
  // Detaylı filtre sheet'ini açar (ManufacturerFilterSheet `mfr-filter-open` dinler).
  return `
    <button type="button" data-mfr-filter-btn aria-label="${t("mfr.list.filter")}"
      class="th-no-press shrink-0 inline-flex items-center justify-center w-12 self-stretch text-[#222] hover:bg-gray-50 border-e border-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--input-focus-border-color,#f5b800)] focus-visible:ring-inset">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M4 5h16M7 12h10M10 19h4"/></svg>
    </button>
  `;
}

export function HorizontalCategoryBar(): string {
  return CategoryNavBar({
    idPrefix: "hm",
    allLabelKey: "mfr.allCategories",
    viewMoreLabel: t("mfr.viewMore"),
    allInCategoryLabel: (name: string) => t("mfr.allInCategory", { name }),
    desktopExtraSlot: desktopSubTabSlot(),
    mobileLeadingSlot: mobileFilterButton(),
    mobileSegmented: true,
  });
}

export async function initHorizontalCategoryBar(): Promise<void> {
  // ── Kategori navigasyonu (ortak component) ──
  function applyCategory(slug: string): void {
    const params = new URLSearchParams(window.location.search);
    if (slug) params.set("cat", slug);
    else params.delete("cat");
    params.delete("category");
    const qs = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : ""));
    document.dispatchEvent(new CustomEvent("manufacturer-filters-changed"));
  }

  const controller: CategoryNavController | null = await initCategoryNavBar({
    idPrefix: "hm",
    allLabelKey: "mfr.allCategories",
    viewMoreLabel: t("mfr.viewMore"),
    allInCategoryLabel: (name: string) => t("mfr.allInCategory", { name }),
    mobileSegmented: true,
    onSelect: applyCategory,
    getActiveSlug: () => new URLSearchParams(window.location.search).get("cat") || "",
  });

  // Başlangıç ?cat senkronu
  controller?.syncActive(new URLSearchParams(window.location.search).get("cat") || "");

  // ── Sub-tab "Daha fazla" dropdown toggle (üreticiye özel, navigasyon değil) ──
  const subBtn = document.getElementById("sub-tab-more-btn");
  const subIcon = document.getElementById("sub-tab-more-icon");
  const subDropdown = document.getElementById("sub-tab-dropdown");
  if (subBtn && subDropdown) {
    subBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const hidden = subDropdown.classList.toggle("hidden");
      if (subIcon) subIcon.style.transform = hidden ? "rotate(0deg)" : "rotate(180deg)";
    });
    document.addEventListener("click", (e) => {
      const target = e.target as Node;
      if (!subDropdown.contains(target) && !subBtn.contains(target)) {
        subDropdown.classList.add("hidden");
        if (subIcon) subIcon.style.transform = "rotate(0deg)";
      }
    });
  }

  // ── Mobil filtre ikonu → detaylı filtre sheet'i aç (mfr-filter-open) ──
  const mobileFilterBtn = document.querySelector<HTMLElement>("[data-mfr-filter-btn]");
  if (mobileFilterBtn) {
    mobileFilterBtn.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("mfr-filter-open"));
    });
  }
}
