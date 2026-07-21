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
    // NOTE: "style" intentionally NOT allowed — inline style enables CSS
    // injection / clickjacking (background url(), position overlay).
    ALLOWED_ATTR: ["href", "target", "rel", "class"],
  });
}

/**
 * Sanitize rich HTML (product descriptions, seller rich-text) while keeping
 * common formatting tags (headings, tables, images, lists). DOMPurify's default
 * config strips <script>, event-handler attributes and `javascript:` URLs, so
 * this neutralises stored XSS while preserving legitimate markup. Use this for
 * backend rich-text fields; use escapeHtml() for short plain-text values.
 */
export function sanitizeRichHtml(dirty: unknown): string {
  return DOMPurify.sanitize(String(dirty ?? ""), {
    FORBID_TAGS: ["style"],
    FORBID_ATTR: ["style"],
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

/** Escape a value for safe interpolation inside an HTML attribute. */
export function escapeAttr(value: unknown): string {
  return escapeHtml(value);
}

/**
 * Bir string'i, TEK TIRNAKLI bir JS string literal'i içine gömülmek üzere kaçışlar.
 * Alpine ifadelerine derleme-zamanı i18n metni (`x-text="'${t('key')}'"`) gömerken
 * ZORUNLU: çevirideki apostrof (İngilizce `don't`, `Seller's`) tek tırnağı erken
 * kapatıp "Unexpected identifier" ile TÜM x-data/expression'ı çökertir.
 */
export function escapeJsString(value: unknown): string {
  return String(value ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

/** Validate CSS color hex (#abc / #abcdef / #abcdefab) — reject anything else. */
export function safeHexColor(value: unknown, fallback = "#cccccc"): string {
  const s = String(value ?? "");
  return /^#[0-9a-fA-F]{3,8}$/.test(s) ? s : fallback;
}

/**
 * Sanitize a URL before placing it into an href/src attribute. Allows only
 * http(s)/mailto/tel and relative URLs (path/query/fragment). Rejects
 * `javascript:`, `data:`, `vbscript:` and protocol-relative `//host` (open
 * redirect). Whitespace/control chars are stripped before scheme detection so
 * tricks like `java\nscript:` cannot smuggle a scheme through.
 */
export function sanitizeUrl(value: unknown, fallback = "#"): string {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  // Protocol-relative → open redirect risk.
  if (raw.startsWith("//")) return fallback;
  // Relative URL (path, query, fragment) is safe.
  if (/^[/?#]/.test(raw)) return raw;
  // Strip control chars + whitespace so "java\nscript:" can't smuggle a scheme.
  // eslint-disable-next-line no-control-regex -- intentional: neutralises control-char scheme smuggling
  const stripped = raw.replace(/[\u0000-\u0020\u007f-\u009f]/g, "");
  // Has an explicit scheme → only allow the known-safe ones.
  if (/^[a-z][a-z0-9+.-]*:/i.test(stripped)) {
    return /^(https?:|mailto:|tel:)/i.test(stripped) ? raw : fallback;
  }
  // No scheme, not protocol-relative → relative path (e.g. "products.html").
  return raw;
}
