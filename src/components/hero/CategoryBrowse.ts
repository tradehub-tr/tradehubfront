/**
 * CategoryBrowse Component
 * iSTOC-style vertical category list placed below the welcome bar.
 * Clicking a category opens a popup modal with sidebar + product grid.
 * Kategoriler API'den dinamik olarak yüklenir (categoryService).
 */

import { onCategoriesLoaded } from "../../services/categoryService";
import type { ApiCategory } from "../../services/categoryService";
import { getCategoryIcon, getIconByName } from "../header";
import { t } from "../../i18n";
import { getRecentCategories } from "../../utils/recentCategories";

/* ──── Subcategory item renderer ──── */

function renderSubcategoryItem(name: string, slug: string, image?: string): string {
  const placeholderSvg = `<svg class="w-8 h-8 lg:w-10 lg:h-10" style="color:var(--catpopup-icon)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75Z"/></svg>`;
  const inner = image
    ? `<img src="${image}" alt="${name}" class="w-full h-full object-cover" loading="lazy" onerror="this.outerHTML=this.dataset.fallback" data-fallback='${placeholderSvg.replace(/'/g, "&apos;")}' />`
    : placeholderSvg;
  return `
    <a href="/pages/products.html?cat=${slug}" class="flex flex-col items-center gap-2 group/product">
      <div class="relative w-20 h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 rounded-full flex items-center justify-center overflow-hidden group-hover/product:ring-2 transition-all" style="background-color:var(--catpopup-product-bg);--tw-ring-color:var(--catpopup-sidebar-active-border)">
        ${inner}
      </div>
      <span class="text-xs lg:text-sm text-center leading-tight transition-colors duration-150 max-w-[80px] lg:max-w-[100px] xl:max-w-[120px]" style="color:var(--catpopup-text)">${name}</span>
    </a>
  `;
}

/* ──── Skeleton helpers ──── */

function renderBrowseListSkeleton(): string {
  return Array.from(
    { length: 6 },
    () => `
    <li>
      <div class="flex items-center w-full animate-pulse" style="min-height:44px;padding:6px 16px;gap:12px">
        <div class="w-5 h-5 rounded bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
        <div class="h-3.5 rounded bg-gray-200 dark:bg-gray-700 flex-1"></div>
      </div>
    </li>
  `
  ).join("");
}

function renderPopupSidebarSkeleton(): string {
  return Array.from(
    { length: 8 },
    () => `
    <li class="flex-shrink-0 lg:flex-shrink">
      <div class="flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-2.5 animate-pulse">
        <div class="w-5 h-5 rounded bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
        <div class="h-3 rounded bg-gray-200 dark:bg-gray-700 w-24"></div>
      </div>
    </li>
  `
  ).join("");
}

/* ──── Popup modal ──── */

