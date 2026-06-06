/**
 * QuantityInput Atom
 * Rounded stepper used in cart SKU rows.
 * Alpine component: quantityInput (registered in alpine.ts)
 */

import { t } from "../../../i18n";
import { escapeHtml } from "../../../utils/sanitize";

export interface QuantityInputProps {
  id: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
}

export function QuantityInput({
  id,
  value,
  min = 1,
  max = 9999,
  step = 1,
}: QuantityInputProps): string {
  const minusDisabled = value <= min ? "disabled" : "";
  const plusDisabled = value >= max ? "disabled" : "";
  // id is server/user-derived: encode as a JS string literal (JSON.stringify),
  // then HTML-escape for the double-quoted x-data attribute context.
  const idLiteral = escapeHtml(JSON.stringify(id));
  const idAttr = escapeHtml(id);

  return `
    <div class="th-quantity number-picker max-[480px]:w-[100px] max-[480px]:h-[34px] max-[380px]:w-[88px] max-[380px]:h-[30px]" x-data="quantityInput({ value: ${value}, min: ${min}, max: ${max}, step: ${step}, id: ${idLiteral} })">
      <button type="button" class="th-quantity__button number-picker-button number-picker-minus max-[480px]:w-[28px] max-[480px]:h-[28px] max-[380px]:w-[24px] max-[380px]:h-[24px]" @click="decrement()" :disabled="value <= min" ${minusDisabled} aria-label="${t("cart.quantityDecrease")}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="max-[380px]:w-3 max-[380px]:h-3">
          <path d="M5 12h14" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <input
        type="number"
        id="${idAttr}"
        x-ref="input"
        class="th-quantity__input number-picker-input max-[480px]:text-[12px] max-[380px]:text-[11px]"
        :value="value"
        value="${value}"
        @change="clampAndDispatch()"
        min="${min}"
        max="${max}"
        step="${step}"
        aria-label="${t("cart.quantityLabel")}"
      />
      <button type="button" class="th-quantity__button number-picker-button number-picker-plus max-[480px]:w-[28px] max-[480px]:h-[28px] max-[380px]:w-[24px] max-[380px]:h-[24px]" @click="increment()" :disabled="value >= max" ${plusDisabled} aria-label="${t("cart.quantityIncrease")}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="max-[380px]:w-3 max-[380px]:h-3">
          <path d="M12 5v14M5 12h14" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  `.trim();
}

/** @deprecated Alpine handles all interactivity now – kept for backward compatibility */
export function initQuantityInputs(_container?: HTMLElement): void {
  // no-op – Alpine x-data="quantityInput" handles everything
}
