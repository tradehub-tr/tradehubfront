/**
 * Country helpers — backend "country" string'inden flag emoji ve 2-letter kod döndürür.
 *
 * Backend `Admin Seller Profile.country` field'ı genellikle "Turkey", "China", "USA"
 * gibi tam isim veya doğrudan ISO-2 kodu ("TR", "CN") olabilir. Bu helper iki formatı
 * da destekler.
 *
 * Project genelinde flag emoji standart (TopBar, AccountSetupForm vb. aynı pattern).
 */

import { t } from "../i18n";

interface CountryEntry {
  code: string; // ISO-2
  flag: string; // Emoji
  names: string[]; // Backend'in dönebileceği isimler (case-insensitive eşleşme)
}

const COUNTRIES: CountryEntry[] = [
  { code: "TR", flag: "🇹🇷", names: ["Turkey", "Türkiye", "Turkiye", "TR"] },
  { code: "US", flag: "🇺🇸", names: ["United States", "USA", "US"] },
  { code: "CN", flag: "🇨🇳", names: ["China", "CN"] },
  { code: "DE", flag: "🇩🇪", names: ["Germany", "DE", "Deutschland"] },
  { code: "FR", flag: "🇫🇷", names: ["France", "FR"] },
  { code: "GB", flag: "🇬🇧", names: ["United Kingdom", "UK", "GB", "England"] },
  { code: "IT", flag: "🇮🇹", names: ["Italy", "IT", "Italia"] },
  { code: "ES", flag: "🇪🇸", names: ["Spain", "ES", "España"] },
  { code: "NL", flag: "🇳🇱", names: ["Netherlands", "NL", "Holland"] },
  { code: "JP", flag: "🇯🇵", names: ["Japan", "JP"] },
  { code: "KR", flag: "🇰🇷", names: ["South Korea", "KR", "Korea"] },
  { code: "IN", flag: "🇮🇳", names: ["India", "IN"] },
  { code: "RU", flag: "🇷🇺", names: ["Russia", "RU"] },
  { code: "BR", flag: "🇧🇷", names: ["Brazil", "BR"] },
  { code: "MX", flag: "🇲🇽", names: ["Mexico", "MX"] },
];

/**
 * Backend country string'inden ISO-2 kodu çıkarır. Bilinmiyorsa string'in ilk 2
 * karakterini döndürür (defansif).
 */
export function getCountryCode(country: string | null | undefined): string {
  if (!country) return "";
  const normalized = country.trim();
  for (const entry of COUNTRIES) {
    if (entry.names.some((n) => n.toLowerCase() === normalized.toLowerCase())) {
      return entry.code;
    }
  }
  return normalized.length <= 2 ? normalized.toUpperCase() : normalized.slice(0, 2).toUpperCase();
}

/**
 * Country string'inden flag emoji döndürür. Bilinmiyorsa boş string (UI defansif).
 */
export function getCountryFlag(country: string | null | undefined): string {
  if (!country) return "";
  const normalized = country.trim();
  for (const entry of COUNTRIES) {
    if (entry.names.some((n) => n.toLowerCase() === normalized.toLowerCase())) {
      return entry.flag;
    }
  }
  return "";
}

/**
 * Arayüzde gösterilecek ülke adı: backend'in ham değeri ("Turkey", "TR") sözlükteki
 * `countries.<KOD>` karşılığına çevrilir (TR → "Türkiye" — resmî ad; İngilizce
 * sözlükte de "Türkiye"). Sözlükte karşılığı olmayan ad olduğu gibi döner.
 * Backend'e GİDEN değerler bu yardımcıdan geçmez (Country master adı "Turkey" kalır).
 */
export function getCountryDisplayName(country: string | null | undefined): string {
  if (!country) return "";
  const code = getCountryCode(country);
  if (!code) return country;
  const key = `countries.${code}`;
  const translated = t(key);
  return translated && translated !== key ? translated : country;
}
