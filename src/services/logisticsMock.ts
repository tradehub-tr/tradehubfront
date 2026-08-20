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
 * TEK KAPI: **sunucu adı.** Önizleme ortamlarında varsayılan AÇIK.
 *
 *   NEREDE ÇALIŞIR : yerel geliştirme (`localhost`, `*.localhost`,
 *                    `127.0.0.1`, `*.local`) ve ALPHA
 *   NEREDE ÇALIŞMAZ: BETA · RC · PROD — beyaz liste eşleşmiyor, hiçbir
 *                    parametre bunu değiştiremez
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
 * BETA, RC ve PROD BİLİNÇLİ OLARAK YOK: `betaistoc.cronbi.com`,
 * `rcistoc.cronbi.com`, `istoc.cronbi.com`, `istoc.com`, `rc.istoc.com`
 * hiçbiri ne bu listede ne de aşağıdaki son eklerle eşleşiyor.
 *
 * ALPHA açık: tasarım onayı orada alınıyor ve onaya sunulan ekranların
 * çoğunun backend ucu henüz yazılmadı. Kapalı olsaydı paydaş boş kutulardan
 * başka bir şey görmezdi.
 */
const PREVIEW_HOSTS: readonly string[] = ["localhost", "127.0.0.1", "::1", "alpha.istoc.com"];

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
  if (!isPreviewHost()) return false;

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
      gerçek sipariş bilgisi değildir. Yalnız yerel incelemede çalışır.
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

/**
 * Bildirim akışı — fixture'ı YOK.
 *
 * Sözleşmede "gönderilmiş bildirim kaydı" diye bir varlık bulunmuyor
 * (`Notification Template` ve `Notification Preference` tanım tarafı).
 * Bu yüzden bu liste elle yazıldı ve alan adları `Notification Template`
 * ile hizalandı. Varlık sözleşmeye eklenince buradan silinip fixture'a
 * taşınmalı.
 */
export function mockNotificationFeed() {
  return [
    {
      name: "NTF-2026-00311",
      event: "shipment_shipped",
      title: "Siparişiniz yola çıktı",
      body: "SHP-2026-00042 numaralı sevkiyat Yurtiçi Kargo'ya teslim edildi.",
      created_at: "2026-08-10 09:10:00",
      read: 0,
      shipment: "SHP-2026-00042",
    },
    {
      name: "NTF-2026-00298",
      event: "shipment_out_for_delivery",
      title: "Kurye dağıtıma çıktı",
      body: "Gönderiniz bugün teslim edilecek.",
      created_at: "2026-08-12 07:40:00",
      read: 0,
      shipment: "SHP-2026-00042",
    },
    {
      name: "NTF-2026-00255",
      event: "shipment_delivered",
      title: "Sevkiyat teslim edildi",
      body: "SHP-2026-00041 teslim alındı. Teslim özetini görüntüleyebilirsiniz.",
      created_at: "2026-08-08 14:35:00",
      read: 1,
      shipment: "SHP-2026-00041",
    },
  ];
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
