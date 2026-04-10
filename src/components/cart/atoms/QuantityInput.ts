/**
 * QuantityInput Atom
 * Rounded stepper used in cart SKU rows.
 * Alpine component: quantityInput (registered in alpine.ts)
 */

import { t } from '../../../i18n';

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
  const minusDisabled = value <= min ? 'disabled' : '';
  const plusDisabled = value >= max ? 'disabled' : '';

  return `
    <div class="th-quantity number-picker" x-data="quantityInput({ value: ${value}, min: ${min}, max: ${max}, step: ${step}, id: '${id}' })">
      <button type="button" class="th-quantity__button number-picker-button number-picker-minus" @click="decrement()" :disabled="value <= min" ${minusDisabled} aria-label="${t('cart.quantityDecrease')}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <input
        type="number"
        id="${id}"
        x-ref="input"
        class="th-quantity__input number-picker-input"
        :value="value"
        value="${value}"
        @change="clampAndDispatch()"
        min="${min}"
        max="${max}"
        step="${step}"
        aria-label="${t('cart.quantityLabel')}"
      />
      <button type="button" class="th-quantity__button number-picker-button number-picker-plus" @click="increment()" :disabled="value >= max" ${plusDisabled} aria-label="${t('cart.quantityIncrease')}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
