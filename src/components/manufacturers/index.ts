import { ManufacturersHero } from "./ManufacturersHero";
import { HorizontalCategoryBar } from "./HorizontalCategoryBar";
import { ManufacturerList } from "./ManufacturerList";
import { ManufacturerFilterSidebar } from "./ManufacturerFilterSidebar";

function hasSearchContext(): boolean {
  if (typeof window === "undefined") return false;
  const p = new URLSearchParams(window.location.search);
  return Boolean(p.get("q") || p.get("cat") || p.get("category"));
}

export function ManufacturersLayout(): string {
  if (hasSearchContext()) {
    // Filtreli görünüm — Alibaba "Tedarikçiler" sayfası modeli
    return `
      <div class="container-boxed pt-4">
        <div class="flex flex-col lg:flex-row gap-4 lg:gap-6">
          <div class="hidden lg:block">
            ${ManufacturerFilterSidebar()}
          </div>
          <div class="flex-1 min-w-0">
            ${ManufacturerList()}
          </div>
        </div>
      </div>
    `;
  }

  // Discovery görünümü — bağlamsız landing
  return `
    <div class="container-boxed pt-4">
      ${ManufacturersHero()}
      ${HorizontalCategoryBar()}
      ${ManufacturerList()}
    </div>
  `;
}

export { initHorizontalCategoryBar } from "./HorizontalCategoryBar";
export { initCategoryFlyout } from "./ManufacturersHero";
export { initFactorySliders } from "./ManufacturerList";
export { initManufacturerFilters } from "./ManufacturerFilterSidebar";
