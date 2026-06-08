import { t } from "../../i18n";

/**
 * ManufacturerFilterSidebar — Tedarikçiler sayfası için Alibaba'nın sol filtre
 * paneli. Görsel taslak, products `FilterSidebar` ile birebir aynı (collapsible
 * section + sticky apply button); içerik tedarikçiye özgü.
 *
 * Aktif: kategori (URL'den `cat`/`category` ile gelir, doğrudan API'ye geçer).
 * Diğer alanlar URL state'i tutar; backend desteklediğinde aktifleşir.
 */

const chevronDown = `<svg class="w-4 h-4 transition-transform duration-200" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>`;

interface SectionWrapperOpts {
  id: string;
  title: string;
  body: string;
}

function section({ id, title, body }: SectionWrapperOpts): string {
  return `
    <div class="border-b py-2.5" style="border-color: var(--filter-divider-color, #e5e7eb);">
      <div
        class="flex items-center justify-between py-0.5 cursor-pointer group"
        @click="toggleSection('${id}')"
      >
        <h3 class="text-[13px] font-semibold uppercase tracking-wide" style="color: var(--filter-heading-color, #111827);">${title}</h3>
        <span class="transition-transform duration-200" :class="{ 'rotate-180': !collapsed['${id}'] }" style="color: var(--filter-chevron-color, #6b7280);">${chevronDown}</span>
      </div>
      <div
        class="overflow-hidden transition-all duration-200"
        :class="{ 'max-h-0 opacity-0': collapsed['${id}'], 'max-h-[500px] opacity-100': !collapsed['${id}'] }"
      >
        <div class="pt-2">${body}</div>
      </div>
    </div>
  `;
}

/**
 * Tek-seçim filtre chip'i. Eski radio'nun yerine geçer: `name` Alpine model'i,
 * `value` korunur. Tekrar tıklayınca seçimi kaldırır (radio'da yapılamayan ama
 * filtrede beklenen davranış). Seçim sonrası apply() çağrılır.
 */
function chipRow(name: string, value: string, label: string): string {
  return `
    <button
      type="button"
      @click="${name} = ${name} === '${value}' ? '' : '${value}'; apply()"
      class="px-3 py-1 rounded-full text-[13px] font-medium border transition-colors cursor-pointer"
      :class="${name} === '${value}'
        ? 'bg-[var(--color-primary-500,#cc9900)] text-white border-[var(--color-primary-500,#cc9900)]'
        : 'bg-white text-[color:var(--filter-text-color,#374151)] border-gray-300 hover:border-[var(--color-primary-500,#cc9900)]'"
    >${label}</button>
  `;
}

function checkboxRow(model: string, value: string, label: string, leading = ""): string {
  return `
    <label class="flex items-center gap-2 py-1 cursor-pointer text-[13px]" style="color: var(--filter-text-color, #374151);">
      <input type="checkbox" value="${value}" x-model="${model}" @change="apply()" class="rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
      ${leading}<span>${label}</span>
    </label>
  `;
}

