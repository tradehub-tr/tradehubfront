/**
 * Currency Service — handles multi-currency display for TradeHub
 *
 * Currencies and rates are fetched from the backend (Supported Currency +
 * Currency Rate Pair DocTypes).  A localStorage cache avoids repeat API calls.
 * Hard-coded defaults are kept only as a last-resort fallback for the very
 * first page-load before the API has ever responded.
 */

import { api } from "../utils/api";

// ── Types ──

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  nameTr: string;
  decimalPlaces: number;
}

export interface CurrencyRateEntry {
  [toCurrency: string]: number;
}

export interface ExchangeRates {
  [fromCurrency: string]: CurrencyRateEntry;
}

export interface CurrencySettings {
  currencies: CurrencyInfo[];
  rates: ExchangeRates;
  defaultCurrency: string;
  detectedCountry: string;
  baseCurrency: string;
}

// ── State ──

const STORAGE_KEY = "tradehub-currency";
const RATES_CACHE_KEY = "tradehub_rates";
const META_CACHE_KEY = "tradehub_currency_meta";
const RATES_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

const DEFAULT_CURRENCY_META: Record<string, CurrencyInfo> = {
  TRY: { code: "TRY", symbol: "₺", name: "Turkish Lira", nameTr: "Türk Lirası", decimalPlaces: 2 },
  USD: { code: "USD", symbol: "$", name: "US Dollar", nameTr: "Amerikan Doları", decimalPlaces: 2 },
  EUR: { code: "EUR", symbol: "€", name: "Euro", nameTr: "Euro", decimalPlaces: 2 },
};

const DEFAULT_RATES: ExchangeRates = {
  USD: { USD: 1, EUR: 0.92, TRY: 38.5, GBP: 0.79, CNY: 7.25 },
};

let _settings: CurrencySettings | null = _loadCachedRates();
let _currencyMeta: Record<string, CurrencyInfo> = _buildCurrencyMeta(_settings?.currencies);
let _selectedCurrency: string = localStorage.getItem(STORAGE_KEY) || "USD";
let _initialized = false;

// ── Initialization ──

export async function initCurrency(): Promise<void> {
  if (_initialized) return;

  _selectedCurrency = localStorage.getItem(STORAGE_KEY) || "USD";

  const cached = _loadCachedRates();
  if (cached) {
    _settings = cached;
    _currencyMeta = _buildCurrencyMeta(cached.currencies);
    _initialized = true;
  }

  try {
    const response = await api<{ message: CurrencySettings }>(
      "/method/tradehub_core.api.currency.get_currency_settings"
    );
    _settings = response.message;

    if (_settings.currencies?.length) {
      _currencyMeta = _buildCurrencyMeta(_settings.currencies);
      _saveCachedMeta(_settings.currencies);
    }

    _saveCachedRates(_settings);

    if (!localStorage.getItem(STORAGE_KEY) && _settings.defaultCurrency) {
      _selectedCurrency = _settings.defaultCurrency;
      localStorage.setItem(STORAGE_KEY, _selectedCurrency);
    }

    _initialized = true;
    _notifyCurrencyChange();
  } catch (err) {
    console.warn("[currency] Failed to fetch rates from API, using defaults:", err);
    if (!_settings) {
      _settings = {
        currencies: Object.values(_currencyMeta),
        rates: DEFAULT_RATES,
        defaultCurrency: "USD",
        detectedCountry: "US",
        baseCurrency: "USD",
      };
    }
    _initialized = true;
  }
}

// ── Currency Selection ──

export function getSelectedCurrency(): string {
  return _selectedCurrency;
}

export function getSelectedCurrencyInfo(): CurrencyInfo {
  return _currencyMeta[_selectedCurrency] || _currencyMeta["USD"] || DEFAULT_CURRENCY_META["USD"];
}

export function setSelectedCurrency(currencyCode: string): void {
  if (!_currencyMeta[currencyCode]) {
    console.warn(`[currency] Unknown currency: ${currencyCode}`);
    return;
  }
  _selectedCurrency = currencyCode;
  localStorage.setItem(STORAGE_KEY, currencyCode);
  _notifyCurrencyChange();
}

export function getSupportedCurrencies(): CurrencyInfo[] {
  if (_settings?.currencies?.length) return _settings.currencies;
  return Object.values(_currencyMeta);
}

// ── Price Conversion ──

export function convertPrice(amount: number, fromCurrency: string = "USD"): number {
  if (!amount || isNaN(amount)) return 0;
  if (fromCurrency === _selectedCurrency) return amount;

  const rate = getExchangeRate(fromCurrency, _selectedCurrency);
  return Math.round(amount * rate * 100) / 100;
}

