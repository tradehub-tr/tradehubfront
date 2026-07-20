/**
 * Fiyat facet'i — histogram + çift tutamaçlı (dual-range) slider.
 *
 * Backend `get_filter_facets` `priceRange` (TRY baz, eşit-genişlikli bucket'lar) döndürür.
 * Burada bar'lar çizilir ve slider ölçeklenir (görüntüleme birimine çevrilerek). Kullanıcı
 * tutamacı bırakınca değerler Min/Maks input'larına yazılıp mevcut "apply" akışı tetiklenir
 * (filterEngine `data-filter-action="apply"` delegation'ı) — böylece tek fetch yolu korunur.
 */
import { convertPrice } from "../../services/currencyService";
import type { FilterFacets } from "../../services/listingService";

const SLIDER_MAX = 1000; // slider granularity (0..1000 → gerçek fiyat aralığına ölçeklenir)

interface PriceScale {
  lo: number;
  hi: number;
}
// Her price-filter kökü için çevrilmiş min/max fiyat aralığı (slider değeri → gerçek fiyat).
const scales = new WeakMap<HTMLElement, PriceScale>();

const priceFromSlider = (v: number, s: PriceScale): number =>
  Math.round((s.lo + (v / SLIDER_MAX) * (s.hi - s.lo)) * 100) / 100;

const sliderFromPrice = (p: number, s: PriceScale): number =>
  s.hi > s.lo ? Math.round(((p - s.lo) / (s.hi - s.lo)) * SLIDER_MAX) : 0;

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

function updateFill(root: HTMLElement): void {
  const minH = root.querySelector<HTMLInputElement>('[data-price-handle="min"]');
  const maxH = root.querySelector<HTMLInputElement>('[data-price-handle="max"]');
  const fill = root.querySelector<HTMLElement>("[data-price-fill]");
  if (!minH || !maxH || !fill) return;
  const lo = (Number(minH.value) / SLIDER_MAX) * 100;
  const hi = (Number(maxH.value) / SLIDER_MAX) * 100;
  fill.style.left = `${lo}%`;
  fill.style.width = `${Math.max(hi - lo, 0)}%`;
}

/** Facet geldiğinde: histogram bar'larını çiz, slider'ı ölçekle, mevcut seçimi koru. */
export function updatePriceFacet(facets: FilterFacets): void {
  const pr = facets.priceRange;
  document.querySelectorAll<HTMLElement>("[data-price-filter]").forEach((root) => {
    const histo = root.querySelector<HTMLElement>("[data-price-histogram]");
    const slider = root.querySelector<HTMLElement>("[data-price-slider]");
    if (!histo || !slider) return;

    if (!pr || !pr.buckets.length || pr.max <= pr.min) {
      histo.innerHTML = "";
      slider.classList.add("hidden");
      scales.delete(root);
      return;
    }

    // Backend TRY baz → görüntüleme birimi.
    const scale: PriceScale = { lo: convertPrice(pr.min, "TRY"), hi: convertPrice(pr.max, "TRY") };
    scales.set(root, scale);

    const maxCount = Math.max(...pr.buckets.map((b) => b.count), 1);
    histo.innerHTML = pr.buckets
      .map((b) => {
        const h = Math.max(Math.round((b.count / maxCount) * 100), 4);
        return `<div class="flex-1 rounded-t-sm bg-[var(--color-primary-500,#f5b800)]/40" style="height:${h}%"></div>`;
      })
      .join("");

    // Mevcut Min/Maks input seçimi varsa slider tutamaçlarını ona hizala; yoksa uçlara.
    const minInput = root.querySelector<HTMLInputElement>('[data-filter-type="min"]');
    const maxInput = root.querySelector<HTMLInputElement>('[data-filter-type="max"]');
    const minH = slider.querySelector<HTMLInputElement>('[data-price-handle="min"]');
    const maxH = slider.querySelector<HTMLInputElement>('[data-price-handle="max"]');
    if (minH) {
      const p = minInput?.value ? parseFloat(minInput.value) : scale.lo;
      minH.value = String(clamp(sliderFromPrice(p, scale), 0, SLIDER_MAX));
    }
    if (maxH) {
      const p = maxInput?.value ? parseFloat(maxInput.value) : scale.hi;
      maxH.value = String(clamp(sliderFromPrice(p, scale), 0, SLIDER_MAX));
    }

    slider.classList.remove("hidden");
    updateFill(root);
  });
}

let slidersInited = false;

/** Slider drag delegation — bir kez init'te kurulur (desktop + mobile sidebar ortak). */
export function initPriceSliders(): void {
  if (slidersInited) return; // document-level delegation'ı tek sefer bağla
  slidersInited = true;
  // Sürükleme sırasında: tutamaçları çakışmadan tut, fill + Min/Maks input'u canlı güncelle.
  document.addEventListener("input", (e) => {
    const handle = (e.target as HTMLElement).closest?.<HTMLInputElement>("[data-price-handle]");
    if (!handle) return;
    const root = handle.closest<HTMLElement>("[data-price-filter]");
    const scale = root ? scales.get(root) : null;
    if (!root || !scale) return;

    const minH = root.querySelector<HTMLInputElement>('[data-price-handle="min"]');
    const maxH = root.querySelector<HTMLInputElement>('[data-price-handle="max"]');
    if (!minH || !maxH) return;
    // Tutamaçların yer değiştirmesini engelle (min ≤ max).
    if (handle.dataset.priceHandle === "min" && Number(minH.value) > Number(maxH.value)) {
      minH.value = maxH.value;
    } else if (handle.dataset.priceHandle === "max" && Number(maxH.value) < Number(minH.value)) {
      maxH.value = minH.value;
    }

    const minInput = root.querySelector<HTMLInputElement>('[data-filter-type="min"]');
    const maxInput = root.querySelector<HTMLInputElement>('[data-filter-type="max"]');
    if (minInput) minInput.value = String(priceFromSlider(Number(minH.value), scale));
    if (maxInput) maxInput.value = String(priceFromSlider(Number(maxH.value), scale));
    updateFill(root);
  });

  // Tutamaç bırakılınca (change): filtreyi uygula — Min/Maks input zaten dolu, apply'ı tetikle.
  document.addEventListener("change", (e) => {
    const handle = (e.target as HTMLElement).closest?.<HTMLInputElement>("[data-price-handle]");
    if (!handle) return;
    const root = handle.closest<HTMLElement>("[data-price-filter]");
    root?.querySelector<HTMLButtonElement>('[data-filter-action="apply"]')?.click();
  });
}
