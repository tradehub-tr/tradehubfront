/**
 * Kargo barkodu — mock görseli (13-FE görsel denetimi, 2026-08-28).
 *
 * NEDEN VAR: üretilmiş fixture `"/files/barkod/PKG-42-001.png"` gibi YOLLAR
 * taşıyor ve backend olmadığı için üçü de 404. Bileşen doğru davranıyor —
 * `onerror` yedeği "Barkod yüklenemedi" yazıyor — ama satıcının gerçekte ne
 * göreceği, yani **barkodun tasarımı**, hiçbir yerde görünmüyordu.
 *
 * Aynı sınıf 24 Ağustos'ta POD kanıt medyası için ölçülmüştü (`KALAN-ISLER`
 * A11): *"Ekran zaten doğru davranıyordu; görülemeyen şey medyanın
 * TASARIMIYDI."* Bu modül o kararın etiket karşılığı.
 *
 * `data:` URI çünkü mock'un tarayıcıdan başka bir şeye ihtiyacı olmamalı;
 * `public/` altına demo varlığı koymak üretim build'ine sızdırırdı. Gerçek
 * barkod 13-BE'de üretilecek (`KALAN-ISLER` §B → "13-FE P3: barkod görseli"),
 * o gün bu modül silinir.
 *
 * ⚠ Bu GERÇEK bir Code128 değil — koddan türeyen deterministik bir çizgi
 * deseni. Amaç tarama değil, tasarımın görülmesi. Okuyucuya tutulursa çalışmaz
 * ve çalışmamalı: mock barkodun kargo sisteminde iş görmesi tehlikeli olurdu.
 */

/** Kod metninden sabit bir sayı üretir — aynı koli hep aynı barkodu alır. */
function tohum(kod: string): number {
  let h = 2166136261;
  for (let i = 0; i < kod.length; i += 1) {
    h ^= kod.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Koli koduna karşılık gelen barkod görseli (`data:` URI).
 *
 * Çizgi genişlikleri koddan türüyor; iki farklı koli iki farklı desen alıyor
 * ki ekranda "hepsi aynı görsel" yanılsaması olmasın.
 */
export function barkodUrl(kod: string): string {
  let durum = tohum(kod);
  const sonraki = (): number => {
    durum = (durum * 1103515245 + 12345) >>> 0;
    return durum;
  };

  const cizgiler: string[] = [];
  let x = 8;
  while (x < 292) {
    const genislik = 1 + (sonraki() % 4);
    const bosluk = 1 + (sonraki() % 3);
    cizgiler.push(`<rect x="${x}" y="8" width="${genislik}" height="64" fill="#111827"/>`);
    x += genislik + bosluk;
  }

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="96" viewBox="0 0 300 96">
  <rect width="300" height="96" fill="#ffffff"/>
  ${cizgiler.join("")}
  <text x="150" y="88" text-anchor="middle" font-family="monospace" font-size="12" fill="#374151">${kod}</text>
</svg>`.trim();

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

/**
 * Etiket belgesi — açılabilir bir PDF taklidi.
 *
 * `FE-MOCK-DISIPLINI` §2.3: "etiket/irsaliye yazdırılabilir açılır". Fixture'ın
 * `/files/etiket/*.pdf` yolu 404 dönüyordu; indirme bağlantısı ölü bağlantıydı.
 */
export function etiketUrl(kod: string, sevkiyat: string): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="380" height="560" viewBox="0 0 380 560">
  <rect width="380" height="560" fill="#ffffff" stroke="#d1d5db" stroke-width="2"/>
  <rect x="0" y="0" width="380" height="56" fill="#111827"/>
  <text x="20" y="36" font-family="system-ui, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">
    KARGO ETİKETİ
  </text>
  <text x="20" y="92" font-family="system-ui, sans-serif" font-size="13" fill="#6b7280">Sevkiyat</text>
  <text x="20" y="112" font-family="monospace" font-size="15" fill="#111827">${sevkiyat}</text>
  <text x="20" y="146" font-family="system-ui, sans-serif" font-size="13" fill="#6b7280">Koli</text>
  <text x="20" y="166" font-family="monospace" font-size="15" fill="#111827">${kod}</text>
  <image href="${barkodUrl(kod)}" x="20" y="200" width="340" height="110"/>
  <line x1="20" y1="340" x2="360" y2="340" stroke="#e5e7eb" stroke-width="8"/>
  <line x1="20" y1="372" x2="360" y2="372" stroke="#e5e7eb" stroke-width="8"/>
  <line x1="20" y1="404" x2="250" y2="404" stroke="#e5e7eb" stroke-width="8"/>
  <rect x="20" y="446" width="150" height="70" fill="none" stroke="#9ca3af" stroke-dasharray="4 3"/>
  <text x="20" y="536" font-family="system-ui, sans-serif" font-size="11" fill="#6b7280">
    Teslim alan kaşe/imza
  </text>
</svg>`.trim();

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}