export function ManufacturerFilterSidebar(): string {
  const ratings = [4.0, 4.5, 5.0];
  const platformYears = [5, 10, 15];
  const onTime = ["90", "95", "100"];
  const respHours = ["4", "2", "1"];
  const reorder = ["15", "30", "50"];

  const countries = [
    { code: "TR", name: t("checkoutMfr.countryTR") },
    { code: "CN", name: t("checkoutMfr.countryCN") },
    { code: "PK", name: t("checkoutMfr.countryPK") },
    { code: "US", name: t("checkoutMfr.countryUS") },
    { code: "IN", name: t("checkoutMfr.countryIN") },
    { code: "TW", name: t("checkoutMfr.countryTW") },
    { code: "DE", name: t("checkoutMfr.countryDE") },
    { code: "IT", name: t("checkoutMfr.countryIT") },
    { code: "FR", name: t("checkoutMfr.countryFR") },
  ];

  const mgmtCerts = ["ISO", "BSCI", "SEDEX", "FAMA", "ICTI"];
  const productCerts = ["CE", "ROHS", "CPC", "OEKO-TEX 100", "GRS"];

  // Section gövdeleri — tek-seçim chip grupları (flex-wrap)
  const chipGroup = (chips: string) => `<div class="flex flex-wrap gap-2 pt-1">${chips}</div>`;

  const ratingsBody = chipGroup(
    ratings
      .map((r) =>
        chipRow(
          "rating",
          String(r),
          `${r.toFixed(1)} ${r === 5.0 ? "" : t("products.filterAndUp")}`
        )
      )
      .join("")
  );

  const moqBody = `
    <div class="flex items-center gap-1.5 mt-2">
      <input
        type="number"
        min="1"
        placeholder="${t("products.filterQuantity")}"
        x-model="moqMax"
        class="th-input th-input-sm flex-1 min-w-0 w-0 px-2 text-[13px]"
        style="border-color: var(--filter-input-border, #d1d5db); color: var(--filter-text-color, #374151);"
        @keydown.enter="apply()"
      />
      <span class="text-[12px] whitespace-nowrap shrink-0" style="color: var(--filter-text-color, #6b7280);">${t("products.filterPieces")}</span>
      <button
        type="button"
        @click="apply()"
        class="th-btn shrink-0 !w-8 !h-8 !p-0 leading-none text-base font-semibold"
        aria-label="${t("products.filterApply")}"
      >&rsaquo;</button>
    </div>
  `;

  const countryBody = `
    <div class="space-y-0.5 max-h-[180px] overflow-y-auto">
      ${countries
        .map((c) =>
          checkboxRow(
            "countries",
            c.code,
            c.name,
            `<span class="inline-block w-5 h-3 bg-gray-100 rounded-sm text-[8px] text-gray-500 leading-3 text-center font-bold me-1">${c.code}</span>`
          )
        )
        .join("")}
    </div>
  `;

  const mgmtBody = `
    <div class="space-y-0.5 max-h-[160px] overflow-y-auto">
      ${mgmtCerts.map((c) => checkboxRow("mgmtCerts", c, c)).join("")}
    </div>
  `;

  const productCertBody = `
    <div class="space-y-0.5 max-h-[160px] overflow-y-auto">
      ${productCerts.map((c) => checkboxRow("productCerts", c, c)).join("")}
    </div>
  `;

  const platformBody = chipGroup(
    platformYears.map((y) => chipRow("platformYears", String(y), t("checkoutMfr.yearsAndAbove", { count: y }))).join("")
  );

  const onTimeBody = chipGroup(
    onTime.map((v) => chipRow("onTimeRate", v, v === "100" ? `%${v}` : t("checkoutMfr.percentAndAbove", { value: v }))).join("")
  );

  const respBody = chipGroup(
    respHours.map((v) => chipRow("responseHours", v, t("checkoutMfr.hoursOrLess", { count: v }))).join("")
  );

  const reorderBody = chipGroup(
    reorder.map((v) => chipRow("reorderRate", v, t("checkoutMfr.percentAndAbove", { value: v }))).join("")
  );

  return `
    <aside
      class="w-full lg:w-60 xl:w-64 flex-shrink-0 rounded-md border flex flex-col"
      aria-label="${t("checkoutMfr.supplierFilters")}"
      x-data="manufacturerFilters"
      style="background: var(--filter-bg, #ffffff); border-color: var(--filter-border-color, #e5e7eb);"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 class="text-[15px] font-bold" style="color: var(--filter-heading-color, #111827);">${t("products.filters")}</h2>
        <button
          type="button"
          class="th-btn-link !p-0 text-[12px] font-medium"
          @click="clearAll()"
        >${t("products.filterClearAll")}</button>
      </div>

      <!-- Sections -->
      <div class="px-4 pb-2">
        ${section({ id: "store-reviews", title: t("products.filterStoreReviews"), body: ratingsBody })}
        ${section({ id: "min-order", title: t("products.filterMinOrder"), body: moqBody })}
        ${section({ id: "supplier-country", title: t("products.filterSupplierCountry"), body: countryBody })}
        ${section({ id: "mgmt-certifications", title: t("products.filterMgmtCertifications"), body: mgmtBody })}
        ${section({ id: "product-certifications", title: t("products.filterProductCertifications"), body: productCertBody })}
        ${section({ id: "platform-years", title: t("checkoutMfr.yearsOnPlatform"), body: platformBody })}
        ${section({ id: "ontime", title: t("checkoutMfr.onTimeDelivery"), body: onTimeBody })}
        ${section({ id: "response-time", title: t("checkoutMfr.responseTime"), body: respBody })}
        ${section({ id: "reorder-rate", title: t("checkoutMfr.reorderRate"), body: reorderBody })}
      </div>

      <!-- Sticky apply button -->
      <div
        class="lg:sticky lg:bottom-0 z-10 px-4 py-3 border-t"
        style="background: var(--filter-bg, #ffffff); border-color: var(--filter-divider-color, #e5e7eb);"
      >
        <button
          type="button"
          class="th-btn w-full"
          @click="apply()"
        >${t("products.filterApply")}</button>
      </div>
    </aside>
  `;
}

