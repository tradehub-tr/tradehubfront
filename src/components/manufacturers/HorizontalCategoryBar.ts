import { t } from "../../i18n";

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

export function HorizontalCategoryBar(): string {
  const SUB_TAB_FILTERS = getSubTabFilters();
  const SUB_TAB_MORE_FILTERS = getSubTabMoreFilters();

  return `
    <!-- Desktop layout (Category bar) -->
    <div class="hidden lg:block relative bg-white rounded-md mb-8" data-factory-tab-wrapper>

      <!-- Tab Bar -->
      <div class="flex items-center h-[62px] border-b border-[#d8d8d8]">
        <ul class="flex items-center h-full overflow-hidden flex-1 list-none m-0 p-0" data-factory-tab>
          <!-- Dinamik olarak doldurulacak -->
        </ul>

        <!-- View more button -->
        <div class="flex-shrink-0 flex items-center h-full px-2">
          <button id="hm-view-more" type="button"
                  class="flex items-center gap-2 px-4 py-2 rounded-full border border-[#d8d8d8] text-sm font-medium text-[#222] hover:border-[#999] transition-colors whitespace-nowrap">
            <span>${t("mfr.viewMore")}</span>
            <svg class="w-3.5 h-3.5 transition-transform duration-200" id="hm-view-more-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- More Content Dropdown (absolutely positioned below tab bar) -->
      <div id="hm-mega-menu" class="hidden absolute left-0 right-0 top-[62px] z-50 bg-white rounded-b-lg py-8 px-5" style="box-shadow: rgba(0,0,0,0.12) 0 8px 20px 0">
        <ul id="hm-mega-menu-list" class="grid grid-cols-4 grid-flow-col max-h-[400px] overflow-y-auto list-none m-0 p-0" style="grid-template-rows: repeat(11, auto);">
          <!-- Dinamik olarak doldurulacak -->
        </ul>
      </div>

      <!-- Sub Tab Filter Chips -->
      <ul class="flex items-center h-[48px] px-5 list-none m-0 p-0 overflow-x-auto" data-factory-sub-tab>
        ${SUB_TAB_FILTERS.map(
          (filter) => `
          <li class="flex-shrink-0 flex items-center h-8 mr-3 mt-0 px-4 border border-[#767676] rounded-full text-xs text-[#222] text-center cursor-pointer whitespace-nowrap hover:border-[#222] hover:font-medium transition-colors">
            ${filter}
          </li>
        `
        ).join("")}
        <!-- Sub-tab view more -->
        <li id="sub-tab-more-btn" class="ml-auto flex-shrink-0 flex items-center gap-1 h-8 px-4 border border-[#d8d8d8] rounded-full text-xs text-[#222] text-center cursor-pointer whitespace-nowrap hover:border-[#999] transition-colors">
          ${t("mfr.viewMore")}
          <svg class="w-3 h-3 transition-transform duration-200" id="sub-tab-more-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </li>
      </ul>

      <!-- Sub-tab More Dropdown -->
      <div id="sub-tab-dropdown" class="hidden absolute left-0 right-0 top-[110px] z-50 bg-white rounded-b-lg py-6 px-5" style="box-shadow: rgba(0,0,0,0.12) 0 8px 20px 0">
        <ul class="flex flex-wrap list-none m-0 p-0">
          ${SUB_TAB_MORE_FILTERS.map(
            (filter) => `
            <li class="w-1/4 mb-3 pr-4 text-sm text-[#222] cursor-pointer hover:text-primary-600 transition-colors">
              ${filter}
            </li>
          `
          ).join("")}
        </ul>
      </div>

    </div>

    <!-- Mobile layout (Filter bar) -->
    <div class="lg:hidden flex items-center overflow-x-auto gap-2.5 pb-2 mb-1 no-scrollbar scroll-smooth">
      <button class="th-btn-outline flex items-center justify-center w-[30px] h-[30px] shrink-0">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" class="w-4 h-4 text-[#222]">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 0H3.75m12 12h3.75m-3.75 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 0H3.75m9.75-6h3.75m-3.75 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 0H3.75" />
        </svg>
      </button>
      <button class="px-3.5 h-[30px] border border-gray-300 rounded-full text-[12px] font-medium whitespace-nowrap text-[#222] hover:bg-gray-50 flex items-center shrink-0">
        ${t("mfr.verifiedManufacturers")}
      </button>
    </div>
  `;
}

interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  children: Array<{ id: string; name: string; slug: string }>;
}

