/**
 * Sevkiyat yönetimi (S2, S8, S9) — satıcı.
 *
 * Üçü tek sayfada çünkü satıcı için tek bir akış: sevkiyatı oluştur →
 * kolileri gir → etiketi indir. Ayrı sayfalara bölmek, satıcıyı her adımda
 * geri dönmeye zorlardı.
 *
 * VERİ DURUMU (ölçüldü):
 *   S2 · `create_shipment` VAR ama yalnız order/items/idempotency_key alıyor —
 *        formun kanal, taşıyıcı, takip no, plaka, sürücü alanlarının hiçbiri
 *        karşılıksız. Bu yüzden form ÇİZİLMİYOR: doldurulur, kaydedilir ve
 *        hiçbiri yazılmazdı.
 *   S8 · koli kaydetme ucu yok. Mevcut koliler `get_shipment_detail`'den
 *        GELİYOR, o yüzden okunur hâlde gösteriliyor (`locked`).
 *   S9 · `Shipment Package` şemasında etiket/barkod alanı yok
 *        (`package_code`, `label_url`, `barcode_url` sözleşmede var, şemada
 *        yok) — etiket bölümü bağlı değil.
 */
import "../style.css";
import "../alpine/sidebar";
import { startAlpine } from "../alpine";
import { NotWiredNotice } from "../components/logistics/NotWiredNotice";
import { statusBadge } from "../components/logistics/presentation";
import { SellerPacking } from "../components/logistics/SellerPacking";
import { t } from "../i18n";
import { getShipment } from "../services/shipmentService";
import { requireAuth } from "../utils/auth-guard";
import { escapeHtml } from "../utils/sanitize";

import { mountDashboardShell, shellCard } from "./dashboardShell";

await requireAuth();

const shipmentName = new URLSearchParams(window.location.search).get("name") ?? "";

const root = mountDashboardShell({
  breadcrumb: [
    { label: t("shipment.page.sellerPanel"), href: "/pages/seller/dashboard.html" },
    { label: t("shipment.page.sellerShipment") },
  ],
  contentId: "seller-shipment-root",
  initialContent: shellCard(
    `<p class="text-sm text-gray-500">${escapeHtml(t("shipment.page.loading"))}</p>`
  ),
});

if (!shipmentName) {
  // Sevkiyat adı yoksa S2 (oluşturma) beklenirdi — ama o uç alan taşımıyor.
  root.innerHTML = shellCard(`
    <h1 class="mb-3 text-base font-semibold text-gray-900">
      ${escapeHtml(t("shipment.sellerForm.title"))}
    </h1>
    ${NotWiredNotice({
      title: t("shipment.page.createNotWired"),
      endpoint: "api.v1.shipment.create_shipment (yalnız order/items alıyor)",
    })}
  `);
} else {
  try {
    const shipment = await getShipment(shipmentName);
    const packages = (shipment.packages ?? []) as Parameters<typeof SellerPacking>[0]["packages"];

    root.innerHTML = [
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

      // S8 — koliler okunur: kayıt ucu yok, ama mevcut koliler gerçek veriden.
      shellCard(
        SellerPacking({
          shipmentName: shipment.name,
          packages,
          packageTypes: [],
          locked: true,
        })
      ),

      // S9 — etiket alanları şemada yok.
      shellCard(`
        <h2 class="mb-3 text-base font-semibold text-gray-900">
          ${escapeHtml(t("shipment.label.title"))}
        </h2>
        ${NotWiredNotice({
          title: t("shipment.page.labelNotWired"),
          endpoint: "Shipment Package şemasında label_url/barcode_url yok",
        })}
      `),
    ].join("");
  } catch (e) {
    root.innerHTML = shellCard(
      `<p class="text-sm font-medium text-red-700">${escapeHtml(
        (e as Error)?.message || t("shipment.page.loadFailed")
      )}</p>`
    );
  }
}

startAlpine();
