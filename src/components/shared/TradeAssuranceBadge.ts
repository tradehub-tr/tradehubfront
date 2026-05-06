/**
 * TradeAssuranceBadge — Hero üzerinde "TAS logo + Ticari Güvence Sistemi" pill rozeti.
 * Karanlık hero overlay'leri üzerinde kullanılmak üzere tasarlanmıştır.
 */
import { t } from "../../i18n";
import tasLogoUrl from "../../assets/images/tas_logo.png";

export interface TradeAssuranceBadgeOptions {
  /** Ek margin/utility class'ları (ör. `mb-6`, `mb-3`). */
  className?: string;
}

export function TradeAssuranceBadge(options: TradeAssuranceBadgeOptions = {}): string {
  const { className = "" } = options;
  const label = t("mega.tradeAssuranceTitle");
  return `
    <div class="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/15 backdrop-blur-sm ${className}">
      <img src="${tasLogoUrl}" alt="${label}" class="h-9 sm:h-10 w-auto object-contain" />
      <span class="text-white font-bold text-base sm:text-lg" data-i18n="mega.tradeAssuranceTitle">${label}</span>
    </div>
  `;
}
