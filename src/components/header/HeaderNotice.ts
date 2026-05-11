/**
 * HeaderNotice — Üst koyu şeritte kayan duyuru bandı (marquee)
 * - Pure CSS animation (Alpine yok), hover'da durur
 * - Senkron HeaderNotice() render + async initHeaderNotice() ile arka plan yenileme
 * - i18n: getCurrentLang() ile TR/EN; EN boşsa TR fallback
 */

import { getCurrentLang } from "../../i18n";
import {
  fetchActiveNotices,
  getCachedNotices,
  type HeaderNoticeItem,
} from "../../services/headerNoticeService";

const VALID_ICONS = new Set(["🎉", "⚡", "📦", "ℹ️", "🚚", "🔥", "⭐"]);

function escapeText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return escapeText(s);
}

function sanitizeHref(url: string): string {
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith("javascript:") || trimmed.startsWith("data:") || trimmed.startsWith("vbscript:")) {
    return "#";
  }
  return url;
}

function renderItems(items: HeaderNoticeItem[]): string {
  const lang = getCurrentLang();
  return items
    .map((n) => {
      const message =
        lang === "en" && n.message_en && n.message_en.trim() ? n.message_en : n.message_tr;
      const linkText =
        lang === "en" && n.link_text_en && n.link_text_en.trim() ? n.link_text_en : n.link_text_tr;
      const icon = n.icon && VALID_ICONS.has(n.icon) ? n.icon : "";
      const linkHtml =
        linkText && n.link_href
          ? `<a href="${escapeAttr(sanitizeHref(n.link_href))}" class="ml-2 underline text-[#ffb800] hover:text-white">${escapeText(linkText)}</a>`
          : "";
      return `
        <span class="inline-flex items-center gap-2">
          ${icon ? `<span aria-hidden="true">${icon}</span>` : ""}
          <span>${escapeText(message)}</span>
          ${linkHtml}
        </span>
      `;
    })
    .join("");
}

export function HeaderNotice(initialNotices: HeaderNoticeItem[] = []): string {
  if (!initialNotices.length) {
    return `<div data-header-notice-root class="hidden"></div>`;
  }
  const hashAttr = JSON.stringify(initialNotices.map((n) => n.name));
  return `
    <div
      data-header-notice-root
      data-notice-hash='${escapeAttr(hashAttr)}'
      class="bg-[#1a1a1a] text-white text-[12px] leading-none overflow-hidden"
    >
      <div class="container-boxed">
        <div
          class="relative h-9 flex items-center
                 [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]"
        >
          <div class="flex items-center gap-12 whitespace-nowrap
                      [animation:notice-scroll_22s_linear_infinite]
                      hover:[animation-play-state:paused]">
            ${renderItems(initialNotices)}
            ${renderItems(initialNotices)}
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function initHeaderNotice(): Promise<void> {
  const root = document.querySelector<HTMLElement>("[data-header-notice-root]");
  if (!root) return;

  try {
    const fresh = await fetchActiveNotices();
    const currentHash = root.dataset.noticeHash ?? "";
    const nextHash = JSON.stringify(fresh.map((n) => n.name));
    if (currentHash === nextHash) return;

    const newHtml = HeaderNotice(fresh);
    const wrapper = document.createElement("div");
    wrapper.innerHTML = newHtml;
    const newRoot = wrapper.firstElementChild as HTMLElement;
    if (newRoot) root.replaceWith(newRoot);
  } catch (err) {
    console.warn("[HeaderNotice] init failed", err);
  }
}

export { getCachedNotices };
