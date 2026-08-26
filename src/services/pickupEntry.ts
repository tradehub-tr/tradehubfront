/**
 * Sipariş listesinden teslim alma ekranına giriş — 07-FE.
 *
 * NEDEN AYRI BİR EŞLEME GEREKİYOR: sipariş veri modeli (`types/order.ts`)
 * sevkiyat ADINI taşımıyor. `OrderShipping` yalnız taşıyıcı, takip numarası
 * ve yöntem tutuyor; teslim alma ekranı ise `?name=SHP-…` bekliyor.
 *
 * Siparişe alan eklemek backend'i (`order.py::get_my_orders`) değiştirmeyi
 * gerektirirdi. Bunun yerine **zaten canlı olan** `list_shipments` ucundan
 * tek bir çağrıyla sevkiyatlar çekilip sipariş numarasına göre eşleniyor —
 * sipariş başına ayrı çağrı (N+1) yok.
 *
 * Ekran ulaşılamaz kalırsa teslim edilmiş sayılmıyor
 * (`GOREV-TAMAMLAMA-SOZLESMESI` §2 · K-B).
 */
import { mockShipmentList, isMockMode } from "./logisticsMock";
import { listShipments } from "./shipmentService";

/**
 * Teslim alma bloklarının çıktığı sevkiyat tipleri (K-D).
 *
 * `channel` katalog kaydı olduğu ve kodu panelden değiştirilebildiği için
 * koşul `shipment_type` enum'una bağlı. Tek tanım burada; `shipment-tracking`
 * sayfası da bunu kullanıyor.
 */
export const TESLIM_ALMA_TIPLERI = ["Buyer Pickup", "Seller Delivery"];

/** Alıcının gidip alması beklenen durum. */
const BEKLEYEN_DURUMLAR = ["Ready for Pickup"];

/** `{ "ORD-2026-00840": "SHP-2026-00035" }` */
export type PickupEntryMap = Record<string, string>;

export interface KanalliSevkiyat {
  name?: string;
  order?: string;
  status?: string;
  shipment_type?: string;
}

/**
 * Saf eşleme — ağ ve `window` yok ki test edilebilsin.
 *
 * `logisticsMock.ts`'teki `isPreviewHostname` ile aynı gerekçe: kuralın
 * kendisi bir yorum satırıyla korunamaz, testle korunur.
 */
export function esle(sevkiyatlar: KanalliSevkiyat[]): PickupEntryMap {
  const map: PickupEntryMap = {};
  for (const s of sevkiyatlar) {
    if (!s.name || !s.order) continue;
    if (!TESLIM_ALMA_TIPLERI.includes(s.shipment_type ?? "")) continue;
    if (!BEKLEYEN_DURUMLAR.includes(s.status ?? "")) continue;
    // Bir siparişin birden çok teslim alma sevkiyatı olabilir (bölünmüş
    // sevkiyat). İlki alınıyor: kartta tek düğme var ve alıcı oradan
    // sevkiyat listesine ulaşabiliyor.
    if (!map[s.order]) map[s.order] = s.name;
  }
  return map;
}

/**
 * Teslim alınmayı bekleyen sevkiyatları sipariş numarasına göre eşler.
 *
 * Hata yutuluyor: sipariş listesi bu çağrı yüzünden çökmemeli. Eşleme boş
 * kalırsa hiçbir kartta düğme çıkmıyor — ölü düğme çizmektense hiç
 * çizmemek doğru (`GOREV-TAMAMLAMA-SOZLESMESI` §2).
 */
export async function loadPickupEntries(): Promise<PickupEntryMap> {
  try {
    if (isMockMode()) return esle(mockShipmentList() as KanalliSevkiyat[]);
    const { items } = await listShipments();
    return esle(items as KanalliSevkiyat[]);
  } catch {
    return {};
  }
}

/** Kartın düğmesinin gideceği adres. */
export function pickupHref(shipmentName: string): string {
  return `/pages/dashboard/shipment-tracking.html?name=${encodeURIComponent(shipmentName)}`;
}
