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
