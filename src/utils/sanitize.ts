import DOMPurify from "dompurify";

/**
 * Sanitize HTML string to prevent XSS.
 * Allows safe inline formatting tags only.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "b",
      "i",
      "em",
      "strong",
      "a",
      "br",
      "span",
      "p",
      "ul",
      "ol",
      "li",
      "small",
      "sub",
      "sup",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class", "style"],
  });
}

/**
 * Set element innerHTML with DOMPurify sanitization.
 */
export function safeInnerHTML(el: HTMLElement, html: string): void {
  el.innerHTML = sanitizeHtml(html);
}

/**
 * Escape HTML-significant characters. Use when interpolating user-controlled
 * strings into a template literal that will be assigned to innerHTML. Backend
 * `body`, `title`, `author`, `seller_name`, file URL etc. MUST go through this
 * before reaching innerHTML/x-html — backend trust is not enough.
 */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Validate CSS color hex (#abc / #abcdef / #abcdefab) — reject anything else. */
export function safeHexColor(value: unknown, fallback = "#cccccc"): string {
  const s = String(value ?? "");
  return /^#[0-9a-fA-F]{3,8}$/.test(s) ? s : fallback;
}
