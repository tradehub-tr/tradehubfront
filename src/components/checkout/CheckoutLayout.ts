/**
 * CheckoutLayout Component
 * Two-column layout wrapper for checkout page.
 * Left column (60%): shipping form, payment, items & delivery sections.
 * Right column (35%): sticky order summary sidebar.
 */

export interface CheckoutLayoutProps {
  leftContent: string;
  rightContent: string;
}

export function CheckoutLayout({ leftContent, rightContent }: CheckoutLayoutProps): string {
  return `
    <div class="sc-checkout-page bg-[#fafafa] max-w-[1680px] mx-auto px-3 sm:px-4 py-4 sm:py-5">
      <div class="flex flex-col xl:flex-row gap-4 xl:gap-5 items-start w-full relative">
        <!-- Left Column (Form Area) -->
        <div class="w-full xl:flex-1 xl:min-w-0 flex flex-col gap-3">
          ${leftContent}
        </div>

        <!-- Right Column (Sticky Summary) -->
        <!-- Sepet sayfasındaki özet kutusuyla (CartSummary, xl:w-[425px]) aynı genişlik: ürün şeridi iki sayfada aynı noktada taşar -->
        <div class="w-full xl:w-[425px] flex-shrink-0 xl:sticky xl:top-[20px] self-start z-10">
          ${rightContent}
        </div>
      </div>
    </div>
  `;
}