export async function initHorizontalCategoryBar(): Promise<void> {
  const btn = document.getElementById("hm-view-more");
  const menu = document.getElementById("hm-mega-menu");
  const icon = document.getElementById("hm-view-more-icon");
  const tabUl = document.querySelector<HTMLElement>("[data-factory-tab]");
  const megaList = document.getElementById("hm-mega-menu-list");

  const subBtn = document.getElementById("sub-tab-more-btn");
  const subIcon = document.getElementById("sub-tab-more-icon");
  const subDropdown = document.getElementById("sub-tab-dropdown");

  if (!btn || !menu || !tabUl || !megaList) return;

  // ── Kategorileri API'den çek ──────────────────────────────────────────────
  let categories: ApiCategory[] = [];
  try {
    const url = (window as any).API_BASE
      ? `${(window as any).API_BASE}/method/tradehub_core.api.category.get_mega_menu`
      : "/api/method/tradehub_core.api.category.get_mega_menu";
    const res = await fetch(url, { credentials: "include" }).then((r) => r.json());
    categories = (res.message || []) as ApiCategory[];
  } catch (e) {
    console.error("HorizontalCategoryBar fetch failed", e);
  }

  // ── Tab bar ───────────────────────────────────────────────────────────────
  const allCatLabel = t("mfr.allCategories");
  const TAB_LIMIT = 5; // "Tüm kategoriler" + ilk 4 kategori görünür, geri kalanlar dropdown'da
  const tabCats = [{ id: "__all__", name: allCatLabel, slug: "" }, ...categories].slice(
    0,
    TAB_LIMIT + 1
  );

  tabUl.innerHTML = tabCats
    .map(
      (cat, i) => `
    <li class="whitespace-nowrap cursor-pointer px-5 h-[61px] leading-[61px] text-base transition-colors
               ${i === 0 ? "factory-tab-active font-bold text-[#222]" : "font-normal text-[#222] hover:text-[#666]"}"
        data-tab-index="${i}"
        data-tab-slug="${cat.slug}"
        data-tab-name="${cat.name}">
      ${cat.name}
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

  function buildCol(header: string, items: Array<{ name: string; slug: string }>): string {
    return [
      `<li class="mb-3 pr-4 font-bold text-[#222]" style="font-size:14px;line-height:21px;">
         <a href="${header === allCatLabel ? "/pages/categories" : `/pages/products.html?cat=${items[0]?.slug || ""}`}" class="hover:text-primary-600 transition-colors">${header}</a>
       </li>`,
      ...items.map(
        (it) => `
        <li class="mb-3 pr-4 font-normal text-[#222]" style="font-size:14px;line-height:21px;" data-dropdown-cat="${it.name}">
          <a href="/pages/products.html?cat=${it.slug}" class="hover:text-primary-600 transition-colors">${it.name}</a>
        </li>`
      ),
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
    buildCol(allCatLabel, col1Items.slice(1)),
    col2Cat ? buildCol(col2Cat.name, col2Cat.children) : "",
    col3Cat ? buildCol(col3Cat.name, col3Cat.children) : "",
    col4Cat ? buildCol(col4Cat.name, col4Cat.children) : "",
  ].join("");

  // ── Event listeners ───────────────────────────────────────────────────────
  function closeMain() {
    menu!.classList.add("hidden");
    if (icon) icon.style.transform = "rotate(0deg)";
  }
  function closeSub() {
    if (subDropdown) subDropdown.classList.add("hidden");
    if (subIcon) subIcon.style.transform = "rotate(0deg)";
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (menu!.classList.contains("hidden")) {
      closeSub();
      menu!.classList.remove("hidden");
      if (icon) icon.style.transform = "rotate(180deg)";
    } else {
      closeMain();
    }
  });

  if (subBtn && subDropdown) {
    subBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (subDropdown.classList.contains("hidden")) {
        closeMain();
        subDropdown.classList.remove("hidden");
        if (subIcon) subIcon.style.transform = "rotate(180deg)";
      } else {
        closeSub();
      }
    });
  }

  document.addEventListener("click", (e) => {
    const target = e.target as Node;
    if (!menu!.contains(target) && !btn.contains(target)) closeMain();
    if (subDropdown && subBtn && !subDropdown.contains(target) && !subBtn.contains(target))
      closeSub();
  });

  // Tab switching
  const tabs = Array.from(tabUl.querySelectorAll<HTMLElement>("[data-tab-index]"));
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => {
        t.classList.remove("factory-tab-active", "font-bold");
        t.classList.add("font-normal");
      });
      tab.classList.add("factory-tab-active", "font-bold");
      tab.classList.remove("font-normal");

      // Dropdown'da aktif kategoriye göre bold yap
      const activeName = tab.dataset.tabName || "";
      megaList.querySelectorAll<HTMLElement>("[data-dropdown-cat]").forEach((item) => {
        if (item.dataset.dropdownCat === activeName) {
          item.classList.add("font-bold");
          item.classList.remove("font-normal");
        } else {
          item.classList.remove("font-bold");
          item.classList.add("font-normal");
        }
      });
    });
  });
}
