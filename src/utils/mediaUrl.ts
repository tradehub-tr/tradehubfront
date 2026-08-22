/**
 * GitHub Pages'te /files/ ve /private/files/ path'leri backend'e yönlendirilmez.
 * Bu modül, img src ve background-image URL'lerini otomatik olarak backend URL'sine yazar.
 * Docker deploy'da VITE_MEDIA_BASE boş olduğu için hiçbir şey yapmaz.
 */

import { sanitizeUrl } from "./sanitize";

const MEDIA_BASE = import.meta.env.VITE_MEDIA_BASE || "";

function needsRewrite(src: string | null): boolean {
  return !!src && (src.startsWith("/files/") || src.startsWith("/private/files/"));
}

function rewriteImg(img: HTMLImageElement): void {
  const src = img.getAttribute("src");
  if (needsRewrite(src)) {
    // src DOM/sunucu kaynaklı bir URL; src attribute'una yazmadan önce
    // sema-allowlist'ten geçir (javascript:/data:/protocol-relative reddedilir).
    img.setAttribute("src", sanitizeUrl(MEDIA_BASE + src));
  }
}

function rewriteSrcset(el: HTMLImageElement | HTMLSourceElement): void {
  const srcset = el.getAttribute("srcset");
  if (!srcset) return;
  const rewritten = srcset
    .split(",")
    .map((candidate) => {
      const value = candidate.trim();
      if (!value) return "";
      const separator = value.search(/\s/);
      const src = separator === -1 ? value : value.slice(0, separator);
      const descriptor = separator === -1 ? "" : value.slice(separator).trim();
      const safe = needsRewrite(src) ? sanitizeUrl(MEDIA_BASE + src) : sanitizeUrl(src);
      return descriptor ? `${safe} ${descriptor}` : safe;
    })
    .filter(Boolean)
    .join(", ");
  if (rewritten !== srcset) el.setAttribute("srcset", rewritten);
}

function rewriteBgImages(el: HTMLElement): void {
  const style = el.getAttribute("style");
  if ((style && style.includes("url(/files/")) || style?.includes("url(/private/files/")) {
    el.setAttribute(
      "style",
      style.replace(/url\((\/(?:private\/)?files\/[^)]+)\)/g, (_match, path: string) => {
        // CSS url() context: path DOM/sunucu kaynaklı. Önce sema-allowlist,
        // sonra url()'den kaçmayı engelleyecek quote/paren/whitespace temizliği.
        const safe = sanitizeUrl(MEDIA_BASE + path).replace(/["'()\s]/g, "");
        return `url(${safe})`;
      })
    );
  }
}

function rewriteAll(root: HTMLElement): void {
  root.querySelectorAll<HTMLImageElement>("img").forEach(rewriteImg);
  root
    .querySelectorAll<HTMLImageElement | HTMLSourceElement>("img[srcset], source[srcset]")
    .forEach(rewriteSrcset);
  root.querySelectorAll<HTMLElement>('[style*="/files/"]').forEach(rewriteBgImages);
  if (root instanceof HTMLImageElement) rewriteImg(root);
  if (root instanceof HTMLImageElement || root instanceof HTMLSourceElement) rewriteSrcset(root);
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
        if (
          m.attributeName === "srcset" &&
          (m.target instanceof HTMLImageElement || m.target instanceof HTMLSourceElement)
        ) {
          rewriteSrcset(m.target);
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
    attributeFilter: ["src", "srcset", "style"],
  });
}
