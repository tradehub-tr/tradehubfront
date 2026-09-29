/**
 * Lojistik mock modu — YALNIZ yerel inceleme için.
 *
 * NEDEN VAR:
 *   Lojistik ekranlarının çoğunun ucu henüz yazılmadı. Sayfalar bu yüzden
 *   "bu bölüm bağlı değil" kutusu gösteriyor — üretimde DOĞRU davranış bu.
 *   Ama ekranı incelemek isteyen biri o kutulardan hiçbir şey göremiyor.
 *
 *   Bu modül, aynı sayfaların gerçek ekranları GERÇEK ŞEKİLLİ veriyle
 *   çizmesini sağlıyor. Veri uydurma değil: `src/mocks/logistics/*.json`
 *   dosyaları sözleşmeden ÜRETİLİYOR (`gen_logistics_types.py`), yani alan
 *   adları backend yazıldığında da aynı kalacak.
 *
 * İKİ KAPI (MOGEM-685 F-03, 29 Eyl 2026 — ürün kararı: Alpha, Beta ve RC'de sahte
 * veri OLABİLİR, PROD'da HİÇ olmamalı):
 *
 *   1. DERLEME ANAHTARI `VITE_LOGISTICS_MOCK`. Kapalıyken
 *      (`.env.production` = "0", PROD derlemesi) çağıranlar `mock` dalını
 *      derleme anında sabit `false` görür ve bu modülün verisi dahil tüm mock kodu
 *      DERLEME ÇIKTISINA GİRMEZ. Ölçüldü: anahtardan önce PROD'un kendi dosyalarında
 *      `dedupe_key` ve sahte `YK-…` takip numaraları vardı. Açanlar: `.env.development`
 *      (geliştirme sunucusu + mock E2E), `npm run build:onizleme`, repo `Dockerfile`'ı
 *      (varsayılan AÇIK — Alpha/Beta/RC onunla derleniyor; PROD sunucudaki ayrı
 *      Dockerfile ile anahtarsız derleniyor, Jenkins rc-to-prod #47'de ölçüldü).
 *      Kapıyı CI koruyor: `scripts/check-no-mock-in-build.mjs`.
 *   2. SUNUCU ADI (ikinci kilit). Anahtar yanlışlıkla PROD derlemesine
 *      verilse bile mod yalnız önizleme sunucularında açılır.
 *
 *   NEREDE ÇALIŞIR : yerel geliştirme (`localhost`, `*.localhost`,
 *                    `127.0.0.1`, `*.local`), ALPHA, BETA ve RC
 *   NEREDE ÇALIŞMAZ: PROD — ne derlenir ne de beyaz liste eşleşir
 *
 * ÇAĞIRANLAR için kural: `mock` bayrağını HER DOSYADA `__LOJISTIK_MOCK__ && isMockMode()`
 * olarak kurun (`__LOJISTIK_MOCK__`: vite.config `define`, `src/types/global.d.ts`).
 *   - Yalnız `isMockMode()` yazmak kodu ÇALIŞTIRMAZ ama derleyici mock dallarını
 *     atamaz — veri yine dosyaya girer.
 *   - Başka dosyadan içe aktarılan bir sabit ya da `import.meta.env.VITE_…` de
 *     YETMİYOR: ikisi de ölçüldü (29 Eyl) — derleyici ağaç budama anında değeri
 *     bilmedi ve `shipment.json` parçalar arası bağla derlemede kaldı. `define`
 *     sabiti Rollup'tan önce yazılır; dal ancak böyle gerçekten atılır.
 *
 * NEDEN VARSAYILAN AÇIK: önce `?mock=1` şartı koymuştum. İşe yaramadı —
 * menü bağlantıları parametre taşımıyor, ekip de her adrese elle eklemeyi
 * hatırlamıyor. Ekranı incelemek isteyen herkes boş kutu görüyordu.
 * Parametre bir "gizli anahtar" değildi zaten; asıl güvenlik sunucu adı
 * beyaz listesinde ve o yerinde duruyor.
 *
 * KAPATMAK: `?mock=0`. Yerelde gerçek uçları test etmek isteyen geliştirici
 * bir kez ekler, tercih `localStorage`'da kalır. Geri açmak: `?mock=1`.
 */
import notificationPreferenceJson from "../mocks/logistics/notification_preference.json";
import returnRequestJson from "../mocks/logistics/return_request.json";
import shipmentJson from "../mocks/logistics/shipment.json";
import shippingMethodJson from "../mocks/logistics/shipping_method.json";

const STORAGE_KEY = "istoc_logistics_mock";

/**
 * Örnek veri modunun açılabileceği sunucular — TAM eşleşme.
 *
 * PROD BİLİNÇLİ OLARAK YOK: `istoc.com`, `www.istoc.com` ve backend adresleri
 * (`*.cronbi.com`) ne bu listede ne de aşağıdaki son eklerle eşleşiyor.
 *
 * ALPHA, BETA ve RC açık: test, tasarım/iş onayı ve UAT orada yapılıyor ve onaya
 * sunulan ekranların çoğunun backend ucu henüz yazılmadı (BETA ve RC 29 Eyl 2026
 * ürün kararıyla eklendi — MOGEM-685 F-03).
 */
