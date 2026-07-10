/**
 * Listing grid favori kalbi — kart görselinin sağ-üst köşesindeki kalp butonu.
 *
 * Akış ürün detay sayfasıyla aynı: login değilse LoginModal, login ise
 * FavoritesDropdown (liste seçici) açılır. Kalp dolgusu `isItemFavorited`
 * ile boyanır ve `favorites-changed` event'inde yeniden senkronlanır.
 *
 * Grid butonları `data-fav-btn="<listingId>"` taşır — detay sayfasının
 * `updateFavoriteButtons` global güncelleyicisi (`[data-favorite-btn]`,
 * tek-ürün varsayımıyla TÜM butonları boyar) bunlara bilerek dokunmaz;
 * çok-ürünlü grid'de her kalp kendi ürününün durumunu gösterir.
 */

import { openFavoritesDropdown } from "../favorites/FavoritesDropdown";
import { isItemFavorited } from "../../stores/favorites";
import { isLoggedIn } from "../../utils/auth";
import { showLoginModal } from "../product/LoginModal";

let delegated = false;

/** Sayfa bootstrap'ında BİR KEZ çağrılır — body delegation + favorites-changed dinleyicisi. */
export function initListingFavoriteTriggers(): void {
  if (delegated) return;
  delegated = true;

  document.body.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-fav-btn]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn()) {
      showLoginModal();
      return;
    }

    openFavoritesDropdown(btn, {
      id: btn.dataset.favBtn || "",
      image: btn.dataset.productThumb || "",
      title: btn.dataset.productTitle || "",
      priceRange: btn.dataset.productPrice || "",
      minOrder: btn.dataset.productMinOrder || "",
    });
  });

  window.addEventListener("favorites-changed", syncListingFavoriteHearts);
}

/** Grid her render edildikten sonra çağrılır — kalp dolgularını ürün bazında boyar. */
export function syncListingFavoriteHearts(): void {
  document.querySelectorAll<HTMLButtonElement>("[data-fav-btn]").forEach((btn) => {
    const fav = isItemFavorited(btn.dataset.favBtn || "");
    const svg = btn.querySelector("svg");
    if (!svg) return;
    if (fav) {
      svg.setAttribute("fill", "#ef4444");
      svg.setAttribute("stroke", "#ef4444");
      btn.classList.add("text-red-500");
      btn.classList.remove("text-gray-500");
    } else {
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      btn.classList.add("text-gray-500");
      btn.classList.remove("text-red-500");
    }
  });
}
