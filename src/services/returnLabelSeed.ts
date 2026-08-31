/**
 * İade kargo etiketi — mock belgesi (15-FE).
 *
 * NEDEN VAR: `FE-MOCK-DISIPLINI` §2.3 *"etiket/irsaliye yazdırılabilir
 * açılır"*. Üretilmiş fixture `return_label_url` alanında bir dosya YOLU
 * taşıyor ve backend olmadığı için o yol 404 dönüyor — alıcı "Etiketi aç"
 * düğmesine bastığında kırık sayfa görüyor.
 *
 * Aynı sınıf iki kez ölçüldü: 24 Ağustos'ta POD kanıt medyası
 * (`podMediaSeed.ts`), 28 Ağustos'ta koli barkodu (`barcodeSeed.ts`). Bu
 * modül o kararın iade karşılığı.
 *
 * `data:` URI çünkü mock'un tarayıcıdan başka bir şeye ihtiyacı olmamalı;
 * `public/` altına demo varlığı koymak üretim build'ine sızdırırdı.
 *
 * ⚠ Barkod GERÇEK bir Code128 değil (`barcodeSeed.ts` gerekçesi). Amaç
 * tarama değil, alıcının ne yazdıracağının görülmesi.
 *
 * Gerçek etiket 15-BE'de üretilecek (`15-FE-VERI-SOZLESMESI.md` §2.5,
 * `decide_return_request` yanıtı) — o gün bu modül silinir.
 */
import { barkodUrl } from "./barcodeSeed";

/**
 * İade talebine karşılık gelen etiket belgesi (`data:` URI).
 *
 * Kargo etiketinden (`barcodeSeed.etiketUrl`) ayrı: iade etiketi TERS yönde
 * gidiyor — gönderen alıcı, alıcı satıcının deposu. Aynı şablonu kullanmak
 * kutunun üstüne yanlış yön yazdırırdı.
 */
export function iadeEtiketiUrl(iade: string, sevkiyat: string): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="380" height="560" viewBox="0 0 380 560">
  <rect width="380" height="560" fill="#ffffff" stroke="#d1d5db" stroke-width="2"/>
  <rect x="0" y="0" width="380" height="56" fill="#7c2d12"/>
  <text x="20" y="36" font-family="system-ui, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">
    İADE ETİKETİ
  </text>
  <text x="20" y="92" font-family="system-ui, sans-serif" font-size="13" fill="#6b7280">İade talebi</text>
  <text x="20" y="112" font-family="monospace" font-size="15" fill="#111827">${iade}</text>
  <text x="20" y="146" font-family="system-ui, sans-serif" font-size="13" fill="#6b7280">Orijinal sevkiyat</text>
  <text x="20" y="166" font-family="monospace" font-size="15" fill="#111827">${sevkiyat}</text>
  <image href="${barkodUrl(iade)}" x="20" y="200" width="340" height="110"/>
  <text x="20" y="344" font-family="system-ui, sans-serif" font-size="13" fill="#6b7280">Gönderen</text>
  <line x1="20" y1="368" x2="360" y2="368" stroke="#e5e7eb" stroke-width="8"/>
  <text x="20" y="400" font-family="system-ui, sans-serif" font-size="13" fill="#6b7280">Alıcı — satıcı deposu</text>
  <line x1="20" y1="424" x2="360" y2="424" stroke="#e5e7eb" stroke-width="8"/>
  <line x1="20" y1="452" x2="250" y2="452" stroke="#e5e7eb" stroke-width="8"/>
  <rect x="20" y="480" width="340" height="52" fill="none" stroke="#9ca3af" stroke-dasharray="4 3"/>
  <text x="30" y="512" font-family="system-ui, sans-serif" font-size="11" fill="#6b7280">
    Bu etiketi yazdırıp kolinin üstüne yapıştırın.
  </text>
</svg>`.trim();

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}
