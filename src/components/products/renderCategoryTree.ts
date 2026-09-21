import { t } from "../../i18n";
import { escapeHtml } from "../../utils/sanitize";
import type { CategoryTreeNode } from "./buildCategoryFacetTree";
import { sayiBicimle } from "../../utils/numberLocale";

/** Girinti: seviye → Tailwind padding sınıfı (JIT için literal olmalı). */
const INDENT_BY_DEPTH = ["", "ps-3", "ps-6", "ps-9", "ps-12", "ps-14"] as const;

const CHEVRON_SVG = `<svg class="w-3.5 h-3.5 transition-transform duration-150" :class="open ? 'rotate-180' : ''" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>`;

function renderNode(node: CategoryTreeNode): string {
  const hasChildren = node.children.length > 0;
  const indent = INDENT_BY_DEPTH[Math.min(node.depth, INDENT_BY_DEPTH.length - 1)];
  const href = `/pages/products.html?cat=${encodeURIComponent(node.slug)}`;
  // Renk CSS değişkeniyle sınıftan verilir (text-(color:--cat-color)); inline `color`
  // yazılsaydı hover:text-primary-600 sınıfını ezerdi ve hover rengi çalışmazdı.
  const linkClasses = [
    "group th-no-press flex items-start justify-between flex-1 min-w-0 py-1.5 text-[13px] leading-snug",
    "text-(color:--cat-color) hover:text-primary-600 transition-colors",
    // Yalnız en üst seviye (ana kategoriler) ve seçili düğüm kalın; alt seviyeler normal.
    node.depth === 0 || node.selected ? "font-semibold" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const linkColor = node.selected
    ? "var(--filter-title-color, #111827)"
    : "var(--filter-text-color, #374151)";

  const toggle = hasChildren
    ? `<button type="button" data-cat-toggle
          class="th-no-press flex-shrink-0 p-1 ms-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
          style="color: var(--filter-count-color, #9ca3af);"
          @click="open = !open" :aria-expanded="open"
          aria-label="${escapeHtml(t("products.filterToggleSubcategories"))}">${CHEVRON_SVG}</button>`
    : "";

  const children = hasChildren
    ? `<ul x-show="open" class="list-none m-0 p-0">${node.children.map(renderNode).join("")}</ul>`
    : "";

  return `
    <li data-cat-node="${escapeHtml(node.id)}" data-depth="${node.depth}"${hasChildren ? ' x-data="{ open: ' + (node.open ? "true" : "false") + ' }"' : ""}>
      <div class="flex items-center ${indent}">
        <a href="${href}" class="${linkClasses}" style="--cat-color: ${linkColor};" title="${escapeHtml(node.name)}"${node.selected ? ' aria-current="page"' : ""}>
          <span class="break-words group-hover:underline underline-offset-2">${escapeHtml(node.name)}</span>
          <span class="text-[11px] ms-2 flex-shrink-0 pt-0.5" data-cat-count="${escapeHtml(node.id)}" style="color: var(--filter-count-color, #9ca3af);">(${sayiBicimle(node.count)})</span>
        </a>
        ${toggle}
      </div>
      ${children}
    </li>`;
}

/** Sidebar "Kategoriler" filtresi için açılır-kapanır ağaç HTML'i. */
export function renderCategoryTree(nodes: CategoryTreeNode[]): string {
  return `<ul class="list-none m-0 p-0">${nodes.map(renderNode).join("")}</ul>`;
}
