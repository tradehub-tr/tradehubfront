import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SkuMatrixEntry, ProductVariant } from "../../types/product";

const { getCurrentProduct } = vi.hoisted(() => ({ getCurrentProduct: vi.fn() }));
vi.mock("../../alpine/product", () => ({ getCurrentProduct }));

import { getSkuAxisKey, getSkuValueForAxis, isOptionAvailableForColor } from "./variantMatrix";

const VARIANTS = [
  { type: "color", label: "Renk", options: [] },
  { type: "size", label: "Beden", options: [] },
] as unknown as ProductVariant[];

const SKU: SkuMatrixEntry = {
  axis1: "Siyah",
  axis2: "M",
  stock: 3,
  price: 10,
  available: true,
  sku: "S-1",
  variantId: "V-1",
  extraAxes: { Malzeme: "Pamuk" },
};

describe("variantMatrix", () => {
  beforeEach(() => vi.clearAllMocks());

  it("eksen adını doğru alana eşler", () => {
    expect(getSkuAxisKey(VARIANTS, "Renk")).toEqual({ field: "axis1" });
    expect(getSkuAxisKey(VARIANTS, "Beden")).toEqual({ field: "axis2" });
    expect(getSkuAxisKey(VARIANTS, "Malzeme")).toEqual({ field: "extra", extraName: "Malzeme" });
  });

  it("eksen değerini SKU satırından okur", () => {
    expect(getSkuValueForAxis(SKU, { field: "axis1" })).toBe("Siyah");
    expect(getSkuValueForAxis(SKU, { field: "axis2" })).toBe("M");
    expect(getSkuValueForAxis(SKU, { field: "extra", extraName: "Malzeme" })).toBe("Pamuk");
  });

  it("skuMatrix yoksa seçenek mevcut sayılır", () => {
    expect(isOptionAvailableForColor(undefined, "Siyah", "M", 1)).toBe(true);
    expect(isOptionAvailableForColor([], "Siyah", "M", 1)).toBe(true);
  });

  it("eşleşen satır yoksa mevcut değildir", () => {
    expect(isOptionAvailableForColor([SKU], "Beyaz", "M", 1)).toBe(false);
    expect(isOptionAvailableForColor([SKU], "Siyah", "L", 1)).toBe(false);
  });

  it("eşleşen satır varsa stok durumunu yansıtır", () => {
    expect(isOptionAvailableForColor([SKU], "Siyah", "M", 1)).toBe(true);
    expect(isOptionAvailableForColor([{ ...SKU, available: false }], "Siyah", "M", 1)).toBe(false);
  });
});
