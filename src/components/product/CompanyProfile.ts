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
import { escapeHtml, sanitizeUrl } from "../../utils/sanitize";
import { getSellerUrl } from "../../utils/sellerUrl";

interface InfoRow {
  icon: string;
  title: string;
  desc: string;
}

/** lucide çizgi ikonları — 24x24 viewBox iç path'leri */
const ICONS = {
  checkCircle:
    '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  users:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  banknote:
    '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01"/><path d="M18 12h.01"/>',
  box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M3.3 7 12 12l8.7-5"/><path d="M12 22V12"/>',
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

  // responseTime + onTimeDelivery burada YOK — üstteki "Şirket genel bilgileri"
  // istatistik kartında gösteriliyor, satır listesinde tekrar etmesin.
  const rows: InfoRow[] = [];
  if (s.responseRate)
    rows.push({
      icon: ICONS.checkCircle,
      title: escapeHtml(s.responseRate),
      desc: t("product.responseRate"),
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
  // Backend bu listeyi `mainProducts` adıyla da gönderir ama içeriği
  // `main_markets`'tır (ör. "Türkiye, Almanya"). Doğru etiket "Ana pazarlar";
  // `mainProducts` yalnızca cache'i eski payload'lar için fallback.
  const mainMarkets = (s.mainMarkets?.length ? s.mainMarkets : s.mainProducts) || [];
  if (mainMarkets.length)
    rows.push({
      icon: ICONS.box,
      title: t("product.mainMarkets"),
      desc: escapeHtml(mainMarkets.join(", ")),
    });
  if (s.certifications.length)
    rows.push({
      icon: ICONS.award,
      title: t("product.certifications"),
      desc: escapeHtml(s.certifications.join(" · ")),
    });

  // "Tedarikçinizi tanıyın" kartı — ölçüler referans PDP'den DevTools ile
  // alındı; px arbitrary değerler ve radius'lar bilinçli (html kökü 18px,
  // rem utility'leri referans ölçüleri şişirir).
  // slug dalı bilinçli: gateway /magaza/<sellerCode>'u internal rewrite ile
  // karşılıyor (seller-shop.ts:34, seller-dashboard.ts:78 aynı deseni üretir);
  // id dalının ürettiği ?seller= query URL'i gateway'de 404 veriyor.
  const storeUrl = s.id ? escapeHtml(sanitizeUrl(getSellerUrl({ slug: s.id }))) : "";
  const typeLine = [
    s.verified ? t("product.supplierVerifiedType") : "",
    s.yearsInBusiness ? t("product.supplierYearsOn", { count: s.yearsInBusiness }) : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const stats = [
    { label: t("product.onTimeDeliveryRate"), value: s.onTimeDelivery },
    { label: t("product.responseTimeCard"), value: s.responseTime },
  ].filter((st) => st.value);

  const logoHtml = s.logo
    ? `<img src="${escapeHtml(s.logo)}" alt="${escapeHtml(s.name)}" width="64" height="64" class="h-[64px] w-[64px] shrink-0 rounded-[4px] border border-[#ddd] bg-white object-contain" loading="lazy" decoding="async" />`
    : `<div class="flex h-[64px] w-[64px] shrink-0 items-center justify-center rounded-[4px] border border-[#ddd] bg-white text-[24px] font-bold text-[#999]">${escapeHtml((s.name || "?").charAt(0))}</div>`;

  const supplierCard = `
    <div class="rounded-lg bg-[#f5f5f5] p-[20px]">
      <div class="flex items-start gap-[16px]">
        ${logoHtml}
        <div class="min-w-0">
          ${
            storeUrl
              ? `<a href="${storeUrl}" class="text-[14px] font-semibold text-[#222] underline hover:text-black">${escapeHtml(s.name)}</a>`
              : `<span class="text-[14px] font-semibold text-[#222]">${escapeHtml(s.name)}</span>`
          }
          ${typeLine ? `<div class="mt-[4px] text-[12px] leading-[16px] text-[#222]">${typeLine}</div>` : ""}
          ${
            s.country
              ? `<div class="mt-[4px] flex items-center gap-[4px] text-[12px] leading-[16px] text-[#222]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                  ${t("product.supplierLocation", { code: escapeHtml(s.country) })}
                </div>`
              : ""
          }
        </div>
      </div>
      ${
        stats.length
          ? `<div class="mt-[16px] rounded-lg bg-white p-[20px]">
              <div class="text-[16px] leading-[24px] font-bold text-[#222]">${t("product.companyOverview")}</div>
              <div class="mt-[16px] grid grid-cols-2 gap-x-[32px] gap-y-[16px] max-sm:grid-cols-1">
                ${stats
                  .map(
                    (st) => `
                  <div class="min-w-0">
                    <div class="text-[12px] leading-[16px] text-[#222]">${st.label}</div>
                    <div class="mt-[8px] truncate text-[20px] leading-[28px] font-semibold text-[#222]">${escapeHtml(st.value)}</div>
                  </div>`
                  )
                  .join("")}
              </div>
            </div>`
          : ""
      }
      ${
        storeUrl
          ? `<div class="mt-[16px] flex items-center gap-[12px] max-sm:flex-col">
              <a href="${storeUrl}" class="th-btn inline-flex h-[36px] flex-1 items-center justify-center whitespace-nowrap rounded-full px-[16px] text-[14px] font-medium no-underline max-sm:w-full">${t("product.viewCompanyProfile")}</a>
              <a href="${storeUrl}" class="th-btn-outline h-[36px] flex-1 whitespace-nowrap rounded-full px-[16px] text-[14px] font-medium no-underline max-sm:w-full">${t("product.showMoreProducts")}</a>
            </div>`
          : ""
      }
    </div>`;

  return `
    <div class="py-6 max-[374px]:py-4">
      ${supplierCard}
      ${
        rows.length
          ? `<div class="mt-[16px] grid grid-cols-2 gap-x-12 max-sm:grid-cols-1">
        ${rows.map(renderRow).join("")}
      </div>`
          : ""
      }
    </div>
  `;
}