function renderCategoryPopup(): string {
  return `
    <!-- Category Popup Overlay -->
    <div id="cat-popup-overlay" class="fixed inset-0 z-(--z-backdrop) bg-black/50 opacity-0 pointer-events-none transition-opacity duration-200"></div>

    <!-- Category Popup Panel -->
    <div id="cat-popup-panel" class="fixed inset-0 z-(--z-modal) flex items-end lg:items-start justify-center lg:pt-20 opacity-0 pointer-events-none transition-opacity duration-200">
      <div id="cat-popup-sheet" class="rounded-t-md lg:rounded-md shadow-2xl border w-full lg:max-w-7xl max-h-[85vh] lg:max-h-[80vh] flex flex-col overflow-hidden transition-transform duration-200 will-change-transform" style="background-color:var(--catpopup-bg);border-color:var(--catpopup-border)">

        <!-- Drag handle (mobile) -->
        <div id="cat-popup-drag-handle" class="lg:hidden flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing flex-shrink-0">
          <div class="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></div>
        </div>

        <!-- Header -->
        <div id="cat-popup-header" class="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4 border-b flex-shrink-0 select-none" style="border-color:var(--catpopup-border)">
          <h2 id="cat-popup-title" class="text-lg font-bold" style="color:var(--catpopup-heading)"><span data-i18n="categoryBrowse.title">${t("categoryBrowse.title")}</span></h2>
          <div class="flex items-center gap-4">
            <a href="/featured" class="text-sm hidden lg:inline transition-colors duration-150 hover:text-(--catpopup-link-hover)" style="color:var(--catpopup-link)"><span data-i18n="categoryBrowse.browseDesc">${t("categoryBrowse.browseDesc")}</span></a>
            <button id="cat-popup-close" class="p-1.5 transition-colors" style="color:var(--catpopup-close-color)" aria-label="Close">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Body: sidebar + content -->
        <div class="flex flex-col lg:flex-row flex-1 min-h-0">
          <!-- Sidebar (loading skeleton, replaced after API) -->
          <div class="w-full lg:w-56 lg:flex-shrink-0 border-b lg:border-b-0 lg:border-r overflow-x-auto lg:overflow-x-visible overflow-y-auto" style="background-color:var(--catpopup-sidebar-bg);border-color:var(--catpopup-border)" id="cat-popup-sidebar">
            <ul id="cat-popup-sidebar-list" class="py-1 flex lg:block overflow-x-auto lg:overflow-x-visible gap-1 px-2 lg:px-0">
              ${renderPopupSidebarSkeleton()}
            </ul>
          </div>

          <!-- Content (empty, filled after API) -->
          <div class="flex-1 overflow-y-auto px-4 lg:px-6 py-5" id="cat-popup-content">
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ──── Main component ──── */

export function CategoryBrowse(): string {
  return `
        <div class="left-panel group/panel relative h-[304px] w-full flex-shrink-0 overflow-hidden rounded-md xl:w-[300px] dark:border-gray-700 dark:bg-gray-800" style="background-color:#F8F8F8;border:1px solid #EAEAEA">
          <!-- Category List (loading skeleton, replaced after API) -->
          <ul id="category-browse-list" class="overflow-y-auto h-full">
            ${renderBrowseListSkeleton()}
          </ul>
          <!-- View All: floating pill button at bottom (visible on hover) -->
          <button
            type="button"
            id="category-browse-view-all"
            class="th-no-press absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full border bg-white cursor-pointer opacity-0 group-hover/panel:opacity-100 transition-opacity whitespace-nowrap" style="color:#222222;border-color:#E5E5E5;font-family:var(--font-sans);line-height:1.2"
          >
            <span data-i18n="categoryBrowse.viewAll">${t("categoryBrowse.viewAll")}</span>
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 5 7 7-7 7"/>
            </svg>
          </button>
        </div>

    <!-- Category Popup Modal -->
    ${renderCategoryPopup()}
  `;
}

/* ──── Init: click handlers, sidebar navigation, close ──── */

export function initCategoryBrowse(): void {
  const overlay = document.getElementById("cat-popup-overlay");
  const panel = document.getElementById("cat-popup-panel");
  const closeBtn = document.getElementById("cat-popup-close");
  const title = document.getElementById("cat-popup-title");
  const viewAllBtn = document.getElementById("category-browse-view-all");

  if (!overlay || !panel || !closeBtn || !title) return;

  const ACT = ["th-catpopup-sidebar-item--active"];
  const INACT: string[] = [];

  function openPopup(categoryId: string): void {
    overlay!.style.opacity = "1";
    overlay!.style.pointerEvents = "auto";
    panel!.style.opacity = "1";
    panel!.style.pointerEvents = "auto";
    document.body.style.overflow = "hidden";
    showCategory(categoryId);
  }

  function closePopup(): void {
    overlay!.style.opacity = "0";
    overlay!.style.pointerEvents = "none";
    panel!.style.opacity = "0";
    panel!.style.pointerEvents = "none";
    document.body.style.overflow = "";
  }

  let _cats: ApiCategory[] = [];

  function showCategory(categoryId: string): void {
    const titleSpan = title!.querySelector("span");
    if (categoryId === "for-you") {
      if (titleSpan) titleSpan.textContent = t("categoryBrowse.headerForYou");
      refreshForYouSection();
    } else {
      const cat = _cats.find((c) => c.id === categoryId);
      if (cat && titleSpan) titleSpan.textContent = cat.name;
    }

    const sidebarBtns = document.querySelectorAll<HTMLButtonElement>(".cat-popup-btn");
    sidebarBtns.forEach((btn) => {
      btn.classList.remove(...ACT);
      btn.classList.add(...INACT);
    });
    const activeBtn = document.querySelector<HTMLButtonElement>(
      `.cat-popup-btn[data-category="${categoryId}"]`
    );
    if (activeBtn) {
      activeBtn.classList.remove(...INACT);
      activeBtn.classList.add(...ACT);
    }

    const sections = document.querySelectorAll<HTMLElement>(".cat-popup-section");
    sections.forEach((sec) => {
      sec.classList.toggle("hidden", sec.getAttribute("data-popup-section") !== categoryId);
    });
  }

  /**
   * "Sizin için kategoriler" section'ını günceller.
   * Önce localStorage'daki son ziyaretler (recentCategories), kalan boşluğu
   * tüm kategorilerin children'larından cold-start fallback ile doldurur.
   * Slug bazlı dedupe.
   */
  function refreshForYouSection(): void {
    const section = document.getElementById("cat-popup-section-for-you");
    if (!section) return;
    const grid = section.querySelector<HTMLElement>("div.grid");
    if (!grid) return;

    const TARGET = 24;
    const recent = getRecentCategories(TARGET);
    const seen = new Set<string>();
    const items: { name: string; slug: string; image?: string }[] = [];

    for (const r of recent) {
      if (!r.slug || seen.has(r.slug)) continue;
      seen.add(r.slug);
      items.push({ name: r.name, slug: r.slug, image: r.image });
    }

    if (items.length < TARGET) {
      const fallback = _cats.flatMap((c) => c.children);
      for (const ch of fallback) {
        if (items.length >= TARGET) break;
        if (!ch.slug || seen.has(ch.slug)) continue;
        seen.add(ch.slug);
        items.push({ name: ch.name, slug: ch.slug, image: ch.image });
      }
    }

    grid.innerHTML = items.map((it) => renderSubcategoryItem(it.name, it.slug, it.image)).join("");
  }

  if (viewAllBtn) {
    viewAllBtn.addEventListener("click", () => {
      if (_cats.length > 0) openPopup("for-you");
    });
  }

  // Close handlers
  closeBtn.addEventListener("click", closePopup);
  overlay.addEventListener("click", closePopup);
  panel.addEventListener("click", (e) => {
    if (!(e.target as HTMLElement).closest("#cat-popup-sheet")) closePopup();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePopup();
  });

  // ── Drag-down to close (mouse + touch) ──
  const sheet = document.getElementById("cat-popup-sheet");
  const dragHandle = document.getElementById("cat-popup-drag-handle");
  const popupHeader = document.getElementById("cat-popup-header");
  if (sheet) {
    let startY = 0;
    let deltaY = 0;
    let dragging = false;
    let didDrag = false;

    function beginDrag(y: number) {
      startY = y;
      deltaY = 0;
      dragging = true;
      didDrag = false;
      sheet!.style.transition = "none";
      document.body.style.userSelect = "none";
      document.body.style.webkitUserSelect = "none";
    }

    function updateDrag(y: number) {
      if (!dragging) return;
      deltaY = y - startY;
      if (deltaY < 0) deltaY = 0;
      if (deltaY > 5) didDrag = true;
      sheet!.style.transform = `translateY(${deltaY}px)`;
      const progress = Math.min(deltaY / 300, 1);
      overlay!.style.opacity = String(1 - progress * 0.6);
    }

    function finishDrag() {
      if (!dragging) return;
      dragging = false;
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
      sheet!.style.transition = "transform 0.25s cubic-bezier(.2,.9,.3,1)";
      overlay!.style.transition = "opacity 0.25s ease";

      if (deltaY > 80) {
        sheet!.style.transform = `translateY(100%)`;
        overlay!.style.opacity = "0";
        setTimeout(() => {
          closePopup();
          sheet!.style.transform = "";
          sheet!.style.transition = "";
        }, 250);
      } else {
        sheet!.style.transform = "";
        overlay!.style.opacity = "1";
      }
    }

    closeBtn.addEventListener(
      "click",
      (e) => {
        if (didDrag) {
          e.stopImmediatePropagation();
          didDrag = false;
        }
      },
      true
    );

    [dragHandle, popupHeader].forEach((el) => {
      if (!el) return;
      el.addEventListener("mousedown", (e: MouseEvent) => {
        if ((e.target as HTMLElement).closest("#cat-popup-close")) return;
        e.preventDefault();
        beginDrag(e.clientY);
      });
    });

    document.addEventListener("mousemove", (e: MouseEvent) => {
      if (!dragging) return;
      e.preventDefault();
      updateDrag(e.clientY);
    });

    document.addEventListener("mouseup", () => {
      if (dragging) finishDrag();
    });

    [dragHandle, popupHeader].forEach((el) => {
      if (!el) return;
      el.addEventListener(
        "touchstart",
        (e: TouchEvent) => {
          if ((e.target as HTMLElement).closest("#cat-popup-close")) return;
          beginDrag(e.touches[0].clientY);
        },
        { passive: true }
      );
    });

    document.addEventListener(
      "touchmove",
      (e: TouchEvent) => {
        if (!dragging) return;
        e.preventDefault();
        updateDrag(e.touches[0].clientY);
      },
      { passive: false }
    );

    document.addEventListener("touchend", () => {
      if (dragging) finishDrag();
    });
  }

  // ──── Populate from API ────
  onCategoriesLoaded((cats) => {
    if (!cats.length) return;
    _cats = cats;

    // Populate browse list (left sidebar on home page)
    const browseList = document.getElementById("category-browse-list");
    if (browseList) {
      const forYouStarSvg = `<svg class="w-5 h-5" style="color:#222222" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"/></svg>`;
      const forYouItem = `
        <li>
          <button
            type="button"
            class="category-browse-item level1-cate-unit th-no-press flex items-center w-full text-left transition-colors duration-150 group bg-transparent hover:bg-white dark:text-gray-300 dark:hover:bg-gray-700/60 dark:hover:text-white"
            style="min-height:44px;padding:6px 16px;gap:12px"
            data-category-id="for-you"
          >
            <span class="flex-shrink-0 inline-flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5" style="color:#222222">${forYouStarSvg}</span>
            <span class="title flex-1 truncate" style="color:#222222;font-size:15px;font-weight:600;font-family:var(--font-sans);line-height:1.3">${t("categoryBrowse.headerForYou")}</span>
            <svg class="w-4 h-4 flex-shrink-0" style="color:#999999" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 5 7 7-7 7"/>
            </svg>
          </button>
        </li>
      `;
      browseList.innerHTML =
        forYouItem +
        cats
          .map(
            (cat) => `
        <li>
          <button
            type="button"
            class="category-browse-item level1-cate-unit th-no-press flex items-center w-full text-left transition-colors duration-150 group bg-transparent hover:bg-white dark:text-gray-300 dark:hover:bg-gray-700/60 dark:hover:text-white"
            style="min-height:44px;padding:6px 16px;gap:12px"
            data-category-id="${cat.id}"
          >
            <span class="flex-shrink-0 inline-flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5" style="color:#222222">
              ${cat.icon_class ? getCategoryIcon(cat.icon_class) : getIconByName(cat.name)}
            </span>
            <span class="title flex-1 truncate" style="color:#222222;font-size:15px;font-weight:600;font-family:var(--font-sans);line-height:1.3">${cat.name}</span>
            <svg class="w-4 h-4 flex-shrink-0" style="color:#999999" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 5 7 7-7 7"/>
            </svg>
          </button>
        </li>
      `
          )
          .join("");

      // Bind browse item clicks
      browseList.querySelectorAll<HTMLButtonElement>(".category-browse-item").forEach((item) => {
        item.addEventListener("click", () => {
          const id = item.getAttribute("data-category-id");
          if (id) openPopup(id);
        });
      });
    }

    // Populate popup sidebar
    const sidebarList = document.getElementById("cat-popup-sidebar-list");
    if (sidebarList) {
      const forYouItem = `
        <li class="flex-shrink-0 lg:flex-shrink">
          <button
            type="button"
            class="cat-popup-btn th-catpopup-sidebar-item th-no-press flex items-center gap-2 lg:gap-3 w-full px-3 lg:px-4 py-2 lg:py-2.5 text-sm text-left border-l-2 border-l-transparent transition-colors duration-150 whitespace-nowrap lg:whitespace-normal hover:bg-(--catpopup-sidebar-active-bg) hover:text-(--catpopup-heading) th-catpopup-sidebar-item--active"
            style="color:var(--catpopup-text)"
            data-category="for-you"
          >
            <span class="flex-shrink-0" style="color:var(--catpopup-icon)">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"/></svg>
            </span>
            <span class="flex-1 truncate">${t("categoryBrowse.headerForYou")}</span>
            <svg class="w-4 h-4 flex-shrink-0 hidden lg:block" style="color:var(--catpopup-icon)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 5 7 7-7 7"/></svg>
          </button>
        </li>
      `;
      sidebarList.innerHTML =
        forYouItem +
        cats
          .map(
            (cat) => `
        <li class="flex-shrink-0 lg:flex-shrink">
          <button
            type="button"
            class="cat-popup-btn th-catpopup-sidebar-item th-no-press flex items-center gap-2 lg:gap-3 w-full px-3 lg:px-4 py-2 lg:py-2.5 text-sm text-left border-l-2 border-l-transparent transition-colors duration-150 whitespace-nowrap lg:whitespace-normal hover:bg-(--catpopup-sidebar-active-bg) hover:text-(--catpopup-heading)"
            style="color:var(--catpopup-text)"
            data-category="${cat.id}"
          >
            <span class="flex-shrink-0" style="color:var(--catpopup-icon)">
              ${cat.icon_class ? getCategoryIcon(cat.icon_class) : getIconByName(cat.name)}
            </span>
            <span class="flex-1 truncate">${cat.name}</span>
            <svg class="w-4 h-4 flex-shrink-0 hidden lg:block" style="color:var(--catpopup-icon)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 5 7 7-7 7"/></svg>
          </button>
        </li>
      `
          )
          .join("");

      // Bind sidebar button clicks
      sidebarList.querySelectorAll<HTMLButtonElement>(".cat-popup-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-category");
          if (id) showCategory(id);
        });
      });
    }

    // Populate popup content (subcategory grids)
    const content = document.getElementById("cat-popup-content");
    if (content) {
      const forYouChildren = cats.flatMap((c) => c.children).slice(0, 24);
      const forYouSection = `
        <div id="cat-popup-section-for-you" class="cat-popup-section" data-popup-section="for-you">
          <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-y-5 gap-x-4 lg:gap-y-8 lg:gap-x-6">
            ${forYouChildren.map((ch) => renderSubcategoryItem(ch.name, ch.slug, ch.image)).join("")}
          </div>
        </div>
      `;
      content.innerHTML =
        forYouSection +
        cats
          .map(
            (cat) => `
        <div class="cat-popup-section hidden" data-popup-section="${cat.id}">
          <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-y-5 gap-x-4 lg:gap-y-8 lg:gap-x-6">
            ${cat.children.map((ch) => renderSubcategoryItem(ch.name, ch.slug, ch.image)).join("")}
            <!-- View all item -->
            <a href="/pages/products.html?cat=${cat.slug}" class="flex flex-col items-center gap-2 group/product">
              <div class="w-20 h-20 lg:w-24 lg:h-24 xl:w-28 xl:h-28 rounded-full border-2 border-dashed flex items-center justify-center transition-all" style="background-color:var(--catpopup-sidebar-bg);border-color:var(--catpopup-border)">
                <svg class="w-7 h-7 lg:w-9 lg:h-9" style="color:var(--catpopup-icon)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"/>
                </svg>
              </div>
              <span class="text-xs lg:text-sm text-center leading-tight transition-colors duration-150" style="color:var(--catpopup-text)" data-i18n="categoryBrowse.viewAll">${t("categoryBrowse.viewAll")}</span>
            </a>
          </div>
        </div>
      `
          )
          .join("");
    }
  });
}