export function formatPrice(amount: number, fromCurrency: string = "USD"): string {
  const converted = convertPrice(amount, fromCurrency);
  return formatCurrency(converted, _selectedCurrency);
}

export function formatPriceRange(
  minPrice: number,
  maxPrice: number,
  fromCurrency: string = "USD"
): string {
  const min = convertPrice(minPrice, fromCurrency);
  const max = convertPrice(maxPrice, fromCurrency);
  const info = getSelectedCurrencyInfo();

  if (min === max) {
    return formatCurrency(min, _selectedCurrency);
  }
  return `${info.symbol}${_formatNumber(min)}-${_formatNumber(max)}`;
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const info = _currencyMeta[currencyCode] || DEFAULT_CURRENCY_META["USD"];

  if (currencyCode === "TRY") {
    const parts = amount.toFixed(info.decimalPlaces).split(".");
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${info.symbol}${intPart},${parts[1]}`;
  }

  return `${info.symbol}${amount.toLocaleString("en-US", {
    minimumFractionDigits: info.decimalPlaces,
    maximumFractionDigits: info.decimalPlaces,
  })}`;
}

export function getExchangeRate(fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return 1;

  const rates = _settings?.rates || DEFAULT_RATES;

  if (rates[fromCurrency]?.[toCurrency]) {
    return rates[fromCurrency][toCurrency];
  }

  if (fromCurrency !== "USD" && toCurrency !== "USD") {
    const fromToUsd = rates[fromCurrency]?.["USD"] || 1 / (rates["USD"]?.[fromCurrency] || 1);
    const usdToTarget = rates["USD"]?.[toCurrency] || 1;
    return fromToUsd * usdToTarget;
  }

  if (rates[toCurrency]?.[fromCurrency]) {
    const reverseRate = rates[toCurrency][fromCurrency];
    if (reverseRate > 0) return 1 / reverseRate;
  }

  console.warn(`[currency] No rate found for ${fromCurrency} -> ${toCurrency}`);
  return 1;
}

// ── Event System ──

export function onCurrencyChange(callback: (currency: string) => void): () => void {
  const handler = (e: Event) => {
    callback((e as CustomEvent).detail.currency);
  };
  document.addEventListener("currency-changed", handler);
  return () => document.removeEventListener("currency-changed", handler);
}

function _notifyCurrencyChange(): void {
  document.dispatchEvent(
    new CustomEvent("currency-changed", {
      detail: {
        currency: _selectedCurrency,
        info: getSelectedCurrencyInfo(),
      },
    })
  );
}

// ── Caching ──

function _loadCachedRates(): CurrencySettings | null {
  try {
    const raw = localStorage.getItem(RATES_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (Date.now() - cached._timestamp > RATES_CACHE_TTL) return null;
    return cached.data;
  } catch {
    return null;
  }
}

function _saveCachedRates(settings: CurrencySettings): void {
  try {
    localStorage.setItem(
      RATES_CACHE_KEY,
      JSON.stringify({ data: settings, _timestamp: Date.now() })
    );
  } catch {
    // localStorage full or unavailable
  }
}

function _saveCachedMeta(currencies: CurrencyInfo[]): void {
  try {
    localStorage.setItem(META_CACHE_KEY, JSON.stringify(currencies));
  } catch {
    // localStorage full / disabled — ignore
  }
}

function _buildCurrencyMeta(currencies?: CurrencyInfo[]): Record<string, CurrencyInfo> {
  if (currencies?.length) {
    const meta: Record<string, CurrencyInfo> = {};
    for (const c of currencies) meta[c.code] = c;
    return meta;
  }

  try {
    const raw = localStorage.getItem(META_CACHE_KEY);
    if (raw) {
      const list: CurrencyInfo[] = JSON.parse(raw);
      if (list.length) {
        const meta: Record<string, CurrencyInfo> = {};
        for (const c of list) meta[c.code] = c;
        return meta;
      }
    }
  } catch {
    // invalid JSON in cache — use defaults
  }

  return { ...DEFAULT_CURRENCY_META };
}

// ── Helpers ──

function _formatNumber(num: number): string {
  if (_selectedCurrency === "TRY") {
    const parts = num.toFixed(2).split(".");
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${intPart},${parts[1]}`;
  }
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Global Access for Alpine templates ──

declare global {
  interface Window {
    csFormatPrice: typeof formatPrice;
    csFormatPriceRange: typeof formatPriceRange;
    csFormatCurrency: typeof formatCurrency;
  }
}

window.csFormatPrice = formatPrice;
window.csFormatPriceRange = formatPriceRange;
window.csFormatCurrency = formatCurrency;
