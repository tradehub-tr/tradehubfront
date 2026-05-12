/**
 * FavoritesSection Component
 * Right panel section: horizontal scrollable favorite product cards,
 * or empty state with package+heart icon when no favorites exist.
 */

import type { FavoriteItem } from "../../stores/favorites";
import { SectionCard } from "../shared/SectionCard";
import { SectionHeader } from "../shared/SectionHeader";
import { EmptyState } from "../shared/EmptyState";
import { ProductCard } from "../shared/ProductCard";
import { getFavoritesConfig, getFavoritesEmptyState } from "./rightPanelData";

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
    .map((item) =>
      ProductCard({
        image: item.image,
        price: item.priceRange,
        currency: "",
        minOrder: item.minOrder,
        href: `/pages/product-detail.html?id=${encodeURIComponent(item.id)}`,
      })
    )
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
