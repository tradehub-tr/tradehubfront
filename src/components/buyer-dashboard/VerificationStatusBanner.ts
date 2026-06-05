/**
 * VerificationStatusBanner — Sprint 2.6
 *
 * KYC + KYB durumlarına göre dinamik banner. Plan Bölüm 19.6 tablosu:
 *
 * | kyc_status | kyb_status | Banner |
 * |---|---|---|
 * | Pending      | Locked       | KYC bekliyor → /kyc |
 * | Locked       | Pending      | KYB bekliyor → /kyb |
 * | Pending      | Pending      | İkisi de bekliyor → 2 CTA |
 * | Verified     | Locked       | (banner yok — buyer alışveriş yapabilir) |
 * | Locked       | Verified     | "Alışveriş için KYC doldur" (dismissable) |
 * | Verified     | Verified     | (banner yok) |
 * | Rejected     | *            | KYC reddedildi → /kyc |
 * | *            | Rejected     | KYB reddedildi → /kyb |
 * | Suspended    | *            | Hesap askıya alındı (destek talebi) |
 */

import type { AuthUser } from "../../utils/auth";
import { t } from "../../i18n";

const KYC_HREF = "/pages/dashboard/kyc.html";
const KYB_HREF = "/pages/dashboard/kyb.html";

const ICONS = {
  alert: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  shield: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l9 4v6c0 5-3.5 9-9 10C6.5 21 3 17 3 12V6l9-4z"/></svg>`,
  clock: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
};

interface BannerProps {
  tone: "warning" | "error" | "info" | "success";
  icon: string;
  title: string;
  description?: string;
  ctas?: Array<{ label: string; href: string; primary?: boolean }>;
}

function renderBanner({ tone, icon, title, description, ctas = [] }: BannerProps): string {
  const toneClasses: Record<string, string> = {
    warning: "bg-amber-50 border-amber-200 text-amber-900",
    error: "bg-red-50 border-red-200 text-red-900",
    info: "bg-violet-50 border-violet-200 text-violet-900",
    success: "bg-green-50 border-green-200 text-green-900",
  };
  const iconColors: Record<string, string> = {
    warning: "text-amber-600",
    error: "text-red-600",
    info: "text-violet-600",
    success: "text-green-600",
  };
  const ctaButtons = ctas
    .map((cta) => {
      const cls = cta.primary
        ? "th-btn px-4 py-2 text-sm whitespace-nowrap no-underline"
        : "text-xs font-semibold underline hover:opacity-80 whitespace-nowrap";
      return `<a href="${cta.href}" class="${cls}">${cta.label}</a>`;
    })
    .join(" ");
  return `
		<div class="border rounded-lg p-4 mb-4 flex items-center gap-3 ${toneClasses[tone]}">
			<span class="${iconColors[tone]} flex-shrink-0">${icon}</span>
			<div class="flex-1 min-w-0">
				<div class="font-semibold mb-0.5">${title}</div>
				${description ? `<div class="text-xs opacity-80">${description}</div>` : ""}
			</div>
			${ctaButtons ? `<div class="flex items-center gap-3">${ctaButtons}</div>` : ""}
		</div>
	`;
}

export function VerificationStatusBanner(user: AuthUser | null): string {
  if (!user) return "";
  const kyc = user.kyc_status || null;
  const kyb = user.kyb_status || null;

  // Suspended (en yüksek öncelik — hesap askıda)
  if (kyc === "Suspended" || kyb === "Suspended") {
    return renderBanner({
      tone: "error",
      icon: ICONS.alert,
      title: t("buyerUi.accountSuspendedTitle"),
      description: t("buyerUi.accountSuspendedDesc"),
      ctas: [{ label: t("buyerUi.supportRequest"), href: "/pages/help.html", primary: true }],
    });
  }

  // KYC Rejected — düzelt + tekrar gönder
  if (kyc === "Rejected") {
    return renderBanner({
      tone: "error",
      icon: ICONS.alert,
      title: t("buyerUi.kycRejectedTitle"),
      description: t("buyerUi.rejectedDocDesc"),
      ctas: [{ label: t("buyerUi.fixKyc"), href: KYC_HREF, primary: true }],
    });
  }

  // KYB Rejected — düzelt + tekrar gönder
  if (kyb === "Rejected") {
    return renderBanner({
      tone: "error",
      icon: ICONS.alert,
      title: t("buyerUi.kybRejectedTitle"),
      description: t("buyerUi.rejectedDocDesc"),
      ctas: [{ label: t("buyerUi.fixKyb"), href: KYB_HREF, primary: true }],
    });
  }

  // KYC + KYB her ikisi de Pending
  if (kyc === "Pending" && kyb === "Pending") {
    return renderBanner({
      tone: "warning",
      icon: ICONS.shield,
      title: t("buyerUi.verificationIncompleteTitle"),
      description: t("buyerUi.bothPendingDesc"),
      ctas: [
        { label: "KYC", href: KYC_HREF },
        { label: "KYB", href: KYB_HREF, primary: true },
      ],
    });
  }

  // Sadece KYC Pending
  if (kyc === "Pending") {
    return renderBanner({
      tone: "warning",
      icon: ICONS.shield,
      title: t("buyerUi.kycPendingTitle"),
      description: t("buyerUi.kycPendingDesc"),
      ctas: [{ label: t("buyerUi.applyNow"), href: KYC_HREF, primary: true }],
    });
  }

  // Sadece KYB Pending
  if (kyb === "Pending") {
    return renderBanner({
      tone: "info",
      icon: ICONS.shield,
      title: t("buyerUi.kybPendingTitle"),
      description: t("buyerUi.kybPendingDesc"),
      ctas: [{ label: t("buyerUi.applyNow"), href: KYB_HREF, primary: true }],
    });
  }

  // KYB Under Review (admin inceliyor)
  if (kyb === "Under Review") {
    return renderBanner({
      tone: "info",
      icon: ICONS.clock,
      title: t("buyerUi.kybUnderReviewTitle"),
      description: t("buyerUi.kybUnderReviewDesc"),
    });
  }

  // Locked KYC + Verified KYB (Satıcı, KYC opsiyonel — dismissable banner)
  if (kyc === "Locked" && kyb === "Verified") {
    return renderBanner({
      tone: "info",
      icon: ICONS.shield,
      title: t("buyerUi.fillKycForShoppingTitle"),
      description: t("buyerUi.fillKycForShoppingDesc"),
      ctas: [{ label: t("buyerUi.fillKyc"), href: KYC_HREF }],
    });
  }

  // Verified + Verified veya Verified + Locked — banner yok
  return "";
}
