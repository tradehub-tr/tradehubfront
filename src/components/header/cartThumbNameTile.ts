/**
 * Mini sepet küçük-resim kutusu için görselsiz yedek: ürün görseli yoksa (ya da
 * yüklenemezse) 40×40 kutuda ürün adı gösterilir; uzun ad 2 satırda kırpılıp
 * üç noktayla biter, tam ad title'da durur. (2026-09-07 kararı — ikon yerine ad.)
 */
import { escapeHtml } from "../../utils/sanitize";

export function cartThumbNameTile(title: string): string {
  const name = (title || "").trim();
  return `<div data-thumb-name class="w-10 h-10 rounded-md bg-gray-100 border border-gray-100 px-1 pt-1 flex items-start overflow-hidden text-[9px] leading-[10px] font-medium text-gray-600 text-center" title="${escapeHtml(name)}"><span class="w-full line-clamp-2 break-words">${escapeHtml(name)}</span></div>`;
}
