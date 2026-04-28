/**
 * SellerFavoritesDropdown
 *
 * Tedarikçi (seller) için "Save to list" dropdown — ürün
 * `FavoritesDropdown`'ın paraleli. Listeler ürün store'undan paylaşılır
 * (`getLists`, `createList`) — kullanıcı tek havuzdan ürün ve seller
 * favorilerini aynı listelere atabilir. Item state'i `sellerFavorites`
 * store'unda tutulur.
 */

import { t } from "../../i18n";
import { getLists, createList, type FavoriteList } from "../../stores/favorites";
import {
  getSellerListIds,
  isSellerFavorited,
  toggleSellerInList,
  removeSellerFromAll,
} from "../../stores/sellerFavorites";
import { showToast } from "../../utils/toast";

interface SellerData {
  code: string;
  name: string;
  city?: string;
  country?: string;
  logo?: string;
  cover?: string;
  rating?: number;
  reviewCount?: number;
}

const DEFAULT_LIST_ID = "default";
let activeDropdown: HTMLElement | null = null;
let outsideClickHandler: ((e: MouseEvent) => void) | null = null;

export function closeSellerFavoritesDropdown(): void {
  if (activeDropdown) {
    activeDropdown.classList.add("opacity-0", "scale-95", "pointer-events-none");
    activeDropdown.classList.remove("opacity-100", "scale-100");
    setTimeout(() => {
      activeDropdown?.remove();
      activeDropdown = null;
    }, 150);
  }
  if (outsideClickHandler) {
    document.removeEventListener("click", outsideClickHandler, true);
    outsideClickHandler = null;
  }
}

export function openSellerFavoritesDropdown(anchorBtn: HTMLElement, seller: SellerData): void {
  closeSellerFavoritesDropdown();

  const isFav = isSellerFavorited(seller.code);
  const itemListIds = getSellerListIds(seller.code);
  const lists = getLists();

  const dropdown = document.createElement("div");
  dropdown.id = "seller-fav-dropdown";
  dropdown.className =
    "fav-dropdown-panel fixed z-[9999] w-[280px] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.16)] border border-gray-100 " +
    "opacity-0 scale-95 pointer-events-none transition-all duration-150 origin-top";
  dropdown.style.borderRadius = "var(--radius-card, 8px)";
  dropdown.innerHTML = buildDropdownContent(isFav, itemListIds, lists);

  document.body.appendChild(dropdown);
  activeDropdown = dropdown;

  positionDropdown(anchorBtn, dropdown);

  requestAnimationFrame(() => {
    dropdown.classList.remove("opacity-0", "scale-95", "pointer-events-none");
    dropdown.classList.add("opacity-100", "scale-100");
  });

  wireDropdownEvents(dropdown, seller);

  outsideClickHandler = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!dropdown.contains(target) && !anchorBtn.contains(target)) {
      closeSellerFavoritesDropdown();
    }
  };
  setTimeout(() => {
    document.addEventListener("click", outsideClickHandler!, true);
  }, 10);

  const escHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      closeSellerFavoritesDropdown();
      document.removeEventListener("keydown", escHandler);
    }
  };
  document.addEventListener("keydown", escHandler);
}

