/**
 * BrowsingHistorySection Component
 * Horizontal scrollable product cards with hidden scrollbar.
 */

import type { BrowsingHistoryProduct } from "../../types/buyerDashboard";
import { SectionCard } from "../shared/SectionCard";
import { SectionHeader } from "../shared/SectionHeader";
import { ProductCard } from "../shared/ProductCard";
import { getBrowsingHistoryConfig } from "./rightPanelData";
import { convertPrice, formatCurrency, getSelectedCurrency } from "../../services/currencyService";

const MAX_VISIBLE = 3;

export function BrowsingHistorySection(products: BrowsingHistoryProduct[]): string {
  const browsingHistoryConfig = getBrowsingHistoryConfig();
  const hasMore = products.length > MAX_VISIBLE;
  const visibleProducts = products.slice(0, MAX_VISIBLE);

  const cards = visibleProducts
    .map((p) => {
      // p.price, p.currency'de saklı (görülme-anı kuru); güncel seçili para
      // birimine çevir. Önceden ham değer + sembol-swap gösteriliyordu.
      const converted = convertPrice(p.price ?? 0, p.currency || getSelectedCurrency());
      return ProductCard({
        image: p.image,
        price: "",
        currency: formatCurrency(converted, getSelectedCurrency()),
        minOrder: p.minOrder,
        href: p.href,
      });
    })
    .join("");

  return SectionCard({
    children: `
      ${SectionHeader({
        title: browsingHistoryConfig.title,
        actionText: hasMore ? browsingHistoryConfig.actionText : undefined,
        actionHref: hasMore ? browsingHistoryConfig.actionHref : undefined,
      })}
      <div class="flex gap-3 overflow-x-auto scrollbar-hide">
        ${cards}
      </div>
    `,
  });
}
