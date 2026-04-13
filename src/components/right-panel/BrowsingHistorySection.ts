/**
 * BrowsingHistorySection Component
 * Horizontal scrollable product cards with hidden scrollbar.
 */

import type { BrowsingHistoryProduct } from '../../types/buyerDashboard';
import { SectionCard } from '../shared/SectionCard';
import { SectionHeader } from '../shared/SectionHeader';
import { ProductCard } from '../shared/ProductCard';
import { getBrowsingHistoryConfig } from './rightPanelData';

const MAX_VISIBLE = 3;

export function BrowsingHistorySection(products: BrowsingHistoryProduct[]): string {
  const browsingHistoryConfig = getBrowsingHistoryConfig();
  const hasMore = products.length > MAX_VISIBLE;
  const visibleProducts = products.slice(0, MAX_VISIBLE);

  const cards = visibleProducts.map((p) =>
    ProductCard({
      image: p.image,
      price: p.price.toFixed(2),
      currency: p.currency,
      minOrder: p.minOrder,
      href: p.href,
    })
  ).join('');

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
