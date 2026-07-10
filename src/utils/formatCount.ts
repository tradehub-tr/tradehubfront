/**
 * Sosyal kanıt rozetinde sayı formatlama.
 *
 * - n < 1000  → tam sayı string ("14", "999")
 * - n >= 1000 → bin-bazlı yuvarlama + "." separator + "+" suffix
 *               ("1.000+", "2.000+", "12.000+")
 * - geçersiz girdi (negatif, NaN, Infinity) → "0"
 *
 * Used by: src/alpine/socialProofBadge.ts (G1)
 */
export function formatCount(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "0";
  const v = Math.floor(n);
  if (v < 1000) return v.toString();
  const rounded = Math.floor(v / 1000) * 1000;
  return `${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}+`;
}

/**
 * Görüntülenme sayısı kısaltması: 1500 → "1.5K+", 2000000 → "2M+".
 * Used by: hero/TailoredSelections.ts, tailored-selections/TailoredSelectionsHero.ts
 */
export function formatViews(n: number | string): string {
  const num = typeof n === "number" ? n : parseInt(String(n), 10) || 0;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, "")}M+`;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}K+`;
  return String(num);
}
