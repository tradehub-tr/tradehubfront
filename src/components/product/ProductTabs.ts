/**
 * ProductTabs Component
 * Flowbite-based tabbed content: Description, Reviews, Company, FAQ.
 */

import { AttributesTabContent } from "./AttributesTabContent";
import { ProductReviews } from "./ProductReviews";
import { CompanyProfile } from "./CompanyProfile";
import { ProductDescription } from "./ProductDescription";
import { getCurrentProduct } from "../../alpine/product";
import { t } from "../../i18n";

interface TabConfig {
  id: string;
  label: string;
  i18nKey: string;
  content: () => string;
}

const tabs: TabConfig[] = [
  {
    id: "attributes",
    label: t("product.attributes"),
    i18nKey: "product.attributes",
    content: AttributesTabContent,
  },
  {
    id: "reviews",
    label: t("product.reviews"),
    i18nKey: "product.reviews",
    content: ProductReviews,
  },
  {
    id: "company",
    label: t("product.supplier"),
    i18nKey: "product.supplier",
    content: CompanyProfile,
  },
  {
    id: "description",
    label: t("product.description"),
    i18nKey: "product.description",
    content: ProductDescription,
  },
];

export function ProductTabs(): string {
  const reviewCount = getCurrentProduct().reviewCount ?? 0;

  return `
    <section id="product-tabs-section" x-data="{ activeTab: 'attributes' }" class="mt-6">
     <div class="rounded-lg border border-[var(--pd-spec-border,#e5e5e5)] bg-[var(--pd-bg,#ffffff)] px-4 pt-4 pb-6 sm:px-6">
      <!-- Tab Navigation (boxed card tabs) -->
      <div
        id="product-tabs-nav"
        class="inline-flex max-w-full gap-[3px] overflow-x-auto scrollbar-hide rounded-lg bg-[var(--color-surface-raised,#f1f5f9)] p-1"
        role="tablist"
      >
        ${tabs
          .map((tab) => {
            const badge =
              tab.id === "reviews" && reviewCount > 0
                ? `<span class="ms-0.5 text-[11px] font-bold px-1.5 py-px rounded-full bg-[#e4e8ee] text-[var(--pd-tab-color,#6b7280)] [font-variant-numeric:tabular-nums]">${reviewCount}</span>`
                : "";
            return `
          <button
            type="button"
            id="tab-btn-${tab.id}"
            class="product-tab-btn whitespace-nowrap inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-md transition-colors cursor-pointer"
            :class="activeTab === '${tab.id}' ? 'bg-[var(--pd-bg,#ffffff)] text-[var(--pd-title-color,#111827)] font-bold shadow-[0_1px_2px_rgba(16,24,40,0.08),0_1px_3px_rgba(16,24,40,0.06)]' : 'bg-transparent text-[var(--pd-tab-color,#6b7280)] font-medium hover:text-[var(--pd-title-color,#111827)]'"
            role="tab"
            :aria-selected="(activeTab === '${tab.id}').toString()"
            aria-controls="tab-content-${tab.id}"
            @click="activeTab = '${tab.id}'"
          >
            <span data-i18n="${tab.i18nKey}">${tab.label}</span>${badge}
          </button>
        `;
          })
          .join("")}
      </div>

      <!-- Tab Content Panels -->
      ${tabs
        .map(
          (tab, i) => `
        <div
          id="tab-content-${tab.id}"
          class="product-tab-panel pt-6"
          role="tabpanel"
          aria-labelledby="tab-btn-${tab.id}"
          x-show="activeTab === '${tab.id}'"
          ${i !== 0 ? "x-cloak" : ""}
        >
          ${tab.content()}
        </div>
      `
        )
        .join("")}
     </div>
    </section>
  `;
}

export function initProductTabs(): void {
  // Sekme geçişi Alpine.js ile. Segment-pill'i kaydırınca header altına yapıştır.
  // Pill KENDİ zeminini korur (bg override YOK — eski sticky'nin hatasıydı);
  // stuck durumda yalnız hafif gölge eklenir.
  const tabNav = document.getElementById("product-tabs-nav");
  const tabSection = document.getElementById("product-tabs-section");
  if (!tabNav || !tabSection) return;

  const header = document.getElementById("sticky-header");
  const headerHeight = header ? header.offsetHeight : 0;
  const offset = headerHeight + 8;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) {
        tabNav.style.position = "sticky";
        tabNav.style.top = `${offset}px`;
        tabNav.style.zIndex = "20";
        tabNav.style.boxShadow = "0 6px 16px -6px rgba(16,24,40,0.18)";
        // Frosted: arkadaki içerik blur olsun (yarı-saydam surface + backdrop-blur)
        tabNav.style.background = "rgba(241,245,247,0.72)";
        tabNav.style.backdropFilter = "blur(10px)";
        tabNav.style.setProperty("-webkit-backdrop-filter", "blur(10px)");
      } else {
        tabNav.style.position = "";
        tabNav.style.top = "";
        tabNav.style.zIndex = "";
        tabNav.style.boxShadow = "";
        tabNav.style.background = "";
        tabNav.style.backdropFilter = "";
        tabNav.style.removeProperty("-webkit-backdrop-filter");
      }
    },
    { rootMargin: `-${offset}px 0px 0px 0px`, threshold: 1 }
  );
  observer.observe(tabSection);
}
