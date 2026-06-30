import { t } from "../../i18n";
import { escapeHtml, sanitizeUrl } from "../../utils/sanitize";
import { BottomSheet } from "./BottomSheet";
import { initCategoryDrillSheet } from "./CategoryDrillSheet";

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  // Backend 3 seviyeye kadar iç içe kategori döndürür (recursive).
  children: ApiCategory[];
}

export interface CategoryNavConfig {
  idPrefix: string;
  allLabelKey: string;
  viewMoreLabel: string;
  allInCategoryLabel: (name: string) => string;
  desktopExtraSlot?: string;
  mobileExtraSlot?: string;
}

export interface CategoryNavRuntimeConfig extends CategoryNavConfig {
  onSelect: (slug: string) => void;
  getActiveSlug: () => string;
}

export interface CategoryNavController {
  syncActive: (slug: string) => void;
}

export function CategoryNavBar(config: CategoryNavConfig): string {
  const p = config.idPrefix;
  const allLabel = t(config.allLabelKey);
  return `
    <!-- Desktop layout (Category bar) -->
    <div class="hidden lg:block relative bg-white rounded-md mb-8" data-${p}-tab-wrapper>
      <div class="flex items-center h-[62px] border-b border-[#d8d8d8]">
        <ul class="flex items-center h-full overflow-hidden flex-1 list-none m-0 p-0" data-${p}-tab></ul>
        <div class="flex-shrink-0 flex items-center h-full px-2">
          <button id="${p}-view-more" type="button"
                  class="th-no-press flex items-center gap-2 px-4 py-2 rounded-full border border-[#d8d8d8] text-sm font-medium text-[#222] hover:border-[#999] transition-colors whitespace-nowrap">
            <span>${escapeHtml(config.viewMoreLabel)}</span>
            <svg class="w-3.5 h-3.5 transition-transform duration-200" id="${p}-view-more-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
        </div>
      </div>
      <div id="${p}-mega-menu" class="hidden absolute start-0 end-0 top-[62px] z-50 bg-white rounded-b-lg py-8 px-5" style="box-shadow: rgba(0,0,0,0.12) 0 8px 20px 0">
        <ul id="${p}-mega-menu-list" class="grid grid-cols-4 grid-flow-col max-h-[400px] overflow-y-auto list-none m-0 p-0" style="grid-template-rows: repeat(11, auto);"></ul>
      </div>
      ${config.desktopExtraSlot ?? ""}
    </div>

    <!-- Mobile kategori çubuğu -->
    <div class="lg:hidden mb-2 bg-white rounded-md border border-gray-200">
      <div class="flex items-stretch">
        <ul class="flex items-center overflow-x-auto scrollbar-hide grow list-none m-0 p-0" data-${p}-mobile-tab></ul>
        <button id="${p}-mobile-cat-more" type="button" aria-label="${escapeHtml(allLabel)}" class="th-no-press appearance-none focus:outline-none [-webkit-tap-highlight-color:transparent] shrink-0 px-3 flex items-center justify-center text-gray-400 hover:text-gray-700 border-s border-gray-100">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
      </div>
    </div>
    ${BottomSheet(
      { id: `${p}-mobile-cat`, titleKey: config.allLabelKey },
      `<ul class="overflow-y-auto flex-1 py-2 list-none m-0 p-0" data-${p}-mobile-list></ul>`
    )}
    ${config.mobileExtraSlot ?? ""}
  `;
}

