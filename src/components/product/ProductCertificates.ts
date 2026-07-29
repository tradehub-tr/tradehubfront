/**
 * ProductCertificates — ürün-seviyesi sertifika bölümü (Alibaba PDP referansı).
 *
 * Ölçüler referans sayfadan DevTools ile birebir alındı (2026-07-29):
 * container mt/pt 32px + border-t #DDDDDD; başlık 18px bold #222222 + mavi
 * rozet, alt boşluk 28px; kart 186×52, bg #E5F3FD, padding 8×12, grid gap 12.
 * Kök font 18px olduğundan (rem şişmesi) spacing'ler px arbitrary yazıldı —
 * gap-3 gibi rem utility'leri burada 13.5px'e şişer, referansla eşleşmez.
 */

import { getCurrentProduct } from "../../alpine/product";
import { t } from "../../i18n";
import { escapeHtml } from "../../utils/sanitize";
import { getLucideIcon } from "../icons/lucideIcons";

// Referans sitedeki onaylı-sertifika rozeti. Monokrom lucide sprite'ına
// giremez (çok path'li, sabit #0066CC dolgu) — tek kullanım, inline durur.
const CERT_BADGE_SVG = `<svg width="20" height="21" viewBox="0 0 20 21" fill="none" aria-hidden="true" class="shrink-0">
  <path d="M9.55769 3.08625C9.80185 2.84169 10.1981 2.84169 10.4423 3.08625L12.2563 4.90319C12.3736 5.02075 12.533 5.08675 12.6991 5.08661L15.2665 5.08451C15.2967 5.08449 15.3264 5.0866 15.3554 5.09071L10.2083 10.2378L8.32175 8.35124L6.33301 10.34L10.2083 14.2153L15.9288 8.49481C15.9598 8.57874 16.0088 8.65584 16.0734 8.72028L17.8903 10.5343C18.1349 10.7784 18.1349 11.1747 17.8903 11.4189L16.0734 13.2328C15.9558 13.3502 15.8898 13.5095 15.8899 13.6756L15.892 16.2431C15.8923 16.5887 15.6121 16.8689 15.2665 16.8686L12.6991 16.8665C12.533 16.8664 12.3736 16.9324 12.2563 17.0499L10.4423 18.8669C10.1981 19.1114 9.80185 19.1114 9.55769 18.8669L7.74372 17.0499C7.62636 16.9324 7.46702 16.8664 7.30091 16.8665L4.73346 16.8686C4.38788 16.8689 4.10767 16.5887 4.10795 16.2431L4.11005 13.6756C4.11019 13.5095 4.04419 13.3502 3.92663 13.2328L2.10969 11.4189C1.86513 11.1747 1.86513 10.7784 2.10969 10.5343L3.92663 8.72028C4.04419 8.60292 4.11019 8.44358 4.11005 8.27747L4.10795 5.71002C4.10767 5.36445 4.38788 5.08423 4.73346 5.08451L7.30091 5.08661C7.46702 5.08675 7.62636 5.02075 7.74372 4.90319L9.55769 3.08625Z" fill="#0066CC"/>
  <path d="M16.4468 6.79834L15.6366 5.98812L10.2083 11.4163L8.32178 9.52978L7.51155 10.34L10.2083 13.0368L16.4468 6.79834Z" fill="#0066CC"/>
</svg>`;

export function ProductCertificates(): string {
  const certs = getCurrentProduct().productCertifications ?? [];
  if (certs.length === 0) return "";

  const cards = certs
    .map(
      (c) => `
      <div class="flex items-center gap-[8px] h-[52px] px-[12px] py-[8px] rounded-sm bg-[#E5F3FD]">
        ${getLucideIcon("badge-check", "w-[32px] h-[32px] shrink-0 text-[#0066CC]")}
        <div class="min-w-0">
          <div class="text-[14px] leading-[18px] font-semibold text-[#222222] truncate">${escapeHtml(c.name)}</div>
          <div class="text-[12px] leading-[16px] mt-[2px] text-[#222222] truncate">${escapeHtml(c.description || c.name)}</div>
        </div>
      </div>
    `
    )
    .join("");

  return `
    <div id="pd-certificates" class="relative mt-[32px] pt-[32px] border-t border-[#DDDDDD]">
      <div class="flex items-center gap-1.5 mb-[28px]">
        <span class="text-[18px] font-bold text-[#222222]" data-i18n="product.certificates">${t("product.certificates")}</span>
        ${CERT_BADGE_SVG}
      </div>
      <div class="grid gap-[12px] grid-cols-[repeat(auto-fill,186px)]">
        ${cards}
      </div>
    </div>
  `;
}
