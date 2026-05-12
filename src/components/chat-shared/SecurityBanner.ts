import { t } from "../../i18n";
import { getLucideIcon } from "../icons/lucideIcons";

export function SecurityBanner(): string {
  const icon = getLucideIcon("shield", "w-4 h-4 shrink-0 mt-0.5");
  return /* html */ `
    <div class="mx-4 mt-3 flex items-start gap-2 rounded-lg bg-[var(--color-success-50,#f0fdf4)] px-3 py-2.5 text-[12px] leading-relaxed text-[var(--color-success-700,#15803d)]">
      ${icon}
      <span>${t("chat.securityBanner")}</span>
    </div>
  `;
}
