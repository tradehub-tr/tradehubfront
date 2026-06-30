/**
 * Varyant fiyat güncelleme — masaüstü (ProductInfo) ve mobil (MobileLayout)
 * varyant seçim handler'larının ortak yardımcısı.
 *
 * `data-variant-price`, varyant butonuna `listingService.mapListingDetail`
 * tarafından ZATEN seçili para birimine çevrilmiş skaler olarak basılır; bu
 * yüzden tekrar `convertPrice` GEREKMEZ — yalnız `formatCurrency` ile doğru
 * biçimlendirilir (TRY için `₺1.250,00` binlik/ondalık). Eski mobil kod
 * `getCurrencySymbol() + toFixed(2)` kullanıp biçimi bozuyordu; masaüstü ise
 * fiyatı hiç güncellemiyordu.
 */

import { formatCurrency, getSelectedCurrency } from "../../services/currencyService";

export function applyVariantPrice(btn: HTMLElement, priceSelector: string): void {
  const variantPrice = btn.getAttribute("data-variant-price");
  if (!variantPrice) return;
  const amount = parseFloat(variantPrice);
  if (Number.isNaN(amount)) return;

  const priceEl = document.querySelector<HTMLElement>(priceSelector);
  if (priceEl) {
    priceEl.textContent = formatCurrency(amount, getSelectedCurrency());
  }

  // Gallery / sticky bar gibi diğer dinleyiciler için tek olay yay.
  document.dispatchEvent(new CustomEvent("variant-price-change", { detail: { price: amount } }));
}
