/**
 * FAZ 1.7 — Entitlement banner.
 *
 * `VerificationStatusBanner` zaten KYC/KYB durumlarını kapsıyor. Bu component
 * **ek olarak** entitlement düzlemi (L0) banner'larını kapsar:
 *   - Trial süresi dolmak üzere (< 3 gün)
 *   - Plan abonelik durumu (past_due)
 *
 * Render fonksiyonu HTML string döner; caller `innerHTML`'e koyar.
 * DOMPurify gerek yok — sadece sabit string ve `entitlement.ts`'den gelen sayı.
 */

import type { EntitlementSnapshot } from "../../utils/entitlement";
import { shouldShowVerificationBanner } from "../../utils/entitlement";
import { t } from "../../i18n";

const SUBSCRIPTION_HREF = "/pages/dashboard/subscription.html";

/**
 * Trial ending / past_due / suspended durumlarında banner üretir.
 * Hiçbir koşul yoksa boş string döner (template'te `{html}` ile direkt güvenli).
 */
export function EntitlementBanner(snapshot: EntitlementSnapshot | null): string {
  if (!snapshot) return "";

  // 1) Subscription past_due / suspended (kritik)
  if (snapshot.is_seller && snapshot.subscription_status === "past_due") {
    return renderBanner({
      tone: "error",
      title: t("infoMisc.subPaymentFailedTitle"),
      description: t("infoMisc.subPaymentFailedDesc"),
      ctaLabel: t("infoMisc.manageSubscription"),
      ctaHref: SUBSCRIPTION_HREF,
    });
  }
  if (snapshot.is_seller && snapshot.subscription_status === "suspended") {
    return renderBanner({
      tone: "error",
      title: t("infoMisc.subSuspendedTitle"),
      description: t("infoMisc.subSuspendedDesc"),
      ctaLabel: t("infoMisc.support"),
      ctaHref: "/pages/help.html",
    });
  }

  // 2) Buyer KYC/KYB pending → mevcut VerificationStatusBanner zaten
  //    bu durumu kapsıyor; burada tekrar göstermemek için skip ediyoruz.
  //    Ama trial ending gibi snapshot-spesifik durumlar VerificationStatusBanner'da
  //    yok — onları biz gösteriyoruz.
  const verif = shouldShowVerificationBanner(snapshot);
  if (verif.show && verif.kind === "trial_ending") {
    return renderBanner({
      tone: "warning",
      title: t("infoMisc.trialEndingTitle"),
      description: verif.message || "",
      ctaLabel: t("infoMisc.upgradePlan"),
      ctaHref: SUBSCRIPTION_HREF,
    });
  }

  return "";
}

interface RenderProps {
  tone: "warning" | "error" | "info" | "success";
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

function renderBanner({ tone, title, description, ctaLabel, ctaHref }: RenderProps): string {
  const toneClasses = {
    warning: "bg-amber-50 border-amber-200 text-amber-900",
    error: "bg-red-50 border-red-200 text-red-900",
    info: "bg-violet-50 border-violet-200 text-violet-900",
    success: "bg-green-50 border-green-200 text-green-900",
  }[tone];

  const cta =
    ctaLabel && ctaHref
      ? `<a href="${ctaHref}" class="th-btn px-4 py-2 text-sm no-underline whitespace-nowrap">${ctaLabel}</a>`
      : "";
  const desc = description ? `<div class="text-xs opacity-80">${description}</div>` : "";

  return `
    <div class="border rounded-lg p-4 mb-4 flex items-center gap-3 ${toneClasses}">
      <div class="flex-1 min-w-0">
        <div class="font-semibold mb-0.5">${title}</div>
        ${desc}
      </div>
      ${cta}
    </div>
  `;
}
