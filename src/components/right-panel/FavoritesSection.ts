/**
 * FavoritesSection Component
 * Right panel section: horizontal scrollable favorite product cards,
 * or empty state with package+heart icon when no favorites exist.
 */

import type { FavoriteItem } from "../../stores/favorites";
import { getListingUrl } from "../../utils/listingUrl";
import { SectionCard } from "../shared/SectionCard";
import { SectionHeader } from "../shared/SectionHeader";
import { EmptyState } from "../shared/EmptyState";
import { ProductCard } from "../shared/ProductCard";
import { getFavoritesConfig, getFavoritesEmptyState } from "./rightPanelData";
import { escapeHtml, sanitizeUrl } from "../../utils/sanitize";
import { convertPrice, formatCurrency, getSelectedCurrency } from "../../services/currencyService";

const MAX_VISIBLE = 3;

export function FavoritesSection(items: FavoriteItem[] = []): string {
  const favoritesConfig = getFavoritesConfig();

  if (items.length === 0) {
    const favoritesEmptyState = getFavoritesEmptyState();
    return SectionCard({
      children: `
        ${SectionHeader({ title: favoritesConfig.title })}
        ${EmptyState({
          icon: favoritesEmptyState.icon,
          text: favoritesEmptyState.text,
          linkText: favoritesEmptyState.linkText,
          linkHref: favoritesEmptyState.linkHref,
          linkColor: "#E67A00",
        })}
      `,
    });
  }

  const hasMore = items.length > MAX_VISIBLE;
  const visibleItems = items.slice(0, MAX_VISIBLE);

  const cards = visibleItems
    .map((item) => {
      // Yeni kayıtlar native price + currency taşır → güncel seçili para birimine
      // çevir (BrowsingHistorySection ile aynı doğru desen). Eski kayıtlar yalnız
      // donmuş `priceRange` string'i taşır → sembol-swap ile yanlış çevirmek
      // yerine kayıt-anı değerini olduğu gibi göster.
      const hasNative = typeof item.price === "number" && item.price > 0 && !!item.currency;
      const converted = hasNative
        ? formatCurrency(convertPrice(item.price as number, item.currency as string), getSelectedCurrency())
        : "";
      return ProductCard({
        image: escapeHtml(sanitizeUrl(item.image)),
        price: hasNative ? "" : escapeHtml(item.priceRange),
        currency: hasNative ? converted : "",
        minOrder: escapeHtml(item.minOrder),
        href: escapeHtml(sanitizeUrl(getListingUrl({ id: item.id }))),
      });
    })
    .join("");

  return SectionCard({
    children: `
      ${SectionHeader({
        title: favoritesConfig.title,
        actionText: hasMore ? favoritesConfig.actionText : undefined,
        actionHref: hasMore ? favoritesConfig.actionHref : undefined,
      })}
      <div class="flex gap-3 overflow-x-auto scrollbar-hide">
        ${cards}
      </div>
    `,
  });
}
