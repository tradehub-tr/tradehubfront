/**
 * Ülke bayrağı SVG'leri.
 *
 * Emoji bayraklar (🇹🇷 = regional-indicator çifti) Windows'ta render
 * EDİLMEZ — Chrome/Edge/Firefox Windows'ta bayrak glyph'i olmadığından
 * yalnız "TR" harflerini gösterir. Tüm tarayıcı/OS'larda birebir aynı
 * görünmesi için inline SVG kullanılır (ayrıca "UI'da emoji yok" kuralı).
 *
 * Tüm viewBox'lar 3:2 oranında — `w-[18px] h-3` kutuda distorsiyonsuz oturur.
 */
const FLAGS: Record<string, { vb: string; inner: string }> = {
  TR: {
    vb: "0 0 1200 800",
    inner: `<rect width="1200" height="800" fill="#e30a17"/><circle cx="425" cy="400" r="200" fill="#fff"/><circle cx="475" cy="400" r="160" fill="#e30a17"/><path fill="#fff" d="M670 400 741 425 743 500 788 440 860 462 817 400 860 338 788 360 743 300 741 375Z"/>`,
  },
  DE: {
    vb: "0 0 3 2",
    inner: `<rect width="3" height="0.667" y="0" fill="#000"/><rect width="3" height="0.667" y="0.667" fill="#d00"/><rect width="3" height="0.666" y="1.334" fill="#ffce00"/>`,
  },
  FR: {
    vb: "0 0 3 2",
    inner: `<rect width="1" height="2" x="0" fill="#0055a4"/><rect width="1" height="2" x="1" fill="#fff"/><rect width="1" height="2" x="2" fill="#ef4135"/>`,
  },
};

/**
 * Verilen ülke koduna ait inline SVG bayrak string'i döndürür.
 * Tanımsız kod için boş string (sadece kod metni gösterilir).
 */
export function getFlagSvg(
  code: string,
  cls = "h-3 w-[18px] shrink-0 rounded-[2px] ring-1 ring-black/10"
): string {
  const f = FLAGS[(code || "").toUpperCase()];
  if (!f) return "";
  return `<svg viewBox="${f.vb}" class="${cls}" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${f.inner}</svg>`;
}
