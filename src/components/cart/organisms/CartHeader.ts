/**
 * Cart page header — sadece sayfa başlığı.
 * Global ödeme akışı sağ paneldeki CartSummary "Ödeme yap" butonu üzerinden gider.
 */

export interface CartHeaderProps {
  title?: string;
}

export function CartHeader({ title }: CartHeaderProps = {}): string {
  const heading = title ?? "Sepetim";
  return `
    <header class="sc-c-page-head flex items-center justify-between gap-4 mb-1 pt-1 max-[720px]:flex-wrap">
      <h1 class="text-[22px] sm:text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-text-heading">${heading}</h1>
    </header>
  `.trim();
}
