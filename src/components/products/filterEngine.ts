/**
 * Filter Engine — Server-side filtering via backend API
 *
 * Captures filter/sort changes from FilterSidebar and SearchHeader,
 * builds API parameters, and calls searchListings() with debounce.
 * Uses document-level event delegation for both desktop sidebar and mobile drawer.
 */

import type { ProductListingCard } from "../../types/productListing";
import { searchListings, type ListingSearchParams } from "../../services/listingService";

/* ── Types ── */

export interface FilterState {
  priceMin: number | null;
  priceMax: number | null;
  minOrder: number | null;
  supplierCountries: string[];
  brands: string[];
  /** Onaylanmış Satıcı filter — true ise sadece KYB Verified satıcıların listing'leri */
  verifiedSupplier: boolean;
  /** Yönetim sertifikaları (ör: ISO 9001, BSCI) */
  mgmtCertifications: string[];
  /** Ürün sertifikaları (ör: CE, FCC) */
  productCertifications: string[];
  /** attribute_code → selected values (OR within attribute, AND across attributes) */
  attributes: Record<string, string[]>;
}

export type SortKey =
  | "best-match"
  | "orders"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "min-order"
  | "supplier-rating";

/** Maps frontend sort keys to backend sort_by parameter */
const SORT_MAP: Record<SortKey, string> = {
  "best-match": "relevance",
  orders: "orders",
  newest: "newest",
  "price-asc": "price_asc",
  "price-desc": "price_desc",
  "min-order": "orders",
  "supplier-rating": "rating",
};

export interface FilterEngineOptions {
  /** Base search parameters (query, category) from URL */
  baseParams: ListingSearchParams;
  /** Page size for pagination */
  pageSize?: number;
  /** Callback when API returns new results */
  onUpdate: (
    products: ProductListingCard[],
    total: number,
    page: number,
    totalPages: number,
    hasNext: boolean,
    hasPrev: boolean
  ) => void;
  /** Callback when loading starts */
  onLoading?: () => void;
  /** Callback on error */
  onError?: (err: unknown) => void;
}

export interface FilterEngine {
  getState: () => Readonly<FilterState>;
  getSortKey: () => SortKey;
  /** Navigate to a specific page */
  goToPage: (page: number) => void;
  /** Force a refresh with current filters */
  refresh: () => void;
  destroy: () => void;
}

/* ── Helpers ── */

/**
 * Locale-aware ondalık sayı parse — TR kullanıcı virgül (1,5), EN kullanıcı nokta (1.5)
 * yazabilir. parseFloat virgülü görmezden gelir → veri kaybı. Bu helper iki ayracı da
 * destekler: önce virgülü noktaya çevirir, sonra parseFloat eder.
 */
function parseLocaleFloat(value: string | null | undefined): number | null {
  if (!value) return null;
  const normalized = value.toString().trim().replace(",", ".");
  if (!normalized) return null;
  const num = parseFloat(normalized);
  return Number.isFinite(num) ? num : null;
}

/**
 * Defansif parseInt — tam sayı (sipariş adet vb.). NaN/Infinity → null,
 * negatif/0 → null (kullanıcı UX: "0 adet" anlamsız), ondalık → truncate.
 */
function parsePositiveInt(value: string | null | undefined): number | null {
  if (!value) return null;
  const num = parseInt(value.toString(), 10);
  if (!Number.isFinite(num) || num <= 0) return null;
  return num;
}

function createDefaultState(): FilterState {
  return {
    priceMin: null,
    priceMax: null,
    minOrder: null,
    supplierCountries: [],
    brands: [],
    verifiedSupplier: false,
    mgmtCertifications: [],
    productCertifications: [],
    attributes: {},
  };
}

/** Debounce helper */
function debounce(fn: () => void, ms: number): () => void {
  let timer: ReturnType<typeof setTimeout>;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(fn, ms);
  };
}

/* ── Engine ── */

