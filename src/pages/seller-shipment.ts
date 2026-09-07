/**
 * Sevkiyat yönetimi (S2, S8, S9) — satıcı.
 *
 * Üçü tek sayfada çünkü satıcı için tek bir akış: sevkiyatı oluştur →
 * kolileri gir → etiketi indir.
 *
 * VERİ DURUMU (ölçüldü):
 *   S2 · `create_shipment` VAR ama yalnız order/items/idempotency_key alıyor;
 *        formun 9 alanı karşılıksız. Gerçek modda form çizilmiyor.
 *   S8 · Koli kaydetme ucu yok. Mevcut koliler detay yanıtından geliyor.
 *   S9 · `Shipment Package` şemasında etiket/barkod alanı yok.
 *
 * `?mock=1` üçünü de örnek veriyle çiziyor.
 */
// T-123: RUM montajı — MPA ortak boot (çift başlatmaya karşı korumalı).
import "../lib/rum/boot";
import "../style.css";
import "../alpine/sidebar";
import "../alpine/logisticsSeller";
import { startAlpine } from "../alpine";
import { LabelDownload } from "../components/logistics/LabelDownload";
import { NotWiredNotice } from "../components/logistics/NotWiredNotice";
import {
  installSellerMock,
  kanallar,
  paketTipleri,
  paketler as mockKoliler,
  sellerMockBarHtml,
  sevkiyatDetay as mockSevkiyatDetay,
  tasiyicilar,
} from "../services/logisticsSellerMock";
import { statusBadge } from "../components/logistics/presentation";
import { SellerPacking } from "../components/logistics/SellerPacking";
import { SellerShipmentForm } from "../components/logistics/SellerShipmentForm";
import { t } from "../i18n";
import {
  isMockMode,
  mockBannerHtml,
  mockPackages,
  mockShipmentDetail,
  mockShipmentItems,
} from "../services/logisticsMock";
import { getShipment, type ShipmentDetail } from "../services/shipmentService";
import { requireAuth } from "../utils/auth-guard";
import { escapeHtml } from "../utils/sanitize";

import { mountDashboardShell, shellCard } from "./dashboardShell";

await requireAuth();

const mock = isMockMode();

/**
 * `SellerShipmentForm` ve `SellerPacking` davranışlarını `window.__th*`
 * üzerinden arıyor. Kurulmazsa form çizilir, düğmeye basılır ve hiçbir şey
 * olmaz — 2026-08-26'da ölçülen durum buydu.
 */
if (mock) installSellerMock();

const shipmentName = new URLSearchParams(window.location.search).get("name") ?? "";

const root = mountDashboardShell({
  breadcrumb: [
    { label: t("shipment.page.sellerPanel"), href: "/pages/seller/dashboard.html" },
    { label: t("shipment.page.sellerShipment") },
  ],
  contentId: "seller-shipment-root",
  heading: t("shipment.page.sellerShipment"),
  initialContent: shellCard(
    `<p class="text-sm text-gray-500">${escapeHtml(t("shipment.page.loading"))}</p>`
  ),
});

/**
 * Seçim listeleri KATALOGDAN geliyor (`services/logisticsSellerMock.ts`).
 *
 * Eskiden burada üç sabit dizi vardı: dört kanal, üç kargo firması, üç paket
 * tipi. Katalogda yeni bir firma açıldığında bu ekran onu görmüyordu —
 * `GOREV-TAMAMLAMA-SOZLESMESI` §2'nin "her seçim listesinin yönetileceği bir
 * yer olmalı" denetiminin ihlaliydi. Fixture'lar sözleşmeden üretiliyor,
 * yani alan adları backend yazıldığında da aynı kalıyor.
 */

/** Sevkiyat yokken: oluşturma ekranı (S2). */
function renderCreate(): void {
  root.innerHTML = [
    mock ? mockBannerHtml() : "",
    mock ? shellCard(sellerMockBarHtml()) : "",
    shellCard(
      mock
        ? SellerShipmentForm({
            orderName: mockShipmentDetail().order,
            /**
             * Kalan miktarı OLMAYAN kalem forma girmiyor.
             *
             * Bileşenin sözleşmesi zaten "kalan miktarı olan kalemler"
             * diyordu ama çağıran taraf filtrelemiyordu. Sonuç: miktar
             * alanı `0` ile çiziliyor, `min="1"` HTML5 doğrulamasına
             * takılıyor ve form SESSİZCE gönderilemiyordu — satıcı düğmeye
             * basıyor, hiçbir hata görmüyor, hiçbir şey olmuyordu
             * (ölçüldü 2026-08-26).
             */
            remainingItems: mockShipmentItems()
              .filter((row) => Number(row.remaining_qty) > 0)
              .map((row) => ({
                item: row.item,
                item_name: row.item_name,
                remaining_qty: row.remaining_qty,
                uom: row.uom,
              })),
            channels: kanallar(),
            carriers: tasiyicilar(),
          })
        : `<h2 class="mb-3 text-base font-semibold text-gray-900">
             ${escapeHtml(t("shipment.sellerForm.title"))}
           </h2>
           ${NotWiredNotice({
             title: t("shipment.page.createNotWired"),
             endpoint: "api.v1.shipment.create_shipment (yalnız order/items alıyor)",
           })}`
    ),
  ].join("");
  startAlpine();
}

