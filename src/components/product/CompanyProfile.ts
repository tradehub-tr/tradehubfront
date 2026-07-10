/**
 * CompanyProfile Component — "Tedarikçi" sekmesi.
 *
 * Kimlik (isim, rozet, CTA) sekmelerin üstündeki kalıcı satıcı kartında
 * (ProductTitleBar) yaşar; bu sekme yalnızca orada olmayan şirket
 * detaylarını ikonlu kayıt satırları olarak verir. Verisi olmayan satır
 * hiç render edilmez; "başlık var, içerik boş" durumu oluşmaz.
 */

import { getCurrentProduct } from "../../alpine/product";
import { t } from "../../i18n";
import { escapeHtml } from "../../utils/sanitize";

interface InfoRow {
  icon: string;
  title: string;
  desc: string;
}

/** lucide çizgi ikonları — 24x24 viewBox iç path'leri */
const ICONS = {
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  checkCircle:
    '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  truck:
    '<path d="M5 18H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h11v11"/><path d="M14 9h4l4 4v4a1 1 0 0 1-1 1h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  users:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  banknote:
    '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01"/><path d="M18 12h.01"/>',
  box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M3.3 7 12 12l8.7-5"/><path d="M12 22V12"/>',
  factory:
    '<path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/>',
  award:
    '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
};

function renderRow(row: InfoRow): string {
  return `
    <div class="flex gap-3.5 border-b border-[var(--pd-spec-border,#e5e5e5)] py-4 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0">
      <div class="flex h-9.5 w-9.5 flex-none items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${row.icon}</svg>
      </div>
      <div class="min-w-0">
        <div class="text-sm font-semibold tabular-nums text-[var(--pd-title-color,#111827)]">${row.title}</div>
        <div class="mt-px text-[13px] text-[var(--pd-rating-text-color,#6b7280)]">${row.desc}</div>
      </div>
    </div>`;
}

export function CompanyProfile(): string {
  const mockProduct = getCurrentProduct();
  const s = mockProduct.supplier;

  const rows: InfoRow[] = [];
  if (s.responseTime)
    rows.push({
      icon: ICONS.clock,
      title: escapeHtml(s.responseTime),
      desc: t("product.responseTime"),
    });
  if (s.responseRate)
    rows.push({
      icon: ICONS.checkCircle,
      title: escapeHtml(s.responseRate),
      desc: t("product.responseRate"),
    });
  if (s.onTimeDelivery)
    rows.push({
      icon: ICONS.truck,
      title: escapeHtml(s.onTimeDelivery),
      desc: t("product.onTimeDelivery"),
    });
  if (s.employees)
    rows.push({
      icon: ICONS.users,
      title: escapeHtml(s.employees),
      desc: t("product.employees"),
    });
  if (s.annualRevenue)
    rows.push({
      icon: ICONS.banknote,
      title: escapeHtml(s.annualRevenue),
      desc: t("product.annualRevenue"),
    });
  if (s.mainProducts.length)
    rows.push({
      icon: ICONS.box,
      title: t("product.mainProductsLabel"),
      desc: escapeHtml(s.mainProducts.join(", ")),
    });
  rows.push({
    icon: ICONS.factory,
    title: t("product.factoryCapability"),
    desc: [
      t("product.productionLine"),
      t("product.qualityControl"),
      t("product.warehouse"),
      t("product.showroom"),
    ].join(" &middot; "),
  });
  if (s.certifications.length)
    rows.push({
      icon: ICONS.award,
      title: t("product.certifications"),
      desc: escapeHtml(s.certifications.join(" · ")),
    });

  return `
    <div class="py-6 max-[374px]:py-4">
      <div class="grid grid-cols-2 gap-x-12 max-sm:grid-cols-1">
        ${rows.map(renderRow).join("")}
      </div>
    </div>
  `;
}
