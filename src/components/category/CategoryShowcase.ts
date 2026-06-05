/**
 * CategoryShowcase — Hero slider altında bento grid kategori vitrini
 * - İki kutu tipi: category (görsel+etiket+hover link) ve promo (düz renk+büyük metin+CTA)
 * - Serbest boyut: col_span/row_span → Tailwind col-span/row-span sınıfları (admin'den ayarlanır)
 * - Senkron CategoryShowcase() render + async initCategoryShowcase() ile arka plan yenileme
 * - i18n: getCurrentLang() ile TR/EN; EN boşsa TR fallback
 */

import { getCurrentLang } from "../../i18n";
import {
  fetchActiveShowcase,
  getCachedShowcase,
  type ShowcaseData,
  type ShowcaseTile,
} from "../../services/categoryShowcaseService";

// LITERAL sınıflar — Tailwind kaynak taraması için string'ler bütün halde durmalı.
const COL_SPAN_CLASSES: Record<number, string> = {
  1: "lg:col-span-1",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  5: "lg:col-span-5",
  6: "lg:col-span-6",
};
// Prefix'siz → tüm breakpoint'lerde (mobil dahil) uygulanır; mobilde de yükseklik çeşitliliği
// olsun ki tek sütunda hepsi eşit kare durmasın.
const ROW_SPAN_CLASSES: Record<number, string> = {
  1: "row-span-1",
  2: "row-span-2",
  3: "row-span-3",
  4: "row-span-4",
};
// Mobil + tablet (base, 2 sütunlu grid) — en fazla 2 sütun kaplasın. Desktop lg ile ezilir.
const COL_BASE_CLASSES: Record<number, string> = {
  1: "col-span-1",
  2: "col-span-2",
};

const COLUMN_CLASSES: Record<number, string> = {
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
};

// col_span/row_span → Tailwind span sınıfları (lg tam, sm en fazla 2 sütun, mobil tek sütun).
function spanClasses(colSpan: number, rowSpan: number, columns: number): string {
  const c = Math.max(1, Math.min(colSpan || 1, columns || 4));
  const r = Math.max(1, Math.min(rowSpan || 1, 4));
  const colBase = COL_BASE_CLASSES[Math.min(c, 2)];
  const colLg = COL_SPAN_CLASSES[c] ?? COL_SPAN_CLASSES[1];
  const row = ROW_SPAN_CLASSES[r] ?? ROW_SPAN_CLASSES[1];
  return `${colBase} ${colLg} ${row}`;
}

const ARROW_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';

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

