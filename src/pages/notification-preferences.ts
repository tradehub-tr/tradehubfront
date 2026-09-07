/**
 * Bildirim merkezi + tercihleri (S6, S7) — alıcı.
 *
 * ── 12-FE (2026-08-28) ──
 *
 * Bu sayfa 13 Ağustos'tan beri duruyordu ama **çalışmıyordu**: ekran
 * çiziliyor, anahtar çevriliyor, hiçbir şey olmuyordu. Sebep
 * `window.__thSetNotificationPref` köprüsünün hiçbir yerde tanımlı
 * olmamasıydı; artık `services/logisticsNotificationMock.ts` sağlıyor.
 *
 * Üç şey değişti:
 *   · Veri **tek kaynaktan** geliyor (mock ya da gerçek uç) — sayfa artık
 *     `logisticsMock`'un iki ayrı yardımcısını doğrudan basmıyor.
 *   · **Rol süzgeci** var: alıcı yalnız kendi tercihlerini görüyor. Eskiden
 *     satıcının ve operasyon ekibinin tercihleri de listedeydi.
 *   · Yükleniyor / hata / boş durumları ayrı ayrı çiziliyor; "kayıt yok" ile
 *     "bağlı değil" birbirine karışmıyor.
 *
 * Gerçek uçlar geldiğinde (`12-BE`) bu dosya değişmez: `MOCK` bayrağı kapanır.
 */
// T-123: RUM montajı — MPA ortak boot (çift başlatmaya karşı korumalı).
import "../lib/rum/boot";
import "../style.css";
import "../alpine/sidebar";
// Tercih anahtarının davranışı (`notificationPreferences`) burada kayıtlı.
import "../alpine/logisticsBuyer";
import { startAlpine } from "../alpine";
import {
  NotificationCenter,
  NotificationPreferences,
} from "../components/logistics/NotificationCenter";
import { NotWiredNotice } from "../components/logistics/NotWiredNotice";
import { t } from "../i18n";
import { isMockMode, mockBannerHtml } from "../services/logisticsMock";
import {
  installNotificationMock,
  listNotificationPreferences,
  listNotifications,
  notificationMockBarHtml,
} from "../services/logisticsNotificationMock";
import { NotWiredError } from "../services/shipmentService";
import { requireAuth } from "../utils/auth-guard";
import { escapeHtml } from "../utils/sanitize";

import { mountDashboardShell, shellCard } from "./dashboardShell";

await requireAuth();

const mock = isMockMode();

/**
 * Köprü kurulmazsa ekran açılır ama anahtar iş yapmaz — 28 Ağustos'a kadar
 * tam olarak bu oluyordu.
 */
if (mock) installNotificationMock();

const root = mountDashboardShell({
  breadcrumb: [
    { label: t("header.myAccount"), href: "/pages/dashboard/buyer-dashboard.html" },
    { label: t("shipment.notifyPref.title") },
  ],
  contentId: "notification-preferences-root",
  heading: t("shipment.notifyPref.title"),
  initialContent: shellCard(
    `<p class="text-sm text-gray-500">${escapeHtml(t("shipment.page.loading"))}</p>`
  ),
});

/** Bağlı olmayan uç ile gerçek hatayı AYIRIR — ikisi farklı ekran. */
function blokHatasi(e: unknown, baslik: string): string {
  if (e instanceof NotWiredError) {
    return NotWiredNotice({ title: baslik, endpoint: e.endpoint });
  }
  return `
    <div class="rounded-md border border-amber-200 bg-amber-50 p-4" role="alert">
      <p class="text-sm font-medium text-amber-900">${escapeHtml((e as Error)?.message || baslik)}</p>
    </div>`;
}

async function render(): Promise<void> {
  const bloklar: string[] = [];
  if (mock) bloklar.push(mockBannerHtml(), shellCard(notificationMockBarHtml()));

  // ── S6 · Bildirim akışı ──
  try {
    const feed = await listNotifications();
    bloklar.push(shellCard(NotificationCenter({ rows: feed })));
  } catch (e) {
    bloklar.push(
      shellCard(
        `<h2 class="mb-3 text-base font-semibold text-gray-900">${escapeHtml(t("shipment.notify.title"))}</h2>
         ${blokHatasi(e, t("shipment.page.notifyFeedNotWired"))}`
      )
    );
  }

  // ── S7 · Bildirim tercihleri ──
  // Ayrı `try`: akış düşse bile tercihler çizilmeli. Tek blokta toplamak,
  // bir ucun hatasında ekranın yarısını sebepsiz karartırdı.
  try {
    const prefs = await listNotificationPreferences();
    bloklar.push(shellCard(NotificationPreferences({ rows: prefs })));
  } catch (e) {
    bloklar.push(
      shellCard(
        `<h2 class="mb-3 text-base font-semibold text-gray-900">${escapeHtml(t("shipment.notifyPref.title"))}</h2>
         ${blokHatasi(e, t("shipment.page.notifyPrefNotWired"))}`
      )
    );
  }

  root.innerHTML = bloklar.join("");
  startAlpine();
}

await render();
