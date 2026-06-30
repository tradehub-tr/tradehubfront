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

function mobileVerifiedSlot(): string {
  return `
    <div class="lg:hidden flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 mb-1">
      <button type="button" data-verified-btn class="th-no-press shrink-0 inline-flex items-center h-8 px-3.5 rounded-full border border-gray-300 bg-white text-[12px] font-medium text-[#222] hover:bg-gray-50 whitespace-nowrap transition-colors">
        ${t("mfr.verifiedManufacturers")}
      </button>
    </div>
  `;
}

export function HorizontalCategoryBar(): string {
  return CategoryNavBar({
    idPrefix: "hm",
    allLabelKey: "mfr.allCategories",
    viewMoreLabel: t("mfr.viewMore"),
    allInCategoryLabel: (name: string) => t("mfr.allInCategory", { name }),
    desktopExtraSlot: desktopSubTabSlot(),
    mobileExtraSlot: mobileVerifiedSlot(),
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

  // ── Verified filter pill (üreticiye özel) ──
  const verifiedBtn = document.querySelector<HTMLElement>("[data-verified-btn]");
  if (verifiedBtn) {
    const updateVerifiedPill = (active: boolean): void => {
      if (active) {
        verifiedBtn.classList.remove("border-gray-300", "bg-white", "text-[#222]", "hover:bg-gray-50");
        verifiedBtn.classList.add("bg-primary-600", "border-primary-600", "text-white");
      } else {
        verifiedBtn.classList.remove("bg-primary-600", "border-primary-600", "text-white");
        verifiedBtn.classList.add("border-gray-300", "bg-white", "text-[#222]", "hover:bg-gray-50");
      }
    };
    updateVerifiedPill(new URLSearchParams(window.location.search).get("verified") === "1");
    verifiedBtn.addEventListener("click", () => {
      const params = new URLSearchParams(window.location.search);
      const isActive = params.get("verified") === "1";
      if (isActive) params.delete("verified"); else params.set("verified", "1");
      const qs = params.toString();
      window.history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : ""));
      document.dispatchEvent(new CustomEvent("manufacturer-filters-changed"));
      updateVerifiedPill(!isActive);
    });
  }
}
