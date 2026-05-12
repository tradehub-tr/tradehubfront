import { t } from "../../i18n";

export function QuickActionChips(): string {
  const labels = [
    t("chat.quickActions.rateSeller"),
    t("chat.quickActions.viewPaymentMethods"),
    t("chat.quickActions.fileComplaint"),
    t("chat.quickActions.sendLogisticsRequest"),
  ];

  const items = labels
    .map(
      (label) => `
      <button type="button" class="appearance-none rounded-full border border-[var(--color-border-default,#e5e5e5)] bg-white px-3 py-1.5 text-[11px] text-[var(--color-text-secondary,#525252)] cursor-pointer hover:border-[var(--color-primary-500,#f5b800)] hover:text-[var(--color-primary-700,#a87c00)] focus:outline-none transition-colors">
        ${label}
      </button>`
    )
    .join("");

  return /* html */ `
    <div class="flex flex-wrap gap-1.5 px-4 pt-1 pb-2">
      ${items}
    </div>
  `;
}
