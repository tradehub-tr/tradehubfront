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
// 2xl'de +2 sütun: 1536px+ ekranda (container-boxed 1840px'e kadar akışkan) kartların
// aşırı büyümesini önlemek için grid daha çok kartla dolar.
// Literal sınıflar — Tailwind kaynak taraması için bütün halde durmalı.
const TWOXL_COLUMN_CLASSES: Record<number, string> = {
  5: "2xl:grid-cols-5",
  6: "2xl:grid-cols-6",
};

// 2xl sütun sayısı: tile hücre toplamını tam bölen, columns'tan büyük en geniş değer
// (max 6). Bölen yoksa columns döner → 2xl'de ek sütun yok, dizilim boşluksuz kalır.
// Örn. 12 hücre + columns=4 → 6; 8 hücre + columns=4 → 4 (6 ve 5 bölmez).
function pickTwoXlColumns(data: ShowcaseData): number {
  const columns = data.columns || 4;
  const cells = data.tiles.reduce((sum, t) => {
    const c = Math.max(1, Math.min(t.col_span || 1, columns));
    const r = Math.max(1, Math.min(t.row_span || 1, 4));
    return sum + c * r;
  }, 0);
  for (let n = Math.min(columns + 2, 6); n > columns; n--) {
    if (cells > 0 && cells % n === 0) return n;
  }
  return columns;
}

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
  const hover =
    pick(t.hover_text_tr, t.hover_text_en) ||
    (getCurrentLang() === "en" ? "See products" : "Ürünleri gör");
  const href = t.link_href ? escapeAttr(sanitizeHref(t.link_href)) : "#";
  const sizeCls = spanClasses(t.col_span, t.row_span, columns);
  const safeImage = sanitizeImageUrl(t.image);
  const hasImage = !!safeImage;

  // Tile ağırlığı label boyutuna yansır: hero (2x2) manşet gibi, geniş (2x1) ara,
  // standart (1x1) kompakt — bento'da hiyerarşi boyutla okunur.
  const isHero = (t.col_span || 1) >= 2 && (t.row_span || 1) >= 2;
  const isWide = !isHero && (t.col_span || 1) >= 2;
  const labelSize = isHero
    ? "text-base sm:text-xl lg:text-2xl"
    : isWide
      ? "text-sm sm:text-lg"
      : "text-xs sm:text-base";

  // Görsel cover ile hücreyi tam doldurur (contain'in yüzen beyaz boşluğu yok → tutarlı ağırlık);
  // alttan gradient scrim label'ı her görselde okunur kılar. Görsel yoksa tonal gri + koyu metin.
  const media = hasImage
    ? `<img src="${escapeAttr(safeImage)}" alt="${escapeAttr(label)}" width="400" height="400" loading="lazy" decoding="async" class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
      <span class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent transition-colors duration-200 group-hover:from-black/85 motion-reduce:transition-none"></span>`
    : "";
  const labelColor = hasImage ? "text-white" : "text-gray-900";
  const hoverColor = hasImage ? "text-white/90" : "text-gray-700";

  return `
    <a
      href="${href}"
      class="group relative block overflow-hidden rounded-md bg-gray-100 ${sizeCls} appearance-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500,#f5b800)] focus-visible:ring-offset-2"
    >
      ${media}
      <span class="absolute inset-x-0 bottom-0 z-10 p-2.5 sm:p-3 lg:p-4">
        ${label ? `<span class="line-clamp-2 font-semibold leading-snug ${labelSize} ${labelColor}">${escapeText(label)}</span>` : ""}
        <span class="mt-0.5 flex translate-y-1 items-center gap-1 text-xs opacity-0 transition-[opacity,transform] duration-200 ease-out sm:text-sm ${hoverColor} group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 motion-reduce:translate-y-0 motion-reduce:transition-none"><span class="truncate">${escapeText(hover)}</span> ${ARROW_SVG}</span>
      </span>
    </a>
  `;
}

