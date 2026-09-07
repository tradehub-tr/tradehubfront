/**
 * getCountryDisplayName — backend'in ham ülke adı ("Turkey", "TR") arayüzde
 * sözlükteki resmî adla ("Türkiye") gösterilir; sözlükte olmayan ad ham kalır.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("../i18n", () => ({
  t: (k: string) => (k === "countries.TR" ? "Türkiye" : k === "countries.CN" ? "Çin" : k),
}));

import { getCountryDisplayName } from "./country";

describe("getCountryDisplayName", () => {
  it("'Turkey' ve 'TR' → sözlükteki 'Türkiye'", () => {
    expect(getCountryDisplayName("Turkey")).toBe("Türkiye");
    expect(getCountryDisplayName("TR")).toBe("Türkiye");
    expect(getCountryDisplayName("turkiye")).toBe("Türkiye");
  });

  it("bilinen başka ülke sözlükten gelir", () => {
    expect(getCountryDisplayName("China")).toBe("Çin");
  });

  it("sözlükte karşılığı olmayan ad ham kalır; boş → boş", () => {
    expect(getCountryDisplayName("Narnia")).toBe("Narnia");
    expect(getCountryDisplayName("")).toBe("");
    expect(getCountryDisplayName(undefined)).toBe("");
  });
});
