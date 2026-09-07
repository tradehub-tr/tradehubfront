/** Ağaçtaki bir kategoriyi tanımlayan asgari bilgi (facet `path` elemanı). */
export interface CategoryRef {
  id: string;
  name: string;
  slug: string;
}

/** Backend get_filter_facets → categories elemanı: yaprak sayımı + kökten ebeveyne ata zinciri. */
export interface CategoryFacetItem extends CategoryRef {
  count: number;
  /** Kökten başlar, kategorinin kendisini içermez. */
  path: CategoryRef[];
}

/** Sidebar kategori ağacının render edilebilir düğümü. */
export interface CategoryTreeNode extends CategoryRef {
  /** Kendi ilan sayısı + tüm torunların toplamı. */
  count: number;
  /** 0 = kök. */
  depth: number;
  /** Seçili kategoriye giden yol üzerinde → başlangıçta açık. */
  open: boolean;
  /** URL'deki (?cat=) kategori bu düğüm. */
  selected: boolean;
  children: CategoryTreeNode[];
}

/**
 * Facet listesini (her kategori + ata zinciri) açılır-kapanır ağaca çevirir.
 *
 * - Her path elemanı için düğüm oluşturulur; aynı id tek düğümde birleşir.
 * - Sayım: düğümün kendi facet sayısı + torunların toplamı.
 * - Kardeşler sayıma göre azalan, eşitlikte ada göre sıralanır.
 * - `current` (slug ya da id) yoluna düşen atalar ve düğümün kendisi `open`,
 *   düğümün kendisi `selected`.
 */
export function buildCategoryFacetTree(
  facets: CategoryFacetItem[],
  current: string | undefined
): CategoryTreeNode[] {
  const roots: CategoryTreeNode[] = [];
  const byParent = new Map<CategoryTreeNode | null, Map<string, CategoryTreeNode>>();
  const isCurrent = (n: CategoryRef) => !!current && (n.slug === current || n.id === current);

  const ensure = (parent: CategoryTreeNode | null, ref: CategoryRef, depth: number) => {
    let siblings = byParent.get(parent);
    if (!siblings) {
      siblings = new Map();
      byParent.set(parent, siblings);
    }
    let node = siblings.get(ref.id);
    if (!node) {
      node = {
        id: ref.id,
        name: ref.name,
        slug: ref.slug,
        count: 0,
        depth,
        open: false,
        selected: isCurrent(ref),
        children: [],
      };
      siblings.set(ref.id, node);
      (parent ? parent.children : roots).push(node);
    }
    return node;
  };

  for (const f of facets) {
    let parent: CategoryTreeNode | null = null;
    const chain: CategoryTreeNode[] = [];
    f.path.forEach((ref, i) => {
      parent = ensure(parent, ref, i);
      chain.push(parent);
    });
    const self = ensure(parent, f, f.path.length);
    chain.push(self);
    for (const n of chain) n.count += f.count;
  }

  const finalize = (nodes: CategoryTreeNode[]): boolean => {
    nodes.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "tr"));
    let anyOnPath = false;
    for (const n of nodes) {
      const childOnPath = finalize(n.children);
      n.open = n.selected || childOnPath;
      if (n.open) anyOnPath = true;
    }
    return anyOnPath;
  };
  finalize(roots);
  return roots;
}

const TR_FOLD: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" };

/** Türkçe duyarsız arama anahtarı: küçük harf + ç/ğ/ı/ö/ş/ü sadeleştirme. */
function foldTr(text: string): string {
  return text.toLocaleLowerCase("tr").replace(/[çğıöşü]/g, (ch) => TR_FOLD[ch] ?? ch);
}

/**
 * Sidebar kategori arama kutusu: adı ya da atalarından biri terimi içeren
 * facet'leri döndürür (dal bütün kalsın diye). Boş terimde girdi aynen döner.
 */
export function filterCategoryFacets(
  facets: CategoryFacetItem[],
  term: string
): CategoryFacetItem[] {
  const needle = foldTr(term.trim());
  if (!needle) return facets;
  return facets.filter(
    (f) => foldTr(f.name).includes(needle) || f.path.some((p) => foldTr(p.name).includes(needle))
  );
}