function sanitizeColor(color: string, fallback: string): string {
  const c = (color || "").trim();
  // Yalnızca hex (#rgb/#rrggbb/#rrggbbaa) veya rgb()/rgba() kabul et
  if (/^#[0-9a-fA-F]{3,8}$/.test(c)) return c;
  if (/^rgba?\(\s*[\d.\s,%/]+\)$/.test(c)) return c;
  return fallback;
}

function sanitizeImageUrl(url: string): string {
  const u = (url || "").trim();
  if (!u) return "";
  // CSS url() bağlamından kaçışı engelle: tırnak, parantez, noktalı virgül içeren değerleri reddet
  if (/["'()\\;]/.test(u)) return "";
  const lower = u.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("vbscript:")) return "";
  return u;
}

function pick(tr: string, en: string): string {
  const lang = getCurrentLang();
  return lang === "en" && en && en.trim() ? en : tr;
}

function categoryTile(t: ShowcaseTile, columns: number): string {
  const label = pick(t.label_tr, t.label_en);
  const hover = pick(t.hover_text_tr, t.hover_text_en) || (getCurrentLang() === "en" ? "See products" : "Ürünleri gör");
  const href = t.link_href ? escapeAttr(sanitizeHref(t.link_href)) : "#";
  const sizeCls = spanClasses(t.col_span, t.row_span, columns);
  const safeImage = sanitizeImageUrl(t.image);
  const bgStyle = safeImage
    ? `background-image:url('${safeImage}');background-size:contain;background-position:center;background-repeat:no-repeat`
    : "";
  return `
    <a
      href="${href}"
      class="group relative block overflow-hidden rounded-md ${safeImage ? "bg-white" : "bg-gray-100"} ${sizeCls} appearance-none focus:outline-none"
      style="${bgStyle}"
    >
      ${
        label
          ? `<span class="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 inline-flex max-w-[calc(100%-1rem)] items-center truncate rounded bg-white/90 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-gray-800">${escapeText(label)}</span>`
          : ""
      }
      <span class="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20"></span>
      <span class="absolute bottom-2 sm:bottom-3 lg:bottom-4 left-1/2 z-10 -translate-x-1/2 inline-flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm lg:text-base font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        ${escapeText(hover)} ${ARROW_SVG}
      </span>
    </a>
  `;
}

function promoTile(t: ShowcaseTile, columns: number): string {
  const badge = pick(t.promo_badge_tr, t.promo_badge_en);
  const title = pick(t.promo_title_tr, t.promo_title_en);
  const cta = pick(t.cta_text_tr, t.cta_text_en);
  const href = t.cta_href ? escapeAttr(sanitizeHref(t.cta_href)) : "#";
  const sizeCls = spanClasses(t.col_span, t.row_span, columns);
  const bg = sanitizeColor(t.background_color, "#cc9900");
  return `
    <a
      href="${href}"
      class="group relative flex flex-col justify-between overflow-hidden rounded-md p-3 sm:p-4 lg:p-5 text-white ${sizeCls} appearance-none focus:outline-none"
      style="background-color:${bg}"
    >
      ${
        badge
          ? `<span class="inline-flex w-fit max-w-full items-center truncate rounded bg-white/90 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-gray-800">${escapeText(badge)}</span>`
          : ""
      }
      ${title ? `<span class="line-clamp-3 break-words text-xs font-extrabold leading-tight sm:text-sm lg:text-sm">${escapeText(title)}</span>` : ""}
      ${
        cta
          ? `<span class="inline-flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm lg:text-base font-medium opacity-90 transition-opacity duration-300 group-hover:opacity-100">${escapeText(cta)} ${ARROW_SVG}</span>`
          : ""
      }
    </a>
  `;
}

function tileHtml(t: ShowcaseTile, columns: number): string {
  return t.tile_type === "promo" ? promoTile(t, columns) : categoryTile(t, columns);
}

// Render'ı etkileyen TÜM veriyi imzala — değişiklik (boyut, sıra, renk, içerik) tespiti için.
// Sadece id'leri imzalamak boyut değişimini kaçırırdı (init early-return → stale layout).
function signature(data: ShowcaseData): string {
  return JSON.stringify({
    enabled: data.enabled,
    columns: data.columns,
    title: data.section_title,
    tiles: data.tiles,
  });
}

export function CategoryShowcase(data: ShowcaseData = getCachedShowcase()): string {
  if (!data.enabled || !data.tiles.length) {
    return `<div data-category-showcase-root class="hidden"></div>`;
  }
  const hashAttr = signature(data);
  const title = pick(data.section_title.tr, data.section_title.en);
  const colCls = COLUMN_CLASSES[data.columns] ?? COLUMN_CLASSES[4];
  const tilesHtml = data.tiles.map((t) => tileHtml(t, data.columns)).join("");
  return `
    <div data-category-showcase-root data-showcase-hash='${escapeAttr(hashAttr)}' class="rounded-md bg-gray-50 px-3 py-2 sm:px-4 sm:py-3 lg:py-4">
      <div class="mx-auto w-full max-w-[1280px]">
        ${title ? `<h2 class="mb-4 text-xl font-semibold text-gray-900">${escapeText(title)}</h2>` : ""}
        <div class="grid grid-cols-2 ${colCls} gap-2 sm:gap-4 auto-rows-[85px] sm:auto-rows-[145px] lg:auto-rows-[210px] grid-flow-row-dense">
          ${tilesHtml}
        </div>
      </div>
    </div>
  `;
}

export async function initCategoryShowcase(): Promise<void> {
  const existingRoot = document.querySelector<HTMLElement>("[data-category-showcase-root]");
  if (!existingRoot) return;

  try {
    const fresh = await fetchActiveShowcase();
    const currentHash = existingRoot.dataset.showcaseHash ?? "";
    const nextHash = signature(fresh);
    if (currentHash === nextHash) return;

    const newHtml = CategoryShowcase(fresh);
    const wrapper = document.createElement("div");
    wrapper.innerHTML = newHtml;
    const newRoot = wrapper.firstElementChild as HTMLElement | null;
    if (!newRoot) return;
    existingRoot.replaceWith(newRoot);
  } catch (err) {
    console.warn("[CategoryShowcase] init failed", err);
  }
}
