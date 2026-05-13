/**
 * CheckoutHeader Component
 * Sayfa başlığı (h1) + dinamik alt yazı (X tedarikçiden Y ürün — ...).
 * Referans: /checkout/app.jsx -> page-head/page-title/page-sub.
 */

import { t } from "../../i18n";

export interface CheckoutHeaderProps {
  title?: string;
  subtitle?: string;
  /** Aktif tedarikçi (sipariş grubu) sayısı — alt yazıda gösterilir */
  supplierCount?: number;
  /** Toplam seçili ürün adedi — alt yazıda gösterilir */
  itemCount?: number;
}

export function CheckoutHeader({
  title,
  subtitle,
  supplierCount,
  itemCount,
}: CheckoutHeaderProps = {}): string {
  const heading = title ?? t("checkout.pageTitle");

  let sub = subtitle;
  if (!sub) {
    const baseCta = "adresini, ödeme yöntemini ve kargo seçimlerini doğrula.";
    if (
      typeof supplierCount === "number" &&
      typeof itemCount === "number" &&
      supplierCount > 0 &&
      itemCount > 0
    ) {
      sub = `${supplierCount} tedarikçiden ${itemCount} ürün — ${baseCta}`;
    } else {
      sub = baseCta.charAt(0).toUpperCase() + baseCta.slice(1);
    }
  }

  return `
    <header class="co-page-head flex items-start justify-between gap-8 mb-[18px] pt-1.5">
      <div class="co-page-head-l flex-1 min-w-0">
        <h1 class="co-page-title text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-[#1a1a1a] m-0">${heading}</h1>
        ${sub ? `<p class="co-page-sub text-[#8a877f] mt-1.5 max-w-[56ch] text-[13.5px]">${sub}</p>` : ""}
      </div>
    </header>
  `.trim();
}
