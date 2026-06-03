/**
 * Checkbox Atom
 * Alpine.js-powered custom checkbox with checked + indeterminate visuals.
 * Registered as Alpine.data('checkbox') in src/alpine.ts.
 */

export interface CheckboxProps {
  id: string;
  checked: boolean;
  indeterminate?: boolean;
  onChange?: string;
  disabled?: boolean;
}

export function Checkbox({
  id,
  checked,
  indeterminate = false,
  onChange,
  disabled = false,
}: CheckboxProps): string {
  const checkedAttr = checked ? "checked" : "";
  const indeterminateAttr = indeterminate ? 'data-indeterminate="true"' : "";
  const onChangeAttr = onChange ? `data-onchange="${onChange}"` : "";
  const disabledAttr = disabled ? "disabled" : "";
  const disabledCursor = disabled ? "cursor-not-allowed opacity-50" : "";

  const checkVisible = checked ? "block" : "hidden";
  const dashVisible = indeterminate && !checked ? "block" : "hidden";

  return `
    <label class="next-checkbox-wrapper inline-flex items-center cursor-pointer select-none ${disabledCursor}" for="${id}"
      x-data="checkbox">
      <input
        type="checkbox"
        id="${id}"
        class="next-checkbox-input sr-only"
        data-checkbox
        ${checkedAttr}
        ${indeterminateAttr}
        ${onChangeAttr}
        ${disabledAttr}
        x-ref="input"
        x-effect="$el.indeterminate = indeterminate"
        @change="handleChange()"
        :aria-checked="indeterminate ? 'mixed' : String(checked)"
      />
      <span class="th-checkbox next-checkbox relative w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] rounded-[4px] sm:rounded-[5px]"
        :class="{ 'is-checked': checked || indeterminate }">
        <svg class="next-checkbox-check absolute inset-0 m-auto w-[10px] h-[10px] sm:w-3 sm:h-3 ${checkVisible}"
          :class="checked ? 'block' : 'hidden'"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m5 13 4 4L19 7"/>
        </svg>
        <span class="next-checkbox-dash absolute start-0.5 end-0.5 sm:start-1 sm:end-1 top-1/2 -translate-y-1/2 h-[2px] bg-current rounded ${dashVisible}"
          :class="(indeterminate && !checked) ? 'block' : 'hidden'"
          aria-hidden="true"></span>
      </span>
    </label>
  `.trim();
}

/** @deprecated Alpine.js manages checkbox behavior declaratively now. Kept as no-op for backward compatibility. */
export function initCheckbox(_container?: HTMLElement): void {
  // No-op — Alpine.data('checkbox') handles all behavior declaratively.
}
