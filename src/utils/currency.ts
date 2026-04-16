/**
 * Currency utility — reads the user's preferred currency from localStorage
 * and provides helpers to swap the default "$" symbol in price strings.
 *
 * Currency metadata is loaded from the 'tradehub_currency_meta' cache
 * (populated by currencyService on API response).  A hard-coded fallback
 * covers the very first page-load before any API call has completed.
 */

const CURRENCY_STORAGE_KEY = "tradehub-currency";
const META_CACHE_KEY = "tradehub_currency_meta";

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
  try {
    const raw = localStorage.getItem(META_CACHE_KEY);
    if (raw) {
      const list = JSON.parse(raw) as Array<{ code: string; symbol: string }>;
      if (list.length) {
        const map: Record<string, CurrencyInfo> = {};
        for (const c of list) {
          map[c.code] = { code: c.code, symbol: c.symbol };
        }
        return map;
      }
    }
  } catch {
    // ignore parse errors, fallback below
  }
  return FALLBACK_CURRENCIES;
}

/** Get the currently selected currency info */
export function getSelectedCurrency(): CurrencyInfo {
  const code = localStorage.getItem(CURRENCY_STORAGE_KEY) || "USD";
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

/** Save the selected currency code to localStorage */
export function setSelectedCurrency(code: string): void {
  localStorage.setItem(CURRENCY_STORAGE_KEY, code);
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
