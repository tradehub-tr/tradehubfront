/**
 * Sipariş listesinden iade talebine giriş — 15-FE.
 *
 * NEDEN VAR: `pages/dashboard/return-request.html` adresine kod tabanında
 * **tek bir bağlantı yoktu** (ölçüldü 31 Ağu). Alıcı iade formunu ancak
 * adresi elle yazarak açabiliyordu; sidebar'da yalnız iade LİSTESİ vardı.
 *
 * NEDEN AYRI BİR EŞLEME GEREKİYOR: sipariş veri modeli (`types/order.ts`)
 * sevkiyat ADINI taşımıyor. `OrderShipping` yalnız taşıyıcı, takip numarası
 * ve yöntem tutuyor; iade formu ise `?shipment=SHP-…` bekliyor.
 *
 * Desen 07-FE'nin `pickupEntry.ts`'inden birebir: **zaten canlı olan**
 * `list_shipments` ucundan tek çağrıyla sevkiyatlar çekilip sipariş
 * numarasına göre eşleniyor — sipariş başına ayrı çağrı (N+1) yok.
 *
 * ⚠ İade PENCERESİ bu eşlemede YOK. Pencere sunucuda hesaplanıyor
 * (`get_return_eligibility`, sözleşme §2.1) ve `list_shipments` bugün onu
 * döndürmüyor. Sözleşme §10-A1 açık kalemi: FE `list_shipments` yanıtına
 * `return_window_open` eklenmesini öneriyor. O gelene kadar düğme teslim
 * edilmiş her sevkiyatta çiziliyor; pencere kapalıysa form kapalı kutuyu
 * gösteriyor — ölü düğme değil, doğru sebebi söyleyen bir yol.
 */
import { isMockMode, mockShipmentList } from "./logisticsMock";
import { listShipments } from "./shipmentService";

/**
 * İade açılabilen sevkiyat durumları.
 *
 * `Delivered` TEK başına yeterli: iade ancak alıcının eline geçmiş bir
 * gönderi için açılabiliyor. Yolda olan bir sevkiyat iptal edilir, iade
 * edilmez — ikisi farklı akış.
 */
export const IADE_DURUMLARI = ["Delivered"];

/** `{ "ORD-2026-00871": "SHP-2026-00041" }` */
export type ReturnEntryMap = Record<string, string>;

export interface IadeSevkiyati {
  name?: string;
  order?: string;
  status?: string;
}

/**
 * Saf eşleme — ağ ve `window` yok ki test edilebilsin.
 *
 * `logisticsMock.ts`'teki `isPreviewHostname` ile aynı gerekçe: kuralın
 * kendisi bir yorum satırıyla korunamaz, testle korunur.
 */
export function esle(sevkiyatlar: IadeSevkiyati[]): ReturnEntryMap {
  const map: ReturnEntryMap = {};
  for (const s of sevkiyatlar) {
    if (!s.name || !s.order) continue;
    if (!IADE_DURUMLARI.includes(s.status ?? "")) continue;
    // Bir siparişin birden çok teslim edilmiş sevkiyatı olabilir (bölünmüş
    // sevkiyat). İlki alınıyor: kartta tek düğme var ve alıcı oradan
    // sevkiyat listesine ulaşabiliyor.
    if (!map[s.order]) map[s.order] = s.name;
  }
  return map;
}

/**
 * Teslim edilmiş sevkiyatları sipariş numarasına göre eşler.
 *
 * Hata yutuluyor: sipariş listesi bu çağrı yüzünden çökmemeli. Eşleme boş
 * kalırsa hiçbir kartta düğme çıkmıyor — ölü düğme çizmektense hiç
 * çizmemek doğru (`GOREV-TAMAMLAMA-SOZLESMESI` §2).
 */
export async function loadReturnEntries(): Promise<ReturnEntryMap> {
  try {
    if (isMockMode()) return esle(mockShipmentList() as IadeSevkiyati[]);
    const { items } = await listShipments();
    return esle(items as IadeSevkiyati[]);
  } catch {
    return {};
  }
}

/** Kartın düğmesinin gideceği adres. */
export function returnHref(shipmentName: string): string {
  return `/pages/dashboard/return-request.html?shipment=${encodeURIComponent(shipmentName)}`;
}
