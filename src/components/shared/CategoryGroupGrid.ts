/**
 * CategoryGroupGrid — 2. seviye kategori gruplarını ızgara olarak render eder:
 * ikonlu+kalın başlık + en fazla GROUP_LEAF_ROWS adet 3. seviye yaprak satırı +
 * gerekirse "Tümünü Gör". Mega menü kategori paneli ile /pages/categories.html
 * sayfası aynı deseni paylaşır — tek yerde tutulur (workflow.md §1
 * refactor-before-write; önceden MegaMenu.ts'e gömülüydü).
 *
 * Sütun kendi içeriği kadar yüksek kalır (çağıran taraf grid'e `items-start`
 * ekler) — az yapraklı bir grup, komşu sütundaki 4 yapraklı grubun boyuna
 * zorlanıp altında boşluk bırakmaz.
 *
 * Yaprağı (3. seviye) olmayan grup bu kategoride son seviyedir — bazı
 * kategorilerin TÜM grupları böyle olabilir (ör. "Parti Malzemeleri ve
 * Süsleri"). Böyle bir grubu ikonlu+kalın "başlık" sütunu olarak basmak hem
 * yanlış (aslında alt kategori) hem çirkin (boş başlık) olduğundan, yaprağı
 * olan gruplar ızgarada, yaprağı olmayanlar ise normal (bold olmayan) yaprak
 * linki gibi ayrı bir ızgarada gösterilir.
 */

import { t } from "../../i18n";
import { escapeHtml } from "../../utils/sanitize";
import { getIconByName } from "./categoryIcons";
import type { ApiCategoryChild } from "../../services/categoryService";

/** Her grupta gösterilen en fazla yaprak satırı; fazlası "Tümünü Gör" ile. Masaüstü + mobil ortak. */
export const GROUP_LEAF_ROWS = 4;

const LEAF_CLS =
  "block truncate text-sm leading-5 text-gray-700 transition-colors hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400";

const GRP_ARROW_SVG = `<svg class="w-3.5 h-3.5 shrink-0 transition-transform group-hover/grp:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover/grp:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m9 5 7 7-7 7"/></svg>`;

function renderGroupColumn(group: ApiCategoryChild, hrefBase: string): string {
  const leaves = group.children ?? [];
  const groupHref = `${hrefBase}?cat=${encodeURIComponent(group.slug)}`;
  const icon = getIconByName(group.name);
  const rows = leaves
    .slice(0, GROUP_LEAF_ROWS)
    .map(
      (leaf) =>
        `<a href="${hrefBase}?cat=${encodeURIComponent(leaf.slug)}" class="${LEAF_CLS}">${escapeHtml(leaf.name)}</a>`
    )
    .join("");
  const rowsBlock = rows ? `<div class="flex flex-col gap-3.5">${rows}</div>` : "";
  const moreSlot =
    leaves.length > GROUP_LEAF_ROWS
      ? `<a href="${groupHref}" class="group/grp mt-0.5 inline-flex items-center gap-1 self-start whitespace-nowrap text-sm leading-5 font-medium text-primary-600 transition-colors hover:text-primary-700">${t("commonNav.viewAll")}${GRP_ARROW_SVG}</a>`
      : "";
  return `
    <div class="flex min-w-0 flex-col gap-3.5">
      <a href="${groupHref}" class="group/grp mb-0.5 flex items-center gap-2.5 text-base leading-6 font-bold text-gray-900 transition-colors hover:text-primary-600 dark:text-white">
        <span class="inline-flex shrink-0 items-center justify-center text-gray-500 [&>svg]:w-5 [&>svg]:h-5 dark:text-gray-400">${icon}</span>
        <span class="min-w-0 line-clamp-2">${escapeHtml(group.name)}</span>
      </a>
      ${rowsBlock}
      ${moreSlot}
    </div>`;
}

/**
 * `groups` (2. seviye) ızgarasını render eder. `hrefBase` link hedefidir
 * (mega menü ve kategoriler sayfası ikisi de `/pages/products.html` kullanır).
 * Grid'in `items-start` alması çağıran tarafın sorumluluğunda değildir —
 * burada döndürülen `<div class="grid ...">` zaten `items-start` içerir.
 */
export function renderCategoryGroupsGrid(groups: ApiCategoryChild[], hrefBase: string): string {
  if (groups.length === 0) return "";
  const withLeaves = groups.filter((g) => (g.children?.length ?? 0) > 0);
  const terminal = groups.filter((g) => (g.children?.length ?? 0) === 0);
  const gridPart = withLeaves.length
    ? `<div class="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] items-start gap-x-6 gap-y-6">${withLeaves
        .map((g) => renderGroupColumn(g, hrefBase))
        .join("")}</div>`
    : "";
  const terminalPart = terminal.length
    ? `<div class="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-x-6 gap-y-3.5${withLeaves.length ? " mt-5" : ""}">${terminal
        .map(
          (g) =>
            `<a href="${hrefBase}?cat=${encodeURIComponent(g.slug)}" class="${LEAF_CLS}">${escapeHtml(g.name)}</a>`
        )
        .join("")}</div>`
    : "";
  return gridPart + terminalPart;
}
