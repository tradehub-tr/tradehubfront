/**
 * CategoryDrillSheet — paylaşılan mobil drill-down kategori sheet'i.
 *
 * Yığın-tabanlı (navStack) navigasyon: bir kategoriye dokununca içeri girilir
 * (içerik komple değişir), başlık o kategorinin adı olur, geri tuşu çıkar.
 * Yaprak / "Tüm {Kategori}" satırı seçilince `onSelect(slug)` çağrılır ve sheet
 * kapanır. Hem üreticiler kategori çubuğu (CategoryNavBar) hem ana sayfa hero
 * kategori çubuğu (MobileCategoryBar) bunu kullanır — tek drill kaynağı.
 *
 * Sheet kabuğu (overlay/kapat/escape/swipe/setTitle/showBack/onBack) paylaşılan
 * BottomSheet component'inden gelir; bu helper sadece gövde render + navigasyonu
 * yönetir. Sheet HTML'i tüketici tarafından (BottomSheet(...)) önceden basılır.
 */

import { escapeHtml } from "../../utils/sanitize";
import { initBottomSheet } from "./BottomSheet";

/**
 * Minimal recursive kategori tipi. `children` opsiyonel tutulur ki hem
 * CategoryNavBar.ApiCategory (children zorunlu) hem categoryService.ApiCategory
 * (children: ApiCategoryChild[], iç içe opsiyonel) cast'siz atanabilsin.
 */
export interface DrillCategory {
  name: string;
  slug: string;
  children?: DrillCategory[];
}

export interface CategoryDrillSheetConfig {
  /** BottomSheet id (örn "mcb-sheet" / "hm-mobile-cat"). */
  sheetId: string;
  /** Sheet'i açan buton id (örn "mcb-dropdown-btn" / "hm-mobile-cat-more"). */
  triggerId: string;
  /** Sheet gövdesindeki <ul> seçicisi (rows buraya basılır). */
  listSelector: string;
  categories: DrillCategory[];
  /** Kök seviyesi başlığı (örn "Tüm kategoriler"). */
  rootLabel: string;
  /** İçerideyken "Tümü" satırı etiketi (örn name => `Tüm ${name}`). */
  allInCategoryLabel: (name: string) => string;
  onSelect: (slug: string) => void;
  getActiveSlug: () => string;
}

export interface CategoryDrillController {
  /** Aktif (✓) işaretini yeniden hesaplar (sheet açıkken dış senkron için). */
  syncActive: () => void;
}

export function initCategoryDrillSheet(
  cfg: CategoryDrillSheetConfig
): CategoryDrillController | null {
  const listUl = document.querySelector<HTMLElement>(cfg.listSelector);
  if (!listUl) return null;

  const navStack: DrillCategory[] = [];
  let levelCats: DrillCategory[] = cfg.categories;

  // Seçilebilir satır: yaprak kategori ya da "Tümü" (bu seviyenin tamamını seçer).
  const selectRow = (name: string, slug: string, prominent = false): string => `
    <li class="${prominent ? "border-b border-gray-100" : "border-b border-gray-50 last:border-0"}">
      <button type="button" data-cat-slug="${escapeHtml(slug)}"
        class="th-no-press w-full flex items-center justify-between px-5 py-3.5 text-[14px] ${prominent ? "font-semibold text-primary-600" : "text-gray-700"} cursor-pointer hover:bg-gray-50 bg-transparent border-0 text-start">
        <span>${escapeHtml(name)}</span>
        <svg data-check class="hidden w-5 h-5 text-primary-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
      </button>
    </li>`;

  // İçine girilebilir satır (alt kategorisi var): dokununca o seviyeye iner (ileri ok).
  const drillRow = (name: string, idx: number): string => `
    <li class="border-b border-gray-50 last:border-0">
      <button type="button" data-cat-drill="${idx}"
        class="th-no-press w-full flex items-center justify-between px-5 py-3.5 text-[14px] font-medium text-gray-800 cursor-pointer hover:bg-gray-50 bg-transparent border-0 text-start">
        <span>${escapeHtml(name)}</span>
        <svg class="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      </button>
    </li>`;

  const markActive = (): void => {
    const cur = cfg.getActiveSlug();
    listUl
      .querySelectorAll<HTMLElement>("[data-cat-slug]")
      .forEach((el) =>
        el.querySelector("[data-check]")?.classList.toggle("hidden", (el.dataset.catSlug || "") !== cur)
      );
  };

  const renderSheet = (): void => {
    const current = navStack[navStack.length - 1] ?? null;
    levelCats = current ? current.children ?? [] : cfg.categories;
    sheet?.setTitle(current ? current.name : cfg.rootLabel);
    sheet?.showBack(navStack.length > 0);

    listUl.innerHTML = [
      // Sadece içerdeyken "Tüm {Kategori}" (bu kategorinin tamamını seç). Kökte
      // gerek yok; header başlığı zaten kök etiketi.
      ...(current ? [selectRow(cfg.allInCategoryLabel(current.name), current.slug, true)] : []),
      ...levelCats.map((cat, i) =>
        cat.children?.length ? drillRow(cat.name, i) : selectRow(cat.name, cat.slug)
      ),
    ].join("");
    markActive();

    // İçerik tamamen değiştiği için yumuşak fade-in (opacity-only, motion-reduce hariç)
    listUl.classList.remove("transition", "duration-200", "ease-out");
    listUl.classList.add("opacity-0");
    requestAnimationFrame(() => {
      listUl.classList.add("transition", "duration-200", "ease-out", "motion-reduce:transition-none");
      listUl.classList.remove("opacity-0");
    });
  };

  const sheet = initBottomSheet(cfg.sheetId);

  listUl.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const drill = target.closest<HTMLElement>("[data-cat-drill]");
    if (drill) {
      const cat = levelCats[Number(drill.dataset.catDrill)];
      if (cat) {
        navStack.push(cat);
        renderSheet();
      }
      return;
    }
    const sel = target.closest<HTMLElement>("[data-cat-slug]");
    if (sel) {
      sheet.close();
      cfg.onSelect(sel.dataset.catSlug || "");
    }
  });

  sheet.onBack(() => {
    navStack.pop();
    renderSheet();
  });

  document.getElementById(cfg.triggerId)?.addEventListener("click", () => {
    navStack.length = 0; // her açılışta kökten başla
    renderSheet();
    sheet.open();
  });

  return { syncActive: markActive };
}
