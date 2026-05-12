/**
 * Global click delegation for chat-popup triggers.
 *
 * Any element with [data-chat-trigger] anywhere on a page will open the chat
 * popup when clicked. Data attributes drive the payload:
 *   - data-seller-id      → resolved to a conversation via chatService
 *   - data-product-id     → required when pinning a product to the chat
 *   - data-product-title  → pinned product display name
 *   - data-product-price  → pinned product price string
 *   - data-product-thumb  → pinned product thumbnail URL
 *   - data-product-min-order → "Min. Sipariş" value (string)
 *
 * Idempotent: a flag on `document` prevents double-binding when callers
 * accidentally invoke this twice within the same page lifetime.
 */

type AttachedDocument = Document & { __chatTriggersAttached?: boolean };

export function initChatTriggers(): void {
  const doc = document as AttachedDocument;
  if (doc.__chatTriggersAttached) return;

  doc.body.addEventListener("click", (ev) => {
    const target = ev.target as HTMLElement | null;
    const btn = target?.closest<HTMLElement>("[data-chat-trigger]");
    if (!btn) return;
    const ds = btn.dataset;
    const productId = ds.productId;
    window.dispatchEvent(
      new CustomEvent("chat-popup:open", {
        detail: {
          sellerId: ds.sellerId || undefined,
          pinnedProduct: productId
            ? {
                id: productId,
                title: ds.productTitle ?? "",
                price: ds.productPrice ?? "",
                minOrder: ds.productMinOrder ?? "1",
                thumbnail: ds.productThumb ?? "",
              }
            : undefined,
        },
      }),
    );
  });

  doc.__chatTriggersAttached = true;
}
