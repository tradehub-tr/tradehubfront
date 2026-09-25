/**
 * Kategori ikon çözümleme — mega menü, kategoriler sayfası ve manufacturers sayfası
 * aynı ikon mantığını paylaşır (bkz. workflow.md §1 refactor-before-write). Önceden
 * MegaMenu.ts içindeydi; oradan ve `../components/header` barrel'ından hâlâ
 * re-export edilerek mevcut import yolları bozulmadan tek kaynağa taşındı.
 */

import { getLucideIcon, getLucideIconByCategoryName } from "../icons/lucideIcons";

/**
 * Eski API koruma haritası: Bu projede başka yerlerden çağrılan
 * getCategoryIcon("textile"), getCategoryIcon("chip") gibi anahtarları
 * Lucide karşılıklarına bağlar. Yeni kategori için lucideIcons.ts'i kullan.
 */
const LEGACY_TO_LUCIDE: Record<string, string> = {
  star: "star",
  shirt: "shirt",
  chip: "cpu",
  trophy: "trophy",
  running: "footprints",
  shoe: "footprints",
  home: "home",
  sparkles: "sparkles",
  diamond: "gem",
  bag: "backpack",
  box: "boxes",
  baby: "baby",
  food: "utensils-crossed",
  textile: "scissors",
  chemistry: "flask-conical",
  agriculture: "sprout",
  health: "heart-pulse",
  building: "building",
  machinery: "cog",
  tools: "wrench",
  car: "car",
  paper: "briefcase",
  electrical: "cpu",
  furniture: "sofa",
  shopping: "shopping-bag",
};

export function getCategoryIcon(iconName: string): string {
  const lucideName = LEGACY_TO_LUCIDE[iconName] ?? iconName;
  return getLucideIcon(lucideName);
}

/**
 * Kategori adındaki anahtar kelimelere göre otomatik Lucide icon seçer.
 * Backend `icon_class` boş bırakıldığında devreye girer.
 */
export function getIconByName(name: string): string {
  return getLucideIconByCategoryName(name);
}
