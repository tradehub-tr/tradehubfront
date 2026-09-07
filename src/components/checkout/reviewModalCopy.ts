/**
 * Sipariş onay penceresi başlık metinleri.
 *
 * Ödeme tek bir satıcıya yapılıyorsa (sepetteki "Satıcıya ödeme yap" akışı ya da
 * sepette tek satıcı) başlık mağaza adını taşır: "Özgen Plastik sipariş onayı" —
 * ve ödemenin doğrudan o satıcıya yapıldığı ayrı bir satırda söylenir. Birden çok
 * satıcı varsa genel "Siparişinizi gözden geçirin" başlığı kalır, not basılmaz.
 * Onay butonu da aynı kuralı izler: "Özgen Plastik siparişini onayla" / "Siparişi onayla".
 */
import { t } from "../../i18n";

export interface ReviewModalOrderLike {
  sellerName: string;
}

function singleSellerName(orders: ReviewModalOrderLike[]): string {
  if (orders.length !== 1) return "";
  return (orders[0]?.sellerName || "").trim();
}

export function reviewModalTitle(orders: ReviewModalOrderLike[]): string {
  const seller = singleSellerName(orders);
  return seller ? t("checkout.reviewOrderTitleSeller", { seller }) : t("checkout.reviewOrderTitle");
}

export function reviewModalDirectPayNote(orders: ReviewModalOrderLike[]): string {
  const seller = singleSellerName(orders);
  return seller ? t("checkout.reviewOrderDirectPay", { seller }) : "";
}

export function reviewModalConfirmLabel(orders: ReviewModalOrderLike[]): string {
  const seller = singleSellerName(orders);
  return seller ? t("checkout.confirmOrderBtnSeller", { seller }) : t("checkout.confirmOrderBtn");
}