function buildDropdownContent(
  _isFav: boolean,
  itemListIds: string[],
  lists: FavoriteList[]
): string {
  const defaultChecked = itemListIds.includes(DEFAULT_LIST_ID);
  const isFav = _isFav;

  const listItems = lists
    .map((list) => {
      const checked = itemListIds.includes(list.id);
      return `
      <label class="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors" data-list-id="${list.id}">
        <input type="checkbox" class="seller-fav-list-checkbox sr-only peer" ${checked ? "checked" : ""} data-list-id="${list.id}" />
        ${renderCheckboxVisual(checked)}
        <div class="flex-1 min-w-0">
          <span class="block text-sm text-gray-700 truncate">${escapeHtml(list.name)}</span>
        </div>
      </label>
    `;
    })
    .join("");

  return `
    <!-- Header -->
    <div class="flex items-center justify-between px-4 pt-3.5 pb-2">
      <h3 class="text-sm font-semibold text-gray-900">${t("favorites.saveToList")}</h3>
      <button type="button" class="seller-fav-close p-1 rounded-lg hover:bg-gray-100 transition-colors" aria-label="${t("common.close")}">
        <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>

    <!-- Default favorites -->
    <div class="border-b border-gray-100">
      <label class="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors" data-list-id="${DEFAULT_LIST_ID}">
        <input type="checkbox" class="seller-fav-list-checkbox sr-only peer" ${defaultChecked ? "checked" : ""} data-list-id="${DEFAULT_LIST_ID}" />
        ${renderCheckboxVisual(defaultChecked)}
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <svg class="w-5 h-5 text-red-500 shrink-0" fill="${defaultChecked ? "#ef4444" : "none"}" stroke="#ef4444" stroke-width="2" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
          <span class="text-sm font-medium text-gray-700">${t("favorites.defaultList")}</span>
        </div>
      </label>
    </div>

    <!-- Custom lists -->
    <div class="max-h-[200px] overflow-y-auto" id="seller-fav-lists">
      ${listItems}
    </div>

    <!-- Create new list -->
    <div class="border-t border-gray-100" id="seller-fav-footer">
      <button type="button" class="seller-fav-create-btn flex items-center gap-2.5 w-full px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
        <span>${t("favorites.newList")}</span>
      </button>

      <div class="hidden px-4 pt-3 pb-3" id="seller-fav-inline-create">
        <div class="flex gap-2">
          <input type="text" id="seller-fav-inline-input" maxlength="25" placeholder="${t("favorites.enterName")}" class="th-input th-input-md flex-1" />
          <button type="button" id="seller-fav-inline-save" class="th-btn th-btn-sm disabled:opacity-50 disabled:cursor-not-allowed" disabled>
            ${t("common.save")}
          </button>
        </div>
      </div>
    </div>

    ${
      isFav
        ? `
    <div class="border-t border-gray-100">
      <button type="button" class="seller-fav-remove-all-btn flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors rounded-b-md">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        <span>${t("favorites.removeFromAll")}</span>
      </button>
    </div>
    `
        : ""
    }
  `;
}

function positionDropdown(anchor: HTMLElement, dropdown: HTMLElement): void {
  const rect = anchor.getBoundingClientRect();
  const dropdownHeight = 350;
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceRight = window.innerWidth - rect.left;

  let top: number;
  let left: number;

  if (spaceBelow >= dropdownHeight || spaceBelow > rect.top) {
    top = rect.bottom + 8;
  } else {
    top = rect.top - dropdownHeight - 8;
  }

  if (spaceRight >= 280) {
    left = rect.left;
  } else {
    left = rect.right - 280;
  }

  top = Math.max(8, Math.min(top, window.innerHeight - dropdownHeight - 8));
  left = Math.max(8, Math.min(left, window.innerWidth - 288));

  dropdown.style.top = `${top}px`;
  dropdown.style.left = `${left}px`;
}

function wireDropdownEvents(dropdown: HTMLElement, seller: SellerData): void {
  dropdown.querySelector(".seller-fav-close")?.addEventListener("click", () => {
    closeSellerFavoritesDropdown();
  });

  dropdown.querySelectorAll<HTMLInputElement>(".seller-fav-list-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      syncCheckboxVisual(checkbox);
      const listId = checkbox.dataset.listId!;
      const added = toggleSellerInList(seller, listId);

      if (added) {
        const listName =
          listId === DEFAULT_LIST_ID
            ? t("favorites.defaultList")
            : getLists().find((l) => l.id === listId)?.name || "";
        showToast({
          message: `${t("favorites.addedToList")} "${listName}"`,
          type: "success",
          link: { text: t("cart.favorites"), href: "/pages/dashboard/favorites.html" },
        });
      } else {
        showToast({ message: t("favorites.removedFromList"), type: "info" });
      }

      refreshDropdownCheckboxes(dropdown, seller.code);
    });
  });

  const createBtn = dropdown.querySelector(".seller-fav-create-btn");
  const inlineCreate = dropdown.querySelector("#seller-fav-inline-create") as HTMLElement;
  const inlineInput = dropdown.querySelector("#seller-fav-inline-input") as HTMLInputElement;
  const inlineSave = dropdown.querySelector("#seller-fav-inline-save") as HTMLButtonElement;

  createBtn?.addEventListener("click", () => {
    (createBtn as HTMLElement).classList.add("hidden");
    inlineCreate?.classList.remove("hidden");
    inlineInput?.focus();
  });

  inlineInput?.addEventListener("input", () => {
    if (inlineSave) {
      inlineSave.disabled = inlineInput.value.trim().length === 0;
    }
  });

  const trySave = () => {
    if (inlineInput.value.trim()) {
      saveNewList(
        dropdown,
        seller,
        inlineInput,
        inlineSave,
        createBtn as HTMLElement,
        inlineCreate
      );
    }
  };

  inlineInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") trySave();
  });

  inlineSave?.addEventListener("click", trySave);

  dropdown.querySelector(".seller-fav-remove-all-btn")?.addEventListener("click", () => {
    removeSellerFromAll(seller.code);
    showToast({ message: t("favorites.removedFromList"), type: "info" });
    closeSellerFavoritesDropdown();
  });
}