/** Sevkiyat varken: paketleme (S8) + etiket (S9). */
function renderManage(shipment: ShipmentDetail): void {
  /**
   * Koliler: mock modda ÖNCE bu oturumda eklenenler.
   *
   * Sabit fixture'a düşmek, "koli ekle" düğmesini anlamsız kılardı — satıcı
   * koli ekler, sayfa yenilenir ve hep aynı üç koliyi görürdü
   * (`FE-MOCK-DISIPLINI` §2.2: bir eylem sistemin başka yerlerini de
   * değiştirmeli).
   */
  const eklenen = mock ? mockKoliler(shipment.name) : [];
  const packages = mock
    ? ((eklenen.length ? eklenen : mockPackages()) as ReturnType<typeof mockPackages>)
    : ((shipment.packages ?? []) as ReturnType<typeof mockPackages>);

  root.innerHTML = [
    mock ? mockBannerHtml() : "",
    mock ? shellCard(sellerMockBarHtml()) : "",
    shellCard(`
      <div class="flex flex-wrap items-center gap-2">
        ${statusBadge(shipment.status)}
        <code class="font-mono text-xs text-gray-600">${escapeHtml(shipment.name)}</code>
        ${
          shipment.tracking_number
            ? `<span class="font-mono text-xs text-gray-500">${escapeHtml(shipment.tracking_number)}</span>`
            : ""
        }
      </div>
    `),
    shellCard(
      SellerPacking({
        shipmentName: shipment.name,
        packages,
        packageTypes: paketTipleri(),
        // Kayıt ucu yokken form açık bırakmak yanlış olurdu; mock modda
        // açık, çünkü amaç formu incelemek.
        locked: !mock,
      })
    ),
    shellCard(
      mock
        ? LabelDownload({ shipmentName: shipment.name, packages })
        : `<h2 class="mb-3 text-base font-semibold text-gray-900">
             ${escapeHtml(t("shipment.label.title"))}
           </h2>
           ${NotWiredNotice({
             title: t("shipment.page.labelNotWired"),
             endpoint: "Shipment Package şemasında label_url/barcode_url yok",
           })}`
    ),
  ].join("");
  startAlpine();
}

/**
 * `?name=` YOKSA oluşturma, VARSA yönetim.
 *
 * Eskiden örnek veri modunda ad olmadan doğrudan YÖNETİM ekranı çiziliyordu:
 * oluşturma formu çalışmadığı için (köprü tanımsızdı) onu göstermenin anlamı
 * yoktu ve inceleyen kişi hiç değilse paketlemeyi görsün isteniyordu.
 *
 * Artık oluşturma gerçekten çalışıyor (`logisticsSellerMock`), o yüzden akış
 * doğal sırasına döndü: satıcı önce sevkiyatı oluşturuyor, sonra kolileri
 * giriyor. Ad olmadan yönetim ekranı göstermek, var olmayan bir sevkiyatın
 * kolilerini düzenletmek olurdu.
 */
if (!shipmentName) {
  renderCreate();
} else {
  /**
   * Bu oturumda oluşturulan bir sevkiyat mı?
   *
   * Öyleyse gerçek uca hiç gitmiyoruz: satıcının az önce oluşturduğu kayıt
   * ekranda görünmeli, sabit örnek kayıt değil.
   */
  const kendiKaydi = mock ? mockSevkiyatDetay(shipmentName) : null;
  if (kendiKaydi) {
    renderManage(kendiKaydi as unknown as ShipmentDetail);
  } else
    try {
      renderManage(await getShipment(shipmentName));
    } catch (e) {
      if (mock) renderManage(mockShipmentDetail() as unknown as ShipmentDetail);
      else {
        root.innerHTML = shellCard(
          `<p class="text-sm font-medium text-red-700">${escapeHtml(
            (e as Error)?.message || t("shipment.page.loadFailed")
          )}</p>`
        );
      }
    }
}
