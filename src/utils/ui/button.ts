/**
 * Storefront buton class helper'ı.
 *
 * Sayfalar template string içinde `<button class="${btn(...)}">` ile çağırır.
 * Tüm class'lar `style.css` içindeki `.th-btn*` ailesine bağlıdır ve admin
 * panel "Tradehub Theme Settings" → buton CSS variable'larını tüketir
 * (--btn-bg, --btn-text, --radius-button, --spacing-button-x/y vs.).
 *
 * Yeni varyant/size eklerken: önce `style.css` `@layer components` içine
 * `.th-btn-<x>` class'ını ekle, sonra burada Variant/Size tipine ekle.
 *
 * @example
 * html`<button type="button" class="${btn({ variant: "primary" })}">Kaydet</button>`
 *
 * @example
 * html`<a href="/checkout" class="${btn({ variant: "ghost", size: "sm" })}">
 *   Sipariş onayına geç →
 * </a>`
 */

export type ButtonVariant =
  | "primary"
  | "outline"
  | "dark"
  | "success"
  | "danger"
  | "danger-ghost"
  | "ghost"
  | "link"
  | "gradient";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Tam genişlik (cart/checkout mobil CTA). */
  block?: boolean;
  /** Sadece ikon (kare/yuvarlak). `aspect-ratio: 1`. */
  iconOnly?: boolean;
  /** Ek class'lar — opsiyonel; mevcutla birleştirilir. */
  className?: string;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "th-btn",
  outline: "th-btn-outline",
  dark: "th-btn-dark",
  success: "th-btn-success",
  danger: "th-btn-danger",
  "danger-ghost": "th-btn-danger-ghost",
  ghost: "th-btn-ghost",
  link: "th-btn-link",
  // Eski gradient varyantı kaldırıldı — solid 3D `.th-btn`'e alias.
  gradient: "th-btn",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "th-btn-sm",
  md: "",
  lg: "th-btn-lg",
};

/**
 * Variant/size/modifier seçeneklerini tek bir class string'ine dönüştürür.
 * `link` varyantı padding/border içermediğinden size modifier uygulanmaz.
 */
export function btn(opts: ButtonOptions = {}): string {
  const { variant = "primary", size = "md", block = false, iconOnly = false, className } = opts;
  const parts = [VARIANT_CLASS[variant]];

  if (variant !== "link" && variant !== "danger-ghost") {
    const sizeClass = SIZE_CLASS[size];
    if (sizeClass) parts.push(sizeClass);
    if (block) parts.push("th-btn-block");
    if (iconOnly) parts.push("th-btn-icon");
  }

  if (className) parts.push(className);
  return parts.filter(Boolean).join(" ");
}
