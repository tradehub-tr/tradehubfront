// BASE_URL çözüm sözleşmesi (HEADLESS-DURUM-RAPORU "yan ürün" #5).
//
// auth.ts'teki login() base URL'i yerel hesaplayıp NATIVE_API_BASE'i
// atlıyordu; iOS bundle'da isteği yalnız global fetch patch'i tesadüfen
// kurtarıyordu. Düzeltme: base çözümünün TEK kaynağı api.ts'in export'lu
// BASE_URL'i (NATIVE_API_BASE || VITE_API_URL || "/api"); auth.ts onu
// import eder. İlk iki test önceliği davranışsal doğrular, son test
// auth.ts'in yerel hesaba geri dönmediğini kaynak sözleşmesiyle korur.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";

const BURASI = dirname(fileURLToPath(import.meta.url));

function mockKomsular(nativeBase: string | null): void {
  vi.doMock("./nativeHttp", () => ({
    NATIVE_API_BASE: nativeBase,
    isNativeBundleContext: () => nativeBase !== null,
    installNativeFetchRewrite: () => {},
  }));
  vi.doMock("../i18n", () => ({
    getCurrentLang: () => "tr",
    t: (key: string) => key,
  }));
  vi.doMock("./url", () => ({ getBaseUrl: () => "/" }));
}

describe("api.ts BASE_URL çözümü", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unmock("./nativeHttp");
    vi.unmock("../i18n");
    vi.unmock("./url");
  });

  it("native bundle modunda NATIVE_API_BASE kazanır", async () => {
    mockKomsular("https://rc.istoc.com/api");
    const { BASE_URL } = await import("./api");
    expect(BASE_URL).toBe("https://rc.istoc.com/api");
  });

  it("web modunda relative /api'ye düşer", async () => {
    mockKomsular(null);
    const { BASE_URL } = await import("./api");
    // Test ortamında VITE_API_URL tanımsız — zincirin sonu "/api".
    expect(BASE_URL).toBe(import.meta.env.VITE_API_URL || "/api");
  });
});

describe("auth.ts login base sözleşmesi", () => {
  const kaynak = readFileSync(resolve(BURASI, "auth.ts"), "utf8");

  it("login kendi base'ini hesaplamaz — VITE_API_URL fallback'i geri dönmesin", () => {
    expect(kaynak).not.toContain("VITE_API_URL");
  });

  it("merkezi BASE_URL api.ts'ten import edilir", () => {
    expect(kaynak).toMatch(/import \{[^}]*\bBASE_URL\b[^}]*\} from "\.\/api"/);
    expect(kaynak).toContain("fetch(`${BASE_URL}/method/login`");
  });
});
