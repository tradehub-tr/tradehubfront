/**
 * Chat popup tetikleyici attribute seti — data-chat-trigger + pinnedProduct
 * payload'ı (bkz. initChatTriggers.ts). Ürün detayındaki üç tetikleyici
 * (alt bar sohbet/soru gönder + Seçenekler sheet'i) aynı bloğu paylaşır;
 * escaping tek yerden `escapeHtml` ile yapılır.
 */

import { formatCurrency, getSelectedCurrency } from "../../services/currencyService";
import { escapeHtml, sanitizeUrl } from "../../utils/sanitize";
import type { ProductDetail } from "../../types/product";
import type { PinnedProduct } from "../../types/chat";

/** Chat popup'a iğnelenecek ürün payload'ı — hem HTML data-attribute'ları
 *  (chatTriggerAttrs, click-delegation) hem de doğrudan event dispatch eden
 *  bileşenler (QuestionFormSheet) AYNI kaynaktan üretir. */
export function buildPinnedProduct(p: ProductDetail): PinnedProduct {
  const price = p.priceTiers[0]
    ? formatCurrency(p.priceTiers[0].price, getSelectedCurrency())
    : "";
  return {
    id: p.id,
    title: p.title || "",
    price,
    minOrder: p.moq ? String(p.moq) : "1",
    thumbnail: p.images?.[0]?.src || "",
  };
}

export function chatTriggerAttrs(p: ProductDetail): string {
  const pp = buildPinnedProduct(p);
  return `data-chat-trigger
      data-product-id="${escapeHtml(pp.id)}"
      data-product-title="${escapeHtml(pp.title)}"
      data-product-price="${escapeHtml(pp.price)}"
      data-product-thumb="${escapeHtml(sanitizeUrl(pp.thumbnail))}"
      data-product-min-order="${escapeHtml(pp.minOrder)}"
      data-seller-id="${escapeHtml(p.supplier?.id || "")}"`;
}
