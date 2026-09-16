/**
 * Otomatik para birimi ATAMASININ SINIRI.
 *
 * Bu testin tek işi şu iddiayı korumak: **sunucunun önerdiği para birimi
 * desteklenen listede yoksa localStorage'a yazılmaz.**
 *
 * İddia neden gerekli: `COUNTRY_CURRENCY_MAP` (backend) bugün `GB→GBP` ve
 * `CN/HK/TW→CNY` eşlemeleri taşıyor, ama Supported Currency'de yalnız
 * USD/TRY/EUR tanımlı. Doğrulama olmadan İngiltere'den gelen kullanıcının
 * localStorage'ına "GBP" yazılıyor; o kod seçicide görünmediği için kullanıcı
 * seçimini kendisi düzeltemiyor. `setSelectedCurrency` elle seçimde bu
 * doğrulamayı zaten yapıyordu — otomatik atamada yapmıyordu, asimetri buydu.
 *
 * Ölçüldü (16 Eyl 2026, lokal): X-Country=GB → defaultCurrency=GBP,
 * desteklenen listede YOK, kuru YOK.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "tradehub-currency";

/** Backend'in döndürdüğü ayar yükünü taklit eder. */
function ayarYuku(defaultCurrency: string) {
  return {
    currencies: [
      { code: "USD", symbol: "$", decimalPlaces: 2 },
      { code: "TRY", symbol: "₺", decimalPlaces: 2 },
      { code: "EUR", symbol: "€", decimalPlaces: 2 },
    ],
    rates: { USD: { USD: 1, TRY: 48.3195, EUR: 0.860419 } },
    defaultCurrency,
    detectedCountry: "XX",
    baseCurrency: "USD",
  };
}

vi.mock("../../utils/api", () => ({ api: vi.fn() }));
vi.mock("../../lib/query", () => ({
  queryFetch: vi.fn((_k: unknown, fn: () => Promise<unknown>) => fn()),
  queryKeys: { currencyRates: () => ["currency"] },
  policies: { currency: {} },
}));

async function servisiYukle(defaultCurrency: string) {
  vi.resetModules();
  const { api } = await import("../../utils/api");
  (api as ReturnType<typeof vi.fn>).mockResolvedValue({ message: ayarYuku(defaultCurrency) });
  const mod = await import("../currencyService");
  await mod.initCurrency();
  return mod;
}

describe("otomatik para birimi ataması", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("desteklenen bir öneriyi uygular ve saklar", async () => {
    const mod = await servisiYukle("TRY");
    expect(mod.getSelectedCurrency()).toBe("TRY");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("TRY");
  });

  it("DESTEKLENMEYEN öneriyi localStorage'a YAZMAZ (GB→GBP kusuru)", async () => {
    const mod = await servisiYukle("GBP");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(mod.getSelectedCurrency()).toBe("USD");
  });

  it("desteklenmeyen öneri geldiğinde seçilen para birimi listede kalır", async () => {
    const mod = await servisiYukle("CNY");
    const kodlar = mod.getSupportedCurrencies().map((c) => c.code);
    expect(kodlar).toContain(mod.getSelectedCurrency());
  });

  it("GEÇERSİZ depolanmış seçimi temizler (kusur düzeltilmeden önce kilitlenmiş kullanıcı)", async () => {
    // Düzeltme öncesinde localStorage'a "GBP" yazılmış kullanıcılar var; onlar
    // da kurtarılmalı, yoksa seçiciden düzeltemedikleri bir koda kilitli kalır.
    localStorage.setItem(STORAGE_KEY, "GBP");
    const mod = await servisiYukle("USD");
    expect(mod.getSelectedCurrency()).toBe("USD");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("USD");
  });

  it("kullanıcının mevcut seçimini öneri ezmez", async () => {
    localStorage.setItem(STORAGE_KEY, "EUR");
    const mod = await servisiYukle("TRY");
    expect(mod.getSelectedCurrency()).toBe("EUR");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("EUR");
  });
});