function saveNewList(
  dropdown: HTMLElement,
  seller: SellerData,
  input: HTMLInputElement,
  saveBtn: HTMLButtonElement,
  createBtn: HTMLElement,
  inlineCreate: HTMLElement
): void {
  const name = input.value.trim();
  if (!name) return;

  const list = createList(name);
  toggleSellerInList(seller, list.id);

  showToast({
    message: `${t("favorites.listCreated")} "${name}"`,
    type: "success",
    link: { text: t("cart.favorites"), href: "/pages/dashboard/favorites.html" },
  });

  input.value = "";
  saveBtn.disabled = true;
  inlineCreate.classList.add("hidden");
  createBtn.classList.remove("hidden");

  const listsContainer = dropdown.querySelector("#seller-fav-lists");
  if (listsContainer) {
    const newLabel = document.createElement("label");
    newLabel.className =
      "flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors";
    newLabel.dataset.listId = list.id;
    newLabel.innerHTML = `
      <input type="checkbox" class="seller-fav-list-checkbox sr-only peer" checked data-list-id="${list.id}" />
      ${renderCheckboxVisual(true)}
      <div class="flex-1 min-w-0">
        <span class="block text-sm text-gray-700 truncate">${escapeHtml(list.name)}</span>
      </div>
    `;

    const checkbox = newLabel.querySelector("input") as HTMLInputElement;
    checkbox.addEventListener("change", () => {
      syncCheckboxVisual(checkbox);
      const added = toggleSellerInList(seller, list.id);
      if (added) {
        showToast({ message: `${t("favorites.addedToList")} "${list.name}"`, type: "success" });
      } else {
        showToast({ message: t("favorites.removedFromList"), type: "info" });
      }
    });

    listsContainer.appendChild(newLabel);
  }
}

function refreshDropdownCheckboxes(dropdown: HTMLElement, sellerCode: string): void {
  const currentListIds = getSellerListIds(sellerCode);
  dropdown.querySelectorAll<HTMLInputElement>(".seller-fav-list-checkbox").forEach((cb) => {
    const listId = cb.dataset.listId!;
    const isChecked = currentListIds.includes(listId);
    cb.checked = isChecked;
    syncCheckboxVisual(cb);
  });

  const defaultLabel = dropdown.querySelector(`[data-list-id="${DEFAULT_LIST_ID}"]`);
  if (defaultLabel) {
    const heartSvg = defaultLabel.querySelector("svg:not(.fav-checkbox-tick)") as SVGElement | null;
    if (heartSvg) {
      heartSvg.setAttribute("fill", currentListIds.includes(DEFAULT_LIST_ID) ? "#ef4444" : "none");
    }
  }
}

function syncCheckboxVisual(input: HTMLInputElement): void {
  const visual = input.nextElementSibling as HTMLElement | null;
  if (!visual || !visual.classList.contains("fav-checkbox-visual")) return;
  visual.classList.toggle("is-checked", input.checked);
  const tick = visual.querySelector(".fav-checkbox-tick") as HTMLElement | null;
  if (tick) tick.style.display = input.checked ? "block" : "none";
}

function renderCheckboxVisual(checked: boolean): string {
  return `
    <span class="fav-checkbox-visual th-checkbox${checked ? " is-checked" : ""}" aria-hidden="true">
      <svg class="fav-checkbox-tick" style="display:${checked ? "block" : "none"};width:70%;height:70%" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="m5 13 4 4L19 7" />
      </svg>
    </span>
  `;
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
