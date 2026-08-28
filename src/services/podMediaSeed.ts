/**
 * POD kanıt medyası — storefront mock görselleri (12-FE).
 *
 * NEDEN VAR: üretilmiş fixture `"/files/pod/imza-41.png"` gibi YOLLAR taşıyor
 * ve backend olmadığı için üçü de 404. Ekran doğru davranıyor (alt metinli
 * kırık görsel) ama alıcının gerçekte ne göreceği — imzanın, fotoğrafın,
 * tutanağın tasarımı — hiçbir yerde görünmüyordu. 28 Ağustos görsel
 * denetiminde ölçüldü: teslim kanıtı kartındaki iki kutu da kırıktı.
 *
 * `FE-MOCK-DISIPLINI.md` §2.3 mock'tan **gerçek çıktı** istiyor: belge
 * açılabilir olmalı, `#yer-tutucu` bağlantı yasak. Kırık görsel de aynı sınıf.
 *
 * Aynı sorun admin-panel'de 24 Ağustos'ta çözüldü (`KALAN-ISLER.md` A11,
 * commit `d9385d5`) — bu modül onun storefront karşılığı ve aynı gerekçelerle
 * `data:` URI kullanıyor:
 *   · Mock'un tarayıcıdan başka bir şeye ihtiyacı olmamalı; `public/` altına
 *     demo varlığı koymak üretim build'ine sızdırırdı.
 *   · Görsel, yükün İÇİNDE geliyor — 14-BE gerçek `file_url` döndürdüğünde
 *     bu modül silinir, ekran değişmez.
 */

/** SVG metnini `data:` URI'ye çevirir. */
const svg = (icerik: string): string =>
  `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(icerik.trim())))}`;

/**
 * Islak imza — teslim alanın karalaması.
 *
 * Beyaz zemin BİLEREK: gerçek imza taramaları da beyaz gelir ve ekranın
 * görsele zemin verip vermediği ancak böyle görülür.
 */
export const SIGNATURE_URL = svg(`
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="200" viewBox="0 0 420 200">
  <rect width="420" height="200" fill="#ffffff"/>
  <path d="M40 140 C70 60, 95 60, 105 120 S135 175, 150 105 S175 55, 195 120
           S225 165, 245 95 S285 60, 300 130"
        fill="none" stroke="#1f2937" stroke-width="4" stroke-linecap="round"/>
  <path d="M300 130 C320 140, 345 132, 372 108" fill="none" stroke="#1f2937"
        stroke-width="4" stroke-linecap="round"/>
</svg>`);

/** Teslim fotoğrafı — kapı önüne bırakılmış koliler. */
export const PHOTO_URL = svg(`
<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">
  <rect width="480" height="360" fill="#e5e7eb"/>
  <rect y="250" width="480" height="110" fill="#d1d5db"/>
  <rect x="90" y="150" width="140" height="110" fill="#c8a26a" stroke="#a97f45" stroke-width="3"/>
  <line x1="160" y1="150" x2="160" y2="260" stroke="#a97f45" stroke-width="3"/>
  <rect x="240" y="185" width="110" height="75" fill="#d2ae78" stroke="#a97f45" stroke-width="3"/>
  <line x1="295" y1="185" x2="295" y2="260" stroke="#a97f45" stroke-width="3"/>
  <rect x="330" y="40" width="120" height="210" fill="#9ca3af"/>
  <circle cx="352" cy="150" r="6" fill="#6b7280"/>
</svg>`);

/**
 * Teslim tutanağı — açılabilir bir belge.
 *
 * Gerçekte PDF; mock'ta SVG çünkü tarayıcı ikisini de yeni sekmede açıyor ve
 * `data:` URI ile PDF üretmek base64 yükünü gereksiz büyütürdü.
 */
export const DOCUMENT_URL = svg(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="520" viewBox="0 0 400 520">
  <rect width="400" height="520" fill="#ffffff" stroke="#d1d5db" stroke-width="2"/>
  <rect x="0" y="0" width="400" height="64" fill="#f3f4f6"/>
  <text x="24" y="40" font-family="system-ui, sans-serif" font-size="19" font-weight="bold" fill="#111827">
    TESLİM TUTANAĞI
  </text>
  <text x="270" y="40" font-family="monospace" font-size="13" fill="#374151">MNG-2210554</text>
  <text x="24" y="92" font-family="system-ui, sans-serif" font-size="13" fill="#6b7280">
    SHP-2026-00041 · 8 / 8 koli
  </text>
  <line x1="24" y1="118" x2="376" y2="118" stroke="#e5e7eb" stroke-width="9"/>
  <line x1="24" y1="153" x2="376" y2="153" stroke="#e5e7eb" stroke-width="9"/>
  <line x1="24" y1="188" x2="250" y2="188" stroke="#e5e7eb" stroke-width="9"/>
  <line x1="24" y1="223" x2="376" y2="223" stroke="#e5e7eb" stroke-width="9"/>
  <line x1="24" y1="258" x2="320" y2="258" stroke="#e5e7eb" stroke-width="9"/>
  <rect x="24" y="360" width="150" height="70" fill="none" stroke="#9ca3af" stroke-dasharray="4 3"/>
  <path d="M40 410 C60 375, 78 400, 92 385 S120 400, 150 378" fill="none"
        stroke="#1f2937" stroke-width="3" stroke-linecap="round"/>
  <text x="24" y="450" font-family="system-ui, sans-serif" font-size="12" fill="#6b7280">
    Teslim alan kaşe/imza
  </text>
</svg>`);

/**
 * Örnek POD kaydının **sözleşmede olmayan** alanları — TEK KAYNAK.
 *
 * Hem mock (`logisticsNotificationMock.ts`) hem Storybook story'si buradan
 * besleniyor. 28 Ağustos görsel denetiminde ikisi AYRIŞMIŞTI: sayfada imza,
 * fotoğraf ve tutanak düzeltilmişken Storybook'ta üçü de kırıktı ve unvan iki
 * kez yazıyordu, çünkü story fixture'ı doğrudan kullanıyordu. `build-storybook`
 * geçiyordu, dört story yazılmıştı, hepsi "çalışıyor" görünüyordu.
 *
 * K-F: `proof_of_delivery` sözleşmede yalnız 8 alan taşıyor; aşağıdakiler
 * 14-FE §2.2 yükünden geliyor ve varlık 14-BE'ye ait olduğu için sözleşme
 * GENİŞLETİLMEDİ. 14-BE gerçek alanları eklediğinde bu tablo silinir.
 */
export const POD_ORNEK_ALANLAR = {
  shipment: "SHP-2026-00041",
  /**
   * Fixture `received_by` içinde unvanı da taşıyor: "Mehmet Yıldız (Depo
   * Sorumlusu)". 14-FE §2.2 ikisini ayrı alan tutuyor; sadeleştirilmezse
   * ekranda unvan iki kez çıkıyor ("… (Depo Sorumlusu) · Depo sorumlusu").
   */
  received_by: "Mehmet Yıldız",
  received_by_title: "Depo sorumlusu",
  delivery_code_used: 1,
  signature_url: SIGNATURE_URL,
  photo_url: PHOTO_URL,
  document_url: DOCUMENT_URL,
  delivered_package_count: 8,
  total_package_count: 8,
  has_discrepancy: 0,
  exception_code: null,
  discrepancy_note: null,
  waybill_number: "MNG-2210554",
  delivery_point: "MNG-35004",
} as const;
