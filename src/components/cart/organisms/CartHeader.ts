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
    <header class="sc-c-page-head flex items-center justify-between gap-4 mb-1">
      <h1 class="text-2xl sm:text-3xl font-bold text-text-heading">${heading}</h1>
    </header>
  `.trim();
}
