/**
 * Currency utility — reads the user's preferred currency from localStorage
 * and provides helpers to swap the default "$" symbol in price strings.
 *
 * Currency metadata is sourced from currencyService's in-memory list
 * (populated by its queryFetch-backed `initCurrency`).  A hard-coded fallback
 * covers the very first page-load before any API call has completed.
 */

import {
  getSupportedCurrencies,
  getSelectedCurrency as getServiceCurrencyCode,
  setSelectedCurrency as setServiceCurrency,
} from "../services/currencyService";

export interface CurrencyInfo {
  code: string;
  symbol: string;
}

const FALLBACK_CURRENCIES: Record<string, CurrencyInfo> = {
  TRY: { code: "TRY", symbol: "₺" },
  USD: { code: "USD", symbol: "$" },
  EUR: { code: "EUR", symbol: "€" },
};

function getCurrencyMap(): Record<string, CurrencyInfo> {
  const list = getSupportedCurrencies();
  if (list.length) {
    const map: Record<string, CurrencyInfo> = {};
    for (const c of list) {
      map[c.code] = { code: c.code, symbol: c.symbol };
    }
    return map;
  }
  return FALLBACK_CURRENCIES;
}

/** Get the currently selected currency info.
 *  Tek doğruluk kaynağı = currencyService (bellek + localStorage + event).
 *  utils yalnızca code'u CurrencyInfo'ya map eder; localStorage'ı DOĞRUDAN
 *  okumaz — eski desync (service belleği vs taze localStorage farklı değer
 *  döndürüyordu) bu sayede ortadan kalkar. */
export function getSelectedCurrency(): CurrencyInfo {
  const code = getServiceCurrencyCode();
  const map = getCurrencyMap();
  return map[code] || map.USD || { code: "USD", symbol: "$" };
}

/** Get just the symbol */
export function getCurrencySymbol(): string {
  return getSelectedCurrency().symbol;
}

/** Get just the code */
export function getCurrencyCode(): string {
  return getSelectedCurrency().code;
}

/** Save the selected currency. currencyService'e delege eder — hem
 *  _selectedCurrency belleği hem localStorage güncellenir ve 'currency-changed'
 *  event'i fire edilir (TopBar "Kaydet" akışı bunu çağırıyor). */
export function setSelectedCurrency(code: string): void {
  setServiceCurrency(code);
}

/**
 * Replace the "$" prefix in a price string with the selected currency symbol.
 */
export function formatPrice(price: string): string {
  const { symbol, code } = getSelectedCurrency();
  return price
    .replace(/^\$/, symbol)
    .replace(/\$(?=\d)/g, symbol)
    .replace(/\bUSD\b/g, code);
}

export function formatStartingPrice(price: string): string {
  const { symbol, code } = getSelectedCurrency();
  const rangeMatch = price.match(/[$€₺£¥]?([\d.,]+)\s*-\s*[$€₺£¥]?([\d.,]+)/);
  if (rangeMatch) {
    const parseNum = (s: string): number => {
      if (code === "TRY") {
        return parseFloat(s.replace(/\./g, "").replace(",", "."));
      }
      return parseFloat(s.replace(/,/g, ""));
    };
    const a = parseNum(rangeMatch[1]);
    const b = parseNum(rangeMatch[2]);
    if (!isNaN(a) && !isNaN(b)) {
      const startingPrice = Math.max(a, b);
      if (code === "TRY") {
        const formatted = startingPrice.toFixed(2).replace(".", ",").replace(/,00$/, "");
        return `${symbol}${formatted}`;
      }
      return `${symbol}${startingPrice.toFixed(2).replace(/\.00$/, "")}`;
    }
  }
  return formatPrice(price);
}
