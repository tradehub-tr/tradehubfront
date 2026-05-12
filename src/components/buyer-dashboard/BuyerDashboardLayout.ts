/**
 * BuyerDashboardLayout Component
 * 3-column layout orchestrator: Sidebar (260px) | Center (flex-1) | Right Panel (~380px)
 * Max-width 1425px centered, page bg #F5F5F5, 14px gap.
 */

import type { BuyerDashboardData } from "../../types/buyerDashboard";
import { NewBuyerInfo } from "./NewBuyerInfo";
import { OrdersSection, initOrdersSection } from "./OrdersSection";
import { SupportTicketsCard, initSupportTicketsCard } from "./SupportTicketsCard";
import { FavoritesSection } from "../right-panel/FavoritesSection";
import { BrowsingHistorySection } from "../right-panel/BrowsingHistorySection";
// import { PromotionSection, initPromotionSection } from '../right-panel/PromotionSection';
import { getBrowsingHistory } from "../../services/browsingHistoryService";
import { getItems as getFavoriteItems } from "../../stores/favorites";

export interface BuyerDashboardLayoutProps {
  data: BuyerDashboardData;
  emailVerified?: boolean;
}

export function BuyerDashboardLayout({
  data,
  emailVerified: _emailVerified = true,
}: BuyerDashboardLayoutProps): string {
  // Banner artık TopBar.ts içinde global olarak render ediliyor (her sayfada).
  // Burada local banner kaldırıldı; emailVerified prop'u backwards compat
  // amaçlı korunuyor ama kullanılmıyor.
  void _emailVerified;

  return `
    <div class="sc-buyer-dashboard bg-[#F5F5F5]">
      <div class="max-w-[1425px] mx-auto px-[clamp(0.25rem,0.2rem+0.4vw,1rem)] py-4 max-sm:py-3">

        <div class="flex gap-[clamp(0.5rem,0.4rem+0.4vw,0.875rem)] items-start max-lg:flex-col max-lg:items-stretch">
          <!-- Center Column -->
          <div class="flex-1 min-w-0 flex flex-col gap-[clamp(0.5rem,0.4rem+0.4vw,0.875rem)] max-lg:w-full">
            ${NewBuyerInfo({ user: data.user })}
            ${OrdersSection()}
          </div>

          <!-- Right Panel -->
          <div class="w-[380px] max-xl:w-[300px] max-lg:w-full flex-shrink-0 flex flex-col gap-[clamp(0.5rem,0.4rem+0.4vw,0.875rem)]">
            ${SupportTicketsCard()}
            ${FavoritesSection(getFavoriteItems())}
            ${BrowsingHistorySection(
              getBrowsingHistory().map((h) => ({
                id: h.id,
                image: h.image,
                price: h.price ?? 0,
                currency: h.currency ?? "$",
                minOrder: h.minOrder ?? "",
                href: h.href,
              }))
            )}
            ${/* PromotionSection(data.promotions) */ ""}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Initialize all BuyerDashboardLayout interactive behaviors.
 */
export function initBuyerDashboardLayout(): void {
  initOrdersSection();
  void initSupportTicketsCard();
  // initPromotionSection();
}
