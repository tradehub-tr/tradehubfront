/**
 * FooterGroup Component
 * @deprecated Ödeme rozetleri güven kolonuna taşındı (FooterLinks içindeki
 * "Güvenli Alışveriş" bloğu). Geriye dönük uyumluluk için boş string döner.
 */
export function FooterGroup(): string {
  return "";
}

/**
 * Get group companies data for use by other components
 * @deprecated Use FooterGroup() directly
 */
export function getGroupCompaniesData(): { name: string; href: string }[] {
  return [];
}
