/**
 * GitHub Pages'te /files/ ve /private/files/ path'leri backend'e yönlendirilmez.
 * Bu modül, img src ve background-image URL'lerini otomatik olarak backend URL'sine yazar.
 * Docker deploy'da VITE_MEDIA_BASE boş olduğu için hiçbir şey yapmaz.
 */

const MEDIA_BASE = import.meta.env.VITE_MEDIA_BASE || "";

function needsRewrite(src: string | null): boolean {
  return !!src && (src.startsWith("/files/") || src.startsWith("/private/files/"));
}

function rewriteImg(img: HTMLImageElement): void {
  const src = img.getAttribute("src");
  if (needsRewrite(src)) {
    img.setAttribute("src", MEDIA_BASE + src);
  }
}

function rewriteBgImages(el: HTMLElement): void {
  const style = el.getAttribute("style");
  if ((style && style.includes("url(/files/")) || style?.includes("url(/private/files/")) {
    el.setAttribute(
      "style",
      style.replace(/url\((\/(?:private\/)?files\/[^)]+)\)/g, `url(${MEDIA_BASE}$1)`)
    );
  }
}

function rewriteAll(root: HTMLElement): void {
  root.querySelectorAll<HTMLImageElement>("img").forEach(rewriteImg);
  root.querySelectorAll<HTMLElement>('[style*="/files/"]').forEach(rewriteBgImages);
  if (root instanceof HTMLImageElement) rewriteImg(root);
  if (root.hasAttribute?.("style")) rewriteBgImages(root);
}

export function initMediaRewriter(): void {
  if (!MEDIA_BASE) return;

  // Mevcut resimleri yeniden yaz
  rewriteAll(document.documentElement);

  // Dinamik eklenen veya Alpine tarafından güncellenen elementleri izle
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      // Yeni eklenen node'lar
      for (const node of m.addedNodes) {
        if (node instanceof HTMLElement) rewriteAll(node);
      }
      // src veya style attribute değişiklikleri
      if (m.type === "attributes" && m.target instanceof HTMLElement) {
        if (m.attributeName === "src" && m.target instanceof HTMLImageElement) {
          rewriteImg(m.target);
        }
        if (m.attributeName === "style") {
          rewriteBgImages(m.target);
        }
      }
    }
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src", "style"],
  });
}
