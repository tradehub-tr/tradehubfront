/**
 * HeaderNotice — Üst koyu şeritte duyuru bandı
 * - 3 display mode: single (sabit), slide (JS-driven dikey geçiş), marquee (kayan)
 * - Per-notice background_color desteği
 * - Senkron HeaderNotice() render + async initHeaderNotice() ile arka plan yenileme
 * - i18n: getCurrentLang() ile TR/EN; EN boşsa TR fallback
 */

import { getCurrentLang } from "../../i18n";
import {
  fetchActiveNoticeData,
  getCachedNoticeData,
  type HeaderNoticeData,
  type HeaderNoticeItem,
} from "../../services/headerNoticeService";

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
  if (
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("vbscript:")
  ) {
    return "#";
  }
  return url;
}

function noticeContent(n: HeaderNoticeItem): string {
  const lang = getCurrentLang();
  const message =
    lang === "en" && n.message_en && n.message_en.trim() ? n.message_en : n.message_tr;
  const linkText =
    lang === "en" && n.link_text_en && n.link_text_en.trim() ? n.link_text_en : n.link_text_tr;
  const linkHtml =
    linkText && n.link_href
      ? `<a href="${escapeAttr(sanitizeHref(n.link_href))}" class="ml-2 underline text-[#ffb800] hover:text-white">${escapeText(linkText)}</a>`
      : "";
  return `<span class="inline-flex items-center gap-2"><span>${escapeText(message)}</span>${linkHtml}</span>`;
}

export function HeaderNotice(
  data: HeaderNoticeData = { display_mode: "marquee", notices: [] }
): string {
  const notices = data.notices;
  if (!notices.length) {
    return `<div data-header-notice-root class="hidden"></div>`;
  }
  const mode = data.display_mode;
  const hashAttr = JSON.stringify({ mode, ids: notices.map((n) => n.name) });
  const bg = notices[0]?.background_color || "#1a1a1a";

  if (mode === "single") {
    return `
      <div
        data-header-notice-root
        data-notice-hash='${escapeAttr(hashAttr)}'
        class="text-white text-[12px] leading-none overflow-hidden"
        style="background:${escapeAttr(bg)}"
      >
        <div class="container-boxed">
          <div class="h-9 flex items-center justify-center">
            ${noticeContent(notices[0])}
          </div>
        </div>
      </div>
    `;
  }

  if (mode === "slide") {
    // JS-driven vertical slide rotation (setupSlideRotation runs after DOM insertion)
    const items = notices
      .map(
        (n, i) => `
          <div
            class="header-notice-slide-item${i === 0 ? " active" : ""}"
            data-slide-idx="${i}"
            style="background:${escapeAttr(n.background_color || "#1a1a1a")}"
          >
            <div class="container-boxed">
              <div class="h-9 flex items-center justify-center">
                ${noticeContent(n)}
              </div>
            </div>
          </div>
        `
      )
      .join("");
    return `
      <div
        data-header-notice-root
        data-notice-hash='${escapeAttr(hashAttr)}'
        data-slide-total="${notices.length}"
        class="header-notice-slide-root text-white text-[12px] leading-none"
      >
        ${items}
      </div>
    `;
  }

  // marquee (default)
  const renderItems = (arr: HeaderNoticeItem[]) => arr.map((n) => noticeContent(n)).join("");
  return `
    <div
      data-header-notice-root
      data-notice-hash='${escapeAttr(hashAttr)}'
      class="text-white text-[12px] leading-none overflow-hidden"
      style="background:${escapeAttr(bg)}"
    >
      <div class="container-boxed">
        <div class="relative h-9 flex items-center [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
          <div class="flex items-center gap-12 whitespace-nowrap [animation:notice-scroll_22s_linear_infinite] hover:[animation-play-state:paused]">
            ${renderItems(notices)}
            ${renderItems(notices)}
          </div>
        </div>
      </div>
    </div>
  `;
}

function setupSlideRotation(root: HTMLElement): void {
  const items = Array.from(root.querySelectorAll<HTMLElement>(".header-notice-slide-item"));
  if (items.length <= 1) return;
  let current = 0;
  const id = window.setInterval(() => {
    const next = (current + 1) % items.length;
    items[current].classList.remove("active");
    items[current].classList.add("exiting");
    items[next].classList.remove("exiting");
    items[next].classList.add("active");
    // After exit transition completes, reset non-current items for the next cycle
    window.setTimeout(() => {
      items.forEach((el, idx) => {
        if (idx !== next) el.classList.remove("exiting", "active");
      });
    }, 450);
    current = next;
  }, 5000);
  // Store interval id so initHeaderNotice can clear it before replacing the DOM
  root.dataset.slideIntervalId = String(id);
}

export async function initHeaderNotice(): Promise<void> {
  const existingRoot = document.querySelector<HTMLElement>("[data-header-notice-root]");
  if (!existingRoot) return;

  try {
    const fresh = await fetchActiveNoticeData();
    const currentHash = existingRoot.dataset.noticeHash ?? "";
    const nextHash = JSON.stringify({
      mode: fresh.display_mode,
      ids: fresh.notices.map((n) => n.name),
    });

    if (currentHash === nextHash) {
      // Same content; wire up slide rotation if the initial sync render didn't set it yet
      if (fresh.display_mode === "slide" && !existingRoot.dataset.slideIntervalId) {
        setupSlideRotation(existingRoot);
      }
      return;
    }

    // Clear old slide interval before replacing
    if (existingRoot.dataset.slideIntervalId) {
      window.clearInterval(Number(existingRoot.dataset.slideIntervalId));
    }

    const newHtml = HeaderNotice(fresh);
    const wrapper = document.createElement("div");
    wrapper.innerHTML = newHtml;
    const newRoot = wrapper.firstElementChild as HTMLElement;
    if (!newRoot) return;
    existingRoot.replaceWith(newRoot);

    if (fresh.display_mode === "slide") {
      setupSlideRotation(newRoot);
    }
  } catch (err) {
    console.warn("[HeaderNotice] init failed", err);
  }
}

export { getCachedNoticeData };