export async function initCategoryNavBar(
  config: CategoryNavRuntimeConfig
): Promise<CategoryNavController | null> {
  const p = config.idPrefix;
  const btn = document.getElementById(`${p}-view-more`);
  const menu = document.getElementById(`${p}-mega-menu`);
  const icon = document.getElementById(`${p}-view-more-icon`);
  const tabUl = document.querySelector<HTMLElement>(`[data-${p}-tab]`);
  const megaList = document.getElementById(`${p}-mega-menu-list`);

  if (!btn || !menu || !tabUl || !megaList) return null;

  const activeSlug = (): string => config.getActiveSlug();

  // ── Kategorileri merkezi servisten çek ────────────────────────────────────
  // categoryService tek API çağrısını paylaşır (cache) ve spam kategorileri
  // eler — doğrudan fetch yerine bunu kullanınca mega menüyle birebir aynı set.
  const { loadCategories } = await import("../../services/categoryService");
  const categories = (await loadCategories()) as unknown as ApiCategory[];

  // ── Tab bar ───────────────────────────────────────────────────────────────
  const allCatLabel = t(config.allLabelKey);
  const TAB_LIMIT = 5; // "Tüm kategoriler" + ilk 4 kategori görünür, geri kalanlar dropdown'da
  const tabCats = [{ id: "__all__", name: allCatLabel, slug: "" }, ...categories].slice(
    0,
    TAB_LIMIT + 1
  );

  tabUl.innerHTML = tabCats
    .map(
      (cat, i) => `
    <li class="whitespace-nowrap cursor-pointer px-5 h-[61px] leading-[61px] text-base transition-colors [&.factory-tab-active]:relative [&.factory-tab-active]:font-bold [&.factory-tab-active]:after:content-[''] [&.factory-tab-active]:after:absolute [&.factory-tab-active]:after:bottom-0 [&.factory-tab-active]:after:left-1/2 [&.factory-tab-active]:after:-translate-x-1/2 [&.factory-tab-active]:after:w-full [&.factory-tab-active]:after:max-w-[100px] [&.factory-tab-active]:after:h-[3px] [&.factory-tab-active]:after:bg-[var(--color-surface-inverse)] [&.factory-tab-active]:after:rounded-[2px]
               ${i === 0 ? "factory-tab-active font-bold text-[#222]" : "font-normal text-[#222] hover:text-[#666]"}"
        data-tab-index="${i}"
        data-tab-slug="${escapeHtml(cat.slug)}"
        data-tab-name="${escapeHtml(cat.name)}">
      ${escapeHtml(cat.name)}
    </li>
  `
    )
    .join("");

  // ── "Daha fazlası" dropdown: 4 kolon ────────────────────────────────────
  // Kolon 1: "Tüm kategoriler" başlığı + tüm ana kategori isimleri
  // Kolon 2-4: ilk 3 kategorinin alt kategorileri
  const col1Items = [
    { name: allCatLabel, slug: "", isHeader: true },
    ...categories.map((c) => ({ name: c.name, slug: c.slug, isHeader: false })),
  ];

  const col2Cat = categories[0];
  const col3Cat = categories[1];
  const col4Cat = categories[2];

  function buildCol(
    header: string,
    headerSlug: string,
    items: Array<{ name: string; slug: string }>
  ): string {
    const headerDataSlug = escapeHtml(headerSlug);
    const headerHref = escapeHtml(
      sanitizeUrl(
        window.location.pathname +
          (headerSlug ? `?cat=${encodeURIComponent(headerSlug)}` : "")
      )
    );
    return [
      `<li class="mb-3 pe-4 font-bold text-[#222]" style="font-size:14px;line-height:21px;">
         <a href="${headerHref}" data-cat-slug="${headerDataSlug}" class="hover:text-primary-600 transition-colors">${escapeHtml(header)}</a>
       </li>`,
      ...items.map((it) => {
        const slug = escapeHtml(it.slug);
        const href = escapeHtml(
          sanitizeUrl(
            window.location.pathname +
              (it.slug ? `?cat=${encodeURIComponent(it.slug)}` : "")
          )
        );
        return `
        <li class="mb-3 pe-4 font-normal text-[#222]" style="font-size:14px;line-height:21px;">
          <a href="${href}" data-cat-slug="${slug}" class="hover:text-primary-600 transition-colors">${escapeHtml(it.name)}</a>
        </li>`;
      }),
    ].join("");
  }

  // grid-flow-col ile 4 sütun — her kolon ayrı <ul> içinde olmadığından
  // grid-template-rows ile satır sayısını hesapla
  const maxRows = Math.max(
    col1Items.length,
    (col2Cat?.children.length ?? 0) + 1,
    (col3Cat?.children.length ?? 0) + 1,
    (col4Cat?.children.length ?? 0) + 1
  );
  megaList.style.gridTemplateRows = `repeat(${maxRows}, auto)`;

  megaList.innerHTML = [
    buildCol(allCatLabel, "", col1Items.slice(1)),
    col2Cat ? buildCol(col2Cat.name, col2Cat.slug, col2Cat.children) : "",
    col3Cat ? buildCol(col3Cat.name, col3Cat.slug, col3Cat.children) : "",
    col4Cat ? buildCol(col4Cat.name, col4Cat.slug, col4Cat.children) : "",
  ].join("");

  // ── Event listeners ───────────────────────────────────────────────────────
  function closeMain(): void {
    menu!.classList.add("hidden");
    if (icon) icon.style.transform = "rotate(0deg)";
  }

  // ── Ortak kategori uygulama helpers ──────────────────────────────────────
  function syncActive(slug: string): void {
    // Desktop tab'ları
    document.querySelectorAll<HTMLElement>(`[data-${p}-tab] [data-tab-slug]`).forEach((el) => {
      const on = (el.dataset.tabSlug || "") === slug;
      el.classList.toggle("factory-tab-active", on);
      el.classList.toggle("font-bold", on);
      el.classList.toggle("font-normal", !on);
    });
    // Mobil tab'ları — aktif: tema rengi + kalın (sadece renk/ağırlık, layout shift yok)
    document
      .querySelectorAll<HTMLElement>(`[data-${p}-mobile-tab] [data-tab-slug]`)
      .forEach((el) => {
        const on = (el.dataset.tabSlug || "") === slug;
        el.classList.toggle("text-primary-600", on);
        el.classList.toggle("font-semibold", on);
        el.classList.toggle("text-gray-600", !on);
      });
    // Mobil drill-down sheet kendi aktif (✓) işaretini render sırasında yönetir.
  }

  function applyCategory(slug: string): void {
    syncActive(slug);
    closeMain();
    config.onSelect(slug);
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (menu!.classList.contains("hidden")) {
      menu!.classList.remove("hidden");
      if (icon) icon.style.transform = "rotate(180deg)";
    } else {
      closeMain();
    }
  });

  document.addEventListener("click", (e) => {
    const target = e.target as Node;
    if (!menu!.contains(target) && !btn.contains(target)) closeMain();
  });

  // Desktop tab switching
  const tabs = Array.from(tabUl.querySelectorAll<HTMLElement>("[data-tab-index]"));
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => applyCategory(tab.dataset.tabSlug || ""));
  });

  // Desktop mega dropdown — aynı sayfada filtrele
  megaList.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement).closest<HTMLElement>("a[data-cat-slug]");
    if (!a) return;
    e.preventDefault();
    applyCategory(a.dataset.catSlug || "");
  });

  // ── Mobil kategori tab + liste doldur ────────────────────────────────────
  const mobileTabUl = document.querySelector<HTMLElement>(`[data-${p}-mobile-tab]`);
  if (mobileTabUl) {
    mobileTabUl.innerHTML = tabCats
      .map(
        (cat) => `
      <li class="th-no-press whitespace-nowrap cursor-pointer px-4 py-2.5 text-[13px] shrink-0 text-gray-600 transition-colors" data-tab-slug="${escapeHtml(cat.slug)}">${escapeHtml(cat.name)}</li>
    `
      )
      .join("");
    mobileTabUl.addEventListener("click", (e) => {
      const li = (e.target as HTMLElement).closest<HTMLElement>("[data-tab-slug]");
      if (li) applyCategory(li.dataset.tabSlug || "");
    });
  }

  // Mobil drill-down sheet (paylaşılan helper): yığın navigasyonu, "Tüm {Kategori}",
  // ✓ işareti, geri tuşu hepsi içeride. Seçim applyCategory'ye düşer (sheet kapanır).
  // Aktif (✓) işareti her açılışta render sırasında getActiveSlug ile hesaplanır.
  initCategoryDrillSheet({
    sheetId: `${p}-mobile-cat`,
    triggerId: `${p}-mobile-cat-more`,
    listSelector: `[data-${p}-mobile-list]`,
    categories,
    rootLabel: allCatLabel,
    allInCategoryLabel: config.allInCategoryLabel,
    onSelect: applyCategory,
    getActiveSlug: activeSlug,
  });

  return { syncActive };
}