// lucide shield-check — promo tile'ın sessiz filigranı (güvence teması)
const SHIELD_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="h-full w-full"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>';

function promoTile(t: ShowcaseTile, columns: number): string {
  const badge = pick(t.promo_badge_tr, t.promo_badge_en);
  const title = pick(t.promo_title_tr, t.promo_title_en);
  const cta = pick(t.cta_text_tr, t.cta_text_en);
  const href = t.cta_href ? escapeAttr(sanitizeHref(t.cta_href)) : "#";
  const sizeCls = spanClasses(t.col_span, t.row_span, columns);
  const bg = sanitizeColor(t.background_color, "#0a0a0a");
  return `
    <a
      href="${href}"
      class="group relative flex flex-col justify-between gap-2 overflow-hidden rounded-md p-2.5 sm:p-3 lg:p-4 xl:p-5 text-white ${sizeCls} appearance-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500,#f5b800)] focus-visible:ring-offset-2"
      style="background-color:${bg}"
    >
      <span class="pointer-events-none absolute inset-0 bg-white/0 transition-colors duration-200 group-hover:bg-white/10 motion-reduce:transition-none"></span>
      <span class="pointer-events-none absolute -bottom-4 -right-4 h-20 w-20 text-white/10 sm:h-24 sm:w-24 lg:h-28 lg:w-28" aria-hidden="true">${SHIELD_SVG}</span>
      ${
        badge
          ? `<span class="relative z-10 inline-flex w-fit max-w-full items-center truncate rounded bg-[var(--color-primary-500,#f5b800)] px-2 py-0.5 text-[10px] xl:px-2.5 xl:py-1 xl:text-[11px] font-bold uppercase tracking-wide text-[#1a1a1a]">${escapeText(badge)}</span>`
          : ""
      }
      ${title ? `<span class="relative z-10 line-clamp-3 break-words text-xs font-bold leading-snug sm:text-sm xl:text-base">${escapeText(title)}</span>` : ""}
      ${
        cta
          ? `<span class="relative z-10 hidden items-center gap-1 text-xs font-medium opacity-90 transition-opacity duration-200 group-hover:opacity-100 sm:inline-flex sm:gap-1.5 sm:text-sm motion-reduce:transition-none"><span class="truncate">${escapeText(cta)}</span> ${ARROW_SVG}</span>`
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
  // 2xl'de geniş ekranı ek kartlarla doldurur — AMA yalnızca tile hücreleri yeni sütun
  // sayısına tam bölünüyorsa (aksi halde kısa tile'ların altında boş hücre kalırdı).
  // Bölen yoksa base columns'ta kalır → her tile sayısında boşluksuz dizilim.
  const twoXlColCls = TWOXL_COLUMN_CLASSES[pickTwoXlColumns(data)] ?? "";
  const tilesHtml = data.tiles.map((t) => tileHtml(t, data.columns)).join("");
  return `
    <div data-category-showcase-root data-showcase-hash='${escapeAttr(hashAttr)}'>
      ${
        title
          ? `<div class="mb-4 flex items-baseline justify-between gap-3">
              <h2 class="text-sm sm:text-lg lg:text-xl font-semibold text-gray-900">${escapeText(title)}</h2>
              <a href="/kategoriler" class="inline-flex shrink-0 items-center gap-1 text-xs sm:text-sm font-medium text-gray-600 transition-colors duration-150 hover:text-gray-900 appearance-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500,#f5b800)] focus-visible:ring-offset-2 rounded-md motion-reduce:transition-none">${getCurrentLang() === "en" ? "All categories" : "Tüm kategoriler"} ${ARROW_SVG}</a>
            </div>`
          : ""
      }
      <div class="grid grid-cols-2 ${colCls} ${twoXlColCls} gap-2 sm:gap-4 auto-rows-[85px] sm:auto-rows-[145px] lg:auto-rows-[210px] grid-flow-row-dense">
        ${tilesHtml}
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