export function initFilterEngine(options: FilterEngineOptions): FilterEngine {
  const { baseParams, onUpdate, onLoading, onError, pageSize = 40 } = options;
  const state = createDefaultState();
  let currentSort: SortKey = "best-match";
  let currentPage = 1;
  let abortCtrl: AbortController | null = null;
  const ac = new AbortController();
  const { signal } = ac;

  /** Build API params from current filter state */
  function buildParams(): ListingSearchParams {
    const params: ListingSearchParams = {
      ...baseParams,
      page: currentPage,
      page_size: pageSize,
    };

    // Sort
    params.sort_by = SORT_MAP[currentSort] || "relevance";

    // Price range
    if (state.priceMin !== null) params.min_price = state.priceMin;
    if (state.priceMax !== null) params.max_price = state.priceMax;

    // Min order
    if (state.minOrder !== null) (params as any).min_order = state.minOrder;

    // Onaylanmış Satıcı filter (KYB Verified)
    if (state.verifiedSupplier) (params as any).verified_supplier = 1;

    // Supplier countries — multi-select: backend comma-separated string'i parse edip
    // ["in", list] filter'ına çevirir (Admin Seller Profile.country alanı üzerinde).
    if (state.supplierCountries.length > 0) {
      params.country = state.supplierCountries.join(",");
    }

    // Management certifications (state-bazlı; URL ile senkron)
    if (state.mgmtCertifications.length > 0) {
      (params as any).mgmt_certifications = state.mgmtCertifications.join(",");
    }

    // Product certifications (state-bazlı; URL ile senkron)
    if (state.productCertifications.length > 0) {
      (params as any).product_certifications = state.productCertifications.join(",");
    }

    // Brand multi-select
    if (state.brands.length > 0) {
      params.brands = state.brands.join(",");
    }

    // Dynamic attribute filters → "CODE:V1,V2|CODE2:V"
    const attrEntries = Object.entries(state.attributes).filter(([, vs]) => vs.length > 0);
    if (attrEntries.length > 0) {
      params.attrs = attrEntries.map(([code, vals]) => `${code}:${vals.join(",")}`).join("|");
    }

    return params;
  }

  /** Fetch from backend with current filters */
  async function fetchResults(): Promise<void> {
    // Cancel any in-flight request
    if (abortCtrl) abortCtrl.abort();
    abortCtrl = new AbortController();

    onLoading?.();

    try {
      const params = buildParams();
      const result = await searchListings(params);

      syncToUrl();

      onUpdate(
        result.products,
        result.searchHeader.totalProducts,
        result.searchHeader.currentPage || currentPage,
        result.searchHeader.totalPages || 1,
        result.hasNext,
        result.hasPrev
      );
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        onError?.(err);
      }
    }
  }

  const debouncedFetch = debounce(fetchResults, 300);

  /** Sync current filter state to URL query parameters */
  function syncToUrl(): void {
    const url = new URL(window.location.href);
    const p = url.searchParams;

    // Preserve base params (q, cat/category)
    // Update filter params
    if (state.priceMin !== null) p.set("min_price", String(state.priceMin));
    else p.delete("min_price");
    if (state.priceMax !== null) p.set("max_price", String(state.priceMax));
    else p.delete("max_price");
    if (state.minOrder !== null) p.set("min_order", String(state.minOrder));
    else p.delete("min_order");
    if (state.verifiedSupplier) p.set("verified_supplier", "1");
    else p.delete("verified_supplier");
    if (state.supplierCountries.length > 0) p.set("country", state.supplierCountries.join(","));
    else p.delete("country");
    if (state.brands.length > 0) p.set("brands", state.brands.join(","));
    else p.delete("brands");
    if (state.mgmtCertifications.length > 0)
      p.set("mgmt_certifications", state.mgmtCertifications.join(","));
    else p.delete("mgmt_certifications");
    if (state.productCertifications.length > 0)
      p.set("product_certifications", state.productCertifications.join(","));
    else p.delete("product_certifications");

    // Drop any previous attr_* params, then write current ones
    Array.from(p.keys())
      .filter((k) => k.startsWith("attr_"))
      .forEach((k) => p.delete(k));
    for (const [code, vals] of Object.entries(state.attributes)) {
      if (vals.length > 0) p.set(`attr_${code}`, vals.join(","));
    }

    if (currentSort !== "best-match") p.set("sort", currentSort);
    else p.delete("sort");
    if (currentPage > 1) p.set("page", String(currentPage));
    else p.delete("page");

    window.history.replaceState(null, "", url.toString());
  }

  /** Read filter state from URL query parameters (on page load) */
  function readFromUrl(): void {
    const p = new URLSearchParams(window.location.search);

    const minPrice = p.get("min_price");
    if (minPrice) state.priceMin = parseLocaleFloat(minPrice);
    const maxPrice = p.get("max_price");
    if (maxPrice) state.priceMax = parseLocaleFloat(maxPrice);
    const minOrder = p.get("min_order");
    if (minOrder) state.minOrder = parsePositiveInt(minOrder);
    const verifiedSupplier = p.get("verified_supplier");
    state.verifiedSupplier = verifiedSupplier === "1";
    const country = p.get("country");
    if (country) state.supplierCountries = country.split(",");
    const brands = p.get("brands");
    if (brands) state.brands = brands.split(",").filter(Boolean);
    const mgmtCerts = p.get("mgmt_certifications");
    if (mgmtCerts) state.mgmtCertifications = mgmtCerts.split(",").filter(Boolean);
    const prodCerts = p.get("product_certifications");
    if (prodCerts) state.productCertifications = prodCerts.split(",").filter(Boolean);
    for (const [key, val] of p.entries()) {
      if (key.startsWith("attr_") && val) {
        const code = key.slice(5);
        state.attributes[code] = val.split(",").filter(Boolean);
      }
    }
    const sort = p.get("sort") as SortKey | null;
    if (sort && sort in SORT_MAP) currentSort = sort;
    const page = p.get("page");
    if (page) currentPage = parseInt(page, 10);
  }

  /** Restore sidebar DOM elements from current filter state */
  function restoreSidebarFromState(): void {
    // Price inputs
    if (state.priceMin !== null) {
      document
        .querySelectorAll<HTMLInputElement>('[data-filter-section="price"][data-filter-type="min"]')
        .forEach((el) => (el.value = String(state.priceMin)));
    }
    if (state.priceMax !== null) {
      document
        .querySelectorAll<HTMLInputElement>('[data-filter-section="price"][data-filter-type="max"]')
        .forEach((el) => (el.value = String(state.priceMax)));
    }

    // Min order input
    if (state.minOrder !== null) {
      document
        .querySelectorAll<HTMLInputElement>(
          '[data-filter-section="min-order"][data-filter-type="value"]'
        )
        .forEach((el) => (el.value = String(state.minOrder)));
    }

    // Onaylanmış Satıcı checkbox (URL'den geliyorsa işaretle)
    if (state.verifiedSupplier) {
      const restoreVerified = () => {
        document
          .querySelectorAll<HTMLInputElement>(
            '[data-filter-section="verified-supplier"][data-filter-value="1"]'
          )
          .forEach((el) => (el.checked = true));
      };
      restoreVerified();
      setTimeout(restoreVerified, 1500);
    }

    // Yönetim sertifikaları (dinamik element — gecikmeli yeniden dene)
    if (state.mgmtCertifications.length > 0) {
      const restoreMgmt = () => {
        state.mgmtCertifications.forEach((cert) => {
          document
            .querySelectorAll<HTMLInputElement>(
              `[data-filter-section="mgmt-certifications"][data-filter-value="${cert}"]`
            )
            .forEach((el) => (el.checked = true));
        });
      };
      restoreMgmt();
      setTimeout(restoreMgmt, 1500);
    }

    // Ürün sertifikaları
    if (state.productCertifications.length > 0) {
      const restoreProd = () => {
        state.productCertifications.forEach((cert) => {
          document
            .querySelectorAll<HTMLInputElement>(
              `[data-filter-section="product-certifications"][data-filter-value="${cert}"]`
            )
            .forEach((el) => (el.checked = true));
        });
      };
      restoreProd();
      setTimeout(restoreProd, 1500);
    }

    // Supplier countries — dynamic elements may not exist yet, retry after delay
    if (state.supplierCountries.length > 0) {
      const restoreCountries = () => {
        state.supplierCountries.forEach((c) => {
          document
            .querySelectorAll<HTMLInputElement>(
              `[data-filter-section="supplier-country"][data-filter-value="${c}"]`
            )
            .forEach((el) => (el.checked = true));
        });
      };
      restoreCountries();
      setTimeout(restoreCountries, 1500);
    }

    // Brands (dynamic)
    if (state.brands.length > 0) {
      const restoreBrands = () => {
        state.brands.forEach((b) => {
          document
            .querySelectorAll<HTMLInputElement>(
              `[data-filter-section="brands"][data-filter-value="${b}"]`
            )
            .forEach((el) => (el.checked = true));
        });
      };
      restoreBrands();
      setTimeout(restoreBrands, 1500);
    }

    // Dynamic attributes
    const attrEntries = Object.entries(state.attributes);
    if (attrEntries.length > 0) {
      const restoreAttrs = () => {
        for (const [code, vals] of attrEntries) {
          const section = `attr-${code.toLowerCase()}`;
          vals.forEach((v) => {
            document
              .querySelectorAll<HTMLInputElement>(
                `[data-filter-section="${section}"][data-filter-value="${v}"]`
              )
              .forEach((el) => (el.checked = true));
          });
        }
      };
      restoreAttrs();
      setTimeout(restoreAttrs, 1500);
    }
  }

  // Initialize state from URL
  readFromUrl();
  // Restore sidebar DOM after a tick (elements need to be rendered first)
  requestAnimationFrame(() => restoreSidebarFromState());

  /** Reset page to 1 and fetch */
  function filterChanged(): void {
    currentPage = 1;
    debouncedFetch();
  }

  /** Sync matching checkboxes/radios across desktop + mobile sidebars */
  function syncDuplicateInputs(source: HTMLInputElement): void {
    const section = source.dataset.filterSection;
    const value = source.dataset.filterValue ?? source.value;
    if (!section) return;
    document
      .querySelectorAll<HTMLInputElement>(
        `[data-filter-section="${section}"][data-filter-value="${value}"]`
      )
      .forEach((el) => {
        if (el !== source) el.checked = source.checked;
      });
  }

  /* ── Checkbox / radio changes via event delegation ── */
  document.addEventListener(
    "change",
    (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (!target.dataset?.filterSection) return;

      // Keep desktop ↔ mobile sidebar in sync
      syncDuplicateInputs(target);

      const section = target.dataset.filterSection;
      const value = target.dataset.filterValue ?? target.value;

      switch (section) {
        case "supplier-country":
          if (target.checked) {
            if (!state.supplierCountries.includes(value)) {
              state.supplierCountries.push(value);
            }
          } else {
            state.supplierCountries = state.supplierCountries.filter((c) => c !== value);
          }
          break;

        case "brands":
          if (target.checked) {
            if (!state.brands.includes(value)) state.brands.push(value);
          } else {
            state.brands = state.brands.filter((b) => b !== value);
          }
          break;

        case "mgmt-certifications":
          if (target.checked) {
            if (!state.mgmtCertifications.includes(value)) state.mgmtCertifications.push(value);
          } else {
            state.mgmtCertifications = state.mgmtCertifications.filter((c) => c !== value);
          }
          break;

        case "product-certifications":
          if (target.checked) {
            if (!state.productCertifications.includes(value))
              state.productCertifications.push(value);
          } else {
            state.productCertifications = state.productCertifications.filter((c) => c !== value);
          }
          break;

        case "verified-supplier":
          state.verifiedSupplier = target.checked;
          break;

        default:
          // Dynamic attribute facets — data-filter-section starts with "attr-"
          if (section.startsWith("attr-")) {
            const code = target.dataset.attributeCode || section.slice(5).toUpperCase();
            const bucket = state.attributes[code] || (state.attributes[code] = []);
            if (target.checked) {
              if (!bucket.includes(value)) bucket.push(value);
            } else {
              state.attributes[code] = bucket.filter((v) => v !== value);
              if (state.attributes[code].length === 0) delete state.attributes[code];
            }
          }
          break;
      }

      filterChanged();
    },
    { signal }
  );

  /* ── Price range & min order "OK" buttons ── */
  document.addEventListener(
    "click",
    (e: Event) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>('[data-filter-action="apply"]');
      if (!target) return;

      const section = target.dataset.filterSection;
      if (!section) return;

      if (section === "price") {
        const minInput = document.querySelector<HTMLInputElement>(
          '[data-filter-section="price"][data-filter-type="min"]'
        );
        const maxInput = document.querySelector<HTMLInputElement>(
          '[data-filter-section="price"][data-filter-type="max"]'
        );
        state.priceMin = parseLocaleFloat(minInput?.value);
        state.priceMax = parseLocaleFloat(maxInput?.value);
        filterChanged();
      }

      if (section === "min-order") {
        const valueInput = document.querySelector<HTMLInputElement>(
          '[data-filter-section="min-order"][data-filter-type="value"]'
        );
        state.minOrder = parsePositiveInt(valueInput?.value);
        filterChanged();
      }
    },
    { signal }
  );

  /* ── Clear All ── */
  document.addEventListener(
    "click",
    (e: Event) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>(
        '[data-filter-action="clear-all"]'
      );
      if (!target) return;

      Object.assign(state, createDefaultState());
      currentSort = "best-match";

      // Also clear all sidebar checkboxes, radios, inputs
      document.querySelectorAll<HTMLInputElement>("[data-filter-section]").forEach((el) => {
        if (el.type === "checkbox" || el.type === "radio") el.checked = false;
        else if (el.type === "number" || el.type === "text") el.value = "";
      });

      filterChanged();
    },
    { signal }
  );

  /* ── Generic filter-change (re-read all non-checkbox state from DOM) ── */
  document.addEventListener(
    "filter-change",
    () => {
      // Price inputs
      const priceMin = document.querySelector<HTMLInputElement>(
        '[data-filter-section="price"][data-filter-type="min"]'
      );
      const priceMax = document.querySelector<HTMLInputElement>(
        '[data-filter-section="price"][data-filter-type="max"]'
      );
      state.priceMin = parseLocaleFloat(priceMin?.value);
      state.priceMax = parseLocaleFloat(priceMax?.value);

      // Min order input
      const moqInput = document.querySelector<HTMLInputElement>(
        '[data-filter-section="min-order"][data-filter-type="value"]'
      );
      state.minOrder = parsePositiveInt(moqInput?.value);

      // Supplier countries
      const countryCheckboxes = document.querySelectorAll<HTMLInputElement>(
        '[data-filter-section="supplier-country"]:checked'
      );
      state.supplierCountries = Array.from(countryCheckboxes)
        .map((cb) => cb.value || cb.dataset.filterValue || "")
        .filter(Boolean);

      // Onaylanmış Satıcı checkbox
      const verifiedCb = document.querySelector<HTMLInputElement>(
        '[data-filter-section="verified-supplier"]:checked'
      );
      state.verifiedSupplier = !!verifiedCb;

      // Yönetim sertifikaları
      const mgmtCertCbs = document.querySelectorAll<HTMLInputElement>(
        '[data-filter-section="mgmt-certifications"]:checked'
      );
      state.mgmtCertifications = Array.from(mgmtCertCbs)
        .map((cb) => cb.value || cb.dataset.filterValue || "")
        .filter(Boolean);

      // Ürün sertifikaları
      const prodCertCbs = document.querySelectorAll<HTMLInputElement>(
        '[data-filter-section="product-certifications"]:checked'
      );
      state.productCertifications = Array.from(prodCertCbs)
        .map((cb) => cb.value || cb.dataset.filterValue || "")
        .filter(Boolean);

      filterChanged();
    },
    { signal }
  );

  /* ── Sorting from SearchHeader ── */
  document.addEventListener(
    "sort-change",
    ((e: CustomEvent) => {
      currentSort = (e.detail?.value as SortKey) || "best-match";
      filterChanged();
    }) as EventListener,
    { signal }
  );

  /* ── Browser back/forward support ── */
  window.addEventListener(
    "popstate",
    () => {
      Object.assign(state, createDefaultState());
      currentSort = "best-match";
      currentPage = 1;
      readFromUrl();
      fetchResults();
    },
    { signal }
  );

  return {
    getState: () => ({ ...state }),
    getSortKey: () => currentSort,
    goToPage: (page: number) => {
      currentPage = page;
      fetchResults();
    },
    refresh: () => fetchResults(),
    destroy: () => {
      ac.abort();
      if (abortCtrl) abortCtrl.abort();
    },
  };
}
