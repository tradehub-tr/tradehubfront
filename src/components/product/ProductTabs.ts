/**
 * ProductTabs Component
 * Anchor-navigasyonlu içerik: Açıklama, Özellikler, Yorumlar, Tedarikçi.
 * Sekmeler içerik gizleyip göstermez; tüm bölümler alt alta durur, sekmeye
 * tıklandığında ilgili bölüme yumuşak scroll edilir (scroll-spy ile aktif vurgu).
 */

import { AttributesTabContent } from "./AttributesTabContent";
import { ProductCertificates } from "./ProductCertificates";
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
    id: "description",
    label: t("product.description"),
    i18nKey: "product.description",
    content: ProductDescription,
  },
  {
    id: "attributes",
    label: t("product.attributes"),
    i18nKey: "product.attributes",
    // Sertifikalar referans düzendeki gibi özellik içeriğinin altında,
    // yorumlar bölümünün hemen üstünde durur.
    content: () => AttributesTabContent() + ProductCertificates(),
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
];

export function ProductTabs(): string {
  const reviewCount = getCurrentProduct().reviewCount ?? 0;

  return `
    <section id="product-tabs-section" class="mt-6">
     <div class="rounded-md border border-[var(--pd-spec-border,#e5e5e5)] bg-[var(--pd-bg,#ffffff)] px-4 pt-4 pb-6 sm:px-6">
      <!-- Anchor Navigation — referans tasarım: kapsayıcı kutu yok,
           aktif sekme gri pill, pasifler düz metin -->
      <div
        id="product-tabs-nav"
        class="inline-flex max-w-full gap-1 overflow-x-auto scrollbar-hide rounded-md p-1.5 -m-1.5"
        role="tablist"
      >
        ${tabs
          .map((tab, i) => {
            const badge =
              tab.id === "reviews" && reviewCount > 0
                ? `<span class="ms-0.5 text-[11px] font-bold px-1.5 py-px rounded-full bg-[#e5e7eb] text-[#374151] [font-variant-numeric:tabular-nums]">${reviewCount}</span>`
                : "";
            return `
          <button
            type="button"
            id="tab-btn-${tab.id}"
            data-tab-target="tab-content-${tab.id}"
            data-active="${i === 0 ? "true" : "false"}"
            class="th-no-press product-tab-btn whitespace-nowrap inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-md transition-colors cursor-pointer appearance-none focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-500,#f5b800)] bg-transparent font-medium text-[#4b5563] hover:text-[#111827] data-[active=true]:bg-[#e5e5e5] data-[active=true]:font-bold data-[active=true]:text-[#111827]"
            role="tab"
            aria-controls="tab-content-${tab.id}"
          >
            <span data-i18n="${tab.i18nKey}">${tab.label}</span>${badge}
          </button>
        `;
          })
          .join("")}
      </div>

      <!-- İçerik Bölümleri — hepsi görünür, sekme anchor hedefleri -->
      ${tabs
        .map((tab) => {
          // Reviews paneli kendi büyük başlığını ("Değerlendirme ve Yorumlar")
          // basar — panel h2'si onunla alt alta çift başlık görünüyordu.
          const heading =
            tab.id === "reviews"
              ? ""
              : `<h2
            id="tab-heading-${tab.id}"
            class="mb-4 text-lg font-bold tracking-[-0.01em] text-[var(--pd-title-color,#111827)]"
            data-i18n="${tab.i18nKey}"
          >${tab.label}</h2>`;
          return `
        <section
          id="tab-content-${tab.id}"
          class="product-tab-panel scroll-mt-28 pt-6 mt-6 border-t border-[var(--pd-spec-border,#e5e5e5)]"
          ${heading ? `aria-labelledby="tab-heading-${tab.id}"` : `aria-label="${tab.label}"`}
        >
          ${heading}
          ${tab.content()}
        </section>
      `;
        })
        .join("")}
     </div>
    </section>
  `;
}

export function initProductTabs(options: { signal?: AbortSignal } = {}): void {
  const tabNav = document.getElementById("product-tabs-nav");
  const tabSection = document.getElementById("product-tabs-section");
  if (!tabNav || !tabSection) return;

  const header = document.getElementById("sticky-header");
  const headerHeight = header ? header.offsetHeight : 0;
  const offset = headerHeight + 8;

  const buttons = Array.from(
    tabNav.querySelectorAll<HTMLButtonElement>(".product-tab-btn")
  );

  const setActive = (targetId: string): void => {
    buttons.forEach((b) => {
      b.dataset.active = (b.dataset.tabTarget === targetId).toString();
    });
  };

  // ── Anchor scroll: sekmeye tıkla → ilgili bölüme yumuşak kaydır ──
  tabNav.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
      ".product-tab-btn"
    );
    const targetId = btn?.dataset.tabTarget;
    if (!targetId) return;
    const panel = document.getElementById(targetId);
    if (!panel) return;

    // Sticky nav yapıştığında bölüm başlığı onun altında kalmasın diye ekstra pay
    const navHeight = tabNav.offsetHeight;
    const top =
      panel.getBoundingClientRect().top + window.scrollY - offset - navHeight - 8;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
    setActive(targetId);
  });

  // ── Scroll-spy: görünürdeki bölümün sekmesini otomatik vurgula ──
  const panels = buttons
    .map((b) => document.getElementById(b.dataset.tabTarget ?? ""))
    .filter((p): p is HTMLElement => p !== null);

  const spy = new IntersectionObserver(
    (entries) => {
      const topMost = entries
        .filter((en) => en.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (topMost) setActive(topMost.target.id);
    },
    { rootMargin: `-${offset + 56}px 0px -55% 0px`, threshold: 0 }
  );
  panels.forEach((p) => spy.observe(p));

  // ── Sticky segment-pill: header altına yapıştır (bg override YOK; sadece gölge) ──
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) {
        tabNav.style.position = "sticky";
        // Header ile arasında boşluk kalmasın diye tam header altına yapışır
        tabNav.style.top = `${headerHeight}px`;
        tabNav.style.zIndex = "20";
        // Frosted: arkadaki içerik blur olsun (yarı-saydam surface + backdrop-blur)
        tabNav.style.background = "rgba(255,255,255,0.85)";
        tabNav.style.backdropFilter = "blur(10px)";
        tabNav.style.setProperty("-webkit-backdrop-filter", "blur(10px)");
      } else {
        tabNav.style.position = "";
        tabNav.style.top = "";
        tabNav.style.zIndex = "";
        tabNav.style.background = "";
        tabNav.style.backdropFilter = "";
        tabNav.style.removeProperty("-webkit-backdrop-filter");
      }
    },
    { rootMargin: `-${offset}px 0px 0px 0px`, threshold: 1 }
  );
  observer.observe(tabSection);

  options.signal?.addEventListener(
    "abort",
    () => {
      spy.disconnect();
      observer.disconnect();
    },
    { once: true }
  );
}
