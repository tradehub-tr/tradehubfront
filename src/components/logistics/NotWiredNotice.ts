/**
 * "Bu bölüm henüz sunucuya bağlı değil" kutusu.
 *
 * Dört sayfada tekrar ediyor, o yüzden ortak. Ama asıl sebebi tekrar değil:
 * bu mesajın HER YERDE AYNI şeyi söylemesi gerekiyor. Ekranın kendisi hazır,
 * eksik olan veriyi getiren uç — kullanıcı "sistem bozuk" ile "bu özellik
 * henüz açılmadı" arasındaki farkı görmeli.
 *
 * Boş liste göstermek bu farkı siler: alıcı "iade talebim yok" sanır, oysa
 * sistem hiç bakmamıştır.
 */
import { t } from "../../i18n";
import { escapeHtml } from "../../utils/sanitize";

export interface NotWiredNoticeProps {
  /** Ekranın adı — "İade talepleri henüz bağlı değil" gibi. */
  title?: string;
  /** Beklenen uç. Kullanıcıya değil, ekran görüntüsünü alan geliştiriciye. */
  endpoint?: string;
}

export function NotWiredNotice(props: NotWiredNoticeProps = {}): string {
  const { title, endpoint } = props;

  return `
    <div class="rounded-md border border-dashed border-gray-300 bg-gray-50 p-6 text-center" role="status">
      <p class="text-sm font-medium text-gray-800">
        ${escapeHtml(title ?? t("shipment.notWired.title"))}
      </p>
      <p class="mx-auto mt-1 max-w-md text-xs text-gray-600">
        ${escapeHtml(t("shipment.notWired.hint"))}
      </p>
      ${
        endpoint
          ? `<p class="mt-3 font-mono text-[11px] text-gray-400">${escapeHtml(endpoint)}</p>`
          : ""
      }
    </div>`;
}
