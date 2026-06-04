/**
 * Text-direction helpers for RTL (Arabic) support.
 *
 * Swiper determines RTL from `el.dir === 'rtl'` OR the element's *computed*
 * `direction`. The computed value can be stale/ltr at init time (element hidden,
 * not yet reflowed, or initialised before `<html dir>` is applied), which leaves
 * horizontal carousels anchored to the wrong side with empty space. Setting the
 * container's `dir` attribute explicitly — Swiper's documented RTL trigger —
 * makes detection deterministic regardless of timing.
 */

/** Current document direction, "rtl" for Arabic, "ltr" otherwise. */
export function getDocumentDir(): "rtl" | "ltr" {
  return document.documentElement.dir === "rtl" ? "rtl" : "ltr";
}

/**
 * Mirror the document direction onto a Swiper container *before* `new Swiper()`
 * so Swiper initialises with the correct RTL translation. Pass the same element
 * or selector you hand to `new Swiper()`. Call once prior to instantiation.
 */
export function applySwiperDir(target: HTMLElement | string): void {
  const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
  if (el) el.dir = getDocumentDir();
}
