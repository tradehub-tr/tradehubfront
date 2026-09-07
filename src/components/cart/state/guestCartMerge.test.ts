/**
 * Giriş sonrası misafir sepeti birleştirme: karar tablosu, localStorage okuma,
 * "boşalt + ekle" sırası ve sessiz aktarım / sorma akışı.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  apiClearCart: vi.fn(),
  apiMergeGuestCart: vi.fn(),
  loggedIn: true,
  toast: vi.fn(),
}));
vi.mock("../../../services/cartService", () => ({
  apiClearCart: api.apiClearCart,
  apiMergeGuestCart: api.apiMergeGuestCart,
}));
vi.mock("../../../utils/auth", () => ({ isLoggedIn: () => api.loggedIn }));
vi.mock("../../../utils/toast", () => ({ showToast: api.toast }));
vi.mock("../../../utils/currency", () => ({ getCurrencySymbol: () => "₺" }));
vi.mock("../../../i18n", () => ({ t: (k: string) => k }));

import { cartStore } from "./CartStore";
import {
  applyGuestCartMerge,
  decideGuestCartAction,
  readGuestCartItems,
  syncGuestCartAfterLogin,
} from "./guestCartMerge";

const sku = (id: string, quantity: number, listingVariant?: string) => ({
  id,
  skuImage: "",
  variantText: "",
  unitPrice: 1,
  currency: "₺",
  unit: "Adet",
  quantity,
  minQty: 1,
  maxQty: 999,
  selected: true,
  baseUnitPrice: 1,
  basePriceAddon: 0,
  baseCurrency: "TRY",
  ...(listingVariant ? { listingVariant } : {}),
});
const supplier = (id: string, products: Array<{ id: string; skus: ReturnType<typeof sku>[] }>) => ({
  id,
  name: id,
  href: "#",
  selected: true,
  products: products.map((p) => ({
    id: p.id,
    title: p.id,
    href: "#",
    tags: [],
    moqLabel: "",
    favoriteIcon: "",
    deleteIcon: "",
    selected: true,
    skus: p.skus,
  })),
});
const guestCart = [supplier("s1", [{ id: "L1", skus: [sku("a", 3), sku("b", 2, "V2")] }])];
const accountCart = [supplier("s9", [{ id: "L9", skus: [sku("z", 1)] }])];

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  api.apiClearCart.mockReset().mockResolvedValue({ success: true });
  api.apiMergeGuestCart.mockReset().mockResolvedValue({ suppliers: accountCart });
  api.toast.mockReset();
  api.loggedIn = true;
  localStorage.setItem("tradehub_cart", JSON.stringify({ suppliers: guestCart }));
});

describe("decideGuestCartAction", () => {
  it("misafir sepeti boşsa hiçbir şey yapma", () => {
    expect(decideGuestCartAction(0, 5)).toBe("none");
  });
  it("hesap sepeti boşsa sessizce aktar", () => {
    expect(decideGuestCartAction(3, 0)).toBe("silent-merge");
  });
  it("ikisinde de ürün varsa sor; 'şimdi değil' denmişse sorma", () => {
    expect(decideGuestCartAction(3, 2)).toBe("ask");
    expect(decideGuestCartAction(3, 2, true)).toBe("none");
  });
});

describe("readGuestCartItems", () => {
  it("localStorage'daki SKU'ları listing + varyant + adet olarak çıkarır", () => {
    expect(readGuestCartItems()).toEqual([
      { listing: "L1", quantity: 3 },
      { listing: "L1", quantity: 2, listing_variant: "V2" },
    ]);
  });
  it("bozuk/boş veri → boş liste", () => {
    localStorage.setItem("tradehub_cart", "{oops");
    expect(readGuestCartItems()).toEqual([]);
  });
});

describe("applyGuestCartMerge", () => {
  it("'replace' önce hesap sepetini boşaltır, sonra misafir ürünlerini ekler, localStorage'ı temizler", async () => {
    const order: string[] = [];
    api.apiClearCart.mockImplementation(async () => (order.push("clear"), { success: true }));
    api.apiMergeGuestCart.mockImplementation(async () => (order.push("merge"), { suppliers: accountCart }));
    expect(await applyGuestCartMerge("replace")).toBe(true);
    expect(order).toEqual(["clear", "merge"]);
    expect(localStorage.getItem("tradehub_cart")).toBeNull();
    expect(cartStore.getSuppliers().map((s) => s.id)).toEqual(["s9"]);
  });
  it("'merge' hesap sepetini boşaltmaz", async () => {
    await applyGuestCartMerge("merge");
    expect(api.apiClearCart).not.toHaveBeenCalled();
    expect(api.apiMergeGuestCart).toHaveBeenCalledWith(readGuestCartItemsSnapshot());
  });
  it("API hatasında misafir sepeti korunur ve hata toast'u basılır", async () => {
    api.apiMergeGuestCart.mockRejectedValue(new Error("boom"));
    expect(await applyGuestCartMerge("merge")).toBe(false);
    expect(localStorage.getItem("tradehub_cart")).not.toBeNull();
    expect(api.toast).toHaveBeenCalledWith(expect.objectContaining({ type: "error" }));
  });
});

// merge çağrısından önce okunan girdiyi doğrulamak için (localStorage merge sonrası silinir)
function readGuestCartItemsSnapshot() {
  return [
    { listing: "L1", quantity: 3 },
    { listing: "L1", quantity: 2, listing_variant: "V2" },
  ];
}

describe("syncGuestCartAfterLogin", () => {
  it("hesap sepeti boşsa sormadan aktarır", async () => {
    const prompt = vi.fn();
    await syncGuestCartAfterLogin([], prompt);
    expect(prompt).not.toHaveBeenCalled();
    expect(api.apiMergeGuestCart).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("tradehub_cart")).toBeNull();
  });
  it("hesap sepetinde ürün varsa sorar; sayıları verir; aktarım seçime bırakılır", async () => {
    const prompt = vi.fn();
    await syncGuestCartAfterLogin(accountCart, prompt);
    expect(api.apiMergeGuestCart).not.toHaveBeenCalled();
    expect(prompt).toHaveBeenCalledWith(
      expect.objectContaining({ guestCount: 2, accountCount: 1 })
    );
    const ctx = prompt.mock.calls[0][0];
    ctx.dismiss();
    expect(sessionStorage.getItem("tradehub_cart_merge_dismissed")).toBe("1");
  });
  it("modal seçimi uygulanınca onPromptApplied çağrılır; hata olursa çağrılmaz", async () => {
    const prompt = vi.fn();
    const onPromptApplied = vi.fn();
    await syncGuestCartAfterLogin(accountCart, prompt, { onPromptApplied });
    const ctx = prompt.mock.calls[0][0];
    api.apiMergeGuestCart.mockRejectedValueOnce(new Error("boom"));
    expect(await ctx.choose("merge")).toBe(false);
    expect(onPromptApplied).not.toHaveBeenCalled();
    expect(await ctx.choose("replace")).toBe(true);
    expect(api.apiClearCart).toHaveBeenCalledTimes(1);
    expect(onPromptApplied).toHaveBeenCalledTimes(1);
  });
  it("'şimdi değil' denmişse aynı oturumda tekrar sormaz", async () => {
    sessionStorage.setItem("tradehub_cart_merge_dismissed", "1");
    const prompt = vi.fn();
    await syncGuestCartAfterLogin(accountCart, prompt);
    expect(prompt).not.toHaveBeenCalled();
  });
  it("ardışık çağrılar kilitlenmez: 'none' ile biten çağrıdan sonra 'ask' çalışır", async () => {
    localStorage.removeItem("tradehub_cart"); // misafir sepeti yok → none
    await syncGuestCartAfterLogin(accountCart, vi.fn());
    localStorage.setItem("tradehub_cart", JSON.stringify({ suppliers: guestCart }));
    const prompt = vi.fn();
    await syncGuestCartAfterLogin(accountCart, prompt);
    expect(prompt).toHaveBeenCalledTimes(1);
  });
  it("oturum yoksa hiçbir şey yapmaz", async () => {
    api.loggedIn = false;
    const prompt = vi.fn();
    await syncGuestCartAfterLogin([], prompt);
    expect(prompt).not.toHaveBeenCalled();
    expect(api.apiMergeGuestCart).not.toHaveBeenCalled();
  });
});