/**
 * Alpine `manufacturerFilters` data — URL ⟷ state senkronu.
 */
export function initManufacturerFilters(): void {
  if (typeof window === "undefined") return;
  if (window.__mfrFiltersInited) return;
  window.__mfrFiltersInited = true;

  const params = new URLSearchParams(window.location.search);

  document.addEventListener("alpine:init", () => {
    const Alpine = window.Alpine;
    if (!Alpine) return;

    Alpine.data("manufacturerFilters", () => ({
      collapsed: {
        "store-reviews": false,
        "min-order": false,
        "supplier-country": false,
        "mgmt-certifications": false,
        "product-certifications": false,
        "platform-years": false,
        ontime: false,
        "response-time": false,
        "reorder-rate": false,
      } as Record<string, boolean>,
      rating: params.get("min_rating") || "",
      moqMax: params.get("moq_max") || "",
      countries: (params.get("countries") || "").split(",").filter(Boolean),
      mgmtCerts: (params.get("mgmt_certs") || "").split(",").filter(Boolean),
      productCerts: (params.get("product_certs") || "").split(",").filter(Boolean),
      platformYears: params.get("platform_years") || "",
      onTimeRate: params.get("ontime") || "",
      responseHours: params.get("resp_hours") || "",
      reorderRate: params.get("reorder") || "",

      toggleSection(id: string) {
        this.collapsed[id] = !this.collapsed[id];
      },

      apply() {
        const url = new URL(window.location.href);
        const p = url.searchParams;
        // URL query param yazıcısı — primitive veya string[] (countries gibi multi-select)
        // değerleri kabul eder. Boş/null/[] → key silinir.
        const setOrDel = (k: string, v: string | number | string[] | null | undefined) => {
          if (v === "" || v == null || (Array.isArray(v) && v.length === 0)) p.delete(k);
          else p.set(k, Array.isArray(v) ? v.join(",") : String(v));
        };
        setOrDel("min_rating", this.rating);
        setOrDel("moq_max", this.moqMax);
        setOrDel("countries", this.countries);
        setOrDel("mgmt_certs", this.mgmtCerts);
        setOrDel("product_certs", this.productCerts);
        setOrDel("platform_years", this.platformYears);
        setOrDel("ontime", this.onTimeRate);
        setOrDel("resp_hours", this.responseHours);
        setOrDel("reorder", this.reorderRate);
        window.history.replaceState({}, "", url.toString());
        document.dispatchEvent(new CustomEvent("manufacturer-filters-changed"));
      },

      clearAll() {
        this.rating = "";
        this.moqMax = "";
        this.countries = [];
        this.mgmtCerts = [];
        this.productCerts = [];
        this.platformYears = "";
        this.onTimeRate = "";
        this.responseHours = "";
        this.reorderRate = "";
        this.apply();
      },
    }));
  });
}