const PREVIEW_HOSTS: readonly string[] = [
  "localhost",
  "127.0.0.1",
  "::1",
  "alpha.istoc.com",
  "beta.istoc.com",
  "rc.istoc.com",
];

/**
 * Önizleme sayılan alan adı SON EKLERİ.
 *
 * `.localhost` şart: yerel stack `tradehub.localhost` üzerinden servis
 * ediliyor (bkz. `docker/conf/gateway.nginx.conf`). Yalnız `localhost`
 * yazmak yetmiyordu — ekibin gerçekten kullandığı adres bu ve mod orada
 * hiç açılmıyordu.
 *
 * `.localhost` ve `.local` genel alan adı sisteminde tahsis edilemiyor
 * (RFC 6761 / 6762), yani canlı bir sunucu bu son ekleri alamaz.
 */
const PREVIEW_SUFFIXES: readonly string[] = [".localhost", ".local"];

/**
 * Saf karar fonksiyonu — `window`'a bakmıyor ki test edilebilsin.
 *
 * "Canlı ortamda asla açılmaz" iddiası bir yorum satırıyla korunamaz;
 * `__tests__/logisticsMock.test.ts` bu fonksiyonu gerçek alan adlarıyla
 * sınıyor.
 */
export function isPreviewHostname(host: string): boolean {
  return PREVIEW_HOSTS.includes(host) || PREVIEW_SUFFIXES.some((s) => host.endsWith(s));
}

function isPreviewHost(): boolean {
  return isPreviewHostname(window.location.hostname);
}

/**
 * Örnek veri modu açık mı?
 *
 * Önizleme sunucularında **varsayılan AÇIK** — parametre gerekmiyor.
 * `?mock=0` kapatır, `?mock=1` geri açar; tercih `localStorage`'da kalıcı.
 *
 * Önizleme dışı sunucularda saklanmış tercihe BAKILMIYOR: beyaz liste
 * eşleşmiyorsa fonksiyon daha ilk satırda `false` dönüyor.
 */
export function isMockMode(): boolean {
  if (!__LOJISTIK_MOCK__ || !isPreviewHost()) return false;

  const param = new URLSearchParams(window.location.search).get("mock");
  if (param === "1") {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  }
  if (param === "0") {
    localStorage.setItem(STORAGE_KEY, "off");
    return false;
  }
  // Kayıtlı tek değer "off" — yokluğu "açık" demek.
  return localStorage.getItem(STORAGE_KEY) !== "off";
}

/** Sayfaların üstüne konan uyarı şeridi — mock veri gerçek sanılmasın. */
export function mockBannerHtml(): string {
  return `
    <div class="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
      <strong class="font-semibold">Örnek veri modu.</strong>
      Bu sayfadaki lojistik verileri sözleşmeden üretilmiş <em>örnek</em> kayıtlardır,
      gerçek sipariş bilgisi değildir. Yalnız önizleme ortamlarında (yerel, Alpha, Beta,
      RC) çalışır; canlı ortamda yoktur.
      <a href="?mock=0" class="ms-1 underline underline-offset-2">Kapat</a>
    </div>`;
}

// ── Fixture'lardan türetilen mock veriler ────────────────────────────────
//
// Fixture'lar `{ default: {ok,data}, detail: {...}, empty, error }` yapısında.
// Buradaki fonksiyonlar yalnız `data` kısmını açıp ekranın beklediği şekle
// getiriyor — dönüşüm YOK, çünkü fixture zaten sözleşme şeklinde.

export function mockShipmentDetail() {
  return shipmentJson.detail.data;
}

export function mockShipmentList() {
  return shipmentJson.default.data.items;
}

export function mockTrackingEvents() {
  return shipmentJson.detail.data.events;
}

export function mockPackages() {
  return shipmentJson.detail.data.packages;
}

export function mockShipmentItems() {
  return shipmentJson.detail.data.items;
}

export function mockReturnList() {
  return returnRequestJson.default.data.items;
}

export function mockReturnDetail() {
  return returnRequestJson.detail.data;
}

export function mockNotificationPreferences() {
  return notificationPreferenceJson.default.data.items;
}

export function mockShippingMethods() {
  return shippingMethodJson.default.data.items;
}

/** İade nedenleri — `Return Request.reason` seçim listesi. */
export function mockReturnReasons() {
  return [
    { value: "damaged", label: "Hasarlı ürün" },
    { value: "wrong_item", label: "Yanlış ürün" },
    { value: "missing_parts", label: "Eksik parça" },
    { value: "not_as_described", label: "Açıklamaya uymuyor" },
    { value: "other", label: "Diğer" },
  ];
}
