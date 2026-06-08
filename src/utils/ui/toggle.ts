/**
 * Storefront toggle/switch/segmented kontrol helper'ları.
 *
 * Radio-grubu yerine geçen, veri sözleşmesini (input `name`/`value`,
 * `data-field`, Alpine `x-model`) BİREBİR koruyan UI kontrolleri üretir.
 * `button.ts` ile aynı tarzda: saf TS fonksiyonları, template string döndürür,
 * Tailwind v4 utility-first + `var(--color-primary-500)` tema rengi.
 *
 * - renderSwitch    → iOS-tarzı aç/kapa (gerçek boolean veya true/false radio).
 * - renderSegmented → 2-N eşdeğer seçim; kaydıran (peer) aktif segment.
 *
 * Switch peer pattern kullanır: gizli `<input type="checkbox">` + `peer-checked:*`
 * variant'larıyla CSS-only görsel — JS state'i değişen şey native input'tur, bu
 * yüzden mevcut `change`/`x-model` okuması aynı kalır.
 *
 * @example
 * html`${renderSwitch({ name: "e_invoice", field: "e_invoice_registered",
 *   checked: d.e_invoice_registered, label: "E-Fatura mükellefiyim",
 *   onValue: "true", offValue: "false" })}`
 *
 * @example
 * html`${renderSegmented({ name: "taxpayer_type", field: "taxpayer_type",
 *   value: d.taxpayer_type,
 *   options: [{ value: "individual", label: "Bireysel" },
 *             { value: "corporate", label: "Kurumsal" }] })}`
 */

import { escapeHtml } from "../sanitize";

export interface SwitchOptions {
  /** Native input `name` — veri sözleşmesi, değiştirme. */
  name: string;
  /** `data-field` attribute'u — collectCardData okuması buna bağlı. */
  field?: string;
  /** Başlangıçta açık mı? */
  checked: boolean;
  /** Sağda gösterilen başlık. */
  label: string;
  /** Başlık altı açıklama (opsiyonel). */
  description?: string;
  /** Açık değeri — true/false radio uyumu için. Verilirse hidden text input ile yazılır. */
  onValue?: string;
  /** Kapalı değeri. */
  offValue?: string;
  /** Alpine x-model bağı (opsiyonel) — verilirse checkbox'a x-model eklenir. */
  xModel?: string;
  /** Ek class'lar. */
  className?: string;
}

/**
 * iOS-tarzı aç/kapa switch.
 *
 * `onValue`/`offValue` verildiğinde, eski `value="true"/"false"` radio
 * mantığını korumak için gizli bir text input (`name`+`data-field`) basılır ve
 * checkbox sadece görsel/etkileşim kontrolü olur; checkbox `data-toggle-sync`
 * ile o hidden input'a yazar. `onValue`/`offValue` yoksa checkbox doğrudan
 * `name`/`data-field` taşır (gerçek boolean — `el.checked`).
 */
export function renderSwitch(opts: SwitchOptions): string {
  const { name, field, checked, label, description, onValue, offValue, xModel, className } = opts;
  const fieldAttr = field ? ` data-field="${escapeHtml(field)}"` : "";
  const usesHidden = onValue !== undefined && offValue !== undefined;
  const xModelAttr = xModel ? ` x-model="${escapeHtml(xModel)}"` : "";

  // value-mapped mod: checkbox görsel + sync, hidden input gerçek değeri tutar.
  const checkboxAttrs = usesHidden
    ? ` data-toggle-sync${xModelAttr}`
    : ` name="${escapeHtml(name)}"${fieldAttr}${xModelAttr}`;

  const hidden = usesHidden
    ? `<input type="hidden" name="${escapeHtml(name)}"${fieldAttr} value="${escapeHtml((checked ? onValue : offValue) ?? "")}" data-on-value="${escapeHtml(onValue ?? "")}" data-off-value="${escapeHtml(offValue ?? "")}" />`
    : "";

  return `
    <label class="flex items-center justify-between gap-4 cursor-pointer${className ? ` ${escapeHtml(className)}` : ""}">
      <span class="min-w-0">
        <span class="block text-sm font-medium" style="color:var(--color-text-primary)">${escapeHtml(label)}</span>
        ${description ? `<span class="block text-xs mt-0.5" style="color:var(--color-text-tertiary)">${escapeHtml(description)}</span>` : ""}
      </span>
      ${hidden}
      <span class="relative inline-flex shrink-0">
        <input type="checkbox"${checkboxAttrs} ${checked ? "checked" : ""} class="peer sr-only" />
        <span class="block w-11 h-6 rounded-full bg-gray-300 transition-colors duration-200 peer-checked:bg-[var(--color-primary-500,#cc9900)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-primary-500,#cc9900)] peer-focus-visible:ring-offset-1"></span>
        <span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-5"></span>
      </span>
    </label>
  `;
}

export interface SegmentedOption {
  value: string;
  label: string;
}

export interface SegmentedOptions {
  /** Native input `name` — veri sözleşmesi, değiştirme. */
  name: string;
  /** `data-field` attribute'u — collectCardData okuması buna bağlı. */
  field?: string;
  /** Seçili değer. */
  value: string;
  /** 2-N seçenek. */
  options: SegmentedOption[];
  /** Alpine x-model bağı (opsiyonel) — verilirse gizli radio'lara x-model eklenir. */
  xModel?: string;
  /** Ek class'lar. */
  className?: string;
}

/**
 * Kaydıran 2-N segment seçici. Her segment gizli bir `<input type="radio">`
 * (name/value/data-field korunur) + peer-checked ile boyanan görünür label.
 * `change` event ve `x-model` native radio üzerinden çalışır — okuma kodu aynı.
 */
export function renderSegmented(opts: SegmentedOptions): string {
  const { name, field, value, options, xModel, className } = opts;
  const fieldAttr = field ? ` data-field="${escapeHtml(field)}"` : "";
  const xModelAttr = xModel ? ` x-model="${escapeHtml(xModel)}"` : "";

  // Her segment kendi <label> sarmalayıcısında: radio (peer) hemen kardeş span'i
  // boyar. İsimsiz `peer` kullanılır (Tailwind JIT için statik class şart) —
  // her pair ayrı parent'ta olduğundan scoping doğru çalışır.
  const segments = options
    .map((opt) => {
      const checked = opt.value === value ? "checked" : "";
      return `
        <label class="flex-1 cursor-pointer">
          <input type="radio" name="${escapeHtml(name)}" value="${escapeHtml(opt.value)}"${fieldAttr}${xModelAttr} ${checked} class="peer sr-only" />
          <span class="block text-center text-sm font-medium py-2 px-3 rounded-md transition-colors select-none text-[color:var(--color-text-secondary)] peer-checked:bg-[var(--color-primary-500,#cc9900)] peer-checked:text-white">${escapeHtml(opt.label)}</span>
        </label>
      `;
    })
    .join("");

  return `
    <div class="flex w-full gap-1 p-1 rounded-lg bg-gray-100${className ? ` ${className}` : ""}">
      ${segments}
    </div>
  `;
}
